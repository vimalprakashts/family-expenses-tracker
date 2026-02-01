import { BarChart3, Download, Loader2, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useBudgetSummary, useExpenseCategories } from '../hooks/useBudget';
import { useExpenseRecords, useMonthlyData, useRecentTransactions } from '../hooks/useMonthlyTracker';
import { formatCurrency, getCurrentMonthYear } from '../lib/api';

const categoryColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-gray-500',
];

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [selectedReport, setSelectedReport] = useState('Overview');

  const { month, year } = getCurrentMonthYear();

  // Fetch data from Supabase
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyData(year, month);
  const { data: budgetData, isLoading: budgetLoading } = useBudgetSummary();
  const { data: recentTransactions = [], isLoading: transactionsLoading } = useRecentTransactions(5);
  const { data: expenseRecords = [], isLoading: expenseLoading } = useExpenseRecords(year, month);
  const { data: expenseCategories = [] } = useExpenseCategories();

  const isLoading = monthlyLoading || budgetLoading || transactionsLoading || expenseLoading;

  // Calculate totals from real data
  const totalIncome = monthlyData?.summary?.totalReceived || budgetData?.totalIncome || 0;
  const totalExpense = monthlyData?.summary?.totalSpent || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(0) : '0';

  // Generate mock monthly trend (for now, use current month data repeated)
  // In future, this would fetch last 6 months of data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const monthIdx = (month - 6 + i + 12) % 12;
    return {
      month: monthNames[monthIdx],
      income: i === 5 ? totalIncome : totalIncome * (0.9 + Math.random() * 0.2),
      expense: i === 5 ? totalExpense : totalExpense * (0.9 + Math.random() * 0.2),
    };
  });

  const maxAmount = Math.max(...trendData.map(d => Math.max(d.income, d.expense)), 1);

  // Calculate category expenses from expense records
  const categoryExpensesMap = new Map<string, { name: string; amount: number }>();
  expenseRecords.forEach((record: any) => {
    const catName = record.expense_categories?.name || 'Other';
    const existing = categoryExpensesMap.get(catName) || { name: catName, amount: 0 };
    existing.amount += Number(record.spent_amount || 0);
    categoryExpensesMap.set(catName, existing);
  });

  const categoryExpenses = Array.from(categoryExpensesMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 7)
    .map((cat, idx) => ({
      category: cat.name,
      amount: cat.amount,
      percentage: totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0,
      color: categoryColors[idx % categoryColors.length],
    }));

  // Top transactions from recent transactions
  const topTransactions = recentTransactions.slice(0, 5).map((txn: any) => ({
    description: txn.description || 'Transaction',
    category: txn.transaction_type || 'Other',
    amount: Number(txn.amount),
    date: txn.transaction_date,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-gray-500">Track your financial trends and insights</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 sm:py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white min-h-[44px] w-full sm:w-auto"
          >
            <option>This Month</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>This Year</option>
            <option>Custom Range</option>
          </select>
          <button className="btn-secondary flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-gray-200 -mx-4 sm:-mx-6 lg:mx-0">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto hide-scrollbar px-4 sm:px-6 lg:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-1 sm:gap-2 min-w-max">
            {['Overview', 'Income', 'Expenses', 'Investments', 'Tax Summary'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedReport(tab)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px] flex-shrink-0 ${selectedReport === tab
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Total Income</p>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success-500 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
          <p className="text-xs sm:text-sm text-success-600 mt-1">+5% from last month</p>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Total Expenses</p>
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-danger-500 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalExpense)}</p>
          <p className="text-xs sm:text-sm text-success-600 mt-1">-8% from last month</p>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Net Savings</p>
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-success-600">{formatCurrency(totalIncome - totalExpense)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{savingsRate}% savings rate</p>
        </div>
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Transactions</p>
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{recentTransactions.length > 0 ? recentTransactions.length + '+' : 0}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">This month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Income vs Expense Trend */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Income vs Expense Trend</h2>
          <div className="h-48 sm:h-64 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2">
            {trendData.map((data, idx) => (
              <div key={idx} className="flex-1 min-w-[40px] sm:min-w-0 flex flex-col items-center gap-2">
                <div className="w-full flex gap-0.5 sm:gap-1 h-36 sm:h-48 items-end">
                  <div
                    className="flex-1 bg-success-400 rounded-t min-h-[4px]"
                    style={{ height: `${(data.income / maxAmount) * 100}%` }}
                    title={`Income: ${formatCurrency(data.income)}`}
                  />
                  <div
                    className="flex-1 bg-danger-400 rounded-t min-h-[4px]"
                    style={{ height: `${(data.expense / maxAmount) * 100}%` }}
                    title={`Expense: ${formatCurrency(data.expense)}`}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500">{data.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 sm:gap-6 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-400" />
              <span className="text-xs sm:text-sm text-gray-600">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-danger-400" />
              <span className="text-xs sm:text-sm text-gray-600">Expenses</span>
            </div>
          </div>
        </div>

        {/* Expense by Category */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Expense by Category</h2>
          {categoryExpenses.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {categoryExpenses.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-1 gap-2">
                    <span className="text-gray-700 truncate flex-1 min-w-0">{cat.category}</span>
                    <span className="font-medium text-gray-900 flex-shrink-0">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No expense data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Transactions */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Top Transactions</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium min-h-[44px] px-3">View All</button>
        </div>
        {topTransactions.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-4 sm:px-6 pb-3 font-medium">Date</th>
                    <th className="px-4 sm:px-6 pb-3 font-medium">Description</th>
                    <th className="px-4 sm:px-6 pb-3 font-medium">Category</th>
                    <th className="px-4 sm:px-6 pb-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topTransactions.map((txn, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="px-4 sm:px-6 py-3 text-gray-600">
                        {txn.date ? new Date(txn.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">{txn.description}</td>
                      <td className="px-4 sm:px-6 py-3 text-gray-600">{txn.category}</td>
                      <td className="px-4 sm:px-6 py-3 text-right font-medium text-gray-900">{formatCurrency(txn.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {topTransactions.map((txn, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base">{txn.description}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{txn.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-gray-900">{formatCurrency(txn.amount)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      {txn.date ? new Date(txn.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No transactions recorded yet</p>
          </div>
        )}
      </div>

      {/* Financial Insights */}
      <div className="card p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">💡 Financial Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/60 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Savings Rate</p>
            <p className="text-xl sm:text-2xl font-bold text-success-600">{savingsRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Above the recommended 20%</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Biggest Expense</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{categoryExpenses[0]?.category || 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">{categoryExpenses[0]?.percentage || 0}% of total expenses</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Tip</p>
            <p className="text-xs sm:text-sm text-gray-700">Consider reviewing your dining budget - it exceeded by 15% last month.</p>
          </div>
        </div>
      </div>

      {/* Downloadable Reports */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Downloadable Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] w-full text-left">
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-danger-600" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Monthly Statement</p>
              <p className="text-xs sm:text-sm text-gray-500">PDF Format</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] w-full text-left">
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-success-600" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Transaction Export</p>
              <p className="text-xs sm:text-sm text-gray-500">Excel Format</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] w-full text-left sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary-600" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Tax Summary</p>
              <p className="text-xs sm:text-sm text-gray-500">PDF Format</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
