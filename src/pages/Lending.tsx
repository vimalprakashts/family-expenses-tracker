import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, Clock, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, ModalActions } from '../components/ui/Modal';
import { useCreateLending, useDeleteLending, useLendings, useLendingSummary } from '../hooks/useLending';
import { formatCurrency } from '../lib/api';
import type { PersonalLending } from '../lib/supabase';

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  partial: { bg: 'bg-blue-100', text: 'text-blue-700' },
  overdue: { bg: 'bg-rose-100', text: 'text-rose-700' },
  settled: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  partial: ArrowUpRight,
  overdue: AlertTriangle,
  settled: Check,
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partial',
  overdue: 'Overdue',
  settled: 'Settled',
};

export default function Lending() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: lendings, isLoading } = useLendings();
  const { data: summary } = useLendingSummary();
  const createLending = useCreateLending();
  const deleteLending = useDeleteLending();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const lendingData: any = {
      type: formData.get('type') as string,
      person_name: formData.get('person_name') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
    };

    const dueDate = formData.get('due_date') as string;
    if (dueDate) lendingData.due_date = dueDate;

    const notes = formData.get('notes') as string;
    if (notes) lendingData.notes = notes;

    createLending.mutate(lendingData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        (e.target as HTMLFormElement).reset();
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteLending.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading lending records...</p>
        </div>
      </div>
    );
  }

  const lendingsList = lendings || [];
  const lentMoney = lendingsList.filter((l: PersonalLending) => l.type === 'lent');
  const borrowedMoney = lendingsList.filter((l: PersonalLending) => l.type === 'borrowed');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Lending</h1>
          <p className="text-xs sm:text-sm text-gray-500">Track money given to and taken from friends & family</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-emerald-100 text-xs sm:text-sm font-medium">Money Lent</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(summary?.totalLent || 0)}</p>
          <p className="text-emerald-200 text-xs sm:text-sm mt-1">{lentMoney.length} entries</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <span className="text-rose-100 text-xs sm:text-sm font-medium">Money Borrowed</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(summary?.totalBorrowed || 0)}</p>
          <p className="text-rose-200 text-xs sm:text-sm mt-1">{borrowedMoney.length} entries</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Net Position</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold break-words ${(summary?.netPosition || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(summary?.netPosition || 0)}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {(summary?.netPosition || 0) >= 0 ? 'To receive' : 'To pay'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Overdue</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
            {formatCurrency(lendingsList.filter((l: PersonalLending) => l.status === 'overdue').reduce((sum: number, l: PersonalLending) => sum + (l.outstanding || 0), 0))}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Needs attention</p>
        </div>
      </div>

      {/* Money Lent Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-transparent">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Money Lent (You'll Receive)</h2>
        </div>
        {lentMoney.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {lentMoney.map((lending: PersonalLending) => {
              const status = lending.status || 'pending';
              const styles = statusStyles[status] || statusStyles.pending;
              const Icon = statusIcons[status] || Clock;
              const remaining = lending.outstanding || 0;

              return (
                <div key={lending.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-lg flex-shrink-0">
                        {lending.person_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{lending.person_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{lending.notes || 'No reason specified'}</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          {new Date(lending.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(lending.original_amount)}</p>
                        {remaining > 0 && (
                          <p className="text-xs sm:text-sm text-amber-600">Pending: {formatCurrency(remaining)}</p>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 whitespace-nowrap ${styles.bg} ${styles.text}`}>
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          {statusLabels[status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setDeleteConfirm({ id: lending.id, name: `${lending.person_name} - Lent` })}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <p className="text-sm">No lending records yet.</p>
          </div>
        )}
      </div>

      {/* Money Borrowed Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-transparent">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Money Borrowed (You'll Pay Back)</h2>
        </div>
        {borrowedMoney.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {borrowedMoney.map((lending: PersonalLending) => {
              const status = lending.status || 'pending';
              const styles = statusStyles[status] || statusStyles.pending;
              const Icon = statusIcons[status] || Clock;
              const remaining = lending.outstanding || 0;

              return (
                <div key={lending.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-bold text-lg flex-shrink-0">
                        {lending.person_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{lending.person_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{lending.notes || 'No reason specified'}</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          {new Date(lending.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(lending.original_amount)}</p>
                        {remaining > 0 && (
                          <p className="text-xs sm:text-sm text-rose-600">To Pay: {formatCurrency(remaining)}</p>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 whitespace-nowrap ${styles.bg} ${styles.text}`}>
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          {statusLabels[status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setDeleteConfirm({ id: lending.id, name: `${lending.person_name} - Borrowed` })}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <p className="text-sm">No borrowing records yet.</p>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Lending/Borrowing Entry"
      >
        <form onSubmit={handleAdd}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Type <span className="text-danger-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
              >
                <option value="">Select Type</option>
                <option value="lent">Money Lent (I gave)</option>
                <option value="borrowed">Money Borrowed (I received)</option>
              </select>
            </div>

            <FormInput
              label="Person Name"
              name="person_name"
              type="text"
              placeholder="e.g., John Doe"
              required
            />

            <FormInput
              label="Amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Date"
                name="date"
                type="date"
                required
              />

              <FormInput
                label="Due Date (Optional)"
                name="due_date"
                type="date"
              />
            </div>

            <FormInput
              label="Notes (Optional)"
              name="notes"
              type="text"
              placeholder="Reason or additional details..."
            />

            <ModalActions
              onCancel={() => setIsAddModalOpen(false)}
              submitLabel="Add Entry"
              isSubmitting={createLending.isPending}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        itemName={deleteConfirm?.name || ''}
        itemType="entry"
        isLoading={deleteLending.isPending}
      />
    </div>
  );
}
