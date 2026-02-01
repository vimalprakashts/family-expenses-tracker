import { AlertCircle, Calendar, Clock, Edit2, Link, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DeleteConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, FormSelect, ModalActions } from '../components/ui/Modal';
import { useCreateScheduledPayment, useDeleteScheduledPayment, useScheduledPayments, useUpcomingInstances, useUpdateScheduledPayment } from '../hooks/useSchedules';
import { formatCurrency } from '../lib/api';

const frequencyLabels: Record<string, string> = {
  quarterly: 'Quarterly',
  'half-yearly': 'Half-Yearly',
  yearly: 'Yearly',
  custom: 'Custom',
};

const categoryColors: Record<string, { bg: string; text: string; icon: string }> = {
  insurance: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🛡️' },
  education: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🏫' },
  tax: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '💰' },
  maintenance: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🏢' },
  subscription: { bg: 'bg-pink-100', text: 'text-pink-700', icon: '📺' },
  vehicle: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🚗' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📋' },
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Helper function to calculate next due date
function getNextDueDate(schedule: any): Date | null {
  if (!schedule.start_date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(schedule.start_date);
  startDate.setHours(0, 0, 0, 0);

  const dueDay = schedule.due_day || startDate.getDate();

  if (schedule.frequency === 'monthly') {
    // For monthly, next due is this month or next month
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
    if (thisMonth >= today) {
      return thisMonth;
    } else {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
      return nextMonth;
    }
  } else if (schedule.due_months && Array.isArray(schedule.due_months) && schedule.due_months.length > 0) {
    // For quarterly, half-yearly, yearly, or custom
    const dueMonths = schedule.due_months.sort((a: number, b: number) => a - b);
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    // Find next month in the due_months array
    let nextMonth = dueMonths.find((m: number) => m > currentMonth);
    let nextYear = currentYear;

    if (!nextMonth) {
      // If no month found this year, use first month of next year
      nextMonth = dueMonths[0];
      nextYear = currentYear + 1;
    }

    // Create date for next due
    const nextDue = new Date(nextYear, nextMonth - 1, dueDay);

    // If this month is in due_months and day hasn't passed, use this month
    if (dueMonths.includes(currentMonth)) {
      const thisMonthDue = new Date(currentYear, currentMonth - 1, dueDay);
      if (thisMonthDue >= today) {
        return thisMonthDue;
      }
    }

    return nextDue;
  }

  return null;
}

export default function Schedules() {
  const [filter, setFilter] = useState<'all' | 'auto' | 'manual'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [isPayScheduleOpen, setIsPayScheduleOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Fetch data from Supabase
  const { data: scheduledPayments = [], isLoading: loadingSchedules } = useScheduledPayments();
  const { data: upcomingPayments = [], isLoading: loadingUpcoming } = useUpcomingInstances(30);
  const deleteSchedule = useDeleteScheduledPayment();

  const handleDelete = (id: string) => {
    deleteSchedule.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const filteredSchedules = scheduledPayments.filter(sp => {
    const matchesFilter = filter === 'all' || (filter === 'auto' ? sp.is_auto_linked : !sp.is_auto_linked);
    const matchesSearch = sp.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate annual totals - using frequency to estimate occurrences per year
  const getOccurrencesPerYear = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 52;
      case 'bi-weekly': return 26;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'half-yearly': return 2;
      case 'yearly': return 1;
      default: return 1;
    }
  };

  const annualTotal = scheduledPayments.reduce((sum, sp) =>
    sum + Number(sp.amount) * getOccurrencesPerYear(sp.frequency || 'monthly'), 0);
  const autoLinkedTotal = scheduledPayments
    .filter(sp => sp.is_auto_linked)
    .reduce((sum, sp) => sum + Number(sp.amount) * getOccurrencesPerYear(sp.frequency || 'monthly'), 0);

  // Upcoming payments (next 30 days)
  const upcomingCount = upcomingPayments.filter(p => p.status !== 'paid').length;

  if (loadingSchedules) {
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Schedules</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage recurring non-monthly payments</p>
        </div>
        <button
          onClick={() => setIsAddScheduleOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Total Schedules</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{scheduledPayments.length}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">active schedules</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Annual Commitment</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(annualTotal)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">per year</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Link className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Auto-Linked</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(autoLinkedTotal)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{scheduledPayments.filter(sp => sp.is_auto_linked).length} from modules</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Upcoming</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{upcomingCount}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">payments this month</p>
        </div>
      </div>

      {/* Annual Calendar View - simplified for now */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Annual Calendar Overview</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {monthNames.map((month, idx) => {
            // Month index is 0-based (0=Jan, 11=Dec), but due_months is 1-based (1=Jan, 12=Dec)
            const monthNumber = idx + 1;

            // Filter payments that are due in this month
            const monthPayments = scheduledPayments.filter(sp => {
              // If due_months is specified, use it (for custom and auto-linked schedules)
              if (sp.due_months && Array.isArray(sp.due_months) && sp.due_months.length > 0) {
                return sp.due_months.includes(monthNumber);
              }

              // Fallback to frequency-based logic for schedules without due_months
              if (sp.frequency === 'monthly') return true;
              if (sp.frequency === 'quarterly') return [1, 4, 7, 10].includes(monthNumber);
              if (sp.frequency === 'half-yearly') return [1, 7].includes(monthNumber);
              if (sp.frequency === 'yearly') return monthNumber === 1; // Default to January if no due_months
              return false;
            });
            const monthTotal = monthPayments.reduce((sum, sp) => sum + Number(sp.amount), 0);
            const hasPayments = monthPayments.length > 0;

            return (
              <div
                key={month}
                className={`rounded-xl p-2 sm:p-3 text-center transition-colors cursor-pointer ${hasPayments
                    ? 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-100'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                  }`}
              >
                <p className={`text-xs sm:text-sm font-medium ${hasPayments ? 'text-indigo-700' : 'text-gray-500'}`}>{month}</p>
                <p className={`text-[10px] sm:text-xs mt-1 ${hasPayments ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {hasPayments ? formatCurrency(monthTotal) : '-'}
                </p>
                <div className="flex justify-center gap-0.5 mt-1 sm:mt-2">
                  {monthPayments.slice(0, 4).map(sp => (
                    <span key={sp.id} className="text-[10px] sm:text-xs">{sp.icon || '📅'}</span>
                  ))}
                  {monthPayments.length > 4 && (
                    <span className="text-[10px] sm:text-xs text-indigo-500">+{monthPayments.length - 4}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[44px] text-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            All ({scheduledPayments.length})
          </button>
          <button
            onClick={() => setFilter('auto')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] ${filter === 'auto' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Auto-Linked ({scheduledPayments.filter(sp => sp.is_auto_linked).length})
          </button>
          <button
            onClick={() => setFilter('manual')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] ${filter === 'manual' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Manual ({scheduledPayments.filter(sp => !sp.is_auto_linked).length})
          </button>
        </div>
      </div>

      {/* Schedules List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Schedules</h2>
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                <th className="px-4 sm:px-6 py-4 font-medium">Schedule</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Category</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Frequency</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Due Months</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-4 sm:px-6 py-4 font-medium">Next Due Date</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-center">Type</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {filteredSchedules.map((schedule) => {
                const cat = categoryColors[schedule.category || 'other'] || categoryColors.other;
                return (
                  <tr key={schedule.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{schedule.icon || '📅'}</span>
                        <div>
                          <span className="font-medium text-gray-900 block">{schedule.name}</span>
                          {schedule.notes && (
                            <span className="text-xs text-gray-500">{schedule.notes}</span>
                          )}
                        </div>
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cat.bg} ${cat.text}`}>
                        {schedule.category}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {schedule.frequency ? (frequencyLabels[schedule.frequency] || schedule.frequency) : 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {(() => {
                        // Format due months/date based on frequency
                        if (schedule.frequency === 'monthly') {
                          // For monthly, show the day of month
                          const day = schedule.due_day || schedule.start_date ? new Date(schedule.start_date).getDate() : null;
                          return day ? (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              {day}{day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'} of every month
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              Monthly
                            </span>
                          );
                        } else if (schedule.due_months && Array.isArray(schedule.due_months) && schedule.due_months.length > 0) {
                          // Show actual months for quarterly, half-yearly, yearly, or custom
                          const monthNamesFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                          const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const dueMonths = schedule.due_months.sort((a, b) => a - b);
                          const day = schedule.due_day;

                          if (dueMonths.length === 1) {
                            // Single month (yearly or custom)
                            const monthName = monthNamesFull[dueMonths[0] - 1];
                            return (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                {monthName}{day ? ` ${day}${day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'}` : ''}
                              </span>
                            );
                          } else {
                            // Multiple months (quarterly, half-yearly, custom)
                            const monthList = dueMonths.map(m => monthNamesShort[m - 1]).join(', ');
                            return (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium" title={dueMonths.map(m => monthNamesFull[m - 1]).join(', ')}>
                                {monthList}{day ? ` (${day}${day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'})` : ''}
                              </span>
                            );
                          }
                        } else {
                          // Fallback to frequency label
                          return (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              {schedule.frequency ? (frequencyLabels[schedule.frequency] || schedule.frequency) : 'N/A'}
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(Number(schedule.amount))}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">
                      {(() => {
                        const nextDue = getNextDueDate(schedule);
                        if (!nextDue) return <span className="text-gray-400">-</span>;

                        const isOverdue = nextDue < new Date();
                        const isThisMonth = nextDue.getMonth() === new Date().getMonth() &&
                          nextDue.getFullYear() === new Date().getFullYear();

                        return (
                          <span className={`text-xs font-medium ${isOverdue ? 'text-rose-600' :
                              isThisMonth ? 'text-amber-600' :
                                'text-gray-600'
                            }`}>
                            {nextDue.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-center">
                      {schedule.is_auto_linked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Link className="w-3 h-3" /> Auto
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            if (schedule.is_auto_linked) {
                              alert('Auto-linked schedules cannot be edited. Please edit the source (Insurance, Loan, or Investment) instead.');
                            } else {
                              setEditingSchedule(schedule);
                              setIsEditScheduleOpen(true);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title={schedule.is_auto_linked ? "Auto-linked schedules cannot be edited" : "Edit"}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!schedule.is_auto_linked && (
                          <button
                            onClick={() => setDeleteConfirm({ id: schedule.id, name: schedule.name })}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No schedules found</p>
            </div>
          ) : (
            filteredSchedules.map((schedule) => {
              const cat = categoryColors[schedule.category || 'other'] || categoryColors.other;
              const nextDue = getNextDueDate(schedule);
              const isOverdue = nextDue ? nextDue < new Date() : false;
              const isThisMonth = nextDue ? (nextDue.getMonth() === new Date().getMonth() && nextDue.getFullYear() === new Date().getFullYear()) : false;

              // Format due months for mobile
              const formatDueMonths = () => {
                if (schedule.frequency === 'monthly') {
                  const day = schedule.due_day || schedule.start_date ? new Date(schedule.start_date).getDate() : null;
                  return day ? `${day}${day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'} of every month` : 'Monthly';
                } else if (schedule.due_months && Array.isArray(schedule.due_months) && schedule.due_months.length > 0) {
                  const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const dueMonths = schedule.due_months.sort((a, b) => a - b);
                  const day = schedule.due_day;
                  if (dueMonths.length === 1) {
                    const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][dueMonths[0] - 1];
                    return `${monthName}${day ? ` ${day}${day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'}` : ''}`;
                  } else {
                    return dueMonths.map(m => monthNamesShort[m - 1]).join(', ') + (day ? ` (${day}${day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'})` : '');
                  }
                } else {
                  return schedule.frequency ? (frequencyLabels[schedule.frequency] || schedule.frequency) : 'N/A';
                }
              };

              return (
                <div key={schedule.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{schedule.icon || '📅'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{schedule.name}</h3>
                        {schedule.notes && (
                          <p className="text-xs text-gray-500 truncate mt-1">{schedule.notes}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${cat.bg} ${cat.text}`}>
                      {schedule.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500">Frequency</p>
                      <p className="text-sm font-medium text-gray-700">{schedule.frequency ? (frequencyLabels[schedule.frequency] || schedule.frequency) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(schedule.amount))}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Due Months</p>
                      <p className="text-xs font-medium text-gray-700">{formatDueMonths()}</p>
                    </div>
                    {nextDue && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Next Due</p>
                        <p className={`text-xs font-medium ${isOverdue ? 'text-rose-600' : isThisMonth ? 'text-amber-600' : 'text-gray-600'}`}>
                          {nextDue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${schedule.is_auto_linked ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {schedule.is_auto_linked ? (
                        <>
                          <Link className="w-3 h-3" /> Auto
                        </>
                      ) : (
                        'Manual'
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (schedule.is_auto_linked) {
                            alert('Auto-linked schedules cannot be edited. Please edit the source (Insurance, Loan, or Investment) instead.');
                          } else {
                            setEditingSchedule(schedule);
                            setIsEditScheduleOpen(true);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title={schedule.is_auto_linked ? "Auto-linked schedules cannot be edited" : "Edit"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!schedule.is_auto_linked && (
                        <button
                          onClick={() => setDeleteConfirm({ id: schedule.id, name: schedule.name })}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
              <Link className="w-3 h-3" /> Auto
            </span>
            <span>Auto-linked schedules are created from Insurance, Loans, and Investments</span>
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap">
              Manual
            </span>
            <span>Manually created for custom recurring payments</span>
          </span>
        </div>
      </div>

      {/* Modals */}
      <AddScheduleModal isOpen={isAddScheduleOpen} onClose={() => setIsAddScheduleOpen(false)} />
      <EditScheduleModal
        isOpen={isEditScheduleOpen}
        onClose={() => {
          setIsEditScheduleOpen(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
      />
      {selectedPayment && (
        <PayScheduleModal
          isOpen={isPayScheduleOpen}
          onClose={() => setIsPayScheduleOpen(false)}
          payment={selectedPayment}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        itemName={deleteConfirm?.name || ''}
        itemType="schedule"
        isLoading={deleteSchedule.isPending}
      />
    </div>
  );
}

// Add Schedule Modal
function AddScheduleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createSchedule = useCreateScheduledPayment();
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    frequency: 'yearly',
    amount: '',
    dueDay: 1,
    dueMonths: [] as number[],
    notes: '',
  });

  const toggleMonth = (monthIndex: number) => {
    // monthIndex is 0-based (0=Jan, 11=Dec), but due_months is 1-based (1=Jan, 12=Dec)
    const monthNumber = monthIndex + 1;
    if (formData.dueMonths.includes(monthNumber)) {
      setFormData({ ...formData, dueMonths: formData.dueMonths.filter(m => m !== monthNumber) });
    } else {
      setFormData({ ...formData, dueMonths: [...formData.dueMonths, monthNumber].sort((a, b) => a - b) });
    }
  };

  // Auto-populate due_months when frequency changes
  const handleFrequencyChange = (frequency: string) => {
    let dueMonths: number[] = [];
    switch (frequency) {
      case 'quarterly':
        dueMonths = [1, 4, 7, 10];
        break;
      case 'half-yearly':
        dueMonths = [1, 7];
        break;
      case 'yearly':
        dueMonths = [1]; // Default to January
        break;
      case 'custom':
        dueMonths = []; // Let user select
        break;
    }
    setFormData({ ...formData, frequency, dueMonths });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Prevent double submission
    if (createSchedule.isPending) {
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Calculate due_months based on frequency if not custom
    let dueMonths = formData.dueMonths;
    if (formData.frequency !== 'custom' && dueMonths.length === 0) {
      switch (formData.frequency) {
        case 'quarterly':
          dueMonths = [1, 4, 7, 10];
          break;
        case 'half-yearly':
          dueMonths = [1, 7];
          break;
        case 'yearly':
          dueMonths = [1]; // Default to January if not specified
          break;
        default:
          dueMonths = [1];
      }
    }

    if (dueMonths.length === 0) {
      alert('Please select at least one due month');
      return;
    }

    // Prevent double submission
    if (createSchedule.isPending) {
      return;
    }

    const scheduleData = {
      name: formData.name.trim(),
      category: formData.category as any,
      frequency: formData.frequency as any,
      amount: parseFloat(formData.amount),
      due_day: formData.dueDay,
      due_months: dueMonths,
      start_date: new Date().toISOString().split('T')[0], // Today as start date
      is_auto_linked: false,
      icon: '📅',
      notes: formData.notes?.trim() || null,
    };

    createSchedule.mutate(scheduleData, {
      onSuccess: () => {
        onClose();
        setFormData({
          name: '',
          category: 'other',
          frequency: 'yearly',
          amount: '',
          dueDay: 1,
          dueMonths: [],
          notes: '',
        });
      },
      onError: (error: any) => {
        console.error('Error creating schedule:', error);
        alert('Failed to create schedule. Please try again.');
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Payment Schedule" icon="📅" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Schedule Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., School Fees, Property Tax"
          required
        />

        <FormSelect
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'insurance', label: 'Insurance' },
            { value: 'education', label: 'Education' },
            { value: 'tax', label: 'Tax' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'subscription', label: 'Subscription' },
            { value: 'vehicle', label: 'Vehicle' },
            { value: 'other', label: 'Other' },
          ]}
          required
        />

        <FormSelect
          label="Frequency"
          value={formData.frequency}
          onChange={(e) => handleFrequencyChange(e.target.value)}
          options={[
            { value: 'quarterly', label: 'Quarterly (4 times/year)' },
            { value: 'half-yearly', label: 'Half-Yearly (2 times/year)' },
            { value: 'yearly', label: 'Yearly (Once/year)' },
            { value: 'custom', label: 'Custom (Select months)' },
          ]}
          required
        />

        <FormInput
          label="Due Day (Day of Month)"
          type="number"
          value={formData.dueDay}
          onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 1 })}
          min="1"
          max="31"
          placeholder="e.g., 15"
          required
        />

        <FormInput
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          prefix="₹"
          required
        />

        {/* Month Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Due Months</label>
          <div className="grid grid-cols-6 gap-2">
            {monthNames.map((month, idx) => {
              const monthNumber = idx + 1; // Convert to 1-based
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => toggleMonth(idx)}
                  className={`py-2 px-1 text-xs font-medium rounded-lg border-2 transition-colors min-h-[44px] ${formData.dueMonths.includes(monthNumber)
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>

        <ModalActions
          onCancel={onClose}
          submitLabel="Create Schedule"
          isSubmitting={createSchedule.isPending}
          submitDisabled={createSchedule.isPending}
        />
      </form>
    </Modal>
  );
}

// Edit Schedule Modal
function EditScheduleModal({
  isOpen,
  onClose,
  schedule
}: {
  isOpen: boolean;
  onClose: () => void;
  schedule: any | null;
}) {
  const updateSchedule = useUpdateScheduledPayment();
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    frequency: 'yearly',
    amount: '',
    dueDay: 1,
    dueMonths: [] as number[],
    notes: '',
  });

  // Populate form when schedule changes
  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name || '',
        category: schedule.category || 'other',
        frequency: schedule.frequency || 'yearly',
        amount: schedule.amount?.toString() || '',
        dueDay: schedule.due_day || 1,
        dueMonths: schedule.due_months || [],
        notes: schedule.notes || '',
      });
    }
  }, [schedule]);

  const toggleMonth = (monthIndex: number) => {
    const monthNumber = monthIndex + 1;
    if (formData.dueMonths.includes(monthNumber)) {
      setFormData({ ...formData, dueMonths: formData.dueMonths.filter(m => m !== monthNumber) });
    } else {
      setFormData({ ...formData, dueMonths: [...formData.dueMonths, monthNumber].sort((a, b) => a - b) });
    }
  };

  const handleFrequencyChange = (frequency: string) => {
    let dueMonths: number[] = [];
    switch (frequency) {
      case 'quarterly':
        dueMonths = [1, 4, 7, 10];
        break;
      case 'half-yearly':
        dueMonths = [1, 7];
        break;
      case 'yearly':
        dueMonths = [1];
        break;
      case 'custom':
        dueMonths = formData.dueMonths; // Keep existing
        break;
    }
    setFormData({ ...formData, frequency, dueMonths });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!schedule) return;

    if (!formData.name.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    let dueMonths = formData.dueMonths;
    if (formData.frequency !== 'custom' && dueMonths.length === 0) {
      switch (formData.frequency) {
        case 'quarterly':
          dueMonths = [1, 4, 7, 10];
          break;
        case 'half-yearly':
          dueMonths = [1, 7];
          break;
        case 'yearly':
          dueMonths = [1];
          break;
        default:
          dueMonths = [1];
      }
    }

    if (dueMonths.length === 0) {
      alert('Please select at least one due month');
      return;
    }

    const updates = {
      name: formData.name.trim(),
      category: formData.category as any,
      frequency: formData.frequency as any,
      amount: parseFloat(formData.amount),
      due_day: formData.dueDay,
      due_months: dueMonths,
      notes: formData.notes?.trim() || null,
    };

    updateSchedule.mutate(
      { id: schedule.id, updates },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error: any) => {
          console.error('Error updating schedule:', error);
          alert('Failed to update schedule. Please try again.');
        },
      }
    );
  };

  if (!schedule) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Payment Schedule" icon="✏️" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Schedule Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., School Fees, Property Tax"
          required
        />

        <FormSelect
          label="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'insurance', label: 'Insurance' },
            { value: 'education', label: 'Education' },
            { value: 'tax', label: 'Tax' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'subscription', label: 'Subscription' },
            { value: 'vehicle', label: 'Vehicle' },
            { value: 'other', label: 'Other' },
          ]}
          required
        />

        <FormSelect
          label="Frequency"
          value={formData.frequency}
          onChange={(e) => handleFrequencyChange(e.target.value)}
          options={[
            { value: 'quarterly', label: 'Quarterly (4 times/year)' },
            { value: 'half-yearly', label: 'Half-Yearly (2 times/year)' },
            { value: 'yearly', label: 'Yearly (Once/year)' },
            { value: 'custom', label: 'Custom (Select months)' },
          ]}
          required
        />

        <FormInput
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          prefix="₹"
          required
        />

        <FormInput
          label="Due Day (Day of Month)"
          type="number"
          value={formData.dueDay}
          onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) || 1 })}
          min="1"
          max="31"
          placeholder="e.g., 15"
          required
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Due Months</label>
          <div className="grid grid-cols-6 gap-2">
            {monthNames.map((month, idx) => {
              const monthNumber = idx + 1;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => toggleMonth(idx)}
                  className={`py-2 px-1 text-xs font-medium rounded-lg border-2 transition-colors min-h-[44px] ${formData.dueMonths.includes(monthNumber)
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>

        <FormInput
          label="Notes (Optional)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes..."
        />

        <ModalActions
          onCancel={onClose}
          onSubmit={() => handleSubmit()}
          submitLabel="Update Schedule"
          isSubmitting={updateSchedule.isPending}
        />
      </form>
    </Modal>
  );
}

// Pay Schedule Modal
function PayScheduleModal({
  isOpen,
  onClose,
  payment
}: {
  isOpen: boolean;
  onClose: () => void;
  payment: { id: string; scheduleName: string; icon: string; dueDate: string; amount: number };
}) {
  const [formData, setFormData] = useState({
    paidAmount: payment?.amount?.toString() || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" icon="✅" size="md">
      <div className="space-y-4">
        {/* Payment Details */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{payment.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{payment.scheduleName}</h3>
              <p className="text-sm text-gray-500">
                Due: {new Date(payment.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Scheduled Amount</span>
            <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
          </div>
        </div>

        <FormInput
          label="Amount Paid"
          type="number"
          value={formData.paidAmount}
          onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
          prefix="₹"
          required
        />

        <FormInput
          label="Payment Date"
          type="date"
          value={formData.paymentDate}
          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          required
        />

        <FormSelect
          label="Payment Method"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          options={[
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'upi', label: 'UPI' },
            { value: 'credit_card', label: 'Credit Card' },
            { value: 'debit_card', label: 'Debit Card' },
            { value: 'cash', label: 'Cash' },
            { value: 'cheque', label: 'Cheque' },
          ]}
        />

        <FormInput
          label="Notes (Optional)"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes..."
        />

        <ModalActions
          onCancel={onClose}
          onSubmit={onClose}
          submitLabel="Mark as Paid"
        />
      </div>
    </Modal>
  );
}
