import { supabase } from './client';
import * as Crypto from 'expo-crypto';

export async function createInvite() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Generate a unique invite token
  const token = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${user.user.id}-${Date.now()}`
  );
  const shortToken = token.substring(0, 16);

  // Store invite in a temporary table or use the pairs table with pending status
  // For MVP, we use the deep link with user ID encoded
  const inviteUrl = `diaryart://pair?inviter=${user.user.id}&token=${shortToken}`;
  return { inviteUrl, token: shortToken };
}

export async function joinPair(inviterId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  if (inviterId === user.user.id) {
    return { error: new Error('自分自身とペアリングはできません') };
  }

  // Check if already paired
  const { data: existingPair } = await supabase
    .from('pairs')
    .select('*')
    .or(
      `and(user_id_1.eq.${user.user.id},user_id_2.eq.${inviterId}),and(user_id_1.eq.${inviterId},user_id_2.eq.${user.user.id})`
    )
    .eq('status', 'active')
    .single();

  if (existingPair) {
    return { error: new Error('すでにペアリングされています') };
  }

  const { data, error } = await supabase
    .from('pairs')
    .insert({
      user_id_1: inviterId,
      user_id_2: user.user.id,
      status: 'active',
      paired_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { pair: data, error };
}

export async function getMyPair() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('pairs')
    .select(`
      *,
      user1:users!pairs_user_id_1_fkey(id, display_name, avatar_url, premium_status),
      user2:users!pairs_user_id_2_fkey(id, display_name, avatar_url, premium_status)
    `)
    .or(`user_id_1.eq.${user.user.id},user_id_2.eq.${user.user.id}`)
    .eq('status', 'active')
    .single();

  return { pair: data, error };
}

export async function dissolvePair(pairId: string, sendNotification: boolean) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('pairs')
    .update({
      status: 'dissolved',
      dissolved_at: new Date().toISOString(),
    })
    .eq('id', pairId)
    .select()
    .single();

  if (!error && sendNotification && data) {
    const partnerId =
      data.user_id_1 === user.user.id ? data.user_id_2 : data.user_id_1;
    await supabase.from('notifications').insert({
      user_id: partnerId,
      type: 'pair_dissolved',
      reference_id: pairId,
    });
  }

  return { pair: data, error };
}

export async function blockPair(pairId: string, blockedUserId: string) {
  const { data, error } = await supabase
    .from('pairs')
    .update({
      status: 'blocked',
      blocked_by: blockedUserId,
      dissolved_at: new Date().toISOString(),
    })
    .eq('id', pairId)
    .select()
    .single();

  return { pair: data, error };
}
