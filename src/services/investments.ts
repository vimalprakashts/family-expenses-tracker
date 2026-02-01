import { supabase } from '../lib/supabase';
import type { 
  Investment,
  InvestmentInsert 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Investments ====================

export async function getInvestments(familyId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getActiveInvestments(familyId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getInvestment(id: string): Promise<Investment | null> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createInvestment(
  investment: Omit<InvestmentInsert, 'created_by'>,
  userId: string
): Promise<Investment> {
  const { data, error } = await supabase
    .from('investments')
    .insert({ 
      ...investment, 
      current_value: investment.current_value || investment.invested_amount,
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateInvestment(
  id: string,
  updates: Partial<Investment>
): Promise<Investment> {
  const { data, error } = await supabase
    .from('investments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateInvestmentValue(
  id: string,
  currentValue: number
): Promise<Investment> {
  const { data: investment } = await supabase
    .from('investments')
    .select('invested_amount')
    .eq('id', id)
    .single();

  const returnsPercent = investment 
    ? ((currentValue - investment.invested_amount) / investment.invested_amount) * 100
    : 0;

  return updateInvestment(id, { 
    current_value: currentValue,
    returns_percent: Math.round(returnsPercent * 100) / 100
  });
}

export async function deleteInvestment(id: string): Promise<void> {
  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function closeInvestment(
  id: string,
  finalValue: number
): Promise<Investment> {
  return updateInvestment(id, { 
    status: 'closed',
    current_value: finalValue 
  });
}

// ==================== Investment by Type ====================

export async function getInvestmentsByType(familyId: string) {
  const investments = await getActiveInvestments(familyId);
  
  const byType: Record<string, Investment[]> = {};
  for (const inv of investments) {
    if (!byType[inv.type]) {
      byType[inv.type] = [];
    }
    byType[inv.type].push(inv);
  }

  return byType;
}

// ==================== SIP Investments ====================

export async function getSIPInvestments(familyId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .not('sip_amount', 'is', null)
    .order('sip_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== Investment Summary ====================

export async function getInvestmentsSummary(familyId: string) {
  const investments = await getInvestments(familyId);
  
  const activeInvestments = investments.filter(i => i.status === 'active');
  const closedInvestments = investments.filter(i => i.status !== 'active');
  
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.invested_amount, 0);
  const totalCurrentValue = activeInvestments.reduce((sum, i) => sum + (i.current_value || i.invested_amount), 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const overallReturnsPercent = totalInvested > 0 
    ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 
    : 0;

  // Group by type
  const byType: Record<string, { invested: number; current: number; count: number }> = {};
  for (const inv of activeInvestments) {
    if (!byType[inv.type]) {
      byType[inv.type] = { invested: 0, current: 0, count: 0 };
    }
    byType[inv.type].invested += inv.invested_amount;
    byType[inv.type].current += inv.current_value || inv.invested_amount;
    byType[inv.type].count += 1;
  }

  // Get SIPs
  const sipInvestments = activeInvestments.filter(i => i.sip_amount);
  const totalSIPAmount = sipInvestments.reduce((sum, i) => sum + (i.sip_amount || 0), 0);

  return {
    investments,
    activeInvestments,
    closedInvestments,
    totalInvested,
    totalCurrentValue,
    totalReturns,
    overallReturnsPercent: Math.round(overallReturnsPercent * 100) / 100,
    byType,
    sipInvestments,
    totalSIPAmount,
  };
}

// ==================== Mutual Fund Specific ====================

export async function getMutualFunds(familyId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('family_id', familyId)
    .eq('type', 'mutual-fund')
    .order('name', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== FD Specific ====================

export async function getFixedDeposits(familyId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('family_id', familyId)
    .eq('type', 'fd')
    .order('maturity_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getUpcomingMaturities(
  familyId: string, 
  daysAhead: number = 30
): Promise<Investment[]> {
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .not('maturity_date', 'is', null)
    .gte('maturity_date', today.toISOString().split('T')[0])
    .lte('maturity_date', futureDate.toISOString().split('T')[0])
    .order('maturity_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}
