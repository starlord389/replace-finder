import { Mail, Phone, MapPin, BadgeCheck, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  label: string;
  profile: {
    full_name?: string | null;
    profile_photo_url?: string | null;
    brokerage_name?: string | null;
    brokerage_address?: string | null;
    license_state?: string | null;
    license_number?: string | null;
    years_experience?: number | null;
    bio?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export function AgentProfileCard({ label, profile }: Props) {
  const initials = (profile?.full_name || "?").charAt(0).toUpperCase();
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <div className="mt-3 flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0">
          {profile?.profile_photo_url && (
            <AvatarImage src={profile.profile_photo_url} alt={profile.full_name ?? "Agent"} />
          )}
          <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{profile?.full_name || "—"}</p>
          {profile?.brokerage_name && (
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              {profile.brokerage_name}
            </p>
          )}
          {profile?.brokerage_address && (
            <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {profile.brokerage_address}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {profile?.years_experience != null && (
              <Badge variant="secondary" className="text-[10px]">
                {profile.years_experience} yrs experience
              </Badge>
            )}
            {(profile?.license_state || profile?.license_number) && (
              <Badge variant="outline" className="text-[10px]">
                <BadgeCheck className="mr-1 h-3 w-3" />
                {[profile.license_state, profile.license_number].filter(Boolean).join(" #")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {profile?.bio && (
        <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
      )}

      <div className="mt-3 space-y-1.5">
        {profile?.email && (
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            {profile.email}
          </a>
        )}
        {profile?.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            {profile.phone}
          </a>
        )}
      </div>
    </div>
  );
}
