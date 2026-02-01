import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as budgetService from '../services/budget';
import type { IncomeSourceInsert, ExpenseCategoryInsert } from '../lib/supabase';

export function useIncomeSources() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['incomeSources', family?.id],
    queryFn: () => budgetService.getIncomeSources(family!.id),
    enabled: !!family?.id,
  });
}

export function useExpenseCategories() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['expenseCategories', family?.id],
    queryFn: () => budgetService.getExpenseCategories(family!.id),
    enabled: !!family?.id,
  });
}

export function useBudgetSummary() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['budgetSummary', family?.id],
    queryFn: () => budgetService.getBudgetSummary(family!.id),
    enabled: !!family?.id,
  });
}

export function useCreateIncomeSource() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (source: Omit<IncomeSourceInsert, 'created_by' | 'family_id'>) =>
      budgetService.createIncomeSource({ ...source, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeSources'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}

export function useUpdateIncomeSource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof budgetService.updateIncomeSource>[1] }) =>
      budgetService.updateIncomeSource(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeSources'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}

export function useDeleteIncomeSource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => budgetService.deleteIncomeSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomeSources'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (category: Omit<ExpenseCategoryInsert, 'created_by' | 'family_id'>) =>
      budgetService.createExpenseCategory({ ...category, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof budgetService.updateExpenseCategory>[1] }) =>
      budgetService.updateExpenseCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => budgetService.deleteExpenseCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] });
    },
  });
}
