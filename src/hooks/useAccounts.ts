import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as accountsService from '../services/accounts';
import type { BankAccountInsert, CreditCardInsert, CreditCardBillInsert, CreditCardBill } from '../lib/supabase';

export function useBankAccounts() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['bankAccounts', family?.id],
    queryFn: () => accountsService.getBankAccounts(family!.id),
    enabled: !!family?.id,
  });
}

export function useCreditCards() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['creditCards', family?.id],
    queryFn: () => accountsService.getCreditCards(family!.id),
    enabled: !!family?.id,
  });
}

export function useAccountsSummary() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['accountsSummary', family?.id],
    queryFn: () => accountsService.getAccountsSummary(family!.id),
    enabled: !!family?.id,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (account: Omit<BankAccountInsert, 'created_by' | 'family_id'>) =>
      accountsService.createBankAccount({ ...account, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof accountsService.updateBankAccount>[1] }) =>
      accountsService.updateBankAccount(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => accountsService.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
    },
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (card: Omit<CreditCardInsert, 'created_by' | 'family_id'>) =>
      accountsService.createCreditCard({ ...card, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
    },
  });
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof accountsService.updateCreditCard>[1] }) =>
      accountsService.updateCreditCard(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
    },
  });
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => accountsService.deleteCreditCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
    },
  });
}

export function usePayCreditCard() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      cardId: string;
      amount: number;
      fromAccountId: string;
      notes?: string;
    }) => accountsService.payCreditCard(
      data.cardId,
      data.amount,
      data.fromAccountId,
      user!.id,
      family!.id,
      data.notes
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ==================== Credit Card Bills ====================

export function useCreditCardBills(creditCardId: string, year?: number, month?: number) {
  return useQuery({
    queryKey: ['creditCardBills', creditCardId, year, month],
    queryFn: () => accountsService.getCreditCardBills(creditCardId, year, month),
    enabled: !!creditCardId,
  });
}

export function useCreateCreditCardBill() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (bill: Omit<CreditCardBillInsert, 'created_by' | 'family_id' | 'billing_date' | 'due_date' | 'status' | 'paid_amount' | 'paid_date' | 'transaction_id'>) =>
      accountsService.createCreditCardBill(bill, user!.id, family!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCardBills'] });
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
    },
  });
}

export function useUpdateCreditCardBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreditCardBill> }) =>
      accountsService.updateCreditCardBill(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCardBills'] });
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
    },
  });
}

export function usePayCreditCardBill() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      billId: string;
      paidAmount: number;
      fromAccountId: string | null;
      notes?: string;
    }) => accountsService.payCreditCardBill(
      data.billId,
      data.paidAmount,
      data.fromAccountId,
      user!.id,
      family!.id,
      data.notes
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCardBills'] });
      queryClient.invalidateQueries({ queryKey: ['creditCards'] });
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledPayments'] });
      queryClient.invalidateQueries({ queryKey: ['activeSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteCreditCardBill() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => accountsService.deleteCreditCardBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditCardBills'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledInstances'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
    },
  });
}
