import { Check, Edit, Loader2, Mail, Phone, Shield, Trash2, UserPlus, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DeleteConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, FormSelect, ModalActions } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useFamilyMembers, useRemoveFamilyMember } from '../hooks/useFamily';

interface UiFamilyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'member' | 'viewer';
  avatar: string;
  status: 'active' | 'pending';
  addedOn: string;
  relationship?: string;
  user_id?: string;
}

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const roleLabels = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const roleDescriptions = {
  admin: 'Full access - can manage everything',
  member: 'Can add/edit transactions and view reports',
  viewer: 'Can only view data, no editing',
};

const roleColors = {
  admin: 'bg-primary-100 text-primary-700',
  member: 'bg-success-50 text-success-700',
  viewer: 'bg-gray-100 text-gray-700',
};

export default function Family() {
  const { family } = useAuth();
  // Memoize family ID to prevent query key changes
  const familyId = useMemo(() => family?.id, [family?.id]);
  // Only fetch if family exists to prevent unnecessary calls
  const { data: dbMembers = [], isLoading } = useFamilyMembers(familyId);
  const removeMember = useRemoveFamilyMember();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UiFamilyMember | null>(null);

  // Transform database members to UI format
  const members: UiFamilyMember[] = useMemo(() => dbMembers.map((m: any) => ({
    id: m.id,
    name: m.user?.name || m.user?.email?.split('@')[0] || 'Unknown',
    email: m.user?.email || '',
    phone: m.user?.mobile || '',
    role: m.role as 'admin' | 'member' | 'viewer',
    avatar: getInitials(m.user?.name || m.user?.email || 'UN'),
    status: 'active', // All joined members are active
    addedOn: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '',
    relationship: m.relationship || 'Not specified',
    user_id: m.user_id,
  })), [dbMembers]);

  const handleEdit = (member: UiFamilyMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleDelete = (member: UiFamilyMember) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedMember) {
      removeMember.mutate(selectedMember.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleResendInvite = (member: UiFamilyMember) => {
    // Would send invite email
    console.log('Resend invite to', member.email);
  };

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Family Management</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage family members and their access levels</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto">
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Members</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
        <div className="card p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Active Members</p>
          <p className="text-xl sm:text-2xl font-bold text-success-600">{members.filter(m => m.status === 'active').length}</p>
        </div>
        <div className="card p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-gray-500 mb-1">Pending Invites</p>
          <p className="text-xl sm:text-2xl font-bold text-warning-600">{members.filter(m => m.status === 'pending').length}</p>
        </div>
      </div>

      {/* Members List */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Family Members</h2>
        <div className="space-y-3 sm:space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No family members yet</p>
            </div>
          ) : (
            members.map(member => (
              <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-semibold flex-shrink-0 ${member.role === 'admin' ? 'bg-gradient-to-br from-primary-500 to-primary-700' :
                      member.role === 'member' ? 'bg-gradient-to-br from-success-500 to-success-700' :
                        'bg-gradient-to-br from-gray-500 to-gray-700'
                    }`}>
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{member.name}</h3>
                      {member.user_id === family?.owner_id && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">
                          Owner
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${roleColors[member.role]}`}>
                        {roleLabels[member.role]}
                      </span>
                      {member.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700 whitespace-nowrap">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1 truncate w-full sm:w-auto">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </span>
                      {member.phone && (
                        <span className="flex items-center gap-1 truncate w-full sm:w-auto">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{member.phone}</span>
                        </span>
                      )}
                      {member.relationship && (
                        <span className="flex items-center gap-1 truncate w-full sm:w-auto">
                          <span className="text-gray-400">•</span>
                          {member.relationship}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                  {member.status === 'pending' && (
                    <button
                      onClick={() => handleResendInvite(member)}
                      className="btn-secondary text-sm min-h-[44px] min-w-[120px] w-full sm:w-auto justify-center"
                    >
                      Resend Invite
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {member.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(member)}
                      className="p-2 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Roles Explanation */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(roleLabels).map(([role, label]) => (
            <div key={role} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className={`w-5 h-5 flex-shrink-0 ${role === 'admin' ? 'text-primary-600' :
                    role === 'member' ? 'text-success-600' :
                      'text-gray-600'
                  }`} />
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{label}</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">{roleDescriptions[role as keyof typeof roleDescriptions]}</p>
              <div className="space-y-1.5">
                {role === 'admin' && (
                  <>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Check className="w-3 h-3 text-success-500 flex-shrink-0" /> <span>Manage family members</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Check className="w-3 h-3 text-success-500 flex-shrink-0" /> <span>Full access to all features</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Check className="w-3 h-3 text-success-500 flex-shrink-0" /> <span>Export and backup data</span></p>
                  </>
                )}
                {role === 'member' && (
                  <>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Check className="w-3 h-3 text-success-500 flex-shrink-0" /> <span>Add/edit transactions</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Check className="w-3 h-3 text-success-500 flex-shrink-0" /> <span>View all reports</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><X className="w-3 h-3 text-danger-500 flex-shrink-0" /> <span>Cannot manage members</span></p>
                  </>
                )}
                {role === 'viewer' && (
                  <>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Check className="w-3 h-3 text-success-500 flex-shrink-0" /> <span>View all data</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><X className="w-3 h-3 text-danger-500 flex-shrink-0" /> <span>Cannot add/edit</span></p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><X className="w-3 h-3 text-danger-500 flex-shrink-0" /> <span>Cannot manage members</span></p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Edit Member Modal */}
      {selectedMember && (
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          member={selectedMember}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedMember?.name || ''}
        itemType="Family Member"
      />
    </div>
  );
}

function AddMemberModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { family, user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    relationship: 'Other',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !user) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Create invitation using the service
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/family_invitations`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          family_id: family.id,
          email: formData.email,
          role: formData.role,
          relationship: formData.relationship,
          invited_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invitation');
      }

      setSuccess('Invitation sent successfully!');
      setTimeout(() => {
        onClose();
        setFormData({ name: '', email: '', phone: '', role: 'member', relationship: 'Other' });
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', role: 'member', relationship: 'Other' });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Family Member" icon="👨‍👩‍👧‍👦" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700">
              {success}
            </div>
          )}

          <FormInput
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />

          <FormInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />

          <FormInput
            label="Mobile Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />

          <FormSelect
            label="Relationship"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            options={[
              { value: 'Spouse', label: 'Spouse' },
              { value: 'Child', label: 'Child' },
              { value: 'Parent', label: 'Parent' },
              { value: 'Sibling', label: 'Sibling' },
              { value: 'Other', label: 'Other' },
            ]}
            required
          />

          <FormSelect
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'member', label: 'Member - Can add/edit transactions' },
              { value: 'viewer', label: 'Viewer - Can only view data' },
            ]}
            required
          />

          <div className="p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-700">
              An invitation will be sent to the email address provided. When they sign up, they will automatically join your family.
            </p>
          </div>

          <ModalActions
            onCancel={handleClose}
            submitLabel="Send Invitation"
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}

function EditMemberModal({ isOpen, onClose, member }: { isOpen: boolean; onClose: () => void; member: UiFamilyMember }) {
  const [formData, setFormData] = useState({
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Family Member" icon="✏️" size="md">
      <div className="space-y-4">
        <FormInput
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter full name"
          required
        />

        <FormInput
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
          required
        />

        <FormInput
          label="Mobile Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91 98765 43210"
          required
        />

        {member.role !== 'admin' && (
          <FormSelect
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'member' | 'viewer' })}
            options={[
              { value: 'member', label: 'Member - Can add/edit transactions' },
              { value: 'viewer', label: 'Viewer - Can only view data' },
            ]}
            required
          />
        )}

        <ModalActions
          onCancel={onClose}
          onSubmit={onClose}
          submitLabel="Save Changes"
        />
      </div>
    </Modal>
  );
}
