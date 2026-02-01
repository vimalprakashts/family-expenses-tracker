import { supabase } from '../lib/supabase';
import type { 
  Document,
  DocumentInsert 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';

// ==================== Documents ====================

export async function getDocuments(familyId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getDocumentsByCategory(
  familyId: string, 
  category: 'bank' | 'tax' | 'insurance' | 'property' | 'identity' | 'other'
): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('family_id', familyId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getLinkedDocuments(
  linkedType: string,
  linkedId: string
): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('linked_type', linkedType)
    .eq('linked_id', linkedId)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

// ==================== File Upload ====================

export async function uploadDocument(
  file: File,
  metadata: Omit<DocumentInsert, 'created_by' | 'file_url' | 'file_size' | 'file_type'>,
  userId: string
): Promise<Document> {
  const familyId = metadata.family_id;
  const timestamp = Date.now();
  const filename = `${familyId}/${timestamp}-${file.name}`;

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(uploadData.path);

  // Create document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...metadata,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: userId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function updateDocument(
  id: string,
  updates: Partial<Document>
): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function deleteDocument(id: string): Promise<void> {
  // Get document to get file path
  const { data: doc } = await supabase
    .from('documents')
    .select('file_url, family_id')
    .eq('id', id)
    .single();

  if (doc?.file_url) {
    // Extract path from URL
    const url = new URL(doc.file_url);
    const path = url.pathname.split('/').slice(-2).join('/');
    
    // Delete from storage
    await supabase.storage
      .from('documents')
      .remove([path]);
  }

  // Delete record
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

// ==================== Search ====================

export async function searchDocuments(
  familyId: string,
  query: string
): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('family_id', familyId)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getDocumentsByTags(
  familyId: string,
  tags: string[]
): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('family_id', familyId)
    .overlaps('tags', tags)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== Document Summary ====================

export async function getDocumentsSummary(familyId: string) {
  const documents = await getDocuments(familyId);
  
  const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);
  
  // Group by category
  const byCategory: Record<string, { count: number; size: number }> = {};
  for (const doc of documents) {
    const cat = doc.category || 'other';
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, size: 0 };
    }
    byCategory[cat].count += 1;
    byCategory[cat].size += doc.file_size || 0;
  }

  // Recent documents
  const recentDocuments = documents.slice(0, 10);

  return {
    documents,
    totalCount: documents.length,
    totalSize,
    byCategory,
    recentDocuments,
  };
}

// ==================== Helpers ====================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'file-text';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'table';
  if (fileType.includes('document') || fileType.includes('word')) return 'file-text';
  return 'file';
}
