import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as monthlyService from '../services/monthly';

export function useMonthlyData(year: number, month: number) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['monthlyData', family?.id, year, month],
    queryFn: () => monthlyService.getMonthlyData(family!.id, year, month),
    enabled: !!family?.id,
  });
}

export function useIncomeRecords(year: number, month: number) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['incomeRecords', family?.id, year, month],
    queryFn: () => monthlyService.getIncomeRecords(family!.id, year, month),
    enabled: !!family?.id,
  });
}

export function useExpenseRecords(year: number, month: number) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['expenseRecords', family?.id, year, month],
    queryFn: () => monthlyService.getExpenseRecords(family!.id, year, month),
    enabled: !!family?.id,
  });
}

export function useTransactions(options?: {
  year?: number;
  month?: number;
  type?: 'income' | 'expense' | 'transfer';
  limit?: number;
}) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['transactions', family?.id, options],
    queryFn: () => monthlyService.getTransactions(family!.id, options),
    enabled: !!family?.id,
  });
}

export function useRecentTransactions(limit: number = 10) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['recentTransactions', family?.id, limit],
    queryFn: () => monthlyService.getRecentTransactions(family!.id, limit),
    enabled: !!family?.id,
  });
}

export function useRecordIncomeReceived() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      recordId: string;
      receivedAmount: number;
      accountId: string | null;
      paymentMode: string;
      notes: string | null;
    }) => monthlyService.recordIncomeReceived(
      data.recordId,
      data.receivedAmount,
      data.accountId,
      data.paymentMode,
      data.notes,
      user!.id,
      family!.id
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
      queryClient.invalidateQueries({ queryKey: ['incomeRecords'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
    },
  });
}

export function useRecordExpense() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      recordId: string | null;
      categoryId: string;
      amount: number;
      accountId: string | null;
      paymentMode: string;
      description: string;
      notes: string | null;
      year: number;
      month: number;
      isUnplanned?: boolean;
    }) => monthlyService.recordExpense(
      data.recordId,
      data.categoryId,
      data.amount,
      data.accountId,
      data.paymentMode,
      data.description,
      data.notes,
      user!.id,
      family!.id,
      data.year,
      data.month,
      data.isUnplanned
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
      queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
    },
  });
}

export function useInitializeMonthlyRecords() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      monthlyService.initializeMonthlyRecords(family!.id, year, month, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
      queryClient.invalidateQueries({ queryKey: ['incomeRecords'] });
      queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
    },
  });
}

export function useRefreshBudgetValues() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      monthlyService.refreshBudgetValues(family!.id, year, month, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
      queryClient.invalidateQueries({ queryKey: ['incomeRecords'] });
      queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
    },
  });
}
