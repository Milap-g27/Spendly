import { supabase } from "../lib/supabaseClient";

export async function getProfile(user = null) {
  let userId = null;
  if (user && user.id) userId = user.id;
  else {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.data?.user) throw userErr || new Error("No user");
    userId = userRes.data.user.id;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(payload, user = null) {
  let userId = null;
  if (user && user.id) userId = user.id;
  else {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.data?.user) throw userErr || new Error("No user");
    userId = userRes.data.user.id;
  }

  // Ensure a profile row exists by using upsert (insert or update)
  const payloadWithUser = { user_id: userId, ...payload };
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payloadWithUser, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(file, user = null) {
  let userId = null;
  if (user && user.id) userId = user.id;
  else {
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.data?.user) throw userErr || new Error("No user");
    userId = userRes.data.user.id;
  }

  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = publicData.publicUrl || publicData?.public_url || publicData?.publicURL;

  // Persist to profile
  await updateProfile({ avatar_url: publicUrl }, { id: userId });

  return publicUrl;
}
