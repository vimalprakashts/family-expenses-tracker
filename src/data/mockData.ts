import type { 
  PlannedIncome, 
  PlannedExpense, 
  UnplannedExpense, 
  BankAccount, 
  CreditCard, 
  Loan, 
  Investment, 
  Insurance, 
  PersonalLending,
  Notification,
  ScheduledPayment,
  ScheduledPaymentInstance
} from '../types';

export const plannedIncomes: PlannedIncome[] = [
  { id: '1', source: 'Salary', icon: '💰', expectedAmount: 100000, receivedAmount: 100000, expectedDate: 1, status: 'received' },
  { id: '2', source: 'Rental', icon: '🏠', expectedAmount: 25000, receivedAmount: 15000, expectedDate: 5, status: 'partial' },
  { id: '3', source: 'Freelance', icon: '💼', expectedAmount: 10000, receivedAmount: 10000, expectedDate: 15, status: 'received' },
];

export const plannedExpenses: PlannedExpense[] = [
  { id: '1', category: 'Groceries', icon: '🛒', plannedAmount: 12000, actualAmount: 14000, status: 'over' },
  { id: '2', category: 'Utilities', icon: '⚡', plannedAmount: 8000, actualAmount: 6500, status: 'under' },
  { id: '3', category: 'Dining', icon: '🍽️', plannedAmount: 5000, actualAmount: 5000, status: 'on-budget' },
  { id: '4', category: 'Fuel', icon: '⛽', plannedAmount: 6000, actualAmount: 3300, status: 'under' },
  { id: '5', category: 'Education', icon: '📚', plannedAmount: 15000, actualAmount: 15000, status: 'on-budget' },
  { id: '6', category: 'Healthcare', icon: '🏥', plannedAmount: 5000, actualAmount: 4500, status: 'under' },
  { id: '7', category: 'Entertainment', icon: '🎬', plannedAmount: 4000, actualAmount: 4000, status: 'on-budget' },
  { id: '8', category: 'Home Loan EMI', icon: '🏠', plannedAmount: 32450, actualAmount: 32450, status: 'on-budget' },
];

export const unplannedExpenses: UnplannedExpense[] = [
  { id: '1', category: 'Hospital Emergency', icon: '🏥', amount: 8000, date: '2026-01-10' },
  { id: '2', category: "Friend's Wedding Gift", icon: '🎁', amount: 3000, date: '2026-01-15' },
];

export const bankAccounts: BankAccount[] = [
  { id: '1', bankName: 'HDFC Bank', accountType: 'Savings', accountNumber: '****4521', ifscCode: 'HDFC0001234', balance: 123456, minBalance: 10000, debitCard: '****8901' },
  { id: '2', bankName: 'State Bank of India', accountType: 'Salary', accountNumber: '****7890', ifscCode: 'SBIN0005678', balance: 234567, minBalance: 5000, debitCard: '****2345' },
  { id: '3', bankName: 'ICICI Bank', accountType: 'Savings', accountNumber: '****3456', ifscCode: 'ICIC0009012', balance: 45678, minBalance: 10000 },
  { id: '4', bankName: 'Kotak Mahindra', accountType: 'Joint', accountNumber: '****6789', ifscCode: 'KKBK0003456', balance: 53189, minBalance: 5000 },
];

export const creditCards: CreditCard[] = [
  { id: '1', bankName: 'ICICI', cardName: 'Amazon Pay', cardNumber: '****5678', limit: 300000, available: 284330, dueAmount: 15670, dueDate: '2026-01-22', minDue: 1567 },
  { id: '2', bankName: 'HDFC', cardName: 'Millennia', cardNumber: '****9012', limit: 200000, available: 191770, dueAmount: 8230, dueDate: '2026-01-25', minDue: 823 },
];

export const loans: Loan[] = [
  { id: '1', type: 'home', lender: 'HDFC Bank', principal: 3500000, outstanding: 2845000, interestRate: 8.5, emi: 32450, tenure: { paid: 180, total: 240 }, nextDueDate: '2026-01-20', icon: '🏠' },
  { id: '2', type: 'car', lender: 'SBI', principal: 700000, outstanding: 456000, interestRate: 9.2, emi: 12500, tenure: { paid: 28, total: 60 }, nextDueDate: '2026-01-15', icon: '🚗' },
  { id: '3', type: 'gold', lender: 'Muthoot Finance', principal: 100000, outstanding: 100000, interestRate: 12, emi: 0, tenure: { paid: 0, total: 12 }, nextDueDate: '2026-02-15', icon: '🥇' },
];

