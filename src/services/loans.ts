import { supabase } from '../lib/supabase';
import type { 
  Loan, 
  LoanPayment,
  LoanInsert,
  Transaction 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Loans ====================

export async function getLoans(familyId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getActiveLoans(familyId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .order('next_emi_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getLoan(id: string): Promise<Loan | null> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createLoan(
  loan: Omit<LoanInsert, 'created_by'>,
  userId: string
): Promise<Loan> {
  // Calculate next EMI date based on start date and EMI day
  const startDate = new Date(loan.start_date);
  const emiDay = loan.emi_day || startDate.getDate();
  let nextEmiDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, emiDay);
  
  const { data, error } = await supabase
    .from('loans')
    .insert({ 
      ...loan, 
      next_emi_date: nextEmiDate.toISOString().split('T')[0],
      months_paid: 0,
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateLoan(
  id: string,
  updates: Partial<Loan>
): Promise<Loan> {
  const { data, error } = await supabase
    .from('loans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteLoan(id: string): Promise<void> {
  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

// ==================== Loan Payments ====================

export async function getLoanPayments(loanId: string): Promise<LoanPayment[]> {
  const { data, error } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', loanId)
    .order('payment_date', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function payEMI(
  loanId: string,
  amount: number,
  accountId: string | null,
  paymentMode: string,
  userId: string,
  familyId: string,
  isPrepayment: boolean = false,
  notes?: string
): Promise<{ loan: Loan; payment: LoanPayment; transaction: Transaction }> {
  // Get current loan
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();

  if (loanError) handleSupabaseError(loanError);

  // Calculate interest and principal portions (simplified)
  const monthlyRate = loan!.interest_rate / 100 / 12;
  const interestPaid = Math.round(loan!.outstanding * monthlyRate);
  const principalPaid = amount - interestPaid;
  const newOutstanding = Math.max(0, loan!.outstanding - principalPaid);
  const newMonthsPaid = (loan!.months_paid || 0) + 1;

  // Calculate next EMI date
  const currentEmiDate = new Date(loan!.next_emi_date || new Date());
  const nextEmiDate = new Date(currentEmiDate.getFullYear(), currentEmiDate.getMonth() + 1, loan!.emi_day || currentEmiDate.getDate());

  // Determine new status
  const newStatus = newOutstanding <= 0 ? (isPrepayment ? 'prepaid' : 'closed') : 'active';

  // Update loan
  const { data: updatedLoan, error: updateError } = await supabase
    .from('loans')
    .update({ 
      outstanding: newOutstanding,
      months_paid: newMonthsPaid,
      next_emi_date: newStatus === 'active' ? nextEmiDate.toISOString().split('T')[0] : null,
      status: newStatus,
    })
    .eq('id', loanId)
    .select()
    .single();

  if (updateError) handleSupabaseError(updateError);

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      family_id: familyId,
      type: 'expense',
      amount,
      date: new Date().toISOString().split('T')[0],
      description: `${isPrepayment ? 'Prepayment' : 'EMI'} - ${loan!.lender} ${loan!.type} Loan`,
      account_id: accountId,
      payment_mode: paymentMode as any,
      notes,
      created_by: userId,
    })
    .select()
    .single();

  if (txError) handleSupabaseError(txError);

  // Create loan payment record
  const { data: payment, error: paymentError } = await supabase
    .from('loan_payments')
    .insert({
      loan_id: loanId,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      principal_paid: principalPaid,
      interest_paid: interestPaid,
      outstanding_after: newOutstanding,
      is_prepayment: isPrepayment,
      transaction_id: transaction!.id,
      created_by: userId,
    })
    .select()
    .single();

  if (paymentError) handleSupabaseError(paymentError);

  // Deduct from bank account if specified
  if (accountId) {
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (account) {
      await supabase
        .from('bank_accounts')
        .update({ balance: (account.balance || 0) - amount })
        .eq('id', accountId);
    }
  }

  return { loan: updatedLoan!, payment: payment!, transaction: transaction! };
}

// ==================== Loan Summary ====================

export async function getLoansSummary(familyId: string) {
  const loans = await getLoans(familyId);
  
  const activeLoans = loans.filter(l => l.status === 'active');
  const closedLoans = loans.filter(l => l.status !== 'active');
  
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstanding, 0);
  const totalEMI = activeLoans.reduce((sum, l) => sum + l.emi, 0);
  const totalPrincipal = activeLoans.reduce((sum, l) => sum + l.principal, 0);
  
  // Get upcoming EMIs
  const upcomingEMIs = activeLoans
    .filter(l => l.next_emi_date)
    .sort((a, b) => new Date(a.next_emi_date!).getTime() - new Date(b.next_emi_date!).getTime())
    .slice(0, 5);

  return {
    loans,
    activeLoans,
    closedLoans,
    totalOutstanding,
    totalEMI,
    totalPrincipal,
    totalPaid: totalPrincipal - totalOutstanding,
    upcomingEMIs,
  };
}

// ==================== Prepayment Calculator ====================

export function calculatePrepaymentSavings(
  outstanding: number,
  interestRate: number,
  remainingMonths: number,
  prepaymentAmount: number
): {
  originalInterest: number;
  newInterest: number;
  interestSaved: number;
  monthsReduced: number;
} {
  const monthlyRate = interestRate / 100 / 12;
  
  // Calculate original interest
  const emi = (outstanding * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
              (Math.pow(1 + monthlyRate, remainingMonths) - 1);
  const originalInterest = (emi * remainingMonths) - outstanding;
  
  // Calculate new interest after prepayment
  const newOutstanding = outstanding - prepaymentAmount;
  const newEmi = (newOutstanding * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                 (Math.pow(1 + monthlyRate, remainingMonths) - 1);
  const newInterest = (newEmi * remainingMonths) - newOutstanding;
  
  // Calculate months reduced (keeping same EMI)
  const newMonths = Math.ceil(
    Math.log(emi / (emi - newOutstanding * monthlyRate)) / Math.log(1 + monthlyRate)
  );
  
  return {
    originalInterest: Math.round(originalInterest),
    newInterest: Math.round(newInterest),
    interestSaved: Math.round(originalInterest - newInterest),
    monthsReduced: remainingMonths - newMonths,
  };
}
