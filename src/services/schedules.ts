import { supabase } from '../lib/supabase';
import type { 
  ScheduledPayment,
  ScheduledInstance,
  ScheduledPaymentInsert,
  ScheduledInstanceInsert,
  Transaction 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Scheduled Payments ====================

export async function getScheduledPayments(familyId: string): Promise<ScheduledPayment[]> {
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*')
    .eq('family_id', familyId)
    .order('due_day', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getActiveSchedules(familyId: string): Promise<ScheduledPayment[]> {
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('due_day', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getScheduledPayment(id: string): Promise<ScheduledPayment | null> {
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createScheduledPayment(
  schedule: Omit<ScheduledPaymentInsert, 'created_by'>,
  userId: string
): Promise<ScheduledPayment> {
  const { data, error } = await supabase
    .from('scheduled_payments')
    .insert({ 
      ...schedule, 
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateScheduledPayment(
  id: string,
  updates: Partial<ScheduledPayment>
): Promise<ScheduledPayment> {
  const { data, error } = await supabase
    .from('scheduled_payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteScheduledPayment(id: string): Promise<void> {
  const { error } = await supabase
    .from('scheduled_payments')
    .update({ is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

// ==================== Scheduled Instances ====================

export async function getScheduledInstances(
  familyId: string,
  year: number,
  month: number
): Promise<ScheduledInstance[]> {
  const { data, error } = await supabase
    .from('scheduled_instances')
    .select('*, scheduled_payments(*)')
    .eq('family_id', familyId)
    .eq('year', year)
    .eq('month', month)
    .order('due_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getUpcomingInstances(
  familyId: string,
  daysAhead: number = 30
): Promise<ScheduledInstance[]> {
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('scheduled_instances')
    .select('*, scheduled_payments(*)')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getOverdueInstances(familyId: string): Promise<ScheduledInstance[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('scheduled_instances')
    .select('*, scheduled_payments(*)')
    .eq('family_id', familyId)
    .eq('status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true });

  if (error) handleSupabaseError(error);
  
  // Update status to overdue
  if (data && data.length > 0) {
    const ids = data.map(d => d.id);
    await supabase
      .from('scheduled_instances')
      .update({ status: 'overdue' })
      .in('id', ids);
  }

  return data ?? [];
}

export async function createScheduledInstance(
  instance: Omit<ScheduledInstanceInsert, 'created_by'>,
  userId: string
): Promise<ScheduledInstance> {
  const { data, error } = await supabase
    .from('scheduled_instances')
    .insert({ 
      ...instance, 
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function payScheduledInstance(
  instanceId: string,
  paidAmount: number,
  accountId: string | null,
  paymentMode: string,
  userId: string,
  familyId: string,
  notes?: string
): Promise<{ instance: ScheduledInstance; transaction: Transaction }> {
  // Get instance with schedule details
  const { data: instance, error: instanceError } = await supabase
    .from('scheduled_instances')
    .select('*, scheduled_payments(*)')
    .eq('id', instanceId)
    .single();

  if (instanceError) handleSupabaseError(instanceError);

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      family_id: familyId,
      type: 'expense',
      amount: paidAmount,
      date: new Date().toISOString().split('T')[0],
      description: (instance as any).scheduled_payments?.name || 'Scheduled Payment',
      scheduled_instance_id: instanceId,
      account_id: accountId,
      payment_mode: paymentMode as any,
      notes,
      created_by: userId,
    })
    .select()
    .single();

  if (txError) handleSupabaseError(txError);

  // Update instance
  const { data: updatedInstance, error: updateError } = await supabase
    .from('scheduled_instances')
    .update({ 
      status: 'paid',
      paid_amount: paidAmount,
      paid_date: new Date().toISOString().split('T')[0],
      transaction_id: transaction!.id
    })
    .eq('id', instanceId)
    .select('*, scheduled_payments(*)')
    .single();

  if (updateError) handleSupabaseError(updateError);

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
        .update({ balance: (account.balance || 0) - paidAmount })
        .eq('id', accountId);
    }
  }

  return { instance: updatedInstance!, transaction: transaction! };
}

// ==================== Generate Monthly Instances ====================

export async function generateMonthlyInstances(
  familyId: string,
  year: number,
  month: number,
  userId: string
): Promise<ScheduledInstance[]> {
  // Get active schedules
  const schedules = await getActiveSchedules(familyId);
  
  // Check existing instances
  const { data: existing } = await supabase
    .from('scheduled_instances')
    .select('schedule_id')
    .eq('family_id', familyId)
    .eq('year', year)
    .eq('month', month);

  const existingScheduleIds = new Set(existing?.map(e => e.schedule_id) || []);

  // Filter schedules that need instances
  const needsInstances = schedules.filter(s => {
    if (existingScheduleIds.has(s.id)) return false;
    
    // Check if this month is in due_months (if specified)
    if (s.due_months && s.due_months.length > 0) {
      return s.due_months.includes(month);
    }
    
    // Check frequency
    if (s.frequency === 'monthly') return true;
    if (s.frequency === 'quarterly') return [1, 4, 7, 10].includes(month);
    if (s.frequency === 'half-yearly') return [1, 7].includes(month);
    if (s.frequency === 'yearly') return month === new Date(s.start_date).getMonth() + 1;
    
    return true;
  });

  // Create instances
  const newInstances = needsInstances.map(s => ({
    family_id: familyId,
    schedule_id: s.id,
    year,
    month,
    due_date: `${year}-${String(month).padStart(2, '0')}-${String(s.due_day || 1).padStart(2, '0')}`,
    amount: s.amount,
    status: 'pending' as const,
    created_by: userId,
  }));

  if (newInstances.length === 0) return [];

  const { data, error } = await supabase
    .from('scheduled_instances')
    .insert(newInstances)
    .select('*, scheduled_payments(*)');

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== Schedule Summary ====================

export async function getSchedulesSummary(
  familyId: string,
  year: number,
  month: number
) {
  const [schedules, instances, upcoming, overdue] = await Promise.all([
    getActiveSchedules(familyId),
    getScheduledInstances(familyId, year, month),
    getUpcomingInstances(familyId, 30),
    getOverdueInstances(familyId),
  ]);

  const totalMonthlyAmount = schedules
    .filter(s => s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0);

  const paidThisMonth = instances
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.paid_amount || 0), 0);

  const pendingThisMonth = instances
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);

  // Group by category
  const byCategory: Record<string, { count: number; amount: number }> = {};
  for (const schedule of schedules) {
    const cat = schedule.category || 'other';
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, amount: 0 };
    }
    byCategory[cat].count += 1;
    byCategory[cat].amount += schedule.amount;
  }

  return {
    schedules,
    instances,
    upcoming,
    overdue,
    totalMonthlyAmount,
    paidThisMonth,
    pendingThisMonth,
    byCategory,
  };
}
