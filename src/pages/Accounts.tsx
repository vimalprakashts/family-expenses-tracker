import { Building2, Calendar, ChevronDown, ChevronUp, CreditCard, Loader2, Plus, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, ModalActions } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import {
  useAccountsSummary,
  useBankAccounts,
  useCreateBankAccount,
  useCreateCreditCard,
  useCreateCreditCardBill,
  useCreditCardBills,
  useCreditCards,
  useDeleteBankAccount,
  useDeleteCreditCard,
  usePayCreditCardBill
} from '../hooks/useAccounts';
import { formatCurrency, getCurrentMonthYear } from '../lib/api';

export default function Accounts() {
  const { showToast } = useToast();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: 'bank' | 'card' } | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isPayBillModalOpen, setIsPayBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const { data: bankAccounts, isLoading: loadingBanks } = useBankAccounts();
  const { data: creditCards, isLoading: loadingCards } = useCreditCards();
  const { data: summary, isLoading: loadingSummary } = useAccountsSummary();
  const createBankAccount = useCreateBankAccount();
  const createCreditCard = useCreateCreditCard();
  const deleteBankAccount = useDeleteBankAccount();
  const deleteCreditCard = useDeleteCreditCard();
  const createBill = useCreateCreditCardBill();
  const payBill = usePayCreditCardBill();

  // Get bills for expanded card (all bills, not filtered by month)
  const { data: cardBills } = useCreditCardBills(
    expandedCardId || ''
  );

  const handleAddBank = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const accountData: any = {
      bank_name: formData.get('bank_name') as string,
      account_type: formData.get('account_type') as string,
      balance: parseFloat(formData.get('balance') as string),
    };

    const accountNumber = formData.get('account_number') as string;
    if (accountNumber) accountData.account_number = accountNumber;

    createBankAccount.mutate(accountData, {
      onSuccess: () => {
        setIsAddBankModalOpen(false);
        (e.target as HTMLFormElement).reset();
      },
    });
  };

  const handleAddCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const creditLimit = parseFloat(formData.get('credit_limit') as string);
    const outstanding = parseFloat(formData.get('outstanding') as string || '0');
    const lastFour = formData.get('last_four') as string;

    const cardData: any = {
      bank_name: formData.get('bank_name') as string,
      card_name: formData.get('card_name') as string,
      credit_limit: creditLimit,
      outstanding: outstanding,
      available_limit: creditLimit - outstanding,
      billing_date: parseInt(formData.get('billing_day') as string),
    };

    // Map last_four to card_number_masked (format: ****1234)
    if (lastFour) {
      cardData.card_number_masked = `****${lastFour}`;
    }

    const dueDay = formData.get('due_day') as string;
    if (dueDay) cardData.due_date = parseInt(dueDay);

    createCreditCard.mutate(cardData, {
      onSuccess: () => {
        setIsAddCardModalOpen(false);
        (e.target as HTMLFormElement).reset();
      },
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'bank') {
      deleteBankAccount.mutate(deleteConfirm.id, {
        onSuccess: () => setDeleteConfirm(null),
      });
    } else {
      deleteCreditCard.mutate(deleteConfirm.id, {
        onSuccess: () => setDeleteConfirm(null),
      });
    }
  };

  const handleAddBill = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCardId) return;

    const formData = new FormData(e.currentTarget);
    const billData = {
      credit_card_id: selectedCardId,
      month: parseInt(formData.get('month') as string),
      year: parseInt(formData.get('year') as string),
      bill_amount: parseFloat(formData.get('bill_amount') as string),
      min_due: formData.get('min_due') ? parseFloat(formData.get('min_due') as string) : null,
      notes: formData.get('notes') ? (formData.get('notes') as string) : undefined,
    };

    createBill.mutate(billData, {
      onSuccess: () => {
        setIsAddBillModalOpen(false);
        setSelectedCardId(null);
        (e.target as HTMLFormElement).reset();
        showToast('success', 'Credit card bill added successfully');
      },
      onError: () => {
        showToast('error', 'Failed to add credit card bill');
      },
    });
  };

  const handlePayBill = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBill) return;

    const formData = new FormData(e.currentTarget);
    const paidAmount = parseFloat(formData.get('paid_amount') as string);
    const fromAccountId = formData.get('from_account') as string || null;
    const notes = (formData.get('notes') as string) || undefined;

    payBill.mutate({
      billId: selectedBill.id,
      paidAmount,
      fromAccountId,
      notes,
    }, {
      onSuccess: () => {
        setIsPayBillModalOpen(false);
        setSelectedBill(null);
        (e.target as HTMLFormElement).reset();
        showToast('success', 'Bill payment recorded successfully');
      },
      onError: () => {
        showToast('error', 'Failed to record payment');
      },
    });
  };

  const isLoading = loadingBanks || loadingCards || loadingSummary;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  const totalBalance = summary?.totalBankBalance || 0;
  const totalCreditLimit = summary?.totalCreditLimit || 0;
  const totalOutstanding = summary?.totalOutstanding || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage your bank accounts and credit cards</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAddBankModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors min-h-[44px] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Bank Account
          </button>
          <button
            onClick={() => setIsAddCardModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors min-h-[44px] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Credit Card
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-emerald-100 text-xs sm:text-sm font-medium">Total Balance</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(totalBalance)}</p>
          <p className="text-emerald-200 text-xs sm:text-sm mt-1">{bankAccounts?.length || 0} accounts</p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-slate-300 text-xs sm:text-sm font-medium">Credit Limit</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(totalCreditLimit)}</p>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">{creditCards?.length || 0} cards</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-gray-500 text-xs sm:text-sm font-medium">Card Outstanding</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(totalOutstanding)}</p>
          <p className="text-amber-600 text-xs sm:text-sm mt-1">Total dues</p>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Bank Accounts</h2>
              <p className="text-xs sm:text-sm text-gray-500">{bankAccounts?.length || 0} accounts linked</p>
            </div>
          </div>
        </div>
        {bankAccounts && bankAccounts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {bankAccounts.map((account) => (
              <div key={account.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {account.bank_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{account.bank_name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{account.account_type} • {account.account_number_masked}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{formatCurrency(account.balance || 0)}</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ id: account.id, name: account.bank_name, type: 'bank' })}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <p className="text-sm">No bank accounts added yet.</p>
          </div>
        )}
      </div>

      {/* Credit Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-100 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Credit Cards</h2>
              <p className="text-xs sm:text-sm text-gray-500">{creditCards?.length || 0} cards linked</p>
            </div>
          </div>
        </div>
        {creditCards && creditCards.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {creditCards.map((card) => {
              const utilization = card.credit_limit > 0
                ? (((card.credit_limit - (card.available_limit || card.credit_limit)) / card.credit_limit) * 100)
                : 0;

              return (
                <div key={card.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{card.bank_name} {card.card_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{card.card_number_masked}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-500">Limit: {formatCurrency(card.credit_limit)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 sm:w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${utilization > 70 ? 'bg-rose-500' : utilization > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-600">{utilization.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setExpandedCardId(expandedCardId === card.id ? null : card.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title={expandedCardId === card.id ? "Hide bills" : "View bills"}
                        >
                          {expandedCardId === card.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: card.id, name: `${card.bank_name} ${card.card_name}`, type: 'card' })}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Bills View */}
                  {expandedCardId === card.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">Monthly Bills</h4>
                        <button
                          onClick={() => {
                            setSelectedCardId(card.id);
                            setIsAddBillModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4" />
                          Add Bill
                        </button>
                      </div>

                      {cardBills && cardBills.length > 0 ? (
                        <div className="space-y-2">
                          {cardBills.map((bill: any) => {
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const isPaid = bill.status === 'paid';
                            const isOverdue = bill.status === 'overdue';
                            const dueDate = new Date(bill.due_date);

                            return (
                              <div
                                key={bill.id}
                                className={`p-3 sm:p-4 rounded-lg border ${isPaid ? 'bg-emerald-50 border-emerald-200' :
                                    isOverdue ? 'bg-rose-50 border-rose-200' :
                                      'bg-gray-50 border-gray-200'
                                  }`}
                              >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                                        {monthNames[bill.month - 1]} {bill.year}
                                      </span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-700' :
                                          isOverdue ? 'bg-rose-100 text-rose-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {bill.status}
                                      </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-600">
                                      <span>Bill: {formatCurrency(bill.bill_amount)}</span>
                                      {bill.min_due && (
                                        <span>Min Due: {formatCurrency(bill.min_due)}</span>
                                      )}
                                      <span>Due: {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                    </div>
                                    {bill.paid_amount > 0 && (
                                      <div className="mt-1 text-xs text-gray-500">
                                        Paid: {formatCurrency(bill.paid_amount)} / {formatCurrency(bill.bill_amount)}
                                      </div>
                                    )}
                                  </div>
                                  {!isPaid && (
                                    <button
                                      onClick={() => {
                                        setSelectedBill(bill);
                                        setIsPayBillModalOpen(true);
                                      }}
                                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-colors min-h-[44px] w-full sm:w-auto whitespace-nowrap"
                                    >
                                      Pay
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 text-sm">
                          <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>No bills added for this month</p>
                          <button
                            onClick={() => {
                              setSelectedCardId(card.id);
                              setIsAddBillModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-700 text-sm mt-2"
                          >
                            Add your first bill →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No credit cards added yet.
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      <Modal
        isOpen={isAddBankModalOpen}
        onClose={() => setIsAddBankModalOpen(false)}
        title="Add Bank Account"
      >
        <form onSubmit={handleAddBank}>
          <div className="space-y-4">
            <FormInput
              label="Bank Name"
              name="bank_name"
              type="text"
              placeholder="e.g., HDFC Bank"
              required
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Account Type <span className="text-danger-500">*</span>
              </label>
              <select
                name="account_type"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white min-h-[44px]"
              >
                <option value="">Select Type</option>
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
                <option value="salary">Salary Account</option>
              </select>
            </div>

            <FormInput
              label="Account Number (Optional)"
              name="account_number"
              type="text"
              placeholder="Last 4 digits or full number"
            />

            <FormInput
              label="Current Balance"
              name="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />

            <ModalActions
              onCancel={() => setIsAddBankModalOpen(false)}
              submitLabel="Add Account"
              isSubmitting={createBankAccount.isPending}
            />
          </div>
        </form>
      </Modal>

      {/* Add Credit Card Modal */}
      <Modal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        title="Add Credit Card"
      >
        <form onSubmit={handleAddCard}>
          <div className="space-y-4">
            <FormInput
              label="Bank Name"
              name="bank_name"
              type="text"
              placeholder="e.g., HDFC Bank"
              required
            />

            <FormInput
              label="Card Name"
              name="card_name"
              type="text"
              placeholder="e.g., Regalia, Platinum, etc."
              required
            />

            {/* Card Type field removed - not stored in database */}

            <FormInput
              label="Last 4 Digits"
              name="last_four"
              type="text"
              placeholder="e.g., 1234"
              maxLength={4}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Credit Limit"
                name="credit_limit"
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
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Billing Day (1-31)"
                name="billing_day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 1"
                required
              />

              <FormInput
                label="Due Day (1-31)"
                name="due_day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 15"
              />
            </div>

            <ModalActions
              onCancel={() => setIsAddCardModalOpen(false)}
              submitLabel="Add Card"
              isSubmitting={createCreditCard.isPending}
            />
          </div>
        </form>
      </Modal>

      {/* Add Credit Card Bill Modal */}
      <Modal
        isOpen={isAddBillModalOpen}
        onClose={() => {
          setIsAddBillModalOpen(false);
          setSelectedCardId(null);
        }}
        title="Add Credit Card Bill"
      >
        <form onSubmit={handleAddBill}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                <select
                  name="month"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white min-h-[44px]"
                  defaultValue={currentMonth}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                    <option key={idx + 1} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  name="year"
                  type="number"
                  required
                  min="2020"
                  max="2100"
                  defaultValue={currentYear}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all min-h-[44px]"
                />
              </div>
            </div>

            <FormInput
              label="Bill Amount *"
              name="bill_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />

            <FormInput
              label="Minimum Due (Optional)"
              name="min_due"
              type="number"
              step="0.01"
              placeholder="0.00"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none min-h-[44px]"
                placeholder="Any additional notes about this bill..."
              />
            </div>

            <ModalActions
              onCancel={() => {
                setIsAddBillModalOpen(false);
                setSelectedCardId(null);
              }}
              submitLabel="Add Bill"
              isSubmitting={createBill.isPending}
            />
          </div>
        </form>
      </Modal>

      {/* Pay Credit Card Bill Modal */}
      <Modal
        isOpen={isPayBillModalOpen}
        onClose={() => {
          setIsPayBillModalOpen(false);
          setSelectedBill(null);
        }}
        title="Pay Credit Card Bill"
      >
        {selectedBill && (
          <form onSubmit={handlePayBill}>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Bill Amount</div>
                    <div className="font-medium text-gray-900">{formatCurrency(selectedBill.bill_amount)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Already Paid</div>
                    <div className="font-medium text-gray-900">{formatCurrency(selectedBill.paid_amount || 0)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-500">Remaining</div>
                    <div className="font-medium text-indigo-600">
                      {formatCurrency(selectedBill.bill_amount - (selectedBill.paid_amount || 0))}
                    </div>
                  </div>
                </div>
              </div>

              <FormInput
                label="Payment Amount *"
                name="paid_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                defaultValue={selectedBill.bill_amount - (selectedBill.paid_amount || 0)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Account (Optional)</label>
                <select
                  name="from_account"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white min-h-[44px]"
                >
                  <option value="">Select account</option>
                  {bankAccounts?.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} - {formatCurrency(acc.balance || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none min-h-[88px]"
                  placeholder="Payment notes..."
                />
              </div>

              <ModalActions
                onCancel={() => {
                  setIsPayBillModalOpen(false);
                  setSelectedBill(null);
                }}
                submitLabel="Record Payment"
                isSubmitting={payBill.isPending}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        itemName={deleteConfirm?.name || ''}
        itemType={deleteConfirm?.type === 'bank' ? 'bank account' : 'credit card'}
        isLoading={deleteBankAccount.isPending || deleteCreditCard.isPending}
      />
    </div>
  );
}
