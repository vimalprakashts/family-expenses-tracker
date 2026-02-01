// Budget Types
export interface PlannedIncome {
  id: string;
  source: string;
  icon: string;
  expectedAmount: number;
  receivedAmount: number;
  expectedDate: number;
  status: 'received' | 'partial' | 'pending';
}

export interface PlannedExpense {
  id: string;
  category: string;
  icon: string;
  plannedAmount: number;
  actualAmount: number;
  status: 'under' | 'on-budget' | 'over';
}

export interface UnplannedExpense {
  id: string;
  category: string;
  icon: string;
  amount: number;
  date: string;
}

export interface BudgetSummary {
  plannedIncome: number;
  actualIncome: number;
  plannedExpenses: number;
  actualExpenses: number;
  unplannedExpenses: number;
}

// Account Types
export interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  accountNumber: string;
  ifscCode: string;
  balance: number;
  minBalance: number;
  debitCard?: string;
}

export interface CreditCard {
  id: string;
  bankName: string;
  cardName: string;
  cardNumber: string;
  limit: number;
  available: number;
  dueAmount: number;
  dueDate: string;
  minDue: number;
}

// Loan Types
export interface Loan {
  id: string;
  type: 'home' | 'car' | 'personal' | 'gold' | 'education';
  lender: string;
  principal: number;
  outstanding: number;
  interestRate: number;
  emi: number;
  tenure: { paid: number; total: number };
  nextDueDate: string;
  icon: string;
}

// Investment Types
export interface Investment {
  id: string;
  type: 'mutual-fund' | 'fd' | 'rd' | 'ppf' | 'stocks' | 'chit_fund' | 'gold';
  name: string;
  invested: number;
  currentValue: number;
  returns: number;
  maturityDate?: string;
  sip?: number;
}

// Insurance Types
export interface Insurance {
  id: string;
  type: 'lic' | 'health' | 'term' | 'vehicle';
  provider: string;
  policyNumber: string;
  coverage: number;
  premium: number;
  frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  nextDueDate: string;
  maturityDate?: string;
  icon: string;
}

// Personal Lending Types
export interface PersonalLending {
  id: string;
  type: 'given' | 'taken';
  personName: string;
  amount: number;
  amountReceived?: number;
  date: string;
  returnDate: string;
  purpose: string;
  status: 'pending' | 'partial' | 'overdue' | 'settled';
}

// Scheduled Payment Types (Non-Monthly Recurring)
export interface ScheduledPayment {
  id: string;
  name: string;
  category: 'insurance' | 'education' | 'tax' | 'maintenance' | 'subscription' | 'vehicle' | 'other';
  icon: string;
  frequency: 'quarterly' | 'half-yearly' | 'yearly' | 'custom';
  amount: number;
  dueMonths: number[]; // 1-12 for Jan-Dec
  dueDay: number; // Day of month
  linkedTo?: { type: 'insurance' | 'loan' | 'investment'; id: string };
  isAutoLinked: boolean;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface ScheduledPaymentInstance {
  id: string;
  scheduleId: string;
  scheduleName: string;
  icon: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAmount?: number;
  paidDate?: string;
  linkedTo?: { type: string; id: string };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'emi' | 'card' | 'insurance' | 'chit' | 'lending' | 'budget';
  title: string;
  description: string;
  amount?: number;
  date: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
}
