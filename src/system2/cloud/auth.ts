import { getSupabaseClient, getSupabaseInitError } from './supabaseClient';
import type { CloudAuthMode, CloudUser, AuthStateListener, CloudState } from './cloudTypes';

const authStateListeners = new Set<AuthStateListener>();
let currentAuthState: CloudAuthMode = 'GUEST';
let currentUser: CloudUser | null = null;
let authInitialized = false;

function notifyAuthListeners(): void {
  for (const listener of authStateListeners) {
    try {
      listener(currentAuthState, currentUser);
    } catch {
      // Listener errors should not break auth
    }
  }
}

function mapSupabaseUser(user: any): CloudUser | null {
  if (!user?.id) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    created_at: user.created_at ?? new Date().toISOString(),
  };
}

export function onAuthStateChange(listener: AuthStateListener): () => void {
  authStateListeners.add(listener);
  listener(currentAuthState, currentUser);
  return () => { authStateListeners.delete(listener); };
}

export function getCurrentAuthState(): CloudAuthMode {
  return currentAuthState;
}

export function getCurrentUser(): CloudUser | null {
  return currentUser;
}

export async function initializeAuth(): Promise<void> {
  if (authInitialized) return;
  authInitialized = true;

  const client = getSupabaseClient();
  const initError = getSupabaseInitError();

  if (!client || initError) {
    currentAuthState = 'GUEST';
    currentUser = null;
    return;
  }

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      currentUser = mapSupabaseUser(session.user);
      currentAuthState = 'AUTHENTICATED';
    } else {
      currentAuthState = 'GUEST';
      currentUser = null;
    }
  } catch {
    currentAuthState = 'GUEST';
    currentUser = null;
  }

  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      currentUser = mapSupabaseUser(session.user);
      currentAuthState = 'AUTHENTICATED';
    } else {
      currentUser = null;
      currentAuthState = 'GUEST';
    }
    notifyAuthListeners();
  });
}

export async function signUp(email: string, password: string): Promise<{ user: CloudUser | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase not configured' };

  try {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return { user: null, error: error.message };
    if (data.user) {
      const user = mapSupabaseUser(data.user);
      currentUser = user;
      currentAuthState = 'AUTHENTICATED';
      notifyAuthListeners();
      return { user, error: null };
    }
    return { user: null, error: 'Signup succeeded but no user returned' };
  } catch (cause) {
    return { user: null, error: cause instanceof Error ? cause.message : 'Signup failed' };
  }
}

export async function signIn(email: string, password: string): Promise<{ user: CloudUser | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase not configured' };

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    if (data.user) {
      const user = mapSupabaseUser(data.user);
      currentUser = user;
      currentAuthState = 'AUTHENTICATED';
      notifyAuthListeners();
      return { user, error: null };
    }
    return { user: null, error: 'Sign in succeeded but no user returned' };
  } catch (cause) {
    return { user: null, error: cause instanceof Error ? cause.message : 'Sign in failed' };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase not configured' };

  try {
    const { error } = await client.auth.signOut();
    currentUser = null;
    currentAuthState = 'GUEST';
    notifyAuthListeners();
    return { error: error?.message ?? null };
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : 'Sign out failed' };
  }
}

export async function getSession(): Promise<{ user: CloudUser | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase not configured' };

  try {
    const { data, error } = await client.auth.getSession();
    if (error) return { user: null, error: error.message };
    if (data.session?.user) {
      const user = mapSupabaseUser(data.session.user);
      currentUser = user;
      currentAuthState = 'AUTHENTICATED';
      notifyAuthListeners();
      return { user, error: null };
    }
    return { user: null, error: null };
  } catch (cause) {
    return { user: null, error: cause instanceof Error ? cause.message : 'Get session failed' };
  }
}