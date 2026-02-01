import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as loansService from '../services/loans';
import type { LoanInsert } from '../lib/supabase';

export function useLoans() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['loans', family?.id],
    queryFn: () => loansService.getLoans(family!.id),
    enabled: !!family?.id,
  });
}

export function useActiveLoans() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['activeLoans', family?.id],
    queryFn: () => loansService.getActiveLoans(family!.id),
    enabled: !!family?.id,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: () => loansService.getLoan(id),
    enabled: !!id,
  });
}

export function useLoanPayments(loanId: string) {
  return useQuery({
    queryKey: ['loanPayments', loanId],
    queryFn: () => loansService.getLoanPayments(loanId),
    enabled: !!loanId,
  });
}

export function useLoansSummary() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['loansSummary', family?.id],
    queryFn: () => loansService.getLoansSummary(family!.id),
    enabled: !!family?.id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (loan: Omit<LoanInsert, 'created_by' | 'family_id'>) =>
      loansService.createLoan({ ...loan, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['loansSummary'] });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof loansService.updateLoan>[1] }) =>
      loansService.updateLoan(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['loansSummary'] });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => loansService.deleteLoan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['loansSummary'] });
      // Invalidate scheduled payments since linked schedules are deleted
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingInstances'] });
      queryClient.invalidateQueries({ queryKey: ['schedulesSummary'] });
    },
  });
}

export function usePayEMI() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      loanId: string;
      amount: number;
      accountId: string | null;
      paymentMode: string;
      isPrepayment?: boolean;
      notes?: string;
    }) => loansService.payEMI(
      data.loanId,
      data.amount,
      data.accountId,
      data.paymentMode,
      user!.id,
      family!.id,
      data.isPrepayment,
      data.notes
    ),
    onSuccess: (_, { loanId }) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['activeLoans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loanPayments', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loansSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}
