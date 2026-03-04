import { supabase } from './client';
import { UserSettings } from '@/types';

export async function getMyProfile() {
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.user.id)
    .single();

  return { user: data, error };
}

export async function updateProfile(updates: {
  display_name?: string;
  avatar_url?: string;
}) {
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', authUser.user.id)
    .select()
    .single();

  return { user: data, error };
}

export async function deleteAccount() {
  const { error } = await supabase.auth.admin.deleteUser(
    (await supabase.auth.getUser()).data.user?.id ?? ''
  );
  return { error };
}

export async function ensureUserRecord() {
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser.user) return;

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.user.id)
    .single();

  if (!existing) {
    await supabase.from('users').insert({
      id: authUser.user.id,
      email: authUser.user.email ?? '',
      display_name: authUser.user.user_metadata?.display_name ?? null,
      premium_status: 'free',
    });
  }
}
