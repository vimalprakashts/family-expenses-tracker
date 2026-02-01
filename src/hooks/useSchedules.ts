import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as schedulesService from '../services/schedules';
import type { ScheduledPaymentInsert } from '../lib/supabase';

export function useScheduledPayments() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['scheduledPayments', family?.id],
    queryFn: () => schedulesService.getScheduledPayments(family!.id),
    enabled: !!family?.id,
  });
}

export function useActiveSchedules() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['activeSchedules', family?.id],
    queryFn: () => schedulesService.getActiveSchedules(family!.id),
    enabled: !!family?.id,
  });
}

export function useScheduledInstances(year: number, month: number) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['scheduledInstances', family?.id, year, month],
    queryFn: () => schedulesService.getScheduledInstances(family!.id, year, month),
    enabled: !!family?.id,
  });
}

export function useUpcomingInstances(daysAhead: number = 30) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['upcomingInstances', family?.id, daysAhead],
    queryFn: () => schedulesService.getUpcomingInstances(family!.id, daysAhead),
    enabled: !!family?.id,
  });
}

export function useOverdueInstances() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['overdueInstances', family?.id],
    queryFn: () => schedulesService.getOverdueInstances(family!.id),
    enabled: !!family?.id,
  });
}

export function useSchedulesSummary(year: number, month: number) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['schedulesSummary', family?.id, year, month],
    queryFn: () => schedulesService.getSchedulesSummary(family!.id, year, month),
    enabled: !!family?.id,
  });
}

export function useCreateScheduledPayment() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (schedule: Omit<ScheduledPaymentInsert, 'created_by' | 'family_id'>) =>
      schedulesService.createScheduledPayment({ ...schedule, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
    },
  });
}

export function useUpdateScheduledPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof schedulesService.updateScheduledPayment>[1] }) =>
      schedulesService.updateScheduledPayment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
    },
  });
}

export function useDeleteScheduledPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => schedulesService.deleteScheduledPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
    },
  });
}

export function usePayScheduledInstance() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      instanceId: string;
      paidAmount: number;
      accountId: string | null;
      paymentMode: string;
      notes?: string;
    }) => schedulesService.payScheduledInstance(
      data.instanceId,
      data.paidAmount,
      data.accountId,
      data.paymentMode,
      user!.id,
      family!.id,
      data.notes
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingInstances'] });
      queryClient.invalidateQueries({ queryKey: ['overdueInstances'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}

export function useGenerateMonthlyInstances() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      schedulesService.generateMonthlyInstances(family!.id, year, month, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingInstances'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
    },
  });
}
