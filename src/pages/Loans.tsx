import { Calendar, Car, Check, Coins, Eye, GraduationCap, Home, Landmark, Loader2, Plus, Trash2, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, ModalActions } from '../components/ui/Modal';
import { useCreateLoan, useDeleteLoan, useLoans, useLoansSummary } from '../hooks/useLoans';
import { formatCurrency } from '../lib/api';

const loanIcons: Record<string, React.ElementType> = {
  home: Home,
  car: Car,
  gold: Coins,
  education: GraduationCap,
  personal: Landmark,
};

const loanColors: Record<string, { bg: string; text: string }> = {
  home: { bg: 'bg-blue-500', text: 'text-blue-600' },
  car: { bg: 'bg-violet-500', text: 'text-violet-600' },
  gold: { bg: 'bg-amber-500', text: 'text-amber-600' },
  education: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
  personal: { bg: 'bg-slate-500', text: 'text-slate-600' },
};

export default function Loans() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: loans, isLoading } = useLoans();
  const { data: summary } = useLoansSummary();
  const createLoan = useCreateLoan();
  const deleteLoan = useDeleteLoan();

  const handleAddLoan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const loanData: any = {
      type: formData.get('type') as string,
      lender: formData.get('lender') as string,
      principal: parseFloat(formData.get('principal') as string),
      outstanding: parseFloat(formData.get('outstanding') as string),
      interest_rate: parseFloat(formData.get('interest_rate') as string),
      emi: parseFloat(formData.get('emi') as string),
      tenure_months: parseInt(formData.get('tenure_months') as string),
      start_date: formData.get('start_date') as string,
    };

    // Optional fields
    const accountNumber = formData.get('account_number') as string;
    if (accountNumber) loanData.account_number = accountNumber;

    const emiDay = formData.get('emi_day') as string;
    if (emiDay) loanData.emi_day = parseInt(emiDay);

    createLoan.mutate(loanData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        (e.target as HTMLFormElement).reset();
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteLoan.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const handleView = (loan: any) => {
    setSelectedLoan(loan);
    setIsViewModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading loans...</p>
        </div>
      </div>
    );
  }

  const activeLoans = summary?.activeLoans || [];
  const totalDebt = summary?.totalOutstanding || 0;
  const monthlyEmi = summary?.totalEMI || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Loans & EMI</h1>
          <p className="text-xs sm:text-sm text-gray-500">Track all your loans and upcoming payments</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Loan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-rose-100 text-xs sm:text-sm font-medium">Total Debt</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(totalDebt)}</p>
          <p className="text-rose-200 text-xs sm:text-sm mt-1">{activeLoans.length} active loans</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Monthly EMI</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(monthlyEmi)}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Due every month</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Total Paid</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">{formatCurrency(summary?.totalPaid || 0)}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Principal repaid</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Original Amount</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(summary?.totalPrincipal || 0)}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Total borrowed</p>
        </div>
      </div>

      {/* Loans List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Your Loans</h2>
        </div>

        {loans && loans.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {loans.map((loan) => {
              const loanType = loan.type || 'personal';
              const colors = loanColors[loanType] || loanColors.personal;
              const Icon = loanIcons[loanType] || Landmark;
              const progress = loan.principal > 0 ? ((loan.principal - loan.outstanding) / loan.principal) * 100 : 0;

              return (
                <div key={loan.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{loan.lender} - {loanType.charAt(0).toUpperCase() + loanType.slice(1)} Loan</h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                          <span className="text-gray-600">
                            EMI: <strong>{formatCurrency(loan.emi)}</strong>
                          </span>
                          <span className="text-gray-600">
                            Rate: <strong>{loan.interest_rate}%</strong>
                          </span>
                          {loan.next_emi_date && (
                            <span className="text-amber-600">
                              Next: {new Date(loan.next_emi_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-500">Outstanding</p>
                        <p className="text-lg sm:text-xl font-bold text-rose-600 break-words">{formatCurrency(loan.outstanding)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 whitespace-nowrap ${loan.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            loan.status === 'closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {loan.status || 'active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleView(loan)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: loan.id, name: `${loan.lender} - ${loan.type}` })}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Paid: {formatCurrency(loan.principal - loan.outstanding)}</span>
                      <span>{progress.toFixed(0)}% complete</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bg}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <p className="text-sm">No loans added yet. Click "Add Loan" to add your first loan.</p>
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Loan"
      >
        <form onSubmit={handleAddLoan}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Loan Type <span className="text-danger-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white min-h-[44px]"
              >
                <option value="">Select Type</option>
                <option value="home">Home Loan</option>
                <option value="car">Car Loan</option>
                <option value="education">Education Loan</option>
                <option value="gold">Gold Loan</option>
                <option value="personal">Personal Loan</option>
              </select>
            </div>

            <FormInput
              label="Lender Name"
              name="lender"
              type="text"
              placeholder="e.g., HDFC Bank"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Principal Amount"
                name="principal"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />

              <FormInput
                label="Outstanding Amount"
                name="outstanding"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Interest Rate (%)"
                name="interest_rate"
                type="number"
                step="0.01"
                placeholder="e.g., 8.5"
                required
              />

              <FormInput
                label="EMI Amount"
                name="emi"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <FormInput
              label="Tenure (Months)"
              name="tenure_months"
              type="number"
              min="1"
              placeholder="e.g., 240 for 20 years"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Start Date"
                name="start_date"
                type="date"
                required
              />

              <FormInput
                label="EMI Day (1-31)"
                name="emi_day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 5"
              />
            </div>

            <FormInput
              label="Account Number (Optional)"
              name="account_number"
              type="text"
              placeholder="e.g., 1234567890"
            />

            <ModalActions
              onCancel={() => setIsAddModalOpen(false)}
              submitLabel="Add Loan"
              isSubmitting={createLoan.isPending}
            />
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedLoan(null);
        }}
        title="Loan Details"
      >
        {selectedLoan && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Lender</label>
                <p className="text-gray-900 font-medium">{selectedLoan.lender}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                <p className="text-gray-900 capitalize">{selectedLoan.type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Principal Amount</label>
                <p className="text-gray-900 font-medium">{formatCurrency(selectedLoan.principal || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Outstanding</label>
                <p className="text-rose-600 font-medium">{formatCurrency(selectedLoan.outstanding || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Interest Rate</label>
                <p className="text-gray-900">{selectedLoan.interest_rate}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Monthly EMI</label>
                <p className="text-gray-900 font-medium">{formatCurrency(selectedLoan.emi || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                <p className="text-gray-900">{new Date(selectedLoan.start_date).toLocaleDateString()}</p>
              </div>
              {selectedLoan.emi_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">EMI Date</label>
                  <p className="text-gray-900">{selectedLoan.emi_day} of every month</p>
                </div>
              )}
            </div>

            {selectedLoan.account_number && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
                <p className="text-gray-900">{selectedLoan.account_number}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedLoan(null);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm.id)}
        itemName={deleteConfirm?.name || ''}
        itemType="loan"
        isLoading={deleteLoan.isPending}
      />
    </div>
  );
}
