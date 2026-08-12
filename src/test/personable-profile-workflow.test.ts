import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260812120000_personable_trust_profiles.sql");
const agentSettings = read("src/pages/agent/AgentSettings.tsx");
const investorSettings = read("src/pages/investor/InvestorSettings.tsx");
const agentRequests = read("src/pages/agent/AgentRepresentation.tsx");
const requestProfile = read("src/features/representation/components/ClientRequestProfile.tsx");
const investorRepresentation = read("src/pages/investor/InvestorRepresentation.tsx");
const investorLaunchpad = read("src/pages/investor/InvestorLaunchpad.tsx");

describe("personable profiles and client requests", () => {
  it("adds optional trust fields and owner-scoped avatar storage", () => {
    expect(migration).toContain("profile_headline");
    expect(migration).toContain("service_areas");
    expect(migration).toContain("completed_1031_exchanges");
    expect(migration).toContain("career_transaction_volume");
    expect(migration).toContain("profile-avatars");
    expect(migration).toContain("auth.uid()::text = (storage.foldername(name))[1]");
    expect(migration).toContain("self-reported");
  });

  it("lets both account types build an optional, human profile", () => {
    expect(agentSettings).toContain("ProfileAvatarUploader");
    expect(agentSettings).toContain('name="specializations"');
    expect(agentSettings).toContain('name="serviceAreas"');
    expect(agentSettings).toContain('name="completedExchanges"');
    expect(agentSettings).toContain('name="transactionVolume"');
    expect(investorSettings).toContain("Make the first introduction feel personal");
    expect(investorSettings).toContain("ProfileAvatarUploader");
    expect(investorSettings).toContain("Investment focus");
    expect(investorSettings).toContain("Markets of interest");
    expect(investorSettings).toContain("Only your name is required");
    expect(investorLaunchpad).toContain("recommended details");
    expect(investorLaunchpad).toContain("profile_photo_url, profile_headline, bio, specializations, service_areas");
  });

  it("gives the requested agent a scoped owner and exchange introduction", () => {
    expect(agentRequests).toContain("ClientRequestProfile");
    expect(agentRequests).toContain("profile_photo_url, profile_headline, bio, specializations, service_areas");
    expect(agentRequests).toContain("...requests.map((request) => request.exchange_id)");
    expect(agentRequests).toContain("assignment.investor_id === selectedRequest.investor_id");
    expect(requestProfile).toContain("Exchange they want you to manage");
    expect(requestProfile).toContain("Other exchanges already shared with you");
    expect(requestProfile).toContain("exchanges the owner has already assigned to you");
    expect(agentRequests).toContain("Review request");
  });

  it("shows property owners the richer profile of their representing agent", () => {
    expect(investorRepresentation).toContain("TrustProfileCard");
    expect(investorRepresentation).toContain("career_transaction_volume");
    expect(investorRepresentation).toContain("completed_1031_exchanges");
    expect(investorRepresentation).toContain("profile_photo_url");
  });
});
