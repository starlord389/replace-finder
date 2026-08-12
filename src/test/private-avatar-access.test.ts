import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const createSignedUrl = vi.fn();
const getPublicUrl = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({ createSignedUrl, getPublicUrl }),
    },
  },
}));

const { resolveAvatarUrl, invalidateAvatarUrl, isLegacyAvatarUrl, avatarInitials } = await import(
  "@/components/profile/avatarUrl"
);

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("private profile avatars", () => {
  beforeEach(() => {
    createSignedUrl.mockReset();
    getPublicUrl.mockReset();
  });

  it("signs private object paths for one hour and displays the owner's avatar", async () => {
    const path = "11111111-1111-1111-1111-111111111111/avatar-1.jpg";
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/one" }, error: null });
    expect(await resolveAvatarUrl(path)).toBe("https://signed/one");
    expect(createSignedUrl).toHaveBeenCalledWith(path, 3600);
    expect(getPublicUrl).not.toHaveBeenCalled();
  });

  it("shows a replaced avatar immediately after upload", async () => {
    const first = "user-a/avatar-1.jpg";
    const second = "user-a/avatar-2.png";
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://signed/first" }, error: null });
    expect(await resolveAvatarUrl(first)).toBe("https://signed/first");
    invalidateAvatarUrl(first);
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://signed/second" }, error: null });
    expect(await resolveAvatarUrl(second)).toBe("https://signed/second");
  });

  it("refreshes rather than reusing an unsigned value, and caches within the TTL", async () => {
    const path = "user-b/avatar-9.webp";
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/cached" }, error: null });
    await resolveAvatarUrl(path);
    await resolveAvatarUrl(path);
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    invalidateAvatarUrl(path);
    await resolveAvatarUrl(path);
    expect(createSignedUrl).toHaveBeenCalledTimes(2);
  });

  it("keeps displaying legacy http(s) avatar URLs without signing", async () => {
    const legacy = "https://cdn.example.com/agent-avatars/user/a.jpg";
    expect(isLegacyAvatarUrl(legacy)).toBe(true);
    expect(await resolveAvatarUrl(legacy)).toBe(legacy);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("falls back to initials when signing fails or no avatar exists", async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: { message: "Object not found" } });
    expect(await resolveAvatarUrl("someone-else/avatar-1.jpg")).toBeNull();
    expect(await resolveAvatarUrl(null)).toBeNull();
    expect(await resolveAvatarUrl("")).toBeNull();
    expect(avatarInitials("Sarah Chen")).toBe("SC");
    expect(avatarInitials("")).toBe("?");
  });

  it("never uses getPublicUrl for the profile-avatars bucket in the app", () => {
    const files = [
      "src/components/profile/ProfileAvatarUploader.tsx",
      "src/components/profile/avatarUrl.ts",
      "src/components/profile/ProfileAvatar.tsx",
      "src/components/profile/TrustProfileCard.tsx",
      "src/pages/investor/InvestorRepresentation.tsx",
    ];
    for (const file of files) expect(read(file)).not.toContain("getPublicUrl");
  });

  it("stores the object path, not a URL, and prunes superseded files", () => {
    const uploader = read("src/components/profile/ProfileAvatarUploader.tsx");
    expect(uploader).toContain("profile_photo_url: path");
    expect(uploader).toContain("avatar-${Date.now()}");
    expect(uploader).toContain('.remove(stale)');
    expect(uploader).toContain("MAX_AVATAR_BYTES");
    expect(uploader).toContain("ACCEPTED_AVATAR_TYPES");
  });

  it("uses the shared resolver everywhere profile photos are displayed", () => {
    expect(read("src/components/profile/TrustProfileCard.tsx")).toContain("<ProfileAvatar");
    expect(read("src/pages/investor/InvestorRepresentation.tsx")).toContain("<ProfileAvatar");
    expect(read("src/components/profile/ProfileAvatarUploader.tsx")).toContain("<ProfileAvatar");
    // Agent Settings, Investor Settings, Agent Client Requests, Represented
    // Clients and agent-to-agent cards all render through these two components.
    expect(read("src/pages/agent/AgentSettings.tsx")).toContain("ProfileAvatarUploader");
    expect(read("src/pages/investor/InvestorSettings.tsx")).toContain("ProfileAvatarUploader");
    expect(read("src/features/representation/components/ClientRequestProfile.tsx")).toContain("TrustProfileCard");
    expect(read("src/components/profile/AgentProfileCard.tsx")).toContain("TrustProfileCard");
  });

  it("ships a private-avatar storage policy migration", () => {
    const migration = read("supabase/migrations/20260812173616_668afb02-6780-446a-b63a-97fc6104e0c2.sql");
    expect(migration).toContain('DROP POLICY IF EXISTS "Profile avatars are publicly readable"');
    expect(migration).toContain("FOR SELECT TO authenticated");
    expect(migration).toContain("auth.uid()::text = (storage.foldername(name))[1]");
    expect(migration).toContain("FROM public.profiles p");
    expect(migration).toMatch(/jpg\|jpeg\|png\|webp/);
    expect(migration).not.toMatch(/TO\s+anon/);
  });
});
