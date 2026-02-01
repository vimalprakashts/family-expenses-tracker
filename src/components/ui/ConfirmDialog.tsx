import { AlertTriangle, Trash2, LogOut, Check } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const icons = {
  danger: <Trash2 className="w-6 h-6 text-danger-600" />,
  warning: <AlertTriangle className="w-6 h-6 text-warning-600" />,
  info: <Check className="w-6 h-6 text-primary-600" />,
};

const bgColors = {
  danger: 'bg-danger-50',
  warning: 'bg-warning-50',
  info: 'bg-primary-50',
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 ${bgColors[variant]} rounded-full flex items-center justify-center mb-4`}>
          {icons[variant]}
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Specific Confirmation Dialogs
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}?`}
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Logout" size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <LogOut className="w-6 h-6 text-gray-600" />
        </div>
        <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1">
            Logout
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onSave,
  onDiscard,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unsaved Changes" size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-warning-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-warning-600" />
        </div>
        <p className="text-gray-600 mb-6">
          You have unsaved changes. What would you like to do?
        </p>
        <div className="flex flex-col gap-2 w-full">
          <button onClick={onSave} className="btn-primary w-full">
            Save & Leave
          </button>
          <button onClick={onDiscard} className="btn-secondary w-full">
            Leave Without Saving
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 text-sm py-2">
            Stay on Page
          </button>
        </div>
      </div>
    </Modal>
  );
}
