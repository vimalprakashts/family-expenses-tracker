import { Check, ChevronRight, Lock, LogOut, Shield, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { LogoutConfirmDialog } from '../components/ui/ConfirmDialog';
import Modal, { FormInput, ModalActions } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user, authUser, logout } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  // User profile data
  const [userProfile, setUserProfile] = useState<any>(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && authUser) {
        setUserProfile({
          name: authUser.user_metadata?.name || user.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: authUser.user_metadata?.phone || user.mobile || '',
        });
      }
    };

    fetchUserProfile();
  }, [user]);

  // Check MFA status on mount
  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const { data: factorsData, error } = await supabase.auth.mfa.listFactors();
        if (error) {
          console.error('Failed to check MFA status:', error);
          return;
        }
        const hasVerifiedFactor = factorsData?.totp?.some(factor => factor.status === 'verified');
        setTwoFactorEnabled(hasVerifiedFactor || false);
      } catch (error) {
        console.error('Failed to check MFA status:', error);
      }
    };

    checkMFAStatus();
  }, []);

  // Helper function to get user initials
  const getUserInitials = () => {
    if (!userProfile?.name) return 'U';
    const names = userProfile.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return userProfile.name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500">Manage your account preferences and settings</p>
      </div>

      <div className="max-w-4xl space-y-4 sm:space-y-6">
        {/* Profile Section */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Profile
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-semibold flex-shrink-0">
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{userProfile?.name || 'Loading...'}</h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{userProfile?.email || ''}</p>
                {userProfile?.phone && (
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{userProfile.phone}</p>
                )}
              </div>
            </div>
            <button onClick={() => setIsEditProfileOpen(true)} className="btn-secondary min-h-[44px] w-full sm:w-auto justify-center">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="card p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary-600" />
            Security
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Lock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Change Password</p>
                  <p className="text-xs sm:text-sm text-gray-500">Last changed 30 days ago</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Shield className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Two-Factor Authentication</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {twoFactorEnabled ? 'Your account is protected with 2FA' : 'Add extra security to your account'}
                  </p>
                </div>
              </div>
              {twoFactorEnabled ? (
                <button
                  onClick={() => setIs2FAModalOpen(true)}
                  className="btn-secondary text-sm text-red-600 hover:text-red-700 min-h-[44px] min-w-[100px] w-full sm:w-auto"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={() => setIs2FAModalOpen(true)}
                  className="btn-secondary text-sm min-h-[44px] min-w-[100px] w-full sm:w-auto"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card p-4 sm:p-6 border-red-200 bg-red-50/30">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-600" />
            Account Actions
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-white rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">Logout</p>
              <p className="text-xs sm:text-sm text-gray-500">Sign out of your account</p>
            </div>
            <button
              onClick={() => setIsLogoutDialogOpen(true)}
              className="btn-danger min-h-[44px] w-full sm:w-auto justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">App Version 1.0.0</p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => {
          setIsEditProfileOpen(false);
          // Refresh user profile after edit
          if (user && authUser) {
            setUserProfile({
              name: authUser.user_metadata?.name || user.name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              phone: authUser.user_metadata?.phone || user.mobile || '',
            });
          }
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        isEnabled={twoFactorEnabled}
        onToggle={(enabled) => setTwoFactorEnabled(enabled)}
      />

      {/* Logout Confirmation */}
      <LogoutConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={async () => {
          setIsLogoutDialogOpen(false);
          await logout();
        }}
      />
    </div>
  );
}

function EditProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, authUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    pan: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && user && authUser) {
      setFormData({
        name: authUser.user_metadata?.name || user.name || '',
        email: user.email || '',
        phone: authUser.user_metadata?.phone || user.mobile || '',
        dob: authUser.user_metadata?.dob || '',
        pan: authUser.user_metadata?.pan || '',
      });
    }
  }, [isOpen, user, authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          phone: formData.phone,
          dob: formData.dob,
          pan: formData.pan,
        }
      });

      if (updateError) throw updateError;

      alert('Profile updated successfully!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserInitials = () => {
    if (!formData.name) return user?.email?.substring(0, 2).toUpperCase() || 'U';
    const names = formData.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return formData.name.substring(0, 2).toUpperCase();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" icon="✏️" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-semibold flex-shrink-0">
              {getUserInitials()}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button type="button" className="btn-secondary text-sm min-h-[44px] w-full sm:w-auto justify-center">Change Photo</button>
              <button type="button" className="btn-ghost text-sm min-h-[44px] w-full sm:w-auto justify-center">Remove</button>
            </div>
          </div>

          <FormInput
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <FormInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
            required
          />
          <p className="text-xs text-gray-500 -mt-2">
            Email cannot be changed here. Use "Change Password" to update your email.
          </p>

          <FormInput
            label="Mobile Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />

          <FormInput
            label="Date of Birth"
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          />

          <FormInput
            label="PAN Number (for tax reports)"
            value={formData.pan}
            onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
            placeholder="ABCDE1234F"
          />

          <ModalActions
            onCancel={onClose}
            submitLabel="Save Changes"
            isLoading={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { updatePassword } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requirements = [
    { label: 'At least 8 characters', met: formData.newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(formData.newPassword) },
    { label: 'One number', met: /[0-9]/.test(formData.newPassword) },
    { label: 'One special character', met: /[!@#$%^&*]/.test(formData.newPassword) },
  ];

  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0;
  const allRequirementsMet = requirements.every(req => req.met);
  const canSubmit = allRequirementsMet && passwordsMatch && formData.currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setIsSubmitting(true);

    try {
      const result = await updatePassword(formData.newPassword);
      if (result.error) {
        setError(result.error);
      } else {
        // Success - reset form and close
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        onClose();
        // Show success message (you could add a toast notification here)
        alert('Password updated successfully!');
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password" icon="🔒" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <FormInput
            label="Current Password"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            required
          />

          <FormInput
            label="New Password"
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            required
          />

          {/* Password Strength */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-gray-700">Password Requirements:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {requirements.map((req, idx) => (
                <p key={idx} className={`text-xs flex items-center gap-1 ${req.met ? 'text-success-600' : 'text-gray-400'}`}>
                  {req.met ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
                  {req.label}
                </p>
              ))}
            </div>
          </div>

          <FormInput
            label="Confirm New Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          {formData.confirmPassword && (
            <p className={`text-xs flex items-center gap-1 -mt-2 ${passwordsMatch ? 'text-success-600' : 'text-danger-600'}`}>
              {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}

          <ModalActions
            onCancel={handleClose}
            submitLabel="Update Password"
            isSubmitting={isSubmitting}
            submitDisabled={!canSubmit}
          />
        </div>
      </form>
    </Modal>
  );
}

function TwoFactorModal({
  isOpen,
  onClose,
  isEnabled,
  onToggle
}: {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');

  useEffect(() => {
    if (isOpen && !isEnabled) {
      enrollMFA();
    }
  }, [isOpen, isEnabled]);

  const enrollMFA = async () => {
    try {
      setError('');

      // First, check if there are any existing factors
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();

      if (listError) {
        console.error('List factors error:', listError);
        throw new Error('MFA is not enabled for this project. Please enable TOTP MFA in your Supabase Dashboard under Authentication > Providers.');
      }

      const factors = factorsData?.totp || [];

      if (factors.length > 0) {
        // Clean up any existing factors (verified or unverified)
        for (const factor of factors) {
          console.log('Unenrolling existing factor:', factor.id, factor.status);
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (unenrollError) {
            console.error('Unenroll error:', unenrollError);
          }
        }
      }

      // Now enroll a new factor
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (enrollError) {
        console.error('Enroll error:', enrollError);
        throw enrollError;
      }

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (err: any) {
      console.error('enrollMFA error:', err);
      setError(err.message || 'Failed to initialize 2FA setup. Make sure MFA is enabled in your Supabase project settings.');
    }
  };

  const handleEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      // Success!
      onToggle(true);
      setVerificationCode('');
      onClose();
      alert('Two-Factor Authentication has been enabled successfully!');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable = async () => {
    if (!verificationCode) {
      setError('Please enter your verification code');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Get all factors
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const factors = factorsData?.totp || [];

      if (factors && factors.length > 0) {
        // Unenroll the first factor (typically there's only one)
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: factors[0].id
        });

        if (unenrollError) throw unenrollError;

        onToggle(false);
        setVerificationCode('');
        onClose();
        alert('Two-Factor Authentication has been disabled.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setVerificationCode('');
    setError('');
    setQrCode('');
    setSecret('');
    setFactorId('');
    onClose();
  };

  if (isEnabled) {
    // Disable 2FA flow
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Disable Two-Factor Authentication" icon="🔓" size="md">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> Disabling 2FA will make your account less secure. You'll only need your password to sign in.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <FormInput
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code from your authenticator app"
            maxLength={6}
            required
          />

          <ModalActions
            onCancel={handleClose}
            submitLabel="Disable 2FA"
            isLoading={isProcessing}
            submitVariant="danger"
            onSubmit={handleDisable}
          />
        </div>
      </Modal>
    );
  }

  // Enable 2FA flow
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Enable Two-Factor Authentication" icon="🔒" size="md">
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">How to set up:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Download an authenticator app (Google Authenticator, Authy, or similar)</li>
            <li>Scan the QR code below with your authenticator app</li>
            <li>Enter the 6-digit verification code from the app</li>
          </ol>
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-4 sm:py-6">
          {qrCode ? (
            <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-white p-3 sm:p-4 rounded-xl border-2 border-gray-200">
              <img
                src={qrCode}
                alt="QR Code for 2FA setup"
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-gray-500">Loading QR Code...</p>
              </div>
            </div>
          )}
        </div>

        {secret && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1 text-center font-medium">Manual entry key:</p>
            <p className="text-xs text-gray-800 font-mono text-center break-all">
              {secret}
            </p>
          </div>
        )}

        <FormInput
          label="Verification Code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter 6-digit code"
          maxLength={6}
        />

        <ModalActions
          onCancel={handleClose}
          submitLabel="Enable 2FA"
          isLoading={isProcessing}
          onSubmit={handleEnable}
          submitDisabled={!qrCode || !verificationCode || verificationCode.length !== 6}
        />
      </div>
    </Modal>
  );
}
