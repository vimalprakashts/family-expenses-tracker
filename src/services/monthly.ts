import { supabase } from '../lib/supabase';
import type { 
  IncomeRecord, 
  ExpenseRecord, 
  Transaction,
  IncomeRecordInsert,
  ExpenseRecordInsert,
  TransactionInsert 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Income Records ====================

export async function getIncomeRecords(
  familyId: string, 
  year: number, 
  month: number
): Promise<IncomeRecord[]> {
  const { data, error } = await supabase
    .from('income_records')
    .select('*, income_sources(*)')
    .eq('family_id', familyId)
    .eq('year', year)
    .eq('month', month);

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function createIncomeRecord(
  record: Omit<IncomeRecordInsert, 'created_by'>,
  userId: string
): Promise<IncomeRecord> {
  const { data, error } = await supabase
    .from('income_records')
    .insert({ ...record, created_by: userId })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateIncomeRecord(
  id: string,
  updates: Partial<IncomeRecord>
): Promise<IncomeRecord> {
  const { data, error } = await supabase
    .from('income_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function recordIncomeReceived(
  recordId: string,
  receivedAmount: number,
  accountId: string | null,
  paymentMode: string,
  notes: string | null,
  userId: string,
  familyId: string
): Promise<{ incomeRecord: IncomeRecord; transaction: Transaction }> {
  // Get current income record to add to existing received_amount
  const { data: currentRecord, error: fetchError } = await supabase
    .from('income_records')
    .select('received_amount, expected_amount')
    .eq('id', recordId)
    .single();

  if (fetchError) handleSupabaseError(fetchError);

  // Add the new amount to existing received amount
  const currentReceived = currentRecord?.received_amount || 0;
  const newReceivedAmount = currentReceived + receivedAmount;
  const expectedAmount = currentRecord?.expected_amount || 0;

  // Update income record
  const { data: incomeRecord, error: recordError } = await supabase
    .from('income_records')
    .update({ 
      received_amount: newReceivedAmount,
      status: newReceivedAmount >= expectedAmount ? 'received' : 'partial'
    })
    .eq('id', recordId)
    .select('*, income_sources(*)')
    .single();

  if (recordError) handleSupabaseError(recordError);

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      family_id: familyId,
      type: 'income',
      amount: receivedAmount,
      date: new Date().toISOString().split('T')[0],
      description: (incomeRecord as any).income_sources?.name || 'Income',
      income_record_id: recordId,
      account_id: accountId,
      payment_mode: paymentMode as any,
      notes,
      created_by: userId,
    })
    .select()
    .single();

  if (txError) handleSupabaseError(txError);

  return { incomeRecord: incomeRecord!, transaction: transaction! };
}

// ==================== Expense Records ====================

export async function getExpenseRecords(
  familyId: string, 
  year: number, 
  month: number
): Promise<ExpenseRecord[]> {
  const { data, error } = await supabase
    .from('expense_records')
    .select('*, expense_categories(*)')
    .eq('family_id', familyId)
    .eq('year', year)
    .eq('month', month);

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function createExpenseRecord(
  record: Omit<ExpenseRecordInsert, 'created_by'>,
  userId: string
): Promise<ExpenseRecord> {
  const { data, error } = await supabase
    .from('expense_records')
    .insert({ ...record, created_by: userId })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateExpenseRecord(
  id: string,
  updates: Partial<ExpenseRecord>
): Promise<ExpenseRecord> {
  const { data, error } = await supabase
    .from('expense_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function recordExpense(
  recordId: string | null,
  categoryId: string,
  amount: number,
  accountId: string | null,
  paymentMode: string,
  description: string,
  notes: string | null,
  userId: string,
  familyId: string,
  year: number,
  month: number,
  isUnplanned: boolean = false
): Promise<{ expenseRecord: ExpenseRecord; transaction: Transaction }> {
  let expenseRecordId = recordId;

  // Find or create expense record for this category/month
  if (!expenseRecordId) {
    const { data: existing } = await supabase
      .from('expense_records')
      .select('id, spent_amount')
      .eq('family_id', familyId)
      .eq('category_id', categoryId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (existing) {
      expenseRecordId = existing.id;
    } else {
      const { data: category } = await supabase
        .from('expense_categories')
        .select('planned_amount')
        .eq('id', categoryId)
        .single();

      const { data: newRecord, error } = await supabase
        .from('expense_records')
        .insert({
          family_id: familyId,
          category_id: categoryId,
          year,
          month,
          planned_amount: category?.planned_amount || 0,
          spent_amount: 0,
          status: 'under',
          created_by: userId,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error);
      expenseRecordId = newRecord!.id;
    }
  }

  // Get current spent amount
  const { data: currentRecord } = await supabase
    .from('expense_records')
    .select('spent_amount, planned_amount')
    .eq('id', expenseRecordId)
    .single();

  const newSpentAmount = (currentRecord?.spent_amount || 0) + amount;
  const plannedAmount = currentRecord?.planned_amount || 0;
  const status = newSpentAmount > plannedAmount ? 'over' : 
                 newSpentAmount === plannedAmount ? 'on-budget' : 'under';

  // Update expense record
  const { data: expenseRecord, error: recordError } = await supabase
    .from('expense_records')
    .update({ 
      spent_amount: newSpentAmount,
      status
    })
    .eq('id', expenseRecordId)
    .select('*, expense_categories(*)')
    .single();

  if (recordError) handleSupabaseError(recordError);

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      family_id: familyId,
      type: 'expense',
      amount,
      date: new Date().toISOString().split('T')[0],
      description,
      expense_record_id: expenseRecordId,
      account_id: accountId,
      payment_mode: paymentMode as any,
      notes,
      is_unplanned: isUnplanned,
      created_by: userId,
    })
    .select()
    .single();

  if (txError) handleSupabaseError(txError);

  return { expenseRecord: expenseRecord!, transaction: transaction! };
}

// ==================== Transactions ====================

export async function getTransactions(
  familyId: string,
  options?: {
    year?: number;
    month?: number;
    type?: 'income' | 'expense' | 'transfer';
    limit?: number;
  }
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*, income_records(income_sources(*)), expense_records(expense_categories(*))')
    .eq('family_id', familyId)
    .order('date', { ascending: false });

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.year && options?.month) {
    const startDate = `${options.year}-${String(options.month).padStart(2, '0')}-01`;
    const endDate = new Date(options.year, options.month, 0).toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getRecentTransactions(
  familyId: string,
  limit: number = 10
): Promise<Transaction[]> {
  return getTransactions(familyId, { limit });
}

export async function createTransaction(
  transaction: Omit<TransactionInsert, 'created_by'>,
  userId: string
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...transaction, created_by: userId })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

// ==================== Monthly Summary ====================

export async function getMonthlyData(
  familyId: string,
  year: number,
  month: number
) {
  const [incomeRecords, expenseRecords, transactions] = await Promise.all([
    getIncomeRecords(familyId, year, month),
    getExpenseRecords(familyId, year, month),
    getTransactions(familyId, { year, month }),
  ]);

  const totalExpected = incomeRecords.reduce((sum, r) => sum + (r.expected_amount || 0), 0);
  const totalReceived = incomeRecords.reduce((sum, r) => sum + (r.received_amount || 0), 0);
  const totalPlanned = expenseRecords.reduce((sum, r) => sum + (r.planned_amount || 0), 0);
  const totalSpent = expenseRecords.reduce((sum, r) => sum + (r.spent_amount || 0), 0);

  return {
    incomeRecords,
    expenseRecords,
    transactions,
    summary: {
      totalExpected,
      totalReceived,
      totalPlanned,
      totalSpent,
      balance: totalReceived - totalSpent,
      savingsRate: totalReceived > 0 ? Math.round(((totalReceived - totalSpent) / totalReceived) * 100) : 0,
    },
  };
}

// Initialize monthly records from budget
export async function initializeMonthlyRecords(
  familyId: string,
  year: number,
  month: number,
  userId: string
) {
  // Get budget sources and categories
  const [{ data: sources }, { data: categories }] = await Promise.all([
    supabase
      .from('income_sources')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true),
    supabase
      .from('expense_categories')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true),
  ]);

  // Check existing records
  const [{ data: existingIncome }, { data: existingExpense }] = await Promise.all([
    supabase
      .from('income_records')
      .select('source_id')
      .eq('family_id', familyId)
      .eq('year', year)
      .eq('month', month),
    supabase
      .from('expense_records')
      .select('category_id')
      .eq('family_id', familyId)
      .eq('year', year)
      .eq('month', month),
  ]);

  const existingSourceIds = new Set(existingIncome?.map(r => r.source_id) || []);
  const existingCategoryIds = new Set(existingExpense?.map(r => r.category_id) || []);

  // Create missing income records
  const newIncomeRecords = (sources || [])
    .filter(s => !existingSourceIds.has(s.id))
    .map(s => ({
      family_id: familyId,
      source_id: s.id,
      year,
      month,
      expected_amount: s.expected_amount,
      received_amount: 0,
      status: 'pending' as const,
      created_by: userId,
    }));

  if (newIncomeRecords.length > 0) {
    await supabase.from('income_records').insert(newIncomeRecords);
  }

  // Create missing expense records
  const newExpenseRecords = (categories || [])
    .filter(c => !existingCategoryIds.has(c.id))
    .map(c => ({
      family_id: familyId,
      category_id: c.id,
      year,
      month,
      planned_amount: c.planned_amount,
      spent_amount: 0,
      status: 'under' as const,
      created_by: userId,
    }));

  if (newExpenseRecords.length > 0) {
    await supabase.from('expense_records').insert(newExpenseRecords);
  }
}

// Refresh budget values for existing monthly records (preserves entered amounts)
export async function refreshBudgetValues(
  familyId: string,
  year: number,
  month: number,
  userId: string
) {
  // Get current budget sources and categories
  const [{ data: sources }, { data: categories }] = await Promise.all([
    supabase
      .from('income_sources')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true),
    supabase
      .from('expense_categories')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true),
  ]);

  // Get existing records with their current values
  const [{ data: existingIncome }, { data: existingExpense }] = await Promise.all([
    supabase
      .from('income_records')
      .select('*')
      .eq('family_id', familyId)
      .eq('year', year)
      .eq('month', month),
    supabase
      .from('expense_records')
      .select('*')
      .eq('family_id', familyId)
      .eq('year', year)
      .eq('month', month),
  ]);

  // Create maps for quick lookup
  const sourceMap = new Map((sources || []).map(s => [s.id, s]));
  const categoryMap = new Map((categories || []).map(c => [c.id, c]));

  // Update income records
  const incomeUpdates = (existingIncome || [])
    .filter(record => sourceMap.has(record.source_id))
    .map(record => {
      const source = sourceMap.get(record.source_id)!;
      const receivedAmount = record.received_amount || 0;
      const newExpectedAmount = source.expected_amount;
      
      // Recalculate status based on new expected amount
      let status: 'pending' | 'partial' | 'received' = 'pending';
      if (receivedAmount >= newExpectedAmount) {
        status = 'received';
      } else if (receivedAmount > 0) {
        status = 'partial';
      }

      return {
        id: record.id,
        expected_amount: newExpectedAmount,
        status,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };
    });

  // Update expense records
  const expenseUpdates = (existingExpense || [])
    .filter(record => categoryMap.has(record.category_id))
    .map(record => {
      const category = categoryMap.get(record.category_id)!;
      const spentAmount = record.spent_amount || 0;
      const newPlannedAmount = category.planned_amount;
      
      // Recalculate status based on new planned amount
      let status: 'under' | 'on-budget' | 'over' = 'under';
      if (newPlannedAmount === 0) {
        status = 'under';
      } else {
        const percentage = (spentAmount / newPlannedAmount) * 100;
        if (percentage > 100) {
          status = 'over';
        } else if (percentage >= 90) {
          status = 'on-budget';
        } else {
          status = 'under';
        }
      }

      return {
        id: record.id,
        planned_amount: newPlannedAmount,
        status,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };
    });

  // Batch update income records
  if (incomeUpdates.length > 0) {
    for (const update of incomeUpdates) {
      const { error } = await supabase
        .from('income_records')
        .update({
          expected_amount: update.expected_amount,
          status: update.status,
          updated_by: update.updated_by,
          updated_at: update.updated_at,
        })
        .eq('id', update.id);
      
      if (error) handleSupabaseError(error);
    }
  }

  // Batch update expense records
  if (expenseUpdates.length > 0) {
    for (const update of expenseUpdates) {
      const { error } = await supabase
        .from('expense_records')
        .update({
          planned_amount: update.planned_amount,
          status: update.status,
          updated_by: update.updated_by,
          updated_at: update.updated_at,
        })
        .eq('id', update.id);
      
      if (error) handleSupabaseError(error);
    }
  }

  // Also create any new records from budget that don't exist yet
  const existingSourceIds = new Set((existingIncome || []).map(r => r.source_id));
  const existingCategoryIds = new Set((existingExpense || []).map(r => r.category_id));

  // Create missing income records
  const newIncomeRecords = (sources || [])
    .filter(s => !existingSourceIds.has(s.id))
    .map(s => ({
      family_id: familyId,
      source_id: s.id,
      year,
      month,
      expected_amount: s.expected_amount,
      received_amount: 0,
      status: 'pending' as const,
      created_by: userId,
    }));

  if (newIncomeRecords.length > 0) {
    const { error } = await supabase.from('income_records').insert(newIncomeRecords);
    if (error) handleSupabaseError(error);
  }

  // Create missing expense records
  const newExpenseRecords = (categories || [])
    .filter(c => !existingCategoryIds.has(c.id))
    .map(c => ({
      family_id: familyId,
      category_id: c.id,
      year,
      month,
      planned_amount: c.planned_amount,
      spent_amount: 0,
      status: 'under' as const,
      created_by: userId,
    }));

  if (newExpenseRecords.length > 0) {
    const { error } = await supabase.from('expense_records').insert(newExpenseRecords);
    if (error) handleSupabaseError(error);
  }
}
