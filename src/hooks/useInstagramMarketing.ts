import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  InstagramUser,
  InstagramCampaign,
  InstagramAssignment,
  InstagramCoinLog,
  InstagramNotification,
  InstagramAnalytics,
  InstagramUserFormData,
  CampaignFormData,
  CoinAssignmentData
} from '@/types/instagram';

export function useInstagramUsers() {
  const [users, setUsers] = useState<InstagramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instagram_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (userData: InstagramUserFormData) => {
    const { data, error } = await supabase
      .from('instagram_users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    await fetchUsers();
    return data;
  };

  const updateUser = async (id: string, userData: Partial<InstagramUserFormData>) => {
    const { data, error } = await supabase
      .from('instagram_users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await fetchUsers();
    return data;
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase
      .from('instagram_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchUsers();
  };

  return { users, loading, error, addUser, updateUser, deleteUser, refetch: fetchUsers };
}

export function useInstagramCampaigns() {
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instagram_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const uploadMedia = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `instagram-campaigns/${fileName}`;

      console.log('🔄 Upload attempt:', {
        bucket: 'product',
        path: filePath,
        fileSize: file.size,
        fileType: file.type
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);

        // Detailed error messages
        if (uploadError.message.includes('not found')) {
          throw new Error('Storage bucket "product" nahi mila. Dashboard se bucket create karo.');
        }
        if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
          throw new Error('Upload permission nahi hai. Bucket ko public banao ya policies add karo.');
        }
        if (uploadError.message.includes('size')) {
          throw new Error('File bahut badi hai. 50MB se chhoti file upload karo.');
        }

        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('product')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('💥 Media upload error:', error);
      throw error;
    }
  };

  const createCampaign = async (campaignData: CampaignFormData) => {
    let mediaUrl = campaignData.media_url;
    let mediaType = campaignData.media_type;

    if (campaignData.media_file) {
      mediaUrl = await uploadMedia(campaignData.media_file);
      // Auto-detect media type from file
      mediaType = campaignData.media_file.type.startsWith('video/') ? 'video' : 'image';
    }

    const { data: user } = await supabase.auth.getUser();

    const campaignPayload = {
      campaign_title: campaignData.campaign_title,
      name: campaignData.name || campaignData.campaign_title,
      description: campaignData.description,
      campaign_code: campaignData.campaign_code,
      source: campaignData.source || 'instagram',
      medium: campaignData.medium,
      media_url: mediaUrl,
      media_type: mediaType || 'image',
      expiry_hours: campaignData.expiry_hours,
      created_by: user.user?.id
    };

    console.log('📝 Creating campaign with payload:', campaignPayload);

    const { data: campaign, error } = await supabase
      .from('instagram_campaigns')
      .insert([campaignPayload])
      .select()
      .single();

    if (error) {
      console.error('❌ Campaign creation error:', error);
      throw new Error(`Campaign save failed: ${error.message}`);
    }

    console.log('✅ Campaign created:', campaign);

    // Create assignments
    if (campaignData.assigned_users.length > 0) {
      const assignments = campaignData.assigned_users.map(userId => ({
        campaign_id: campaign.id,
        user_id: userId,
        expiry_date: new Date(Date.now() + campaignData.expiry_hours * 60 * 60 * 1000).toISOString()
      }));

      const { error: assignError } = await supabase
        .from('instagram_assignments')
        .insert(assignments);

      if (assignError) throw assignError;
    }

    await fetchCampaigns();
    return campaign;
  };

  return { campaigns, loading, error, createCampaign, refetch: fetchCampaigns };
}

export function useInstagramAssignments(userId?: string) {
  const [assignments, setAssignments] = useState<InstagramAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('instagram_assignments')
        .select(`
          *,
          campaign:instagram_campaigns(*),
          user:instagram_users(*)
        `)
        .order('assigned_date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [userId]);

  return { assignments, loading, refetch: fetchAssignments };
}

export function useInstagramCoinLogs(userId?: string) {
  const [coinLogs, setCoinLogs] = useState<InstagramCoinLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoinLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('instagram_coin_logs')
        .select(`
          *,
          user:instagram_users(name, instagram_username)
        `)
        .order('assigned_date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCoinLogs(data || []);
    } catch (err) {
      console.error('Error fetching coin logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoinLogs();
  }, [userId]);

  const assignCoins = async (coinData: CoinAssignmentData) => {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc('assign_instagram_coins', {
      p_user_id: coinData.user_id,
      p_coins: coinData.coins,
      p_reason: coinData.reason,
      p_assigned_by: user.user?.id
    });

    if (error) throw error;
    await fetchCoinLogs();
    return data;
  };

  return { coinLogs, loading, assignCoins, refetch: fetchCoinLogs };
}

export function useInstagramAnalytics() {
  const [analytics, setAnalytics] = useState<InstagramAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('instagram_analytics')
          .select('*')
          .single();

        if (error) throw error;
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, loading };
}

export function useInstagramNotifications(recipientType: 'admin' | 'instagram_user') {
  const [notifications, setNotifications] = useState<InstagramNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instagram_notifications')
        .select('*')
        .eq('recipient_type', recipientType)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchNotifications();

    let subscription: any;
    try {
      // Subscribe to new notifications securely
      subscription = supabase
        .channel(`instagram_notifications_${recipientType}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'instagram_notifications',
            filter: `recipient_type=eq.${recipientType}`
          },
          () => {
            if (mounted) fetchNotifications();
          }
        )
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in instagram notifications:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscription for instagram notifications", e);
    }

    return () => {
      mounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [recipientType]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('instagram_notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
    await fetchNotifications();
  };

  return { notifications, loading, markAsRead, refetch: fetchNotifications };
}
