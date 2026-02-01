import { Edit2, Info, Link as LinkIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import {
  useBudgetSummary,
  useCreateExpenseCategory,
  useCreateIncomeSource,
  useDeleteExpenseCategory,
  useDeleteIncomeSource,
  useExpenseCategories,
  useIncomeSources,
  useUpdateExpenseCategory,
  useUpdateIncomeSource,
} from '../hooks/useBudget';
import { formatCurrency } from '../lib/api';
import type { ExpenseCategory, IncomeSource } from '../lib/supabase';

const iconOptions = ['💰', '🏠', '💼', '📈', '🎁', '💵', '📊', '🏦', '💳', '🛒', '⛽', '⚡', '🍽️', '🎬', '🏥', '👕', '📚', '🚗', '✈️', '💻'];

export default function Budget() {
  const { showToast } = useToast();

  // Fetch data
  const { data: incomeSources, isLoading: loadingIncome } = useIncomeSources();
  const { data: expenseCategories, isLoading: loadingExpenses } = useExpenseCategories();
  const { data: summary } = useBudgetSummary();

  // Mutations
  const createIncome = useCreateIncomeSource();
  const updateIncome = useUpdateIncomeSource();
  const deleteIncome = useDeleteIncomeSource();
  const createExpense = useCreateExpenseCategory();
  const updateExpense = useUpdateExpenseCategory();
  const deleteExpense = useDeleteExpenseCategory();

  // Modal states
  const [addIncomeModal, setAddIncomeModal] = useState(false);
  const [addExpenseModal, setAddExpenseModal] = useState(false);
  const [editItem, setEditItem] = useState<{ item: IncomeSource | ExpenseCategory; type: 'income' | 'expense' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ item: IncomeSource | ExpenseCategory; type: 'income' | 'expense' } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formIcon, setFormIcon] = useState('💰');
  const [isSaving, setIsSaving] = useState(false);

  // Calculations
  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpenses || 0;
  const surplus = summary?.surplus || 0;

  const openAddIncomeModal = () => {
    setFormName('');
    setFormAmount('');
    setFormIcon('💰');
    setAddIncomeModal(true);
  };

  const openAddExpenseModal = () => {
    setFormName('');
    setFormAmount('');
    setFormIcon('🛒');
    setAddExpenseModal(true);
  };

  const openEditModal = (item: IncomeSource | ExpenseCategory, type: 'income' | 'expense') => {
    setEditItem({ item, type });
    setFormName(item.name);
    setFormAmount(type === 'income'
      ? (item as IncomeSource).expected_amount.toString()
      : (item as ExpenseCategory).planned_amount.toString()
    );
    setFormIcon(item.icon || '💰');
  };

  const handleAddIncome = async () => {
    if (!formName || !formAmount) return;
    setIsSaving(true);
    try {
      await createIncome.mutateAsync({
        name: formName,
        expected_amount: parseFloat(formAmount),
        icon: formIcon,
        is_recurring: true,
      });
      showToast('success', 'Income source added successfully');
      setAddIncomeModal(false);
    } catch (error) {
      showToast('error', 'Failed to add income source');
    }
    setIsSaving(false);
  };

  const handleAddExpense = async () => {
    if (!formName || !formAmount) return;
    setIsSaving(true);
    try {
      await createExpense.mutateAsync({
        name: formName,
        planned_amount: parseFloat(formAmount),
        icon: formIcon,
        is_recurring: true,
      });
      showToast('success', 'Expense category added successfully');
      setAddExpenseModal(false);
    } catch (error) {
      showToast('error', 'Failed to add expense category');
    }
    setIsSaving(false);
  };

  const handleUpdateItem = async () => {
    if (!editItem || !formName || !formAmount) return;
    setIsSaving(true);
    try {
      if (editItem.type === 'income') {
        await updateIncome.mutateAsync({
          id: editItem.item.id,
          updates: {
            name: formName,
            expected_amount: parseFloat(formAmount),
            icon: formIcon,
          },
        });
      } else {
        await updateExpense.mutateAsync({
          id: editItem.item.id,
          updates: {
            name: formName,
            planned_amount: parseFloat(formAmount),
            icon: formIcon,
          },
        });
      }
      showToast('success', 'Updated successfully');
      setEditItem(null);
    } catch (error) {
      showToast('error', 'Failed to update');
    }
    setIsSaving(false);
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'income') {
        await deleteIncome.mutateAsync(deleteConfirm.item.id);
      } else {
        await deleteExpense.mutateAsync(deleteConfirm.item.id);
      }
      showToast('success', 'Deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      showToast('error', 'Failed to delete');
    }
  };

  const handleAmountChange = async (id: string, newAmount: string, type: 'income' | 'expense') => {
    const amount = parseFloat(newAmount) || 0;
    try {
      if (type === 'income') {
        await updateIncome.mutateAsync({ id, updates: { expected_amount: amount } });
      } else {
        await updateExpense.mutateAsync({ id, updates: { planned_amount: amount } });
      }
    } catch (error) {
      showToast('error', 'Failed to update amount');
    }
  };

  const isLoading = loadingIncome || loadingExpenses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Budget Settings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Define your monthly budget template</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-blue-800">
          <p className="font-medium">This template repeats monthly</p>
          <p className="text-blue-600 mt-1">Define your expected income sources and expense categories here. Track actual amounts in the Monthly Tracker.</p>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Budget Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <div className="text-xs sm:text-sm text-gray-500">Total Expected Income</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 break-words">{formatCurrency(totalIncome)}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-500">Total Planned Expenses</div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 break-words">{formatCurrency(totalExpense)}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-500">Monthly Surplus</div>
            <div className={`text-xl sm:text-2xl font-bold break-words ${surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {surplus >= 0 ? '🟢' : '🔴'} {formatCurrency(surplus)}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Income Column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">📥 EXPECTED INCOME</h2>
              <button
                onClick={openAddIncomeModal}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-200 transition-colors min-h-[44px] w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">Add Income Source</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {incomeSources?.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-sm sm:text-base">No income sources yet</p>
                <button onClick={openAddIncomeModal} className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm mt-2 min-h-[44px]">
                  Add your first income source →
                </button>
              </div>
            ) : (
              incomeSources?.map((item) => (
                <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon || '💰'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900 truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.is_recurring ? 'Recurring: Monthly' : 'One-time'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                      <div className="relative flex-1 sm:flex-initial">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">₹</span>
                        <input
                          type="number"
                          defaultValue={item.expected_amount}
                          onBlur={(e) => handleAmountChange(item.id, e.target.value, 'income')}
                          className="w-full sm:w-32 pl-7 pr-3 py-2 text-right text-sm sm:text-base font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                        />
                      </div>
                      <button
                        onClick={() => openEditModal(item, 'income')}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ item, type: 'income' })}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 sm:px-6 py-4 bg-emerald-50 border-t border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm sm:text-base text-gray-700">TOTAL</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-600 break-words">{formatCurrency(totalIncome)}</span>
            </div>
          </div>
        </div>

        {/* Expense Column */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">📤 PLANNED EXPENSES</h2>
              <button
                onClick={openAddExpenseModal}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-100 text-rose-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-rose-200 transition-colors min-h-[44px] w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">Add Expense Category</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {expenseCategories?.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-sm sm:text-base">No expense categories yet</p>
                <button onClick={openAddExpenseModal} className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm mt-2 min-h-[44px]">
                  Add your first expense category →
                </button>
              </div>
            ) : (
              expenseCategories?.map((item) => (
                <div key={item.id} className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${item.is_linked ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{item.icon || '📤'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-sm sm:text-base text-gray-900 truncate">{item.name}</span>
                          {item.is_linked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium whitespace-nowrap flex-shrink-0">
                              <LinkIcon className="w-3 h-3" />
                              {item.linked_type}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.is_linked ? '(Auto-linked)' : item.is_recurring ? 'Recurring: Monthly' : 'One-time'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                      <div className="relative flex-1 sm:flex-initial">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">₹</span>
                        <input
                          type="number"
                          defaultValue={item.planned_amount}
                          onBlur={(e) => handleAmountChange(item.id, e.target.value, 'expense')}
                          disabled={item.is_linked || false}
                          className={`w-full sm:w-32 pl-7 pr-3 py-2 text-right text-sm sm:text-base font-medium border border-gray-200 rounded-lg min-h-[44px] ${item.is_linked
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                        />
                      </div>
                      <button
                        onClick={() => !item.is_linked && openEditModal(item, 'expense')}
                        disabled={item.is_linked || false}
                        className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${item.is_linked
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                        title={item.is_linked ? 'Managed in Loans module' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => !item.is_linked && setDeleteConfirm({ item, type: 'expense' })}
                        disabled={item.is_linked || false}
                        className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${item.is_linked
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        title={item.is_linked ? 'Managed in Loans module' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 sm:px-6 py-4 bg-rose-50 border-t border-rose-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm sm:text-base text-gray-700">TOTAL</span>
              <span className="text-lg sm:text-xl font-bold text-rose-600 break-words">{formatCurrency(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-xs sm:text-sm text-gray-500 flex items-start gap-2">
        <LinkIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <span>🔗 = Auto-linked from Loans/Insurance module (cannot edit here)</span>
      </div>

      {/* Add Income Modal */}
      <Modal
        isOpen={addIncomeModal}
        onClose={() => setAddIncomeModal(false)}
        title="Add Income Source"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
              placeholder="e.g., Salary, Rental Income"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.slice(0, 10).map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormIcon(icon)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${formIcon === icon
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleAddIncome}
              disabled={!formName || !formAmount || isSaving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              SAVE
            </button>
            <button
              onClick={() => setAddIncomeModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              CANCEL
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={addExpenseModal}
        onClose={() => setAddExpenseModal(false)}
        title="Add Expense Category"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
              placeholder="e.g., Groceries, Entertainment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.slice(10).map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormIcon(icon)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${formIcon === icon
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleAddExpense}
              disabled={!formName || !formAmount || isSaving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              SAVE
            </button>
            <button
              onClick={() => setAddExpenseModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              CANCEL
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit ${editItem?.type === 'income' ? 'Income Source' : 'Expense Category'}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormIcon(icon)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${formIcon === icon
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleUpdateItem}
              disabled={!formName || !formAmount || isSaving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              SAVE
            </button>
            <button
              onClick={() => setEditItem(null)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              CANCEL
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
        title={`Delete ${deleteConfirm?.type === 'income' ? 'Income Source' : 'Expense Category'}?`}
        message={`Are you sure you want to delete "${deleteConfirm?.item.name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        variant="danger"
      />
    </div>
  );
}
