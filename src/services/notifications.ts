import { supabase } from '../lib/supabase';
import type { 
  Notification,
  NotificationInsert 
} from '../lib/supabase';
import { handleSupabaseError } from '../lib/api';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ==================== Notifications ====================

export async function getNotifications(
  familyId: string,
  userId: string
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('family_id', familyId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getUnreadNotifications(
  familyId: string,
  userId: string
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('family_id', familyId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getUnreadCount(
  familyId: string,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_read', false);

  if (error) handleSupabaseError(error);
  return count ?? 0;
}

export async function getNotification(id: string): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error);
  }
  return data;
}

// ==================== Create Notifications ====================

export async function createNotification(
  notification: Omit<NotificationInsert, 'created_by'>,
  userId: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ 
      ...notification, 
      created_by: userId 
    })
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function createBulkNotifications(
  notifications: Omit<NotificationInsert, 'created_by'>[],
  userId: string
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications.map(n => ({ ...n, created_by: userId })))
    .select();

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== Mark as Read ====================

export async function markAsRead(id: string): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  return data!;
}

export async function markAllAsRead(
  familyId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('family_id', familyId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_read', false);

  if (error) handleSupabaseError(error);
}

// ==================== Delete Notifications ====================

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function clearOldNotifications(
  familyId: string,
  daysOld: number = 30
): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('family_id', familyId)
    .eq('is_read', true)
    .lt('created_at', cutoffDate.toISOString());

  if (error) handleSupabaseError(error);
}

// ==================== Real-time Subscriptions ====================

export function subscribeToNotifications(
  familyId: string,
  userId: string,
  callback: (notification: Notification) => void
): RealtimeChannel {
  return supabase
    .channel(`notifications:${familyId}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `family_id=eq.${familyId}`,
      },
      (payload) => {
        const notification = payload.new as Notification;
        // Check if notification is for this user or all users
        if (!notification.user_id || notification.user_id === userId) {
          callback(notification);
        }
      }
    )
    .subscribe();
}

export function unsubscribeFromNotifications(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

// ==================== Notification Types ====================

export async function getNotificationsByType(
  familyId: string,
  userId: string,
  type: 'emi' | 'budget' | 'card' | 'insurance' | 'reminder' | 'system'
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('family_id', familyId)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

// ==================== Notification Summary ====================

export async function getNotificationsSummary(
  familyId: string,
  userId: string
) {
  const notifications = await getNotifications(familyId, userId);
  
  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);
  
  // Group by type
  const byType: Record<string, { total: number; unread: number }> = {};
  for (const notification of notifications) {
    if (!byType[notification.type]) {
      byType[notification.type] = { total: 0, unread: 0 };
    }
    byType[notification.type].total += 1;
    if (!notification.is_read) {
      byType[notification.type].unread += 1;
    }
  }

  // Group by priority
  const byPriority: Record<string, number> = {};
  for (const notification of unread) {
    const priority = notification.priority || 'medium';
    byPriority[priority] = (byPriority[priority] || 0) + 1;
  }

  return {
    notifications,
    unread,
    read,
    unreadCount: unread.length,
    totalCount: notifications.length,
    byType,
    byPriority,
  };
}

// ==================== Helpers ====================

export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'emi': return 'credit-card';
    case 'budget': return 'pie-chart';
    case 'card': return 'credit-card';
    case 'insurance': return 'shield';
    case 'reminder': return 'bell';
    case 'system': return 'settings';
    default: return 'bell';
  }
}

export function getNotificationColor(priority: string): string {
  switch (priority) {
    case 'high': return 'text-danger-600 bg-danger-50';
    case 'medium': return 'text-warning-600 bg-warning-50';
    case 'low': return 'text-gray-600 bg-gray-50';
    default: return 'text-primary-600 bg-primary-50';
  }
}
