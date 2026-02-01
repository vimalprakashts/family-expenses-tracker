import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Type helpers for easier table access
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Row types for each table
export type User = Tables['users']['Row'];
export type Family = Tables['families']['Row'];
export type FamilyMember = Tables['family_members']['Row'];
export type IncomeSource = Tables['income_sources']['Row'];
export type ExpenseCategory = Tables['expense_categories']['Row'];
export type IncomeRecord = Tables['income_records']['Row'];
export type ExpenseRecord = Tables['expense_records']['Row'];
export type Transaction = Tables['transactions']['Row'];
export type ScheduledPayment = Tables['scheduled_payments']['Row'];
export type ScheduledInstance = Tables['scheduled_instances']['Row'];
export type BankAccount = Tables['bank_accounts']['Row'];
export type CreditCard = Tables['credit_cards']['Row'];
export type CreditCardBill = Tables['credit_card_bills']['Row'];
export type Loan = Tables['loans']['Row'];
export type LoanPayment = Tables['loan_payments']['Row'];
export type Investment = Tables['investments']['Row'];
export type Insurance = Tables['insurance']['Row'];
export type PersonalLending = Tables['personal_lending']['Row'];
export type LendingPayment = Tables['lending_payments']['Row'];
export type Document = Tables['documents']['Row'];
export type Notification = Tables['notifications']['Row'];
export type AuditLog = Tables['audit_logs']['Row'];

// Insert types
export type UserInsert = Tables['users']['Insert'];
export type FamilyInsert = Tables['families']['Insert'];
export type FamilyMemberInsert = Tables['family_members']['Insert'];
export type IncomeSourceInsert = Tables['income_sources']['Insert'];
export type ExpenseCategoryInsert = Tables['expense_categories']['Insert'];
export type IncomeRecordInsert = Tables['income_records']['Insert'];
export type ExpenseRecordInsert = Tables['expense_records']['Insert'];
export type TransactionInsert = Tables['transactions']['Insert'];
export type ScheduledPaymentInsert = Tables['scheduled_payments']['Insert'];
export type ScheduledInstanceInsert = Tables['scheduled_instances']['Insert'];
export type BankAccountInsert = Tables['bank_accounts']['Insert'];
export type CreditCardInsert = Tables['credit_cards']['Insert'];
export type CreditCardBillInsert = Tables['credit_card_bills']['Insert'];
export type LoanInsert = Tables['loans']['Insert'];
export type LoanPaymentInsert = Tables['loan_payments']['Insert'];
export type InvestmentInsert = Tables['investments']['Insert'];
export type InsuranceInsert = Tables['insurance']['Insert'];
export type PersonalLendingInsert = Tables['personal_lending']['Insert'];
export type LendingPaymentInsert = Tables['lending_payments']['Insert'];
export type DocumentInsert = Tables['documents']['Insert'];
export type NotificationInsert = Tables['notifications']['Insert'];

// Enum types
export type FamilyRole = Enums['family_role'];
export type IncomeStatus = Enums['income_status'];
export type ExpenseStatus = Enums['expense_status'];
export type TransactionType = Enums['transaction_type'];
export type PaymentMode = Enums['payment_mode'];
export type PaymentFrequency = Enums['payment_frequency'];
export type ScheduleCategory = Enums['schedule_category'];
export type ScheduleStatus = Enums['schedule_status'];
export type AccountType = Enums['account_type'];
export type LoanType = Enums['loan_type'];
export type LoanStatus = Enums['loan_status'];
export type InvestmentType = Enums['investment_type'];
export type InvestmentStatus = Enums['investment_status'];
export type InsuranceType = Enums['insurance_type'];
export type InsuranceStatus = Enums['insurance_status'];
export type LendingType = Enums['lending_type'];
export type LendingStatus = Enums['lending_status'];
export type DocumentCategory = Enums['document_category'];
export type NotificationType = Enums['notification_type'];
export type NotificationPriority = Enums['notification_priority'];
