import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as notificationsService from '../services/notifications';
import type { NotificationInsert, Notification } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useNotifications() {
  const { family, user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', family?.id, user?.id],
    queryFn: () => notificationsService.getNotifications(family!.id, user!.id),
    enabled: !!family?.id && !!user?.id,
  });
}

export function useUnreadNotifications() {
  const { family, user } = useAuth();
  
  return useQuery({
    queryKey: ['unreadNotifications', family?.id, user?.id],
    queryFn: () => notificationsService.getUnreadNotifications(family!.id, user!.id),
    enabled: !!family?.id && !!user?.id,
  });
}

export function useUnreadCount() {
  const { family, user } = useAuth();
  
  return useQuery({
    queryKey: ['unreadCount', family?.id, user?.id],
    queryFn: () => notificationsService.getUnreadCount(family!.id, user!.id),
    enabled: !!family?.id && !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useNotificationsSummary() {
  const { family, user } = useAuth();
  
  return useQuery({
    queryKey: ['notificationsSummary', family?.id, user?.id],
    queryFn: () => notificationsService.getNotificationsSummary(family!.id, user!.id),
    enabled: !!family?.id && !!user?.id,
  });
}

type NotificationType = 'emi' | 'budget' | 'card' | 'insurance' | 'reminder' | 'system';

export function useNotificationsByType(type: NotificationType) {
  const { family, user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', family?.id, user?.id, 'type', type],
    queryFn: () => notificationsService.getNotificationsByType(family!.id, user!.id, type),
    enabled: !!family?.id && !!user?.id && !!type,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  const { user, family } = useAuth();
  
  return useMutation({
    mutationFn: (notification: Omit<NotificationInsert, 'created_by' | 'family_id'>) =>
      notificationsService.createNotification({ ...notification, family_id: family!.id }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { family, user } = useAuth();
  
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(family!.id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notificationsSummary'] });
    },
  });
}

// Real-time subscription hook
export function useNotificationsSubscription(
  onNewNotification?: (notification: Notification) => void
) {
  const { family, user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!family?.id || !user?.id) return;

    let channel: RealtimeChannel;

    const handleNewNotification = (notification: Notification) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      
      // Call callback if provided
      if (onNewNotification) {
        onNewNotification(notification);
      }
    };

    channel = notificationsService.subscribeToNotifications(
      family.id,
      user.id,
      handleNewNotification
    );

    return () => {
      if (channel) {
        notificationsService.unsubscribeFromNotifications(channel);
      }
    };
  }, [family?.id, user?.id, onNewNotification, queryClient]);
}
