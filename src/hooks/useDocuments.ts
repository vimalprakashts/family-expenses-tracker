import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as documentsService from '../services/documents';
import type { DocumentInsert } from '../lib/supabase';

export function useDocuments() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['documents', family?.id],
    queryFn: () => documentsService.getDocuments(family!.id),
    enabled: !!family?.id,
  });
}

type DocumentCategory = 'bank' | 'tax' | 'insurance' | 'property' | 'identity' | 'other';

export function useDocumentsByCategory(category: DocumentCategory) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['documents', family?.id, 'category', category],
    queryFn: () => documentsService.getDocumentsByCategory(family!.id, category),
    enabled: !!family?.id && !!category,
  });
}

export function useLinkedDocuments(linkedType: string, linkedId: string) {
  return useQuery({
    queryKey: ['documents', 'linked', linkedType, linkedId],
    queryFn: () => documentsService.getLinkedDocuments(linkedType, linkedId),
    enabled: !!linkedType && !!linkedId,
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsService.getDocument(id),
    enabled: !!id,
  });
}

export function useDocumentsSummary() {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['documentsSummary', family?.id],
    queryFn: () => documentsService.getDocumentsSummary(family!.id),
    enabled: !!family?.id,
  });
}

export function useSearchDocuments(query: string) {
  const { family } = useAuth();
  
  return useQuery({
    queryKey: ['documents', family?.id, 'search', query],
    queryFn: () => documentsService.searchDocuments(family!.id, query),
    enabled: !!family?.id && query.length >= 2,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (data: {
      file: File;
      metadata: Omit<DocumentInsert, 'created_by' | 'file_url' | 'file_size' | 'file_type' | 'family_id'>;
    }) => documentsService.uploadDocument(
      data.file,
      { ...data.metadata, family_id: family!.id },
      user!.id
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentsSummary'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof documentsService.updateDocument>[1] }) =>
      documentsService.updateDocument(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['documentsSummary'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => documentsService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentsSummary'] });
    },
  });
}
