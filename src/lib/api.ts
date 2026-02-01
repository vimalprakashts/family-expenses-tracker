import { supabase } from './supabase';
import type { User, Family, FamilyMember } from './supabase';

// Error handling wrapper
export class ApiError extends Error {
  code?: string;
  details?: unknown;
  
  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// Helper to handle Supabase errors
export function handleSupabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new ApiError(
      (error as { message: string }).message,
      (error as { code?: string }).code,
      error
    );
  }
  throw new ApiError('An unexpected error occurred');
}

// Get current authenticated user's ID from Supabase Auth
export async function getCurrentAuthUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Get current user's profile from users table
export async function getCurrentUser(): Promise<User | null> {
  const authId = await getCurrentAuthUserId();
  if (!authId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    handleSupabaseError(error);
  }

  return data;
}

// Get user's primary family
export async function getCurrentFamily(): Promise<Family | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('family_members')
    .select('family_id, families(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }

  return (data?.families as unknown as Family) ?? null;
}

// Get user's family ID (for queries)
export async function getCurrentFamilyId(): Promise<string | null> {
  const family = await getCurrentFamily();
  return family?.id ?? null;
}

// Get user's family membership with role
export async function getCurrentFamilyMembership(): Promise<FamilyMember | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }

  return data;
}

// Check if current user is admin of their family
export async function isCurrentUserAdmin(): Promise<boolean> {
  const membership = await getCurrentFamilyMembership();
  return membership?.role === 'admin';
}

// Currency formatter for INR
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Date formatter
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// Get current month and year
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
