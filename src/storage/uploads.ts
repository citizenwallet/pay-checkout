import { SupabaseClient } from "@supabase/supabase-js";

export async function uploadImage(
  client: SupabaseClient,
  file: File,
  path: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await client.storage
      .from("uploads")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = client.storage.from("uploads").getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}
