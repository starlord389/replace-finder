import { BriefcaseBusiness, Building2, MapPin } from "lucide-react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Badge } from "@/components/ui/badge";

export interface TrustProfileData {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  profile_photo_url?: string | null;
  profile_headline?: string | null;
  bio?: string | null;
  brokerage_name?: string | null;
  brokerage_address?: string | null;
  license_state?: string | null;
  license_number?: string | null;
  years_experience?: number | null;
  completed_1031_exchanges?: number | null;
  career_transaction_volume?: number | null;
  specializations?: string[] | null;
  service_areas?: string[] | null;
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function formatVolume(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function TrustProfileCard({
  profile,
  roleLabel,
  compact = false,
  showContact = false,
}: {
  profile: TrustProfileData | null | undefined;
  roleLabel: string;
  compact?: boolean;
  showContact?: boolean;
}) {
  const name = profile?.full_name || profile?.email || roleLabel;
  const stats = [
    profile?.years_experience != null ? `${profile.years_experience} years experience` : null,
    profile?.completed_1031_exchanges != null ? `${profile.completed_1031_exchanges} completed 1031 exchanges` : null,
    profile?.career_transaction_volume != null ? `${formatVolume(profile.career_transaction_volume)} transaction volume` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <ProfileAvatar
          photoUrl={profile?.profile_photo_url}
          name={name}
          className={compact ? "h-12 w-12" : "h-16 w-16"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{name}</h3>
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
          {profile?.profile_headline ? <p className="mt-1 text-sm font-medium text-foreground/80">{profile.profile_headline}</p> : null}
          {profile?.brokerage_name || profile?.company ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <BriefcaseBusiness className="h-3.5 w-3.5" />{profile.brokerage_name || profile.company}
            </p>
          ) : null}
          {profile?.license_state ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Licensed in {profile.license_state}{profile.license_number ? ` · #${profile.license_number}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {!compact && profile?.bio ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p> : null}

      {stats.length ? (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">{stats.map((stat) => <Badge key={stat} variant="outline">{stat}</Badge>)}</div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Professional statistics are self-reported.</p>
        </div>
      ) : null}

      {!compact && (profile?.specializations?.length || profile?.service_areas?.length) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {profile.specializations?.length ? (
            <div><p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><Building2 className="h-3.5 w-3.5" />Focus</p><p className="mt-1 text-sm text-muted-foreground">{profile.specializations.join(" · ")}</p></div>
          ) : null}
          {profile.service_areas?.length ? (
            <div><p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><MapPin className="h-3.5 w-3.5" />Markets</p><p className="mt-1 text-sm text-muted-foreground">{profile.service_areas.join(" · ")}</p></div>
          ) : null}
        </div>
      ) : null}

      {showContact && (profile?.email || profile?.phone) ? (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-sm">
          {profile.email ? <a href={`mailto:${profile.email}`} className="text-primary hover:underline">{profile.email}</a> : null}
          {profile.phone ? <a href={`tel:${profile.phone}`} className="text-primary hover:underline">{profile.phone}</a> : null}
        </div>
      ) : null}
    </section>
  );
}
