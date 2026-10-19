// Variables publiques : Next les inscrit dans le code au moment du build,
// d'où l'accès direct à process.env.NEXT_PUBLIC_… (pas de lecture dynamique).

export function getSupabaseEnv(): { url: string; publishableKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}
