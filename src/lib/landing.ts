import { supabase } from "@/integrations/supabase/client";

export async function signedAssetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage
    .from("public-assets")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function signedAssetUrls(paths: string[]) {
  const results = await Promise.all(paths.map((p) => signedAssetUrl(p)));
  return results.filter((u): u is string => !!u);
}

export const FONT_STACKS: Record<string, { display: string; body: string }> = {
  geometric: { display: "'Space Grotesk', sans-serif", body: "'DM Sans', sans-serif" },
  serif: { display: "'Fraunces', serif", body: "'DM Sans', sans-serif" },
  grotesk: { display: "'DM Sans', sans-serif", body: "'DM Sans', sans-serif" },
};

export function fontStack(name: string | null | undefined) {
  return FONT_STACKS[name ?? "geometric"] ?? FONT_STACKS['geometric']!;
}
