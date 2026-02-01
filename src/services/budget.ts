import { supabase } from '../lib/supabase';
import type { 
  IncomeSource, 
  ExpenseCategory, 
  IncomeSourceInsert, 
  ExpenseCategoryInsert 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Income Sources ====================

export async function getIncomeSources(familyId: string): Promise<IncomeSource[]> {
  const { data, error } = await supabase
    .from('income_sources')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function createIncomeSource(
  source: Omit<IncomeSourceInsert, 'created_by'>,
  userId: string
): Promise<IncomeSource> {
  const { data, error } = await supabase
    .from('income_sources')
    .insert({ ...source, created_by: userId })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateIncomeSource(
  id: string,
  updates: Partial<IncomeSource>
): Promise<IncomeSource> {
  const { data, error } = await supabase
    .from('income_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteIncomeSource(id: string): Promise<void> {
  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('income_sources')
    .update({ is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function reorderIncomeSources(
  sources: { id: string; display_order: number }[]
): Promise<void> {
  for (const source of sources) {
    const { error } = await supabase
      .from('income_sources')
      .update({ display_order: source.display_order })
      .eq('id', source.id);

    if (error) handleSupabaseError(error);
  }
}

// ==================== Expense Categories ====================

export async function getExpenseCategories(familyId: string): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function createExpenseCategory(
  category: Omit<ExpenseCategoryInsert, 'created_by'>,
  userId: string
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert({ ...category, created_by: userId })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateExpenseCategory(
  id: string,
  updates: Partial<ExpenseCategory>
): Promise<ExpenseCategory> {
  const { data, error } = await supabase
    .from('expense_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('expense_categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function reorderExpenseCategories(
  categories: { id: string; display_order: number }[]
): Promise<void> {
  for (const category of categories) {
    const { error } = await supabase
      .from('expense_categories')
      .update({ display_order: category.display_order })
      .eq('id', category.id);

    if (error) handleSupabaseError(error);
  }
}

// ==================== Budget Summary ====================

export async function getBudgetSummary(familyId: string) {
  const [sources, categories] = await Promise.all([
    getIncomeSources(familyId),
    getExpenseCategories(familyId),
  ]);

  const totalIncome = sources.reduce((sum, s) => sum + s.expected_amount, 0);
  const totalExpenses = categories.reduce((sum, c) => sum + c.planned_amount, 0);
  const surplus = totalIncome - totalExpenses;

  return {
    sources,
    categories,
    totalIncome,
    totalExpenses,
    surplus,
    savingsRate: totalIncome > 0 ? Math.round((surplus / totalIncome) * 100) : 0,
  };
}
