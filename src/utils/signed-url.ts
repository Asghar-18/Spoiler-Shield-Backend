import { supabase } from '../lib/supabase';

export async function getSignedCoverUrl(path: string): Promise<string | null> {
  if (!path) return null;

  const fileName = path.replace('covers/', '');

  const { data, error } = await supabase
    .storage
    .from('covers')
    .createSignedUrl(fileName, 60 * 60); // 1 hour validity

  return error ? null : data?.signedUrl ?? null;
}
