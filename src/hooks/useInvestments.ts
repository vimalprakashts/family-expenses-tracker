import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as investmentsService from '../services/investments';
import type { InvestmentInsert } from '../lib/supabase';

export function useInvestments() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['investments', family?.id],
    queryFn: () => investmentsService.getInvestments(family!.id),
    enabled: !!family?.id,
  });
}

export function useActiveInvestments() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['activeInvestments', family?.id],
    queryFn: () => investmentsService.getActiveInvestments(family!.id),
    enabled: !!family?.id,
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: () => investmentsService.getInvestment(id),
    enabled: !!id,
  });
}

export function useInvestmentsSummary() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['investmentsSummary', family?.id],
    queryFn: () => investmentsService.getInvestmentsSummary(family!.id),
    enabled: !!family?.id,
  });
}

export function useInvestmentsByType() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['investmentsByType', family?.id],
    queryFn: () => investmentsService.getInvestmentsByType(family!.id),
    enabled: !!family?.id,
  });
}

export function useSIPInvestments() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['sipInvestments', family?.id],
    queryFn: () => investmentsService.getSIPInvestments(family!.id),
    enabled: !!family?.id,
  });
}

export function useUpcomingMaturities(daysAhead: number = 30) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['upcomingMaturities', family?.id, daysAhead],
    queryFn: () => investmentsService.getUpcomingMaturities(family!.id, daysAhead),
    enabled: !!family?.id,
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (investment: Omit<InvestmentInsert, 'created_by' | 'family_id'>) =>
      investmentsService.createInvestment({ ...investment, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['activeInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['investmentsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['investmentsByType'] });
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof investmentsService.updateInvestment>[1] }) =>
      investmentsService.updateInvestment(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['activeInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['investment', id] });
      queryClient.invalidateQueries({ queryKey: ['investmentsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['investmentsByType'] });
    },
  });
}

export function useUpdateInvestmentValue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      investmentsService.updateInvestmentValue(id, currentValue),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['activeInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['investment', id] });
      queryClient.invalidateQueries({ queryKey: ['investmentsSummary'] });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => investmentsService.deleteInvestment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['activeInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['investmentsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['investmentsByType'] });
      // Invalidate scheduled payments since linked schedules are deleted
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingInstances'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
    },
  });
}

export function useCloseInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, finalValue }: { id: string; finalValue: number }) =>
      investmentsService.closeInvestment(id, finalValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['activeInvestments'] });
      queryClient.invalidateQueries({ queryKey: ['investmentsSummary'] });
    },
  });
}
