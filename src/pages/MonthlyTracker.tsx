import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  Link as LinkIcon,
  Loader2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Fragment, useState } from 'react';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useBankAccounts } from '../hooks/useAccounts';
import {
  useInitializeMonthlyRecords,
  useMonthlyData,
  useRecordExpense,
  useRecordIncomeReceived,
  useRefreshBudgetValues
} from '../hooks/useMonthlyTracker';
import { usePayScheduledInstance, useScheduledInstances } from '../hooks/useSchedules';
import { formatCurrency, getCurrentMonthYear } from '../lib/api';
import type { ExpenseRecord, IncomeRecord } from '../lib/supabase';
import * as monthlyService from '../services/monthly';

export default function MonthlyTracker() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { month: currentMonthNum, year: currentYearNum } = getCurrentMonthYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState(currentYearNum);

  // Fetch data
  const { data: monthlyData, isLoading } = useMonthlyData(selectedYear, selectedMonth);
  const { data: accounts } = useBankAccounts();
  const { data: scheduledInstances } = useScheduledInstances(selectedYear, selectedMonth);

  // Mutations
  const recordIncomeMutation = useRecordIncomeReceived();
  const recordExpenseMutation = useRecordExpense();
  const payScheduledMutation = usePayScheduledInstance();
  const initializeRecords = useInitializeMonthlyRecords();
  const refreshBudget = useRefreshBudgetValues();

  // Modal states
  const [recordIncomeModal, setRecordIncomeModal] = useState(false);
  const [recordExpenseModal, setRecordExpenseModal] = useState(false);
  const [payScheduledModal, setPayScheduledModal] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [isEditingExpense, setIsEditingExpense] = useState(false);
  const [isEditingExpenseSpent, setIsEditingExpenseSpent] = useState(false);

  // Selected items
  const [selectedIncome, setSelectedIncome] = useState<(IncomeRecord & { income_sources: any }) | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<(ExpenseRecord & { expense_categories: any }) | null>(null);
  const [selectedScheduled, setSelectedScheduled] = useState<any>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // Form states
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeAccount, setIncomeAccount] = useState('');
  const [incomeNote, setIncomeNote] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expensePaymentMode, setExpensePaymentMode] = useState('upi');
  const [isSaving, setIsSaving] = useState(false);

  // Calculations
  const incomeRecords = (monthlyData?.incomeRecords || []) as (IncomeRecord & { income_sources: any })[];
  const expenseRecords = (monthlyData?.expenseRecords || []) as (ExpenseRecord & { expense_categories: any })[];
  const summary = monthlyData?.summary || { totalExpected: 0, totalReceived: 0, totalPlanned: 0, totalSpent: 0, balance: 0, savingsRate: 0 };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getIncomeStatus = (record: IncomeRecord & { income_sources: any }) => {
    const expected = record.expected_amount || 0;
    const received = record.received_amount || 0;
    if (received >= expected) return { label: 'Recv\'d', color: 'bg-emerald-100 text-emerald-700' };
    if (received > 0) return { label: 'Partial', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Pending', color: 'bg-gray-100 text-gray-600' };
  };

  const getExpenseStatus = (record: ExpenseRecord & { expense_categories: any }) => {
    const planned = record.planned_amount || 0;
    const spent = record.spent_amount || 0;
    if (planned === 0) return { label: '0%', color: 'bg-gray-100 text-gray-600' };
    const percentage = Math.round((spent / planned) * 100);
    if (percentage > 100) return { label: `${percentage}%`, color: 'bg-rose-100 text-rose-700' };
    if (percentage >= 80) return { label: `${percentage}%`, color: 'bg-amber-100 text-amber-700' };
    return { label: `${percentage}%`, color: 'bg-emerald-100 text-emerald-700' };
  };

  const handleIncomeRowClick = (record: IncomeRecord & { income_sources: any }) => {
    setSelectedIncome(record);
    setIsEditingIncome(false); // Default to "add more" mode
    // Pre-fill with pending amount (Expected - Received) for easy entry
    // This allows user to easily add the remaining amount
    const expected = record.expected_amount || 0;
    const received = record.received_amount || 0;
    const pending = expected - received;
    setIncomeAmount(pending > 0 ? pending.toString() : '');
    setIncomeDate(new Date().toISOString().split('T')[0]);
    // Try to get the account from the last transaction, or default to first account
    setIncomeAccount(accounts?.[0]?.id || '');
    setIncomeNote('');
    setRecordIncomeModal(true);
  };

  const handleEditIncome = (record: IncomeRecord & { income_sources: any }) => {
    setSelectedIncome(record);
    setIsEditingIncome(true); // Edit mode - show current received amount
    // Pre-fill with current received amount for editing
    setIncomeAmount((record.received_amount || 0).toString());
    setIncomeDate(new Date().toISOString().split('T')[0]);
    setIncomeAccount(accounts?.[0]?.id || '');
    setIncomeNote('');
    setRecordIncomeModal(true);
  };

  const handleExpenseRowClick = (record: ExpenseRecord & { expense_categories: any }) => {
    if (expandedExpenseId === record.id) {
      setExpandedExpenseId(null);
    } else {
      setExpandedExpenseId(record.id);
    }
  };

  const handleAddExpenseToCategory = (record: ExpenseRecord & { expense_categories: any }) => {
    setSelectedExpense(record);
    setIsEditingExpense(false);
    setIsEditingExpenseSpent(false);
    setExpenseAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseDescription('');
    setExpensePaymentMode('upi');
    setRecordExpenseModal(true);
  };

  const handleEditExpenseSpent = (record: ExpenseRecord & { expense_categories: any }) => {
    setSelectedExpense(record);
    setIsEditingExpense(false);
    setIsEditingExpenseSpent(true); // Edit spent amount mode
    // Pre-fill with current spent amount for editing
    const currentSpent = record.spent_amount || 0;
    setExpenseAmount(currentSpent > 0 ? currentSpent.toString() : '');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseDescription('');
    setExpensePaymentMode('upi');
    setRecordExpenseModal(true);
  };

  const handleSaveIncome = async () => {
    if (!selectedIncome || !incomeAmount) return;
    setIsSaving(true);
    try {
      if (isEditingIncome) {
        // Edit mode: Update received_amount directly
        const newAmount = parseFloat(incomeAmount);
        await monthlyService.updateIncomeRecord(selectedIncome.id, {
          received_amount: newAmount,
          status: newAmount >= (selectedIncome.expected_amount || 0) ? 'received' : 'partial'
        });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
        queryClient.invalidateQueries({ queryKey: ['incomeRecords'] });
        showToast('success', 'Income updated successfully');
      } else {
        // Add mode: Add to existing received amount (handled by service)
        await recordIncomeMutation.mutateAsync({
          recordId: selectedIncome.id,
          receivedAmount: parseFloat(incomeAmount),
          accountId: incomeAccount || null,
          paymentMode: 'bank',
          notes: incomeNote || null,
        });
        showToast('success', 'Income recorded successfully');
      }
      setRecordIncomeModal(false);
      setSelectedIncome(null);
      setIsEditingIncome(false);
    } catch (error) {
      showToast('error', 'Failed to record income');
    }
    setIsSaving(false);
  };

  const handleSaveExpense = async () => {
    if (!selectedExpense) return;
    // For edit mode, allow empty amount (will be set to 0)
    if (!isEditingExpenseSpent && !expenseAmount) return;
    setIsSaving(true);
    try {
      if (isEditingExpenseSpent) {
        // Edit mode: Update spent_amount directly
        const newAmount = parseFloat(expenseAmount) || 0;
        const plannedAmount = selectedExpense.planned_amount || 0;

        // Recalculate status based on new spent amount
        let status: 'under' | 'on-budget' | 'over' = 'under';
        if (plannedAmount === 0) {
          status = 'under';
        } else {
          const percentage = (newAmount / plannedAmount) * 100;
          if (percentage > 100) {
            status = 'over';
          } else if (percentage >= 90) {
            status = 'on-budget';
          } else {
            status = 'under';
          }
        }

        await monthlyService.updateExpenseRecord(selectedExpense.id, {
          spent_amount: newAmount,
          status,
        });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
        queryClient.invalidateQueries({ queryKey: ['expenseRecords'] });
        showToast('success', 'Expense spent amount updated successfully');
      } else {
        // Add mode: Record new expense transaction
        await recordExpenseMutation.mutateAsync({
          recordId: selectedExpense.id,
          categoryId: selectedExpense.category_id,
          amount: parseFloat(expenseAmount),
          accountId: null,
          paymentMode: expensePaymentMode,
          description: expenseDescription,
          notes: null,
          year: selectedYear,
          month: selectedMonth,
        });
        showToast('success', 'Expense recorded successfully');
      }
      setRecordExpenseModal(false);
      setSelectedExpense(null);
      setIsEditingExpenseSpent(false);
    } catch (error) {
      showToast('error', 'Failed to record expense');
    }
    setIsSaving(false);
  };

  const handlePayScheduled = async () => {
    if (!selectedScheduled) return;
    setIsSaving(true);
    try {
      await payScheduledMutation.mutateAsync({
        instanceId: selectedScheduled.id,
        paidAmount: selectedScheduled.amount,
        accountId: null,
        paymentMode: 'bank',
      });
      showToast('success', 'Payment recorded successfully');
      setPayScheduledModal(false);
      setSelectedScheduled(null);
    } catch (error) {
      showToast('error', 'Failed to record payment');
    }
    setIsSaving(false);
  };

  const handleInitializeRecords = async () => {
    try {
      await initializeRecords.mutateAsync({ year: selectedYear, month: selectedMonth });
      showToast('success', 'Monthly records initialized');
    } catch (error) {
      showToast('error', 'Failed to initialize records');
    }
  };

  const handleRefreshBudget = async () => {
    try {
      await refreshBudget.mutateAsync({ year: selectedYear, month: selectedMonth });
      showToast('success', 'Budget values refreshed. Your entered amounts are preserved.');
    } catch (error) {
      showToast('error', 'Failed to refresh budget values');
    }
  };

  // Filter out credit card bills from scheduled instances (they're auto-linked expenses now)
  const nonCreditCardScheduled = scheduledInstances?.filter((instance: any) =>
    instance.scheduled_payments?.linked_type !== 'credit_card'
  ) || [];

  // Calculate totals (excluding credit card bills)
  const scheduledPaid = nonCreditCardScheduled.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;
  const scheduledPending = nonCreditCardScheduled.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalScheduled = nonCreditCardScheduled.reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading monthly data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Monthly Tracker</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Record actual income and expenses against your budget</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 w-full sm:w-auto">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="px-3 sm:px-4 py-2 font-medium text-gray-900 min-w-[140px] sm:min-w-[160px] text-center text-sm sm:text-base">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          {(incomeRecords.length > 0 || expenseRecords.length > 0) && (
            <button
              onClick={handleRefreshBudget}
              disabled={refreshBudget.isPending}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Refresh budget values"
            >
              {refreshBudget.isPending ? (
                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <div className="text-xs sm:text-sm text-gray-500 mb-1">INCOME</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(summary.totalReceived)}</div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">
            Plan: {formatCurrency(summary.totalExpected)}
          </div>
          <div className={`text-xs sm:text-sm font-medium mt-1 ${summary.totalReceived >= summary.totalExpected ? 'text-emerald-600' : 'text-amber-600'}`}>
            {summary.totalReceived >= summary.totalExpected ? '🟢' : '🟡'} {formatCurrency(summary.totalReceived - summary.totalExpected)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <div className="text-xs sm:text-sm text-gray-500 mb-1">EXPENSES</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(summary.totalSpent)}</div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">
            Plan: {formatCurrency(summary.totalPlanned)}
          </div>
          <div className={`text-xs sm:text-sm font-medium mt-1 ${summary.totalSpent <= summary.totalPlanned ? 'text-emerald-600' : 'text-rose-600'}`}>
            {summary.totalSpent <= summary.totalPlanned ? '🟢' : '🔴'} {formatCurrency(summary.totalPlanned - summary.totalSpent)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <div className="text-xs sm:text-sm text-gray-500 mb-1">SCHEDULED</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(totalScheduled)}</div>
          <div className="text-xs sm:text-sm text-emerald-600 mt-1">
            Paid: {formatCurrency(scheduledPaid)}
          </div>
          <div className="text-xs sm:text-sm text-amber-600 mt-1">
            Pending: {formatCurrency(scheduledPending)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
          <div className="text-xs sm:text-sm text-gray-500 mb-1">BALANCE</div>
          <div className={`text-lg sm:text-xl font-bold break-words ${summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(summary.balance)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-1">
            {summary.balance >= 0 ? 'Surplus' : 'Deficit'}
            {scheduledPending > 0 && (
              <span className="text-amber-600 ml-1 sm:ml-2">
                (Pending: {formatCurrency(scheduledPending)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Initialize Button */}
      {incomeRecords.length === 0 && expenseRecords.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-blue-800 mb-4">No records for this month yet. Initialize from your budget template?</p>
          <button
            onClick={handleInitializeRecords}
            disabled={initializeRecords.isPending}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            {initializeRecords.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Initialize Monthly Records
          </button>
        </div>
      )}

      {/* Income Section */}
      {incomeRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">INCOME (Click row to record received amount)</h2>
          </div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expected</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Variance</th>
                  <th className="text-center px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incomeRecords.map((record) => {
                  const status = getIncomeStatus(record);
                  const variance = (record.received_amount || 0) - (record.expected_amount || 0);
                  return (
                    <tr
                      key={record.id}
                      onClick={() => handleIncomeRowClick(record)}
                      className="hover:bg-indigo-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{record.income_sources?.icon || '💰'}</span>
                          <span className="font-medium text-gray-900">{record.income_sources?.name || 'Income'}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-gray-600">{formatCurrency(record.expected_amount || 0)}</td>
                      <td className="px-4 sm:px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(record.received_amount || 0)}</td>
                      <td className={`px-4 sm:px-6 py-4 text-right font-medium ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          {(record.received_amount || 0) > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditIncome(record);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Edit received amount"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-gray-900">TOTAL</td>
                  <td className="px-4 sm:px-6 py-4 text-right text-gray-900">{formatCurrency(summary.totalExpected)}</td>
                  <td className="px-4 sm:px-6 py-4 text-right text-gray-900">{formatCurrency(summary.totalReceived)}</td>
                  <td className={`px-4 sm:px-6 py-4 text-right ${summary.totalReceived - summary.totalExpected >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(summary.totalReceived - summary.totalExpected)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {incomeRecords.map((record) => {
              const status = getIncomeStatus(record);
              const variance = (record.received_amount || 0) - (record.expected_amount || 0);
              return (
                <div
                  key={record.id}
                  onClick={() => handleIncomeRowClick(record)}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{record.income_sources?.icon || '💰'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{record.income_sources?.name || 'Income'}</h3>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    {(record.received_amount || 0) > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditIncome(record);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                        title="Edit received amount"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Expected</p>
                      <p className="text-sm font-medium text-gray-600">{formatCurrency(record.expected_amount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Received</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(record.received_amount || 0)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Variance</p>
                      <p className={`text-sm font-semibold ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Mobile Total */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900 text-sm">TOTAL</span>
                <span className="text-sm font-medium text-gray-600">Expected: {formatCurrency(summary.totalExpected)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Received: {formatCurrency(summary.totalReceived)}</span>
                <span className={`text-sm font-semibold ${summary.totalReceived - summary.totalExpected >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(summary.totalReceived - summary.totalExpected)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Section */}
      {expenseRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">EXPENSES (Click row to record spending)</h2>
          </div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Planned</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Spent</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="text-center px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenseRecords.map((record) => {
                  const status = getExpenseStatus(record);
                  const remaining = (record.planned_amount || 0) - (record.spent_amount || 0);
                  const isLinked = record.expense_categories?.is_linked;
                  const isExpanded = expandedExpenseId === record.id;

                  return (
                    <Fragment key={record.id}>
                      <tr
                        onClick={() => {
                          if (isLinked) {
                            // For auto-linked, clicking row opens edit modal
                            handleEditExpenseSpent(record);
                          } else {
                            // For manual, clicking row expands/collapses
                            handleExpenseRowClick(record);
                          }
                        }}
                        className={`hover:bg-indigo-50 cursor-pointer transition-colors group`}
                      >
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{record.expense_categories?.icon || '📤'}</span>
                            <span className="font-medium text-gray-900">{record.expense_categories?.name || 'Expense'}</span>
                            {isLinked && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                <LinkIcon className="w-3 h-3" />
                                Auto
                              </span>
                            )}
                            {!isLinked && (
                              isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right text-gray-600">{formatCurrency(record.planned_amount || 0)}</td>
                        <td className="px-4 sm:px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(record.spent_amount || 0)}</td>
                        <td className={`px-4 sm:px-6 py-4 text-right font-medium ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {isLinked ? 'Auto' : status.label}
                            </span>
                            {/* Show edit button for all expenses (auto-linked or manual) when they have spent amount, or always for auto-linked */}
                            {((record.spent_amount || 0) > 0 || isLinked) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditExpenseSpent(record);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title={isLinked ? "Edit spent amount (click row or button)" : "Edit spent amount"}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && !isLinked && (
                        <tr>
                          <td colSpan={5} className="bg-gradient-to-b from-indigo-50 to-white px-4 sm:px-6 py-4">
                            <div className="space-y-4">
                              {/* Progress Bar */}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                <span className="text-gray-600">Planned: {formatCurrency(record.planned_amount || 0)}</span>
                                <span className="text-gray-600">Spent: {formatCurrency(record.spent_amount || 0)}</span>
                                <span className={remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                  {remaining >= 0 ? `Remaining: ${formatCurrency(remaining)}` : `Over by: ${formatCurrency(Math.abs(remaining))}`}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${remaining >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(((record.spent_amount || 0) / (record.planned_amount || 1)) * 100, 100)}%` }}
                                />
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAddExpenseToCategory(record); }}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Expense
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setExpandedExpenseId(null); }}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium min-h-[44px]"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                  Collapse
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-4 sm:px-6 py-4 text-gray-900">TOTAL</td>
                  <td className="px-4 sm:px-6 py-4 text-right text-gray-900">{formatCurrency(summary.totalPlanned)}</td>
                  <td className="px-4 sm:px-6 py-4 text-right text-gray-900">{formatCurrency(summary.totalSpent)}</td>
                  <td className={`px-4 sm:px-6 py-4 text-right ${summary.totalPlanned - summary.totalSpent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(summary.totalPlanned - summary.totalSpent)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {expenseRecords.map((record) => {
              const status = getExpenseStatus(record);
              const remaining = (record.planned_amount || 0) - (record.spent_amount || 0);
              const isLinked = record.expense_categories?.is_linked;
              const isExpanded = expandedExpenseId === record.id;

              return (
                <div
                  key={record.id}
                  onClick={() => {
                    if (isLinked) {
                      handleEditExpenseSpent(record);
                    } else {
                      handleExpenseRowClick(record);
                    }
                  }}
                  className={`bg-gray-50 rounded-xl p-4 border border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors ${isLinked ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{record.expense_categories?.icon || '📤'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{record.expense_categories?.name || 'Expense'}</h3>
                          {isLinked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium whitespace-nowrap flex-shrink-0">
                              <LinkIcon className="w-3 h-3" />
                              Auto
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.color}`}>
                          {isLinked ? 'Auto' : status.label}
                        </span>
                      </div>
                    </div>
                    {((record.spent_amount || 0) > 0 || isLinked) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditExpenseSpent(record);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                        title={isLinked ? "Edit spent amount" : "Edit spent amount"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Planned</p>
                      <p className="text-sm font-medium text-gray-600">{formatCurrency(record.planned_amount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Spent</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(record.spent_amount || 0)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Remaining</p>
                      <p className={`text-sm font-semibold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                      </p>
                    </div>
                  </div>
                  {!isLinked && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${remaining >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(((record.spent_amount || 0) / (record.planned_amount || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddExpenseToCategory(record);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px]"
                      >
                        <Plus className="w-4 h-4" />
                        Add Expense
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Mobile Total */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900 text-sm">TOTAL</span>
                <span className="text-sm font-medium text-gray-600">Planned: {formatCurrency(summary.totalPlanned)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Spent: {formatCurrency(summary.totalSpent)}</span>
                <span className={`text-sm font-semibold ${summary.totalPlanned - summary.totalSpent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(summary.totalPlanned - summary.totalSpent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled This Month (excluding credit card bills - they're in expenses) */}
      {nonCreditCardScheduled && nonCreditCardScheduled.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">SCHEDULED THIS MONTH (Click to mark as paid)</h2>
          </div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-center px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nonCreditCardScheduled.map((instance: any) => {
                  const isPaid = instance.status === 'paid';
                  const isOverdue = instance.status === 'overdue';
                  return (
                    <tr
                      key={instance.id}
                      onClick={() => !isPaid && (setSelectedScheduled(instance), setPayScheduledModal(true))}
                      className={`${isPaid ? 'opacity-75' : 'hover:bg-indigo-50 cursor-pointer'} transition-colors`}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <span className="font-medium text-gray-900">{instance.scheduled_payments?.name || 'Payment'}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600">
                        {new Date(instance.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(instance.amount)}</td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-emerald-100 text-emerald-700' :
                            isOverdue ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Due'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-4">
            {nonCreditCardScheduled.map((instance: any) => {
              const isPaid = instance.status === 'paid';
              const isOverdue = instance.status === 'overdue';
              return (
                <div
                  key={instance.id}
                  onClick={() => !isPaid && (setSelectedScheduled(instance), setPayScheduledModal(true))}
                  className={`bg-gray-50 rounded-xl p-4 border border-gray-200 ${isPaid ? 'opacity-75' : 'cursor-pointer hover:bg-indigo-50'} transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {instance.scheduled_payments?.name || 'Payment'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {new Date(instance.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-700' :
                        isOverdue ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>
                      {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Due'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Amount</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(instance.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Record Income Modal */}
      <Modal
        isOpen={recordIncomeModal}
        onClose={() => {
          setRecordIncomeModal(false);
          setSelectedIncome(null);
          setIsEditingIncome(false);
        }}
        title={isEditingIncome ? "Edit Income Received" : "Record Income"}
      >
        {selectedIncome && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Recording for: <span className="font-medium text-gray-900">{selectedIncome.income_sources?.name}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <div className="text-gray-500">Expected</div>
                  <div className="font-medium text-gray-900 break-words">{formatCurrency(selectedIncome.expected_amount || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Received</div>
                  <div className="font-medium text-gray-900 break-words">{formatCurrency(selectedIncome.received_amount || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Pending</div>
                  <div className="font-medium text-amber-600 break-words">{formatCurrency((selectedIncome.expected_amount || 0) - (selectedIncome.received_amount || 0))}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select
                  value={incomeAccount}
                  onChange={(e) => setIncomeAccount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                >
                  <option value="">Select account</option>
                  {accounts?.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_number_masked}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSaveIncome}
                disabled={!incomeAmount || isSaving}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditingIncome ? 'UPDATE' : 'SAVE'}
              </button>
              <button
                onClick={() => {
                  setRecordIncomeModal(false);
                  setSelectedIncome(null);
                  setIsEditingIncome(false);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 min-h-[44px]"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Expense Modal */}
      <Modal
        isOpen={recordExpenseModal}
        onClose={() => {
          setRecordExpenseModal(false);
          setSelectedExpense(null);
          setIsEditingExpenseSpent(false);
        }}
        title={isEditingExpenseSpent ? "Edit Spent Amount" : "Record Expense"}
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {isEditingExpenseSpent ? 'Editing spent amount for: ' : 'Recording for: '}
              <span className="font-medium text-gray-900">{selectedExpense.expense_categories?.name}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <div className="text-gray-500">Planned</div>
                  <div className="font-medium text-gray-900 break-words">{formatCurrency(selectedExpense.planned_amount || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Spent</div>
                  <div className="font-medium text-gray-900 break-words">{formatCurrency(selectedExpense.spent_amount || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Remaining</div>
                  <div className={`font-medium break-words ${(selectedExpense.planned_amount || 0) - (selectedExpense.spent_amount || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency((selectedExpense.planned_amount || 0) - (selectedExpense.spent_amount || 0))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEditingExpenseSpent ? 'Spent Amount *' : 'Amount *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {!isEditingExpenseSpent && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                    <select
                      value={expensePaymentMode}
                      onChange={(e) => setExpensePaymentMode(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                    >
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                    placeholder="e.g., Weekly grocery shopping"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSaveExpense}
                disabled={!expenseAmount || isSaving}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEditingExpenseSpent ? 'UPDATE' : 'SAVE'}
              </button>
              <button
                onClick={() => {
                  setRecordExpenseModal(false);
                  setSelectedExpense(null);
                  setIsEditingExpenseSpent(false);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 min-h-[44px]"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Scheduled Modal */}
      <Modal
        isOpen={payScheduledModal}
        onClose={() => setPayScheduledModal(false)}
        title="Pay Scheduled Item"
      >
        {selectedScheduled && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{selectedScheduled.scheduled_payments?.name}</div>
              <div className="text-sm text-gray-500 mt-1">Amount: {formatCurrency(selectedScheduled.amount)}</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handlePayScheduled}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                MARK AS PAID
              </button>
              <button
                onClick={() => setPayScheduledModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 min-h-[44px]"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