export const investments: Investment[] = [
  { id: '1', type: 'mutual-fund', name: 'HDFC Mid-Cap Fund', invested: 200000, currentValue: 265000, returns: 32.5, sip: 5000 },
  { id: '2', type: 'mutual-fund', name: 'Axis Bluechip', invested: 150000, currentValue: 172000, returns: 14.6, sip: 3000 },
  { id: '3', type: 'fd', name: 'SBI FD - 5 Years', invested: 300000, currentValue: 340000, returns: 7.1, maturityDate: '2028-03-15' },
  { id: '4', type: 'chit_fund', name: 'Shriram Chit ₹5L', invested: 200000, currentValue: 200000, returns: 0, maturityDate: '2027-01-01' },
  { id: '5', type: 'ppf', name: 'PPF Account', invested: 500000, currentValue: 580000, returns: 7.1, maturityDate: '2035-04-01' },
];

export const insurances: Insurance[] = [
  { id: '1', type: 'lic', provider: 'LIC', policyNumber: '123456789', coverage: 1000000, premium: 24000, frequency: 'yearly', nextDueDate: '2026-01-25', maturityDate: '2035-12-15', icon: '🛡️' },
  { id: '2', type: 'health', provider: 'Star Health', policyNumber: 'HI987654', coverage: 1000000, premium: 28000, frequency: 'yearly', nextDueDate: '2026-08-15', icon: '🏥' },
  { id: '3', type: 'term', provider: 'ICICI Pru', policyNumber: 'TI456789', coverage: 10000000, premium: 18000, frequency: 'yearly', nextDueDate: '2026-03-10', icon: '💀' },
  { id: '4', type: 'vehicle', provider: 'HDFC Ergo', policyNumber: 'VI789012', coverage: 650000, premium: 15000, frequency: 'yearly', nextDueDate: '2026-02-28', icon: '🚗' },
];

export const personalLendings: PersonalLending[] = [
  { id: '1', type: 'given', personName: 'Rahul Sharma', amount: 50000, date: '2025-11-15', returnDate: '2026-01-31', purpose: 'Medical Emergency', status: 'pending' },
  { id: '2', type: 'given', personName: 'Priya Verma', amount: 15000, amountReceived: 5000, date: '2025-12-20', returnDate: '2026-02-15', purpose: 'Personal', status: 'partial' },
  { id: '3', type: 'given', personName: 'Amit Kumar', amount: 10000, date: '2025-12-01', returnDate: '2026-01-05', purpose: 'Business', status: 'overdue' },
  { id: '4', type: 'taken', personName: 'Father', amount: 25000, date: '2025-10-01', returnDate: '2026-01-31', purpose: 'Home Renovation', status: 'pending' },
];

export const notifications: Notification[] = [
  { id: '1', type: 'emi', title: 'EMI Due Tomorrow', description: 'HDFC Home Loan EMI ₹32,450 due Jan 20', amount: 32450, date: '2026-01-19', priority: 'high', read: false },
  { id: '2', type: 'budget', title: 'Budget Alert', description: 'Groceries budget 85% used', date: '2026-01-19', priority: 'medium', read: false },
  { id: '3', type: 'card', title: 'Payment Successful', description: 'Credit card payment ₹15,670 - ICICI Amazon Pay', amount: 15670, date: '2026-01-19', priority: 'low', read: true },
  { id: '4', type: 'chit', title: 'Chit Fund Reminder', description: 'Auction on Jan 25 - Shriram Chit ₹5L', date: '2026-01-18', priority: 'medium', read: false },
  { id: '5', type: 'insurance', title: 'Premium Due', description: 'LIC Jeevan Anand ₹24,000 due Jan 25', amount: 24000, date: '2026-01-18', priority: 'high', read: false },
];

// Scheduled Payments (Non-Monthly Recurring)
export const scheduledPayments: ScheduledPayment[] = [
  // Auto-Linked from Insurance
  { id: 'sp1', name: 'LIC Jeevan Anand Premium', category: 'insurance', icon: '🛡️', frequency: 'yearly', amount: 24000, dueMonths: [1], dueDay: 25, linkedTo: { type: 'insurance', id: '1' }, isAutoLinked: true, startDate: '2015-01-25' },
  { id: 'sp2', name: 'Car Insurance - HDFC Ergo', category: 'insurance', icon: '🚗', frequency: 'yearly', amount: 15000, dueMonths: [2], dueDay: 28, linkedTo: { type: 'insurance', id: '4' }, isAutoLinked: true, startDate: '2023-02-28' },
  { id: 'sp3', name: 'Term Insurance - ICICI', category: 'insurance', icon: '💀', frequency: 'yearly', amount: 18000, dueMonths: [3], dueDay: 10, linkedTo: { type: 'insurance', id: '3' }, isAutoLinked: true, startDate: '2020-03-10' },
  
  // Manual Schedules
  { id: 'sp4', name: 'School Fees - Term', category: 'education', icon: '🏫', frequency: 'quarterly', amount: 30000, dueMonths: [1, 4, 7, 10], dueDay: 1, isAutoLinked: false, startDate: '2024-01-01', notes: 'Delhi Public School - Arjun' },
  { id: 'sp5', name: 'Society Maintenance', category: 'maintenance', icon: '🏢', frequency: 'quarterly', amount: 3000, dueMonths: [1, 4, 7, 10], dueDay: 10, isAutoLinked: false, startDate: '2020-01-10' },
  { id: 'sp6', name: 'Property Tax', category: 'tax', icon: '🏠', frequency: 'half-yearly', amount: 8000, dueMonths: [4, 10], dueDay: 1, isAutoLinked: false, startDate: '2018-04-01' },
  { id: 'sp7', name: 'Netflix Annual', category: 'subscription', icon: '📺', frequency: 'yearly', amount: 1500, dueMonths: [6], dueDay: 15, isAutoLinked: false, startDate: '2022-06-15' },
  { id: 'sp8', name: 'Car Service', category: 'vehicle', icon: '🔧', frequency: 'half-yearly', amount: 5000, dueMonths: [3, 9], dueDay: 1, isAutoLinked: false, startDate: '2024-03-01' },
  { id: 'sp9', name: 'Advance Tax (Self)', category: 'tax', icon: '💰', frequency: 'quarterly', amount: 15000, dueMonths: [6, 9, 12, 3], dueDay: 15, isAutoLinked: false, startDate: '2024-06-15' },
];

