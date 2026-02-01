import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Processing OAuth callback');
        
        // Get the session from the URL (Supabase will automatically extract it)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthCallback: Error getting session:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        if (!session) {
          console.error('AuthCallback: No session found');
          setError('No session found. Redirecting to login...');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        console.log('AuthCallback: Session found, redirecting to home');
        // Session is valid, redirect to home
        // The AuthContext will pick up the session via onAuthStateChange
        navigate('/', { replace: true });
      } catch (err) {
        console.error('AuthCallback: Unexpected error:', err);
        setError('An unexpected error occurred.');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-400 mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-white mb-2">{error}</h2>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Completing sign in...</h2>
            <p className="text-primary-200">Please wait while we set up your account</p>
          </>
        )}
      </div>
    </div>
  );
}
