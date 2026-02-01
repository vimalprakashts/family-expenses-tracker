import { ArrowDownRight, ArrowUpRight, Loader2, Plus, Repeat, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import Modal, { FormInput, ModalActions } from '../components/ui/Modal';
import { useCreateInvestment, useInvestments, useInvestmentsSummary } from '../hooks/useInvestments';
import { formatCurrency } from '../lib/api';

const typeLabels: Record<string, string> = {
  'mutual_fund': 'Mutual Fund',
  'fd': 'Fixed Deposit',
  'rd': 'Recurring Deposit',
  'ppf': 'PPF',
  'stocks': 'Stocks',
  'chit_fund': 'Chit Fund',
  'gold': 'Gold',
  'nps': 'NPS',
  'epf': 'EPF',
  'ssy': 'Sukanya Samriddhi Yojana',
};

const typeColors: Record<string, { gradient: string }> = {
  'mutual_fund': { gradient: 'from-blue-500 to-blue-600' },
  'fd': { gradient: 'from-emerald-500 to-emerald-600' },
  'ppf': { gradient: 'from-violet-500 to-violet-600' },
  'chit_fund': { gradient: 'from-orange-500 to-orange-600' },
  'rd': { gradient: 'from-teal-500 to-teal-600' },
  'stocks': { gradient: 'from-pink-500 to-pink-600' },
  'gold': { gradient: 'from-amber-500 to-amber-600' },
  'nps': { gradient: 'from-cyan-500 to-cyan-600' },
  'epf': { gradient: 'from-indigo-500 to-indigo-600' },
  'ssy': { gradient: 'from-rose-500 to-rose-600' },
};

export default function Investments() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: investments, isLoading } = useInvestments();
  const { data: summary } = useInvestmentsSummary();
  const createInvestment = useCreateInvestment();

  const handleAddInvestment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const investmentData: any = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      invested_amount: parseFloat(formData.get('invested_amount') as string),
      current_value: parseFloat(formData.get('current_value') as string),
      start_date: formData.get('start_date') as string,
    };

    // Optional fields
    const maturityDate = formData.get('maturity_date') as string;
    if (maturityDate) investmentData.maturity_date = maturityDate;

    const sipAmount = formData.get('sip_amount') as string;
    if (sipAmount) investmentData.sip_amount = parseFloat(sipAmount);

    const sipDate = formData.get('sip_date') as string;
    if (sipDate) investmentData.sip_date = parseInt(sipDate);

    createInvestment.mutate(investmentData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        (e.target as HTMLFormElement).reset();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading investments...</p>
        </div>
      </div>
    );
  }

  const portfolioValue = summary?.totalCurrentValue || 0;
  const totalInvested = summary?.totalInvested || 0;
  const totalReturns = summary?.totalReturns || 0;
  const returnsPercentage = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Investments</h1>
          <p className="text-xs sm:text-sm text-gray-500">Track your investment portfolio</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-indigo-100 text-xs sm:text-sm font-medium">Portfolio Value</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(portfolioValue)}</p>
          <p className="text-indigo-200 text-xs sm:text-sm mt-1">{investments?.length || 0} investments</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Total Invested</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalInvested)}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Principal amount</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalReturns >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
              }`}>
              {totalReturns >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Total Returns</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold break-words ${totalReturns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)}
          </p>
          <p className={`text-xs sm:text-sm mt-1 ${totalReturns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalReturns >= 0 ? '+' : ''}{returnsPercentage}%
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Repeat className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Monthly SIP</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(summary?.totalSIPAmount || 0)}</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{summary?.sipInvestments?.length || 0} active SIPs</p>
        </div>
      </div>

      {/* Investments List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Your Investments</h2>
        </div>

        {investments && investments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {investments.map((investment) => {
              const type = investment.type || 'mutual_fund';
              const colors = typeColors[type] || typeColors.mutual_fund;
              const currentValue = investment.current_value || investment.invested_amount || 0;
              const investedAmount = investment.invested_amount || 0;
              const returns = currentValue - investedAmount;
              const returnsPct = investedAmount > 0
                ? ((returns / investedAmount) * 100).toFixed(1)
                : '0.0';

              return (
                <div key={investment.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                      <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0`}>
                        {investment.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{investment.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">{typeLabels[type] || type}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                          <span className="text-gray-600">
                            Invested: <strong>{formatCurrency(investedAmount)}</strong>
                          </span>
                          {investment.sip_amount && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs whitespace-nowrap">
                              <Repeat className="w-3 h-3" />
                              SIP {formatCurrency(investment.sip_amount)}/mo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <p className="text-xs sm:text-sm text-gray-500">Current Value</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(currentValue)}</p>
                      <p className={`text-xs sm:text-sm mt-1 ${returns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {returns >= 0 ? '+' : ''}{formatCurrency(returns)} ({returnsPct}%)
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <p className="text-sm">No investments added yet. Click "Add Investment" to add your first investment.</p>
          </div>
        )}
      </div>

      {/* Add Investment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Investment"
      >
        <form onSubmit={handleAddInvestment}>
          <div className="space-y-4">
            <FormInput
              label="Investment Name"
              name="name"
              type="text"
              placeholder="e.g., HDFC Tax Saver Fund"
              required
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Investment Type <span className="text-danger-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white min-h-[44px]"
              >
                <option value="">Select Type</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="fd">Fixed Deposit</option>
                <option value="rd">Recurring Deposit</option>
                <option value="ppf">PPF</option>
                <option value="ssy">Sukanya Samriddhi Yojana (SSY)</option>
                <option value="stocks">Stocks</option>
                <option value="chit_fund">Chit Fund</option>
                <option value="gold">Gold</option>
                <option value="nps">NPS</option>
                <option value="epf">EPF</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Invested Amount"
                name="invested_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />

              <FormInput
                label="Current Value"
                name="current_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
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

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">SIP Details (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="SIP Amount"
                  name="sip_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />

                <FormInput
                  label="SIP Date (Day of Month)"
                  name="sip_date"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            <ModalActions
              onCancel={() => setIsAddModalOpen(false)}
              submitLabel="Add Investment"
              isSubmitting={createInvestment.isPending}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
