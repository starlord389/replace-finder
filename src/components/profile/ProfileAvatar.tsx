import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { avatarInitials, resolveAvatarUrl } from "@/components/profile/avatarUrl";

/**
 * Resolves a stored avatar value (legacy absolute URL or private
 * `profile-avatars` object path) into a displayable URL. Returns null while
 * loading or when the current user is not allowed to read the object.
 */
export function useAvatarUrl(value: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUrl(null);
    if (!value) return;
    resolveAvatarUrl(value).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [value]);

  return url;
}

export function ProfileAvatar({
  photoUrl,
  name,
  className,
  fallbackClassName,
}: {
  photoUrl: string | null | undefined;
  name: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const resolved = useAvatarUrl(photoUrl);
  return (
    <Avatar className={cn("h-12 w-12", className)}>
      {resolved ? <AvatarImage src={resolved} alt={name || "Profile photo"} /> : null}
      <AvatarFallback className={cn("bg-primary/10 font-semibold text-primary", fallbackClassName)}>
        {avatarInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
