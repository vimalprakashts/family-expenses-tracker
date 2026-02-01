import { AlertTriangle, Car, Check, Eye, Heart, Loader2, Plus, Shield, Skull, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, ModalActions } from '../components/ui/Modal';
import { useCreateInsurance, useDeleteInsurance, useInsurancePolicies, useInsuranceSummary } from '../hooks/useInsurance';
import { formatCurrency } from '../lib/api';
import type { Insurance } from '../lib/supabase';

const typeIcons: Record<string, React.ElementType> = {
  life: Shield,
  health: Heart,
  term: Skull,
  vehicle: Car,
  lic: Shield,
};

const typeLabels: Record<string, string> = {
  life: 'Life Insurance',
  lic: 'LIC Policy',
  health: 'Health Insurance',
  term: 'Term Insurance',
  vehicle: 'Vehicle Insurance',
};

const typeColors: Record<string, { gradient: string }> = {
  life: { gradient: 'from-blue-500 to-blue-600' },
  lic: { gradient: 'from-blue-500 to-blue-600' },
  health: { gradient: 'from-rose-500 to-rose-600' },
  term: { gradient: 'from-violet-500 to-violet-600' },
  vehicle: { gradient: 'from-emerald-500 to-emerald-600' },
};

export default function InsurancePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: policies, isLoading } = useInsurancePolicies();
  const { data: summary } = useInsuranceSummary();
  const createInsurance = useCreateInsurance();
  const deleteInsurance = useDeleteInsurance();

  const handleAddPolicy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const insuranceData: any = {
      type: formData.get('type') as string,
      policy_name: formData.get('policy_name') as string,
      provider: formData.get('provider') as string,
      policy_number: formData.get('policy_number') as string,
      coverage: parseFloat(formData.get('coverage') as string),
      premium: parseFloat(formData.get('premium') as string),
      frequency: formData.get('frequency') as string,
      start_date: formData.get('start_date') as string,
    };

    // Optional fields

    const maturityDate = formData.get('maturity_date') as string;
    if (maturityDate) insuranceData.maturity_date = maturityDate;

    const premiumDay = formData.get('premium_day') as string;
    if (premiumDay) insuranceData.premium_day = parseInt(premiumDay);

    createInsurance.mutate(insuranceData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        (e.target as HTMLFormElement).reset();
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteInsurance.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const handleView = (policy: any) => {
    setSelectedPolicy(policy);
    setIsViewModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading insurance policies...</p>
        </div>
      </div>
    );
  }

  const policiesList = policies || [];
  const totalCoverage = summary?.totalCoverage || 0;
  const annualPremium = summary?.annualPremium || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Insurance</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage all your insurance policies</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Policy
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-indigo-100 text-xs sm:text-sm font-medium">Total Coverage</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(totalCoverage)}</p>
          <p className="text-indigo-200 text-xs sm:text-sm mt-1">{policiesList.length} policies</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Annual Premium</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(annualPremium)}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Yearly cost</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Active Policies</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">{policiesList.filter((p: Insurance) => p.status === 'active').length}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Currently active</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Health Coverage</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
            {formatCurrency(policiesList.filter((p: Insurance) => p.type === 'health').reduce((sum: number, p: Insurance) => sum + (p.coverage || 0), 0))}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Medical protection</p>
        </div>
      </div>

      {/* Insurance List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Your Policies</h2>
        </div>

        {policiesList.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {policiesList.map((policy: Insurance) => {
              const type = policy.type || 'life';
              const colors = typeColors[type] || typeColors.life;
              const Icon = typeIcons[type] || Shield;
              const daysUntilDue = policy.next_due_date
                ? Math.ceil((new Date(policy.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={policy.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                      <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{policy.policy_name || `${policy.type} Policy`}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{policy.provider || 'Provider'} • {typeLabels[type] || type}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                          <span className="text-gray-600">
                            Premium: <strong>{formatCurrency(policy.premium || 0)}</strong>
                            <span className="text-gray-400">/{policy.frequency || 'yearly'}</span>
                          </span>
                          {policy.policy_number && (
                            <span className="text-gray-500">#{policy.policy_number}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-500">Sum Assured</p>
                        <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(policy.coverage || 0)}</p>
                        {daysUntilDue !== null && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 whitespace-nowrap ${daysUntilDue <= 7 ? 'bg-rose-100 text-rose-700' :
                              daysUntilDue <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                            {daysUntilDue <= 0 ? 'Overdue' : `Due in ${daysUntilDue} days`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleView(policy)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: policy.id, name: policy.policy_name || `${policy.type} Policy` })}
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
            <p className="text-sm">No insurance policies added yet. Click "Add Policy" to add your first policy.</p>
          </div>
        )}
      </div>

      {/* Add Policy Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Insurance Policy"
      >
        <form onSubmit={handleAddPolicy}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Policy Type <span className="text-danger-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white min-h-[44px]"
              >
                <option value="">Select Type</option>
                <option value="life">Life Insurance</option>
                <option value="lic">LIC Policy</option>
                <option value="health">Health Insurance</option>
                <option value="term">Term Insurance</option>
                <option value="vehicle">Vehicle Insurance</option>
              </select>
            </div>

            <FormInput
              label="Policy Name"
              name="policy_name"
              type="text"
              placeholder="e.g., Family Health Cover"
              required
            />

            <FormInput
              label="Provider"
              name="provider"
              type="text"
              placeholder="e.g., HDFC ERGO"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Coverage Amount"
                name="coverage"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />

              <FormInput
                label="Premium Amount"
                name="premium"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Frequency <span className="text-danger-500">*</span>
                </label>
                <select
                  name="frequency"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white min-h-[44px]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half_yearly">Half Yearly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <FormInput
                label="Premium Day (1-31)"
                name="premium_day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 15"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Start Date"
                name="start_date"
                type="date"
                required
              />

              <FormInput
                label="Maturity Date (Optional)"
                name="maturity_date"
                type="date"
              />
            </div>

            <FormInput
              label="Policy Number"
              name="policy_number"
              type="text"
              placeholder="e.g., POL123456"
              required
            />

            <ModalActions
              onCancel={() => setIsAddModalOpen(false)}
              submitLabel="Add Policy"
              isSubmitting={createInsurance.isPending}
            />
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPolicy(null);
        }}
        title="Policy Details"
      >
        {selectedPolicy && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Policy Name</label>
                <p className="text-gray-900 font-medium">{selectedPolicy.policy_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Provider</label>
                <p className="text-gray-900">{selectedPolicy.provider}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                <p className="text-gray-900 capitalize">{typeLabels[selectedPolicy.type] || selectedPolicy.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Policy Number</label>
                <p className="text-gray-900">{selectedPolicy.policy_number || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Sum Assured</label>
                <p className="text-gray-900 font-medium">{formatCurrency(selectedPolicy.coverage || 0)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Premium</label>
                <p className="text-gray-900 font-medium">{formatCurrency(selectedPolicy.premium || 0)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Frequency</label>
                <p className="text-gray-900 capitalize">{selectedPolicy.frequency}</p>
              </div>
              {selectedPolicy.premium_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Premium Date</label>
                  <p className="text-gray-900">{selectedPolicy.premium_day} of every {selectedPolicy.frequency === 'monthly' ? 'month' : selectedPolicy.frequency === 'quarterly' ? 'quarter' : selectedPolicy.frequency === 'half_yearly' ? 'half year' : 'year'}</p>
                </div>
              )}
              {selectedPolicy.next_due_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Next Due Date</label>
                  <p className="text-gray-900">{new Date(selectedPolicy.next_due_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                <p className="text-gray-900">{new Date(selectedPolicy.start_date).toLocaleDateString()}</p>
              </div>
              {selectedPolicy.maturity_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Maturity Date</label>
                  <p className="text-gray-900">{new Date(selectedPolicy.maturity_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedPolicy(null);
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
        itemType="policy"
        isLoading={deleteInsurance.isPending}
      />
    </div>
  );
}
