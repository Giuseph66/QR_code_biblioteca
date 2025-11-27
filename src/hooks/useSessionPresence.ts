import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSessionPresence = (sessionId: string | undefined) => {
  const [connectedUsers, setConnectedUsers] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`presence-${sessionId}`, {
      config: {
        presence: {
          key: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setConnectedUsers(count);
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setConnectedUsers(count);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setConnectedUsers(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { connectedUsers };
};
