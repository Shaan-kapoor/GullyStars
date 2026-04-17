import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionFromUrl: false,
  },
});

export async function uploadImageToStorage(uri: string, bucket = "feed-images"): Promise<string | null> {
  try {
    const filename = `post-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.jpg`;

    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from(bucket).upload(filename, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (error) { console.error("Upload error:", error); return null; }
    } else {
      const formData = new FormData();
      formData.append("file", { uri, name: filename, type: "image/jpeg" } as any);
      const { error } = await supabase.storage.from(bucket).upload(filename, formData, {
        contentType: "multipart/form-data",
        upsert: false,
      });
      if (error) { console.error("Upload error:", error); return null; }
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl ?? null;
  } catch (err) {
    console.error("uploadImageToStorage failed:", err);
    return null;
  }
}
