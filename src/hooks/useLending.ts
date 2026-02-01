import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as lendingService from '../services/lending';
import type { PersonalLendingInsert } from '../lib/supabase';

export function useLendings() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['lendings', family?.id],
    queryFn: () => lendingService.getLendings(family!.id),
    enabled: !!family?.id,
  });
}

export function useActiveLendings() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['activeLendings', family?.id],
    queryFn: () => lendingService.getActiveLendings(family!.id),
    enabled: !!family?.id,
  });
}

export function useLending(id: string) {
  return useQuery({
    queryKey: ['lending', id],
    queryFn: () => lendingService.getLending(id),
    enabled: !!id,
  });
}

export function useLendingPayments(lendingId: string) {
  return useQuery({
    queryKey: ['lendingPayments', lendingId],
    queryFn: () => lendingService.getLendingPayments(lendingId),
    enabled: !!lendingId,
  });
}

export function useLendingSummary() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['lendingSummary', family?.id],
    queryFn: () => lendingService.getLendingSummary(family!.id),
    enabled: !!family?.id,
  });
}

export function useLentMoney() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['lentMoney', family?.id],
    queryFn: () => lendingService.getLentMoney(family!.id),
    enabled: !!family?.id,
  });
}

export function useBorrowedMoney() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['borrowedMoney', family?.id],
    queryFn: () => lendingService.getBorrowedMoney(family!.id),
    enabled: !!family?.id,
  });
}

export function useOverdueLendings() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['overdueLendings', family?.id],
    queryFn: () => lendingService.getOverdueLendings(family!.id),
    enabled: !!family?.id,
  });
}

export function useCreateLending() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (lending: Omit<PersonalLendingInsert, 'created_by' | 'family_id'>) =>
      lendingService.createLending({ ...lending, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lendings'] });
      queryClient.invalidateQueries({ queryKey: ['activeLendings'] });
      queryClient.invalidateQueries({ queryKey: ['lendingSummary'] });
      queryClient.invalidateQueries({ queryKey: ['lentMoney'] });
      queryClient.invalidateQueries({ queryKey: ['borrowedMoney'] });
    },
  });
}

export function useUpdateLending() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof lendingService.updateLending>[1] }) =>
      lendingService.updateLending(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lendings'] });
      queryClient.invalidateQueries({ queryKey: ['activeLendings'] });
      queryClient.invalidateQueries({ queryKey: ['lending', id] });
      queryClient.invalidateQueries({ queryKey: ['lendingSummary'] });
    },
  });
}

export function useDeleteLending() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => lendingService.deleteLending(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lendings'] });
      queryClient.invalidateQueries({ queryKey: ['activeLendings'] });
      queryClient.invalidateQueries({ queryKey: ['lendingSummary'] });
      queryClient.invalidateQueries({ queryKey: ['lentMoney'] });
      queryClient.invalidateQueries({ queryKey: ['borrowedMoney'] });
    },
  });
}

export function useRecordLendingPayment() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      lendingId: string;
      amount: number;
      accountId: string | null;
      paymentMode: string;
      notes?: string;
    }) => lendingService.recordLendingPayment(
      data.lendingId,
      data.amount,
      data.accountId,
      data.paymentMode,
      user!.id,
      family!.id,
      data.notes
    ),
    onSuccess: (_, { lendingId }) => {
      queryClient.invalidateQueries({ queryKey: ['lendings'] });
      queryClient.invalidateQueries({ queryKey: ['activeLendings'] });
      queryClient.invalidateQueries({ queryKey: ['lending', lendingId] });
      queryClient.invalidateQueries({ queryKey: ['lendingPayments', lendingId] });
      queryClient.invalidateQueries({ queryKey: ['lendingSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });
}
