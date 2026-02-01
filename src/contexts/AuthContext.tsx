import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User, Family, FamilyMember } from '../lib/supabase';

interface AuthContextType {
  // Auth state
  authUser: SupabaseUser | null;
  session: Session | null;
  user: User | null;
  family: Family | null;
  familyMembership: FamilyMember | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string, mobile?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>; // Alias for signOut
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  
  // Refresh methods
  refreshUser: () => Promise<void>;
  refreshFamily: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembership, setFamilyMembership] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function for fetch with timeout
  const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 8000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Fetch user profile from users table using direct REST API (more reliable)
  const fetchUserProfile = useCallback(async (authId: string, accessToken: string, retryCount = 0): Promise<User | null> => {
    console.log('fetchUserProfile: Fetching profile for authId:', authId, 'retry:', retryCount);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    try {
      const response = await fetchWithTimeout(
        `${supabaseUrl}/rest/v1/users?auth_id=eq.${authId}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
        8000
      );
      
      if (!response.ok) {
        console.error('fetchUserProfile: HTTP Error:', response.status);
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchUserProfile(authId, accessToken, retryCount + 1);
        }
        return null;
      }
      
      const data = await response.json();
      console.log('fetchUserProfile: Success:', data?.[0]?.email);
      
      if (data && data.length > 0) {
        setUser(data[0]);
        return data[0];
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('fetchUserProfile: Exception:', errorMessage);
      
      // Retry on network/abort errors
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchUserProfile(authId, accessToken, retryCount + 1);
      }
    }
    return null;
  }, []);

  // Fetch family and membership using direct REST API (more reliable)
  const fetchFamilyData = useCallback(async (userId: string, accessToken: string, retryCount = 0): Promise<Family | null> => {
    console.log('fetchFamilyData: Fetching family for userId:', userId, 'retry:', retryCount);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    try {
      const response = await fetchWithTimeout(
        `${supabaseUrl}/rest/v1/family_members?user_id=eq.${userId}&select=*,families(*)&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
        8000
      );
      
      if (!response.ok) {
        console.error('fetchFamilyData: HTTP Error:', response.status);
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchFamilyData(userId, accessToken, retryCount + 1);
        }
        return null;
      }
      
      const data = await response.json();
      console.log('fetchFamilyData: Success:', data?.[0]?.families);
      
      if (data && data.length > 0) {
        const family = data[0].families as unknown as Family;
        setFamilyMembership(data[0]);
        setFamily(family);
        return family;
      }
      return null;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('fetchFamilyData: Exception:', errorMessage);
      
      // Retry on network/abort errors
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchFamilyData(userId, accessToken, retryCount + 1);
      }
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    console.log('AuthContext: Starting session check...');
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isHandlingOAuth = false; // Prevent duplicate OAuth handling
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        console.log('AuthContext: getSession completed', { hasSession: !!session, error });
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setAuthUser(session?.user ?? null);
        
        if (session?.user && session.access_token) {
          // Small delay to ensure session is fully propagated
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const userData = await fetchUserProfile(session.user.id, session.access_token);
          if (userData && isMounted) {
            await fetchFamilyData(userData.id, session.access_token);
          } else if (isMounted && !userData && !isHandlingOAuth) {
            // OAuth user without profile - create it
            isHandlingOAuth = true;
            await handleOAuthUser(session);
            isHandlingOAuth = false;
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in initializeAuth:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth session check timeout - setting loading to false');
        setIsLoading(false);
      }
    }, 15000); // 15 second timeout

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('Auth state changed:', _event, newSession?.user?.email);
        
        if (!isMounted) return;
        
        setSession(newSession);
        setAuthUser(newSession?.user ?? null);

        if (newSession?.user && newSession.access_token) {
          // Only fetch on SIGNED_IN, not on TOKEN_REFRESHED (to avoid duplicate fetches)
          if (_event === 'SIGNED_IN') {
            try {
              const userData = await fetchUserProfile(newSession.user.id, newSession.access_token);
              if (userData && isMounted) {
                const familyData = await fetchFamilyData(userData.id, newSession.access_token);
                
                // If user exists but has no family, create one
                if (!familyData && !isHandlingOAuth) {
                  console.log('User exists but has no family, creating one...');
                  isHandlingOAuth = true;
                  
                  // Create family for existing user using database function
                  const name = newSession.user.user_metadata?.full_name || 
                               newSession.user.user_metadata?.name || 
                               newSession.user.email?.split('@')[0] || 'User';
                  const familyName = `${name}'s Family`;
                  
                  console.log('Calling create_family_for_user function...');
                  
                  const { data: result, error: familyError } = await supabase.rpc('create_family_for_user', {
                    p_user_id: userData.id,
                    p_family_name: familyName,
                  }) as { data: Array<{ family_id: string; family_name: string; member_id: string }> | null; error: any };

                  if (familyError) {
                    console.error('Failed to create family:', familyError);
                  } else if (result && Array.isArray(result) && result.length > 0) {
                    console.log('Family created successfully:', result[0].family_id);
                    // Refresh family data
                    await fetchFamilyData(userData.id, newSession.access_token);
                  }
                  
                  isHandlingOAuth = false;
                }
              } else if (isMounted && !userData && !isHandlingOAuth) {
                // OAuth user without profile - create it
                isHandlingOAuth = true;
                await handleOAuthUser(newSession);
                isHandlingOAuth = false;
              }
            } catch (err) {
              console.error('Error in auth state change handler:', err);
              isHandlingOAuth = false;
            }
          }
          if (isMounted) {
            setIsLoading(false);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setFamily(null);
            setFamilyMembership(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, fetchFamilyData]);

  // Handle OAuth user (Google) - create user profile if needed
  const handleOAuthUser = async (session: Session) => {
    try {
      const authUser = session.user;
      const accessToken = session.access_token;
      
      console.log('handleOAuthUser: Starting for user', authUser.email);
      console.log('handleOAuthUser: Session provided:', !!session);
      console.log('handleOAuthUser: Access token provided:', !!accessToken);
      console.log('handleOAuthUser: Refresh token provided:', !!session.refresh_token);
      
      // Wait a moment for session to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const email = authUser.email || '';
      const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0];
      
      console.log('handleOAuthUser: Checking if user profile exists');
      
      // Check if user profile exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError);
      }

      console.log('handleOAuthUser: Existing user?', !!existingUser);

      if (existingUser) {
        console.log('handleOAuthUser: User profile already exists');
        // User profile exists, fetch it
        const userData = await fetchUserProfile(authUser.id, accessToken);
        
        // Check if user has a family membership
        const { data: familyMembership } = await supabase
          .from('family_members')
          .select('id')
          .eq('user_id', existingUser.id)
          .maybeSingle();
        
        if (familyMembership) {
          console.log('handleOAuthUser: User already has family');
          return;
        }
        
        console.log('handleOAuthUser: User exists but has no family, creating one');
        // User exists but has no family - create one
        const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
        const familyName = `${name}'s Family`;
        
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .insert({
            name: familyName,
            owner_id: existingUser.id,
            created_by: existingUser.id,
          })
          .select()
          .single();

        if (familyError) {
          console.error('Failed to create family for existing OAuth user:', familyError);
          return;
        }

        console.log('handleOAuthUser: Family created', familyData.id);

        if (familyData) {
          const { error: memberError } = await supabase
            .from('family_members')
            .insert({
              family_id: familyData.id,
              user_id: existingUser.id,
              role: 'admin',
              relationship: 'Self',
              created_by: existingUser.id,
            });

          if (memberError) {
            console.error('Failed to create family member for existing OAuth user:', memberError);
            return;
          }

          console.log('Created family for existing OAuth user:', familyData.id);
        }
        
        // Refresh family data
        await fetchFamilyData(existingUser.id, accessToken);
        return;
      }

      console.log('handleOAuthUser: Creating user profile');
      
      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authUser.id,
          email,
          name,
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating OAuth user profile:', userError);
        return;
      }

      console.log('handleOAuthUser: User profile created, checking for invitations');

      // Check for invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteError) {
        console.error('Error checking invitations:', inviteError);
      }

      if (invitation) {
        console.log('handleOAuthUser: Found invitation, auto-joining family');
        // Auto-join invited family
        await supabase
          .from('family_members')
          .insert({
            family_id: invitation.family_id,
            user_id: userData.id,
            role: invitation.role,
            relationship: invitation.relationship,
            invited_by: invitation.invited_by,
            created_by: userData.id,
          });

        await supabase
          .from('family_invitations')
          .update({ status: 'accepted' as string })
          .eq('id', invitation.id);

        console.log('OAuth user auto-joined invited family:', invitation.family_id);
      } else {
        console.log('handleOAuthUser: No invitation found, creating new family');
        // Create new family for OAuth user using database function
        const familyName = `${name}'s Family`;
        
        const { data: result, error: familyError } = await supabase.rpc('create_family_for_user', {
          p_user_id: userData.id,
          p_family_name: familyName,
        }) as { data: Array<{ family_id: string; family_name: string; member_id: string }> | null; error: any };

        if (familyError) {
          console.error('Failed to create family for OAuth user:', familyError);
          throw new Error(`Failed to create family: ${familyError.message}`);
        }

        if (result && Array.isArray(result) && result.length > 0) {
          console.log('Created new family for OAuth user:', result[0].family_id);
        }
      }

      console.log('handleOAuthUser: Fetching user profile and family data');
      // Fetch user profile and family data
      const userProfile = await fetchUserProfile(authUser.id, accessToken);
      if (userProfile) {
        await fetchFamilyData(userProfile.id, accessToken);
      }
      console.log('handleOAuthUser: Complete!');
    } catch (error) {
      console.error('Error handling OAuth user:', error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  // Send OTP to email
  const signInWithOtp = async (email: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return { error: error.message };
    return {};
  };

  // Verify OTP
  const verifyOtp = async (email: string, token: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.verifyOtp({ 
      email, 
      token, 
      type: 'email' 
    });
    if (error) return { error: error.message };
    return {};
  };

  // Sign up with email and password
  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    mobile?: string
  ): Promise<{ error?: string }> => {
    // 1. Check if user already exists in public.users table
    const { data: existingUserData } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUserData) {
      return { error: 'You are already a member. Please login.' };
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name, mobile }
      }
    });
    
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Failed to create account' };

    // 3. Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        name,
        mobile: mobile || null,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user profile:', userError);
      return { error: 'Account created but profile setup failed' };
    }

    // 4. Check if this email was invited to a family
    const { data: invitation } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (invitation) {
      // User was invited - auto-join the invited family
      await supabase
        .from('family_members')
        .insert({
          family_id: invitation.family_id,
          user_id: userData.id,
          role: invitation.role,
          relationship: invitation.relationship,
          invited_by: invitation.invited_by,
          created_by: userData.id,
        });

      // Mark invitation as accepted
      await supabase
        .from('family_invitations')
        .update({ status: 'accepted' as string })
        .eq('id', invitation.id);

      console.log('User auto-joined invited family:', invitation.family_id);
    } else {
      // No invitation - create new family for the user (super admin)
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: `${name || email.split('@')[0]}'s Family`,
          owner_id: userData.id,
          created_by: userData.id,
        })
        .select()
        .single();

      if (familyError) {
        console.error('Error creating family:', familyError);
        return {};
      }

      // Add user as admin of their family with "Self" relationship
      await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: userData.id,
          role: 'admin',
          relationship: 'Self',
          created_by: userData.id,
        });

      console.log('Created new family for user:', familyData.id);
    }

    return {};
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFamily(null);
    setFamilyMembership(null);
  };

  // Reset password
  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  };

  // Update password
  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return {};
  };

  // Refresh user profile
  const refreshUser = async () => {
    if (authUser && session?.access_token) {
      await fetchUserProfile(authUser.id, session.access_token);
    }
  };

  // Refresh family data
  const refreshFamily = async () => {
    if (user && session?.access_token) {
      await fetchFamilyData(user.id, session.access_token);
    }
  };

  const value: AuthContextType = {
    authUser,
    session,
    user,
    family,
    familyMembership,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signInWithOtp,
    signInWithGoogle,
    verifyOtp,
    signUp,
    signOut,
    logout: signOut, // Alias for signOut
    resetPassword,
    updatePassword,
    refreshUser,
    refreshFamily,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