// Get scheduled payments due in a specific month
export const getScheduledPaymentsForMonth = (month: number, year: number): ScheduledPaymentInstance[] => {
  const instances: ScheduledPaymentInstance[] = [];
  const today = new Date();
  
  scheduledPayments.forEach(sp => {
    if (sp.dueMonths.includes(month)) {
      const dueDate = new Date(year, month - 1, sp.dueDay);
      const isPaid = Math.random() > 0.5 && dueDate < today; // Mock: randomly mark some as paid
      const isOverdue = !isPaid && dueDate < today;
      
      instances.push({
        id: `${sp.id}-${year}-${month}`,
        scheduleId: sp.id,
        scheduleName: sp.name,
        icon: sp.icon,
        amount: sp.amount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
        paidAmount: isPaid ? sp.amount : undefined,
        paidDate: isPaid ? dueDate.toISOString().split('T')[0] : undefined,
        linkedTo: sp.linkedTo,
      });
    }
  });
  
  return instances;
};

// January 2026 scheduled payments (hardcoded for demo)
export const januaryScheduledPayments: ScheduledPaymentInstance[] = [
  { id: 'spi1', scheduleId: 'sp1', scheduleName: 'LIC Jeevan Anand Premium', icon: '🛡️', amount: 24000, dueDate: '2026-01-25', status: 'pending', linkedTo: { type: 'insurance', id: '1' } },
  { id: 'spi2', scheduleId: 'sp4', scheduleName: 'School Fees - Q4', icon: '🏫', amount: 30000, dueDate: '2026-01-01', status: 'paid', paidAmount: 30000, paidDate: '2026-01-02' },
  { id: 'spi3', scheduleId: 'sp5', scheduleName: 'Society Maintenance', icon: '🏢', amount: 3000, dueDate: '2026-01-10', status: 'paid', paidAmount: 3000, paidDate: '2026-01-10' },
];

export const getScheduledTotal = () => januaryScheduledPayments.reduce((sum, p) => sum + p.amount, 0);
export const getScheduledPaid = () => januaryScheduledPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.paidAmount || 0), 0);
export const getScheduledPending = () => januaryScheduledPayments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);

// Computed values
export const getBudgetSummary = () => {
  const plannedIncome = plannedIncomes.reduce((sum, i) => sum + i.expectedAmount, 0);
  const actualIncome = plannedIncomes.reduce((sum, i) => sum + i.receivedAmount, 0);
  const plannedExpensesTotal = plannedExpenses.reduce((sum, e) => sum + e.plannedAmount, 0);
  const actualExpensesTotal = plannedExpenses.reduce((sum, e) => sum + e.actualAmount, 0);
  const unplannedTotal = unplannedExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  return {
    plannedIncome,
    actualIncome,
    plannedExpenses: plannedExpensesTotal,
    actualExpenses: actualExpensesTotal,
    unplannedExpenses: unplannedTotal,
    totalExpenses: actualExpensesTotal + unplannedTotal,
    plannedSurplus: plannedIncome - plannedExpensesTotal,
    actualSurplus: actualIncome - (actualExpensesTotal + unplannedTotal),
  };
};

export const getTotalBalance = () => bankAccounts.reduce((sum, a) => sum + a.balance, 0);

export const getTotalDebt = () => loans.reduce((sum, l) => sum + l.outstanding, 0);

export const getPortfolioValue = () => investments.reduce((sum, i) => sum + i.currentValue, 0);

export const getTotalInvested = () => investments.reduce((sum, i) => sum + i.invested, 0);

export const getNetWorth = () => getTotalBalance() + getPortfolioValue() - getTotalDebt();

export const getUnreadNotifications = () => notifications.filter(n => !n.read).length;
