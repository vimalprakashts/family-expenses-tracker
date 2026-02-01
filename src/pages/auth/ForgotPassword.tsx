import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Mail, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Step = 'email' | 'sent' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [formData, setFormData] = useState({
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    const result = await resetPassword(formData.email);

    setIsLoading(false);

    if (result.error) {
      setErrors({ form: result.error });
    } else {
      setStep('sent');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <Home className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Family Finance</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Form Error */}
          {errors.form && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
              {errors.form}
            </div>
          )}

          {step === 'email' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Reset Password</h2>
              <p className="text-gray-500 text-center text-sm mb-6">
                Enter your registered email to receive a password reset link.
              </p>

              <form onSubmit={handleSendLink} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      disabled={isLoading}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all disabled:bg-gray-50 ${
                        errors.email ? 'border-danger-300' : 'border-gray-200'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-danger-600 mt-1">{errors.email}</p>}
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <Link 
                to="/login" 
                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 mt-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </>
          )}

          {step === 'sent' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-500 text-sm mb-6">
                We've sent a password reset link to <strong>{formData.email}</strong>. 
                Click the link in the email to reset your password.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/login')} 
                  className="w-full btn-primary py-3"
                >
                  Go to Login
                </button>
                <button 
                  onClick={() => setStep('email')} 
                  className="w-full btn-secondary py-3"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-500 text-sm mb-6">
                Your password has been updated. Please login with your new password.
              </p>
              <button 
                onClick={() => navigate('/login')} 
                className="w-full btn-primary py-3"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
