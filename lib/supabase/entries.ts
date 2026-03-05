import * as FileSystem from 'expo-file-system';
import { supabase, supabaseUrl } from './client';
import { Entry, MoodTag } from '@/types';

const PHOTO_BUCKET = 'entry-photos';

export async function uploadEntryPhoto(photoUri: string, userId: string): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const path = `${userId}/${Date.now()}.jpg`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${PHOTO_BUCKET}/${path}`;

    const result = await FileSystem.uploadAsync(uploadUrl, photoUri, {
      httpMethod: 'POST',
      uploadType: 1, // FileSystemUploadType.BINARY_CONTENT
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'false',
      },
    });

    if (result.status !== 200 && result.status !== 201) {
      console.error('[Storage] Upload failed:', result.status, result.body);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(path);

    return publicUrl;
  } catch (err) {
    console.error('[Storage] Photo upload failed:', err);
    return null;
  }
}

export async function createEntry(data: {
  text: string;
  mood_tags: MoodTag[];
  photo_url?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: entry, error } = await supabase
    .from('entries')
    .insert({
      user_id: user.user.id,
      text: data.text,
      mood_tags: data.mood_tags,
      photo_url: data.photo_url ?? null,
      visibility: 'private',
    })
    .select()
    .single();

  return { entry, error };
}

export async function updateEntryImage(entryId: string, imageUrl: string) {
  const { data, error } = await supabase
    .from('entries')
    .update({ generated_image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .select()
    .single();

  return { entry: data, error };
}

export async function getEntries(limit = 30, offset = 0) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { entries: data, error };
}

export async function getEntryById(id: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single();

  return { entry: data, error };
}

export async function shareEntry(entryId: string, receiverId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  // Update entry as shared
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .update({
      is_shared: true,
      shared_at: new Date().toISOString(),
      visibility: 'shared',
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  if (entryError) return { error: entryError };

  // Create received_entry record
  const { error: receivedError } = await supabase
    .from('received_entries')
    .insert({
      entry_id: entryId,
      sender_id: user.user.id,
      receiver_id: receiverId,
      is_visible: true,
    });

  // Create notification for receiver
  if (!receivedError) {
    await supabase.from('notifications').insert({
      user_id: receiverId,
      type: 'received_entry',
      reference_id: entryId,
    });
  }

  return { entry, error: receivedError };
}

export async function withdrawEntry(entryId: string) {
  const { data, error } = await supabase
    .from('entries')
    .update({
      is_withdrawn: true,
      withdrawn_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single();

  // Hide in received_entries
  if (!error) {
    await supabase
      .from('received_entries')
      .update({ is_visible: false })
      .eq('entry_id', entryId);
  }

  return { entry: data, error };
}

export async function getReceivedEntries() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('received_entries')
    .select(`
      *,
      entry:entries(*),
      sender:users!received_entries_sender_id_fkey(id, display_name, avatar_url)
    `)
    .eq('receiver_id', user.user.id)
    .order('received_at', { ascending: false });

  return { receivedEntries: data, error };
}

export async function deleteEntry(entryId: string) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId);

  return { error };
}
