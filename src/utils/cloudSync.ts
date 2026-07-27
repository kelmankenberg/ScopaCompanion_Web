import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { GameState } from '../types/scopa';

interface CloudLoadResult {
  uid: string;
  state: GameState | null;
}

interface CloudRow {
  user_id: string;
  state: GameState;
  updated_at: string;
}

let cachedClient: SupabaseClient | null | undefined;

const getSupabaseConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

export const isCloudSyncConfigured = (): boolean => {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey);
};

const getClient = (): SupabaseClient | null => {
  if (cachedClient !== undefined) return cachedClient;

  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(cfg.url, cfg.anonKey);
  return cachedClient;
};

const ensureAnonymousUser = async (client: SupabaseClient): Promise<string> => {
  const currentUser = (await client.auth.getUser()).data.user;
  if (currentUser?.id) return currentUser.id;

  const signInResult = await client.auth.signInAnonymously();
  if (signInResult.error || !signInResult.data.user?.id) {
    throw signInResult.error || new Error('Unable to sign in anonymously');
  }

  return signInResult.data.user.id;
};

export const loadCloudGameState = async (): Promise<CloudLoadResult | null> => {
  const client = getClient();
  if (!client) return null;

  const uid = await ensureAnonymousUser(client);

  const { data, error } = await client
    .from('scopa_states')
    .select('state')
    .eq('user_id', uid)
    .maybeSingle<Pick<CloudRow, 'state'>>();

  if (error) {
    throw error;
  }

  return {
    uid,
    state: data?.state ?? null,
  };
};

export const saveCloudGameState = async (
  state: GameState,
  existingUid?: string | null
): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  const uid = existingUid || (await ensureAnonymousUser(client));

  const { error } = await client
    .from('scopa_states')
    .upsert(
      {
        user_id: uid,
        state,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    throw error;
  }

  return uid;
};
