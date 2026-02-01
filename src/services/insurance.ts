import { supabase } from '../lib/supabase';
import type { 
  Insurance,
  InsuranceInsert,
  Transaction 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Insurance Policies ====================

export async function getInsurancePolicies(familyId: string): Promise<Insurance[]> {
  const { data, error } = await supabase
    .from('insurance')
    .select('*')
    .eq('family_id', familyId)
    .order('next_due_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getActivePolicies(familyId: string): Promise<Insurance[]> {
  const { data, error } = await supabase
    .from('insurance')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .order('next_due_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getInsurance(id: string): Promise<Insurance | null> {
  const { data, error } = await supabase
    .from('insurance')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createInsurance(
  policy: Omit<InsuranceInsert, 'created_by'>,
  userId: string
): Promise<Insurance> {
  const { data, error } = await supabase
    .from('insurance')
    .insert({ 
      ...policy, 
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateInsurance(
  id: string,
  updates: Partial<Insurance>
): Promise<Insurance> {
  const { data, error } = await supabase
    .from('insurance')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteInsurance(id: string): Promise<void> {
  const { error } = await supabase
    .from('insurance')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

// ==================== Premium Payment ====================

export async function payPremium(
  policyId: string,
  amount: number,
  accountId: string | null,
  paymentMode: string,
  userId: string,
  familyId: string,
  notes?: string
): Promise<{ policy: Insurance; transaction: Transaction }> {
  // Get current policy
  const { data: policy, error: policyError } = await supabase
    .from('insurance')
    .select('*')
    .eq('id', policyId)
    .single();

  if (policyError) handleSupabaseError(policyError);

  // Calculate next due date based on frequency
  const currentDueDate = new Date(policy!.next_due_date || new Date());
  let nextDueDate = new Date(currentDueDate);
  
  switch (policy!.frequency) {
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      break;
    case 'half-yearly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      break;
  }

  // Update policy with new due date
  const { data: updatedPolicy, error: updateError } = await supabase
    .from('insurance')
    .update({ 
      next_due_date: nextDueDate.toISOString().split('T')[0]
    })
    .eq('id', policyId)
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
      description: `Premium - ${policy!.policy_name || policy!.provider} ${policy!.type}`,
      account_id: accountId,
      payment_mode: paymentMode as any,
      notes,
      created_by: userId,
    })
    .select()
    .single();

  if (txError) handleSupabaseError(txError);

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

  return { policy: updatedPolicy!, transaction: transaction! };
}

// ==================== Insurance by Type ====================

export async function getPoliciesByType(familyId: string) {
  const policies = await getActivePolicies(familyId);
  
  const byType: Record<string, Insurance[]> = {};
  for (const policy of policies) {
    if (!byType[policy.type]) {
      byType[policy.type] = [];
    }
    byType[policy.type].push(policy);
  }

  return byType;
}

// ==================== Upcoming Premiums ====================

export async function getUpcomingPremiums(
  familyId: string, 
  daysAhead: number = 30
): Promise<Insurance[]> {
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('insurance')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .not('next_due_date', 'is', null)
    .gte('next_due_date', today.toISOString().split('T')[0])
    .lte('next_due_date', futureDate.toISOString().split('T')[0])
    .order('next_due_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== Insurance Summary ====================

export async function getInsuranceSummary(familyId: string) {
  const policies = await getInsurancePolicies(familyId);
  
  const activePolicies = policies.filter(p => p.status === 'active');
  const expiredPolicies = policies.filter(p => p.status === 'expired');
  
  const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverage, 0);
  const totalPremium = activePolicies.reduce((sum, p) => sum + p.premium, 0);
  
  // Calculate annual premium based on frequency
  let annualPremium = 0;
  for (const policy of activePolicies) {
    let multiplier = 1;
    switch (policy.frequency) {
      case 'monthly': multiplier = 12; break;
      case 'quarterly': multiplier = 4; break;
      case 'half-yearly': multiplier = 2; break;
      case 'yearly': multiplier = 1; break;
    }
    annualPremium += policy.premium * multiplier;
  }

  // Group by type
  const byType: Record<string, { coverage: number; premium: number; count: number }> = {};
  for (const policy of activePolicies) {
    if (!byType[policy.type]) {
      byType[policy.type] = { coverage: 0, premium: 0, count: 0 };
    }
    byType[policy.type].coverage += policy.coverage;
    byType[policy.type].premium += policy.premium;
    byType[policy.type].count += 1;
  }

  // Get upcoming premiums
  const upcomingPremiums = await getUpcomingPremiums(familyId);

  return {
    policies,
    activePolicies,
    expiredPolicies,
    totalCoverage,
    totalPremium,
    annualPremium,
    byType,
    upcomingPremiums,
  };
}
