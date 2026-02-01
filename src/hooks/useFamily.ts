import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as familyService from '../services/family';
import type { FamilyInsert } from '../lib/supabase';

export function useFamily(id?: string) {
  const { family: currentFamily } = useAuth();
  const familyId = id || currentFamily?.id;
  
  return useQuery({
    queryKey: ['family', familyId],
    queryFn: () => familyService.getFamily(familyId!),
    enabled: !!familyId,
  });
}

export function useFamilyMembers(familyId?: string) {
  const { family: currentFamily } = useAuth();
  const id = familyId || currentFamily?.id;
  
  return useQuery({
    queryKey: ['familyMembers', id],
    queryFn: () => familyService.getFamilyMembers(id!),
    enabled: !!id,
    // Prevent redundant calls - data is fresh for 5 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
  });
}

export function useFamilySummary(familyId?: string) {
  const { family: currentFamily } = useAuth();
  const id = familyId || currentFamily?.id;
  
  return useQuery({
    queryKey: ['familySummary', id],
    queryFn: () => familyService.getFamilySummary(id!),
    enabled: !!id,
  });
}

export function useUserFamilies() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userFamilies', user?.id],
    queryFn: () => familyService.getUserFamilies(user!.id),
    enabled: !!user?.id,
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (family: Omit<FamilyInsert, 'created_by' | 'owner_id'>) =>
      familyService.createFamily(family, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFamilies'] });
    },
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof familyService.updateFamily>[1] }) =>
      familyService.updateFamily(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['family', id] });
      queryClient.invalidateQueries({ queryKey: ['familySummary', id] });
      queryClient.invalidateQueries({ queryKey: ['userFamilies'] });
    },
  });
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      userId: string;
      role: 'admin' | 'member' | 'viewer';
      familyId?: string;
    }) => familyService.addFamilyMember(
      data.familyId || family!.id,
      data.userId,
      data.role,
      user!.id
    ),
    onSuccess: (_, { familyId }) => {
      const id = familyId || family?.id;
      queryClient.invalidateQueries({ queryKey: ['familyMembers', id] });
      queryClient.invalidateQueries({ queryKey: ['familySummary', id] });
    },
  });
}

export function useInviteMemberByEmail() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      email: string;
      role: 'admin' | 'member' | 'viewer';
      familyId?: string;
    }) => familyService.inviteMemberByEmail(
      data.familyId || family!.id,
      data.email,
      data.role,
      user!.id
    ),
    onSuccess: (_, { familyId }) => {
      const id = familyId || family?.id;
      queryClient.invalidateQueries({ queryKey: ['familyMembers', id] });
      queryClient.invalidateQueries({ queryKey: ['familySummary', id] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { family } = useAuth();
  
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'admin' | 'member' | 'viewer' }) =>
      familyService.updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers', family?.id] });
      queryClient.invalidateQueries({ queryKey: ['familySummary', family?.id] });
    },
  });
}

export function useUpdateMemberPermissions() {
  const queryClient = useQueryClient();
  const { family } = useAuth();
  
  return useMutation({
    mutationFn: ({ memberId, permissions }: { memberId: string; permissions: Record<string, boolean> }) =>
      familyService.updateMemberPermissions(memberId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers', family?.id] });
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();
  const { family } = useAuth();
  
  return useMutation({
    mutationFn: (memberId: string) => familyService.removeFamilyMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers', family?.id] });
      queryClient.invalidateQueries({ queryKey: ['familySummary', family?.id] });
    },
  });
}
