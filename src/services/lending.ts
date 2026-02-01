import { supabase } from '../lib/supabase';
import type { 
  PersonalLending,
  LendingPayment,
  PersonalLendingInsert,
  Transaction 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Personal Lending ====================

export async function getLendings(familyId: string): Promise<PersonalLending[]> {
  const { data, error } = await supabase
    .from('personal_lending')
    .select('*')
    .eq('family_id', familyId)
    .order('date', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getActiveLendings(familyId: string): Promise<PersonalLending[]> {
  const { data, error } = await supabase
    .from('personal_lending')
    .select('*')
    .eq('family_id', familyId)
    .neq('status', 'settled')
    .order('date', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getLending(id: string): Promise<PersonalLending | null> {
  const { data, error } = await supabase
    .from('personal_lending')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createLending(
  lending: Omit<PersonalLendingInsert, 'created_by'>,
  userId: string
): Promise<PersonalLending> {
  const { data, error } = await supabase
    .from('personal_lending')
    .insert({ 
      ...lending, 
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateLending(
  id: string,
  updates: Partial<PersonalLending>
): Promise<PersonalLending> {
  const { data, error } = await supabase
    .from('personal_lending')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteLending(id: string): Promise<void> {
  const { error } = await supabase
    .from('personal_lending')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

// ==================== Lending Payments ====================

export async function getLendingPayments(lendingId: string): Promise<LendingPayment[]> {
  const { data, error } = await supabase
    .from('lending_payments')
    .select('*')
    .eq('lending_id', lendingId)
    .order('payment_date', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function recordLendingPayment(
  lendingId: string,
  amount: number,
  accountId: string | null,
  paymentMode: string,
  userId: string,
  familyId: string,
  notes?: string
): Promise<{ lending: PersonalLending; payment: LendingPayment; transaction: Transaction }> {
  // Get current lending
  const { data: lending, error: lendingError } = await supabase
    .from('personal_lending')
    .select('*')
    .eq('id', lendingId)
    .single();

  if (lendingError) handleSupabaseError(lendingError);

  const newOutstanding = Math.max(0, lending!.outstanding - amount);
  const newStatus = newOutstanding <= 0 ? 'settled' : 
                    newOutstanding < lending!.original_amount ? 'partial' : 'pending';

  // Update lending
  const { data: updatedLending, error: updateError } = await supabase
    .from('personal_lending')
    .update({ 
      outstanding: newOutstanding,
      status: newStatus
    })
    .eq('id', lendingId)
    .select()
    .single();

  if (updateError) handleSupabaseError(updateError);

  // Create transaction - type depends on lending type
  const transactionType = lending!.type === 'lent' ? 'income' : 'expense';
  const description = lending!.type === 'lent' 
    ? `Received from ${lending!.person_name}` 
    : `Paid to ${lending!.person_name}`;

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      family_id: familyId,
      type: transactionType,
      amount,
      date: new Date().toISOString().split('T')[0],
      description,
      account_id: accountId,
      payment_mode: paymentMode as any,
      notes,
      created_by: userId,
    })
    .select()
    .single();

  if (txError) handleSupabaseError(txError);

  // Create lending payment record
  const { data: payment, error: paymentError } = await supabase
    .from('lending_payments')
    .insert({
      lending_id: lendingId,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      outstanding_after: newOutstanding,
      transaction_id: transaction!.id,
      notes,
      created_by: userId,
    })
    .select()
    .single();

  if (paymentError) handleSupabaseError(paymentError);

  // Update bank account balance
  if (accountId) {
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (account) {
      const balanceChange = lending!.type === 'lent' ? amount : -amount;
      await supabase
        .from('bank_accounts')
        .update({ balance: (account.balance || 0) + balanceChange })
        .eq('id', accountId);
    }
  }

  return { lending: updatedLending!, payment: payment!, transaction: transaction! };
}

// ==================== Lending by Type ====================

export async function getLentMoney(familyId: string): Promise<PersonalLending[]> {
  const { data, error } = await supabase
    .from('personal_lending')
    .select('*')
    .eq('family_id', familyId)
    .eq('type', 'lent')
    .order('date', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getBorrowedMoney(familyId: string): Promise<PersonalLending[]> {
  const { data, error } = await supabase
    .from('personal_lending')
    .select('*')
    .eq('family_id', familyId)
    .eq('type', 'borrowed')
    .order('date', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== Overdue Lendings ====================

export async function getOverdueLendings(familyId: string): Promise<PersonalLending[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('personal_lending')
    .select('*')
    .eq('family_id', familyId)
    .neq('status', 'settled')
    .not('expected_return', 'is', null)
    .lt('expected_return', today)
    .order('expected_return', { ascending: true });

  if (error) handleSupabaseError(error);
  
  // Update status to overdue
  if (data && data.length > 0) {
    const ids = data.map(d => d.id);
    await supabase
      .from('personal_lending')
      .update({ status: 'overdue' })
      .in('id', ids);
  }

  return data ?? [];
}

// ==================== Lending Summary ====================

export async function getLendingSummary(familyId: string) {
  const lendings = await getLendings(familyId);
  
  const lent = lendings.filter(l => l.type === 'lent');
  const borrowed = lendings.filter(l => l.type === 'borrowed');
  
  const activeLent = lent.filter(l => l.status !== 'settled');
  const activeBorrowed = borrowed.filter(l => l.status !== 'settled');
  
  const totalLent = activeLent.reduce((sum, l) => sum + l.outstanding, 0);
  const totalBorrowed = activeBorrowed.reduce((sum, l) => sum + l.outstanding, 0);
  
  const overdue = await getOverdueLendings(familyId);

  // Group by person
  const byPerson: Record<string, { lent: number; borrowed: number }> = {};
  for (const lending of [...activeLent, ...activeBorrowed]) {
    if (!byPerson[lending.person_name]) {
      byPerson[lending.person_name] = { lent: 0, borrowed: 0 };
    }
    if (lending.type === 'lent') {
      byPerson[lending.person_name].lent += lending.outstanding;
    } else {
      byPerson[lending.person_name].borrowed += lending.outstanding;
    }
  }

  return {
    lendings,
    lent,
    borrowed,
    activeLent,
    activeBorrowed,
    totalLent,
    totalBorrowed,
    netPosition: totalLent - totalBorrowed,
    overdue,
    byPerson,
  };
}
