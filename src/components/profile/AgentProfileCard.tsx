import { TrustProfileCard, type TrustProfileData } from "@/components/profile/TrustProfileCard";

interface Props {
  label: string;
  profile: TrustProfileData | null;
}

export function AgentProfileCard({ label, profile }: Props) {
  return <TrustProfileCard profile={profile} roleLabel={label} showContact />;
}
