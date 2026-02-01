import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  Check,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccountsSummary } from '../hooks/useAccounts';
import { useBudgetSummary } from '../hooks/useBudget';
import { useInvestmentsSummary } from '../hooks/useInvestments';
import { useLendingSummary } from '../hooks/useLending';
import { useLoansSummary } from '../hooks/useLoans';
import { useMonthlyData, useRecentTransactions } from '../hooks/useMonthlyTracker';
import { useUpcomingInstances } from '../hooks/useSchedules';
import { formatCurrency, getCurrentMonthYear } from '../lib/api';

export default function Dashboard() {
  const { user } = useAuth();
  const { month, year } = getCurrentMonthYear();

  // Fetch all dashboard data
  const { data: budgetData, isLoading: budgetLoading } = useBudgetSummary();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyData(year, month);
  const { data: accountsData, isLoading: accountsLoading } = useAccountsSummary();
  const { data: loansData, isLoading: loansLoading } = useLoansSummary();
  const { data: investmentsData, isLoading: investmentsLoading } = useInvestmentsSummary();
  const { data: lendingData, isLoading: lendingLoading } = useLendingSummary();
  const { data: upcomingPayments, isLoading: upcomingLoading } = useUpcomingInstances(30);
  useRecentTransactions(5); // Will be used for activity feed in future

  const isLoading = budgetLoading || monthlyLoading || accountsLoading || loansLoading ||
    investmentsLoading || lendingLoading || upcomingLoading;

  // Calculate net worth
  const netWorth = (accountsData?.totalBankBalance || 0) +
    (investmentsData?.totalCurrentValue || 0) +
    (lendingData?.totalLent || 0) -
    (loansData?.totalOutstanding || 0) -
    (accountsData?.totalOutstanding || 0) -
    (lendingData?.totalBorrowed || 0);

  // Monthly summary from actual data
  const actualIncome = monthlyData?.summary.totalReceived || 0;
  const plannedIncome = budgetData?.totalIncome || 0;
  const actualExpenses = monthlyData?.summary.totalSpent || 0;
  const plannedExpenses = budgetData?.totalExpenses || 0;

  const incomeVariance = plannedIncome > 0
    ? ((actualIncome - plannedIncome) / plannedIncome * 100).toFixed(0)
    : '0';
  const expenseVariance = plannedExpenses > 0
    ? ((actualExpenses - plannedExpenses) / plannedExpenses * 100).toFixed(0)
    : '0';

  // Scheduled pending
  const scheduledPending = upcomingPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // Get current date for greeting
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your financial overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-xs sm:text-sm text-gray-500">Here's your financial overview for {monthName}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm text-gray-500">Today</p>
          <p className="text-sm sm:text-base font-medium text-gray-900">
            {now.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs sm:text-sm font-medium">Net Worth</span>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(netWorth)}</p>
          <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-2">
            Assets - Liabilities
          </p>
        </div>

        {/* Monthly Income */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-100 text-xs sm:text-sm font-medium">Monthly Income</span>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(actualIncome)}</p>
          <p className={`text-xs sm:text-sm flex items-center gap-1 mt-2 ${Number(incomeVariance) >= 0 ? 'text-emerald-100' : 'text-rose-200'}`}>
            {Number(incomeVariance) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {incomeVariance}% vs plan
          </p>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-rose-100 text-xs sm:text-sm font-medium">Monthly Expenses</span>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(actualExpenses)}</p>
          <p className={`text-xs sm:text-sm flex items-center gap-1 mt-2 ${Number(expenseVariance) <= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
            {Number(expenseVariance) <= 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            {expenseVariance}% vs plan
          </p>
        </div>

        {/* Scheduled Pending */}
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-violet-100 text-xs sm:text-sm font-medium">Scheduled Pending</span>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(scheduledPending)}</p>
          <p className="text-xs sm:text-sm text-violet-200 flex items-center gap-1 mt-2">
            <Clock className="w-4 h-4" />
            {upcomingPayments?.length || 0} payments due
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Budget Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Budget Status - {monthName}</h2>
            <Link to="/budget" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium min-h-[44px] flex items-center">View Details →</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Income Progress */}
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-medium text-emerald-700">Income Progress</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {plannedIncome > 0 ? ((actualIncome / plannedIncome) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="h-3 bg-emerald-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${plannedIncome > 0 ? Math.min((actualIncome / plannedIncome) * 100, 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-emerald-600">{formatCurrency(actualIncome)}</span>
                <span className="text-emerald-400">of {formatCurrency(plannedIncome)}</span>
              </div>
            </div>

            {/* Expense Progress */}
            <div className="bg-rose-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-medium text-rose-700">Expense Progress</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${actualExpenses <= plannedExpenses
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                  }`}>
                  {plannedExpenses > 0 ? ((actualExpenses / plannedExpenses) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="h-3 bg-rose-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${actualExpenses <= plannedExpenses ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  style={{ width: `${plannedExpenses > 0 ? Math.min((actualExpenses / plannedExpenses) * 100, 100) : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-rose-600">{formatCurrency(actualExpenses)}</span>
                <span className="text-rose-400">of {formatCurrency(plannedExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Actual Surplus (Monthly)
              </span>
              <span className={`text-sm sm:text-base font-semibold break-words ${actualIncome - actualExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(actualIncome - actualExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                Scheduled Payments Pending
              </span>
              <span className="text-sm sm:text-base font-semibold text-violet-600 break-words">- {formatCurrency(scheduledPending)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-4 rounded-b-xl">
              <span className="text-sm sm:text-base font-semibold text-gray-900">Net Available</span>
              <span className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                {formatCurrency((actualIncome - actualExpenses) - scheduledPending)}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Financial Health</h2>
          <div className="flex flex-col items-center py-4">
            {/* Calculate health score based on real data */}
            {(() => {
              let score = 50; // Base score

              // Income received vs planned (+20 if on track)
              if (plannedIncome > 0 && actualIncome >= plannedIncome * 0.8) score += 20;

              // Expenses under control (+20 if under budget)
              if (plannedExpenses > 0 && actualExpenses <= plannedExpenses) score += 20;

              // No overdue payments (+10)
              if ((upcomingPayments?.filter(p => p.status === 'overdue').length || 0) === 0) score += 10;

              score = Math.min(100, Math.max(0, score));

              return (
                <>
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="12"
                        className="sm:hidden"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke={score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="12"
                        strokeDasharray={`${score * 3.02} ${100 * 3.02}`}
                        strokeLinecap="round"
                        className="sm:hidden"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="14"
                        className="hidden sm:block"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        fill="none"
                        stroke={score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="14"
                        strokeDasharray={`${score * 3.77} ${100 * 3.77}`}
                        strokeLinecap="round"
                        className="hidden sm:block"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">{score}</span>
                      <span className="text-xs sm:text-sm text-gray-500">/ 100</span>
                    </div>
                  </div>
                  <div className={`mt-4 px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm ${score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                      score >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                    }`}>
                    {score >= 70 ? 'Good Health' : score >= 50 ? 'Fair Health' : 'Needs Attention'}
                  </div>
                </>
              );
            })()}
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                {actualExpenses <= plannedExpenses ? (
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                )}
                <span className="text-gray-600">
                  {actualExpenses <= plannedExpenses ? 'Budget on track' : 'Budget overspent'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                {(accountsData?.totalBankBalance || 0) > 0 ? (
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                )}
                <span className="text-gray-600">
                  {(accountsData?.totalBankBalance || 0) > 0 ? 'Bank balance healthy' : 'Low bank balance'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                {(accountsData?.totalOutstanding || 0) > 0 ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                )}
                <span className="text-gray-600">
                  {(accountsData?.totalOutstanding || 0) > 0 ? 'Credit card balance pending' : 'No credit card dues'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Payments</h2>
          <Link to="/schedules" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium min-h-[44px] flex items-center">View All →</Link>
        </div>
        {upcomingPayments && upcomingPayments.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                    <th className="px-4 sm:px-6 py-3 font-medium">Date</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Type</th>
                    <th className="px-4 sm:px-6 py-3 font-medium">Description</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                  {upcomingPayments.slice(0, 5).map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-gray-600">
                        {new Date(payment.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                          Scheduled
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {(payment as any).scheduled_payments?.name || 'Payment'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-4">
              {upcomingPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {(payment as any).scheduled_payments?.name || 'Payment'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(payment.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>
                      {payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                      Scheduled
                    </span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-4 sm:px-6 py-12 text-center text-gray-500">
            <CalendarClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No upcoming payments</p>
            <Link to="/schedules" className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm mt-2 inline-block min-h-[44px] flex items-center justify-center">
              Set up scheduled payments →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link to="/monthly-tracker" className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 group min-h-[120px] sm:min-h-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
            </div>
            <span className="font-medium text-gray-900 text-sm sm:text-base text-center">Add Income</span>
          </Link>
          <Link to="/monthly-tracker" className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 group min-h-[120px] sm:min-h-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
            </div>
            <span className="font-medium text-gray-900 text-sm sm:text-base text-center">Add Expense</span>
          </Link>
          <Link to="/documents" className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 group min-h-[120px] sm:min-h-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
            </div>
            <span className="font-medium text-gray-900 text-sm sm:text-base text-center">Upload Document</span>
          </Link>
          <Link to="/reports" className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 group min-h-[120px] sm:min-h-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
            </div>
            <span className="font-medium text-gray-900 text-sm sm:text-base text-center">View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
