import { supabase } from '../lib/supabase';
import type { 
  Family,
  FamilyMember,
  User,
  FamilyInsert 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Families ====================

export async function getFamily(id: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function createFamily(
  family: Omit<FamilyInsert, 'created_by'>,
  userId: string
): Promise<Family> {
  const { data, error } = await supabase
    .from('families')
    .insert({ 
      ...family, 
      owner_id: userId,
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateFamily(
  id: string,
  updates: Partial<Family>
): Promise<Family> {
  const { data, error } = await supabase
    .from('families')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

// ==================== Family Members ====================

export async function getFamilyMembers(familyId: string): Promise<(FamilyMember & { user: User })[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select(`
      id,
      family_id,
      user_id,
      role,
      relationship,
      status,
      created_at,
      updated_at,
      users!inner (
        id,
        name,
        email,
        mobile
      )
    `)
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });

  if (error) handleSupabaseError(error);
  
  return (data ?? []).map((member: any) => {
    const { users, ...memberData } = member;
    return {
      ...memberData,
      user: users as User
    };
  });
}

export async function getFamilyMember(
  familyId: string, 
  userId: string
): Promise<FamilyMember | null> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

export async function addFamilyMember(
  familyId: string,
  userId: string,
  role: 'admin' | 'member' | 'viewer',
  invitedBy: string,
  relationship?: string
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .insert({
      family_id: familyId,
      user_id: userId,
      role,
      relationship,
      invited_by: invitedBy,
      joined_at: new Date().toISOString(),
      created_by: invitedBy,
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateMemberRole(
  memberId: string,
  role: 'admin' | 'member' | 'viewer'
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateMemberPermissions(
  memberId: string,
  permissions: Record<string, boolean>
): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .update({ permissions })
    .eq('id', memberId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function removeFamilyMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId);

  if (error) handleSupabaseError(error);
}

// ==================== Invite Members ====================

export async function inviteMemberByEmail(
  familyId: string,
  email: string,
  role: 'admin' | 'member' | 'viewer',
  invitedBy: string
): Promise<{ success: boolean; message: string }> {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    // Check if already a member
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', existingUser.id)
      .single();

    if (existingMember) {
      return { success: false, message: 'User is already a family member' };
    }

    // Add as member
    await addFamilyMember(familyId, existingUser.id, role, invitedBy);
    return { success: true, message: 'Member added successfully' };
  }

  // User doesn't exist - would need to send invite email
  // For now, return a message
  return { 
    success: false, 
    message: 'User not found. They need to register first.' 
  };
}

// ==================== User's Families ====================

export async function getUserFamilies(userId: string): Promise<Family[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('families(*)')
    .eq('user_id', userId);

  if (error) handleSupabaseError(error);
  
  return (data ?? []).map(m => m.families as unknown as Family);
}

// ==================== Family Summary ====================

export async function getFamilySummary(familyId: string) {
  const [family, members] = await Promise.all([
    getFamily(familyId),
    getFamilyMembers(familyId),
  ]);

  const admins = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');
  const viewers = members.filter(m => m.role === 'viewer');

  return {
    family,
    members,
    memberCount: members.length,
    admins,
    regularMembers,
    viewers,
  };
}

// ==================== Family Invitations ====================

export async function createInvitation(data: {
  family_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  relationship: string;
  invited_by: string;
}) {
  const { data: result, error } = await supabase
    .from('family_invitations')
    .insert({
      ...data,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
    } as any)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return result;
}

export async function getInvitationByEmail(email: string) {
  const { data, error } = await supabase
    .from('family_invitations')
    .select('*')
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (error && error.code !== 'PGRST116') handleSupabaseError(error);
  return data;
}

export async function acceptInvitation(invitationId: string) {
  const { error } = await supabase
    .from('family_invitations')
    .update({ status: 'accepted' as string })
    .eq('id', invitationId);

  if (error) handleSupabaseError(error);
}

export async function checkUserExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') handleSupabaseError(error);
  return !!data;
}
