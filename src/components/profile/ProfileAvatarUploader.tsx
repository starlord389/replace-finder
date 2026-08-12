import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { invalidateAvatarUrl } from "@/components/profile/avatarUrl";
import { Button } from "@/components/ui/button";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};


export function ProfileAvatarUploader({
  userId,
  name,
  photoUrl,
  onPhotoChange,
}: {
  userId: string;
  name: string;
  photoUrl: string | null;
  onPhotoChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) return toast.error("Please choose a JPG, PNG, or WebP image.");
    if (file.size > MAX_AVATAR_BYTES) return toast.error("Choose an image under 5MB.");

    setUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (uploadError) {
      setUploading(false);
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from("profile-avatars").getPublicUrl(path);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ profile_photo_url: data.publicUrl })
      .eq("id", userId);
    if (profileError) {
      await supabase.storage.from("profile-avatars").remove([path]);
      setUploading(false);
      toast.error(profileError.message);
      return;
    }

    const { data: existing } = await supabase.storage.from("profile-avatars").list(userId);
    const stale = (existing ?? [])
      .map((item) => `${userId}/${item.name}`)
      .filter((item) => item !== path);
    if (stale.length) await supabase.storage.from("profile-avatars").remove(stale);

    onPhotoChange(data.publicUrl);
    setUploading(false);
    toast.success("Profile photo updated");
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar className="h-24 w-24 border shadow-sm">
        {photoUrl ? <AvatarImage src={photoUrl} alt={name || "Profile photo"} /> : null}
        <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <label className="inline-flex cursor-pointer">
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleUpload} disabled={uploading} />
          <Button asChild variant="outline" size="sm" disabled={uploading}>
            <span>
              <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? "Uploading..." : photoUrl ? "Change photo" : "Add profile photo"}
            </span>
          </Button>
        </label>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          A clear, recent headshot helps clients and agents recognize a real person. JPG, PNG, or WebP, up to 5MB.
        </p>
      </div>
    </div>
  );
}
