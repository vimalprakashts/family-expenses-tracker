import { supabase } from '../lib/supabase';
import type { 
  BankAccount, 
  CreditCard,
  CreditCardBill,
  BankAccountInsert,
  CreditCardInsert,
  CreditCardBillInsert,
  Transaction 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Bank Accounts ====================

export async function getBankAccounts(familyId: string): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getBankAccount(id: string): Promise<BankAccount | null> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createBankAccount(
  account: Omit<BankAccountInsert, 'created_by'>,
  userId: string
): Promise<BankAccount> {
  // Mask account number
  const masked = account.account_number.slice(-4).padStart(account.account_number.length, 'X');
  
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert({ 
      ...account, 
      account_number_masked: masked,
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateBankAccount(
  id: string,
  updates: Partial<BankAccount>
): Promise<BankAccount> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateBankBalance(
  id: string,
  newBalance: number
): Promise<BankAccount> {
  return updateBankAccount(id, { balance: newBalance });
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('bank_accounts')
    .update({ is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function setPrimaryAccount(
  id: string,
  familyId: string
): Promise<void> {
  // Remove primary from all accounts
  await supabase
    .from('bank_accounts')
    .update({ is_primary: false })
    .eq('family_id', familyId);

  // Set this account as primary
  const { error } = await supabase
    .from('bank_accounts')
    .update({ is_primary: true })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

// ==================== Credit Cards ====================

export async function getCreditCards(familyId: string): Promise<CreditCard[]> {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getCreditCard(id: string): Promise<CreditCard | null> {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createCreditCard(
  card: Omit<CreditCardInsert, 'created_by'>,
  userId: string
): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert({ 
      ...card, 
      available_limit: card.credit_limit - (card.outstanding || 0),
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateCreditCard(
  id: string,
  updates: Partial<CreditCard>
): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteCreditCard(id: string): Promise<void> {
  const { error } = await supabase
    .from('credit_cards')
    .update({ is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function payCreditCard(
  cardId: string,
  amount: number,
  fromAccountId: string,
  userId: string,
  familyId: string,
  notes?: string
): Promise<{ card: CreditCard; transaction: Transaction }> {
  // Get current card details
  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (cardError) handleSupabaseError(cardError);

  const newOutstanding = Math.max(0, (card!.outstanding || 0) - amount);
  const newAvailable = card!.credit_limit - newOutstanding;

  // Update card
  const { data: updatedCard, error: updateError } = await supabase
    .from('credit_cards')
    .update({ 
      outstanding: newOutstanding,
      available_limit: newAvailable 
    })
    .eq('id', cardId)
    .select()
    .single();

  if (updateError) handleSupabaseError(updateError);

  // Deduct from bank account
  const { data: account } = await supabase
    .from('bank_accounts')
    .select('balance')
    .eq('id', fromAccountId)
    .single();

  if (account) {
    await supabase
      .from('bank_accounts')
      .update({ balance: (account.balance || 0) - amount })
      .eq('id', fromAccountId);
  }

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      family_id: familyId,
      type: 'expense',
      amount,
      date: new Date().toISOString().split('T')[0],
      description: `Credit Card Payment - ${card!.card_name}`,
      account_id: fromAccountId,
      payment_mode: 'bank',
      notes,
      created_by: userId,
    })
    .select()
    .single();

  if (txError) handleSupabaseError(txError);

  return { card: updatedCard!, transaction: transaction! };
}

// ==================== Summary ====================

export async function getAccountsSummary(familyId: string) {
  const [accounts, cards] = await Promise.all([
    getBankAccounts(familyId),
    getCreditCards(familyId),
  ]);

  const totalBankBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalCreditLimit = cards.reduce((sum, c) => sum + c.credit_limit, 0);
  const totalOutstanding = cards.reduce((sum, c) => sum + (c.outstanding || 0), 0);
  const totalAvailable = cards.reduce((sum, c) => sum + (c.available_limit || 0), 0);

  return {
    accounts,
    cards,
    totalBankBalance,
    totalCreditLimit,
    totalOutstanding,
    totalAvailable,
    netCashPosition: totalBankBalance - totalOutstanding,
  };
}

// ==================== Credit Card Bills ====================

export async function getCreditCardBills(
  creditCardId: string,
  year?: number,
  month?: number
): Promise<CreditCardBill[]> {
  let query = supabase
    .from('credit_card_bills')
    .select('*')
    .eq('credit_card_id', creditCardId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (year) {
    query = query.eq('year', year);
  }
  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getCreditCardBill(
  id: string
): Promise<CreditCardBill | null> {
  const { data, error } = await supabase
    .from('credit_card_bills')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createCreditCardBill(
  bill: Omit<CreditCardBillInsert, 'created_by' | 'family_id' | 'billing_date' | 'due_date' | 'status' | 'paid_amount' | 'paid_date' | 'transaction_id'>,
  userId: string,
  familyId: string
): Promise<CreditCardBill> {
  // Get credit card details to calculate due date
  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .select('due_date, billing_date')
    .eq('id', bill.credit_card_id)
    .single();

  if (cardError) handleSupabaseError(cardError);

  // Calculate actual due_date and billing_date for the month
  const billingDay = card?.billing_date || 1;
  const dueDay = card?.due_date || 15;
  
  // Billing date is in the bill month
  const billingDate = new Date(bill.year, bill.month - 1, Math.min(billingDay, 28)); // Use 28 to avoid month overflow
  // Due date is typically in the same month or next month
  let dueDate = new Date(bill.year, bill.month - 1, Math.min(dueDay, 28));
  // If due day is before billing day, it's in the next month
  if (dueDay < billingDay) {
    dueDate = new Date(bill.year, bill.month, Math.min(dueDay, 28));
  }

  const { data, error } = await supabase
    .from('credit_card_bills')
    .insert({
      ...bill,
      family_id: familyId,
      due_date: dueDate.toISOString().split('T')[0],
      billing_date: billingDate.toISOString().split('T')[0],
      status: 'pending',
      paid_amount: 0,
      created_by: userId,
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);

  // Get or create scheduled payment for this credit card
  let { data: schedule } = await supabase
    .from('scheduled_payments')
    .select('id')
    .eq('family_id', familyId)
    .eq('linked_type', 'credit_card')
    .eq('linked_id', bill.credit_card_id)
    .eq('is_active', true)
    .maybeSingle();

  // If schedule doesn't exist, create it (for cards created before auto-link trigger)
  if (!schedule) {
    const { data: cardInfo } = await supabase
      .from('credit_cards')
      .select('bank_name, card_name, due_date')
      .eq('id', bill.credit_card_id)
      .single();

    if (cardInfo) {
      const { data: newSchedule, error: scheduleError } = await supabase
        .from('scheduled_payments')
        .insert({
          family_id: familyId,
          name: cardInfo.bank_name + ' ' + cardInfo.card_name + ' Bill',
          icon: '💳',
          category: 'other',
          frequency: 'monthly',
          due_months: [1,2,3,4,5,6,7,8,9,10,11,12],
          due_day: cardInfo.due_date || 15,
          amount: 0,
          is_variable: true,
          is_auto_linked: true,
          linked_type: 'credit_card',
          linked_id: bill.credit_card_id,
          start_date: new Date().toISOString().split('T')[0],
          is_active: true,
          created_by: userId,
        })
        .select('id')
        .single();

      if (scheduleError) {
        console.error('Error creating scheduled payment:', scheduleError);
      } else {
        schedule = newSchedule;
      }
    }
  }

  // Get or create expense category for this credit card (auto-linked, like loans)
  const { data: expenseCategory } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('family_id', familyId)
    .eq('linked_type', 'credit_card')
    .eq('linked_id', bill.credit_card_id)
    .maybeSingle();

  // Create or update expense record for this month (auto-linked behavior, like loan EMIs)
  if (expenseCategory) {
    const { data: existingExpenseRecord } = await supabase
      .from('expense_records')
      .select('id, spent_amount')
      .eq('family_id', familyId)
      .eq('category_id', expenseCategory.id)
      .eq('year', bill.year)
      .eq('month', bill.month)
      .maybeSingle();

    if (existingExpenseRecord) {
      // Update existing expense record with bill amount
      // If already has spent amount (from payment), keep it; otherwise set to bill amount
      const currentSpent = existingExpenseRecord.spent_amount || 0;
      const newSpentAmount = currentSpent > 0 ? currentSpent : bill.bill_amount;
      
      await supabase
        .from('expense_records')
        .update({
          spent_amount: newSpentAmount,
          status: 'over', // Credit card bills are always 'over' since planned = 0
        })
        .eq('id', existingExpenseRecord.id);
    } else {
      // Create new expense record for this month (auto-linked, like loan EMIs)
      const { error: expenseError } = await supabase
        .from('expense_records')
        .insert({
          family_id: familyId,
          category_id: expenseCategory.id,
          year: bill.year,
          month: bill.month,
          planned_amount: 0, // Credit card bills are variable
          spent_amount: bill.bill_amount, // Set to bill amount initially
          status: 'over',
          created_by: userId,
        });

      if (expenseError) {
        console.error('Error creating expense record:', expenseError);
      }
    }
  }

  // Update or create scheduled instance for this month
  if (schedule) {
    const { data: existingInstance } = await supabase
      .from('scheduled_instances')
      .select('id')
      .eq('schedule_id', schedule.id)
      .eq('year', bill.year)
      .eq('month', bill.month)
      .maybeSingle();

    if (existingInstance) {
      const { error: updateError } = await supabase
        .from('scheduled_instances')
        .update({
          amount: bill.bill_amount,
          due_date: dueDate.toISOString().split('T')[0],
        })
        .eq('id', existingInstance.id);
      
      if (updateError) {
        console.error('Error updating scheduled instance:', updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('scheduled_instances')
        .insert({
          schedule_id: schedule.id,
          family_id: familyId,
          year: bill.year,
          month: bill.month,
          due_date: dueDate.toISOString().split('T')[0],
          amount: bill.bill_amount,
          status: 'pending' as any,
          created_by: userId,
        })
        .select();
      
      if (insertError) {
        console.error('Error creating scheduled instance:', insertError);
      }
    }
  }

  return data!;
}

export async function updateCreditCardBill(
  id: string,
  updates: Partial<CreditCardBill>
): Promise<CreditCardBill> {
  const { data, error } = await supabase
    .from('credit_card_bills')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function payCreditCardBill(
  billId: string,
  paidAmount: number,
  fromAccountId: string | null,
  userId: string,
  familyId: string,
  notes?: string
): Promise<{ bill: CreditCardBill; transaction: Transaction | null }> {
  // Get bill details
  const { data: bill, error: billError } = await supabase
    .from('credit_card_bills')
    .select('*, credit_cards(*)')
    .eq('id', billId)
    .single();

  if (billError) handleSupabaseError(billError);

  const billAmount = bill!.bill_amount;
  const newPaidAmount = (bill!.paid_amount || 0) + paidAmount;
  const newStatus = newPaidAmount >= billAmount ? 'paid' : 'partial';

  // Update bill
  const updateData: any = {
    paid_amount: newPaidAmount,
    status: newStatus,
    paid_date: new Date().toISOString().split('T')[0],
  };

  let transaction: Transaction | null = null;

  // Get expense category for this credit card (should exist as auto-linked)
  const { data: expenseCategory } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('family_id', familyId)
    .eq('linked_type', 'credit_card')
    .eq('linked_id', bill!.credit_card_id)
    .maybeSingle();

  let expenseRecordId: string | null = null;

  // Update expense record for this month (auto-linked behavior, like loan EMIs)
  if (expenseCategory) {
    const { data: existingExpenseRecord } = await supabase
      .from('expense_records')
      .select('id, spent_amount')
      .eq('family_id', familyId)
      .eq('category_id', expenseCategory.id)
      .eq('year', bill!.year)
      .eq('month', bill!.month)
      .maybeSingle();

    if (existingExpenseRecord) {
      expenseRecordId = existingExpenseRecord.id;
      // Update spent amount (add payment to existing spent amount)
      const newSpentAmount = (existingExpenseRecord.spent_amount || 0) + paidAmount;
      await supabase
        .from('expense_records')
        .update({
          spent_amount: newSpentAmount,
          status: 'over', // Credit card bills are always 'over' since planned = 0
        })
        .eq('id', expenseRecordId);
    } else {
      // Create expense record if it doesn't exist (shouldn't happen, but safety check)
      const { data: newExpenseRecord, error: expenseError } = await supabase
        .from('expense_records')
        .insert({
          family_id: familyId,
          category_id: expenseCategory.id,
          year: bill!.year,
          month: bill!.month,
          planned_amount: 0, // Credit card bills are variable
          spent_amount: paidAmount,
          status: 'over',
          created_by: userId,
        })
        .select('id')
        .single();

      if (expenseError) {
        console.error('Error creating expense record:', expenseError);
      } else {
        expenseRecordId = newExpenseRecord!.id;
      }
    }
  }

  // Create transaction if payment is made
  if (fromAccountId) {
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        family_id: familyId,
        type: 'expense',
        amount: paidAmount,
        date: new Date().toISOString().split('T')[0],
        description: `Credit Card Bill Payment - ${(bill as any).credit_cards?.bank_name} ${(bill as any).credit_cards?.card_name}`,
        account_id: fromAccountId,
        payment_mode: 'bank',
        expense_record_id: expenseRecordId,
        notes,
        created_by: userId,
      })
      .select()
      .single();

    if (txError) handleSupabaseError(txError);
    transaction = tx!;
    updateData.transaction_id = tx!.id;

    // Deduct from bank account
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('id', fromAccountId)
      .single();

    if (account) {
      await supabase
        .from('bank_accounts')
        .update({ balance: (account.balance || 0) - paidAmount })
        .eq('id', fromAccountId);
    }
  }

  // Update credit card outstanding
  const { data: card } = await supabase
    .from('credit_cards')
    .select('outstanding, credit_limit')
    .eq('id', bill!.credit_card_id)
    .single();

  if (card) {
    const newOutstanding = Math.max(0, (card.outstanding || 0) - paidAmount);
    const newAvailable = card.credit_limit - newOutstanding;
    await supabase
      .from('credit_cards')
      .update({
        outstanding: newOutstanding,
        available_limit: newAvailable,
      })
      .eq('id', bill!.credit_card_id);
  }

  // Update bill
  const { data: updatedBill, error: updateError } = await supabase
    .from('credit_card_bills')
    .update(updateData)
    .eq('id', billId)
    .select()
    .single();

  if (updateError) handleSupabaseError(updateError);

  // Update scheduled instance status
  const { data: schedule } = await supabase
    .from('scheduled_payments')
    .select('id')
    .eq('family_id', familyId)
    .eq('linked_type', 'credit_card')
    .eq('linked_id', bill!.credit_card_id)
    .maybeSingle();

  if (schedule) {
    const { error: instanceError } = await supabase
      .from('scheduled_instances')
      .update({
        status: newStatus === 'paid' ? 'paid' : 'pending',
        paid_amount: newPaidAmount,
        paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        transaction_id: transaction?.id || null,
      })
      .eq('schedule_id', schedule.id)
      .eq('year', bill!.year)
      .eq('month', bill!.month);
    
    if (instanceError) {
      console.error('Error updating scheduled instance:', instanceError);
    }
  }

  return { bill: updatedBill!, transaction };
}

export async function deleteCreditCardBill(id: string): Promise<void> {
  const { error } = await supabase
    .from('credit_card_bills')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}
