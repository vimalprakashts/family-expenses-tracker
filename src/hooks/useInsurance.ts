import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as insuranceService from '../services/insurance';
import type { InsuranceInsert } from '../lib/supabase';

export function useInsurancePolicies() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['insurancePolicies', family?.id],
    queryFn: () => insuranceService.getInsurancePolicies(family!.id),
    enabled: !!family?.id,
  });
}

export function useActivePolicies() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['activePolicies', family?.id],
    queryFn: () => insuranceService.getActivePolicies(family!.id),
    enabled: !!family?.id,
  });
}

export function useInsurance(id: string) {
  return useQuery({
    queryKey: ['insurance', id],
    queryFn: () => insuranceService.getInsurance(id),
    enabled: !!id,
  });
}

export function useInsuranceSummary() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['insuranceSummary', family?.id],
    queryFn: () => insuranceService.getInsuranceSummary(family!.id),
    enabled: !!family?.id,
  });
}

export function usePoliciesByType() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['policiesByType', family?.id],
    queryFn: () => insuranceService.getPoliciesByType(family!.id),
    enabled: !!family?.id,
  });
}

export function useUpcomingPremiums(daysAhead: number = 30) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['upcomingPremiums', family?.id, daysAhead],
    queryFn: () => insuranceService.getUpcomingPremiums(family!.id, daysAhead),
    enabled: !!family?.id,
  });
}

export function useCreateInsurance() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (policy: Omit<InsuranceInsert, 'created_by' | 'family_id'>) =>
      insuranceService.createInsurance({ ...policy, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurancePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['activePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['insuranceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['policiesByType'] });
    },
  });
}

export function useUpdateInsurance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof insuranceService.updateInsurance>[1] }) =>
      insuranceService.updateInsurance(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['insurancePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['activePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['insurance', id] });
      queryClient.invalidateQueries({ queryKey: ['insuranceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['policiesByType'] });
    },
  });
}

export function useDeleteInsurance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => insuranceService.deleteInsurance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurancePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['activePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['insuranceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['policiesByType'] });
      // Invalidate scheduled payments since linked schedules are deleted
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingInstances'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
    },
  });
}

export function usePayPremium() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      policyId: string;
      amount: number;
      accountId: string | null;
      paymentMode: string;
      notes?: string;
    }) => insuranceService.payPremium(
      data.policyId,
      data.amount,
      data.accountId,
      data.paymentMode,
      user!.id,
      family!.id,
      data.notes
    ),
    onSuccess: (_, { policyId }) => {
      queryClient.invalidateQueries({ queryKey: ['insurancePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['activePolicies'] });
      queryClient.invalidateQueries({ queryKey: ['insurance', policyId] });
      queryClient.invalidateQueries({ queryKey: ['insuranceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingPremiums'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}
