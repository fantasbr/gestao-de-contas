// Supabase exports

// Client-side browser client (sem SSR)
export { getSupabaseBrowserClient, createClient as createBrowserClient } from './browser-client';

// Server-side client
export { createClient as createServerSupabaseClient } from './server';

// Middleware
export { updateSession } from './middleware';

// Queries (Server Components)
export * from './queries';
export * from './query';
