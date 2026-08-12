import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

const createSignedUrl = vi.fn();
const onAuthStateChange = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { onAuthStateChange: (cb: unknown) => onAuthStateChange(cb) },
    storage: { from: () => ({ createSignedUrl }) },
  },
}));

const { ProfileAvatar } = await import("@/components/profile/ProfileAvatar");
const {
  AVATAR_SIGNED_URL_TTL_SECONDS,
  AVATAR_REFRESH_MARGIN_MS,
  clearAvatarUrlCache,
  resolveAvatarUrl,
  syncAvatarCacheWithAuthIdentity,
} = await import("@/components/profile/avatarUrl");

const TTL_MS = AVATAR_SIGNED_URL_TTL_SECONDS * 1000;
const REFRESH_MS = TTL_MS - AVATAR_REFRESH_MARGIN_MS;
const PATH = "user-a/avatar-1.jpg";

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("signed-URL lifecycle", () => {
  beforeEach(() => {
    createSignedUrl.mockReset();
    clearAvatarUrlCache();
    syncAvatarCacheWithAuthIdentity("user-a");
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("subscribes to auth changes so cached URLs never cross sessions", () => {
    expect(onAuthStateChange).toHaveBeenCalled();
  });

  it("re-signs a mounted avatar shortly before the signed URL expires", async () => {
    createSignedUrl
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed/first" }, error: null })
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed/second" }, error: null });

    render(<ProfileAvatar photoUrl={PATH} name="Sarah Chen" />);
    await flush();
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(createSignedUrl).toHaveBeenCalledWith(PATH, AVATAR_SIGNED_URL_TTL_SECONDS);

    // Nothing happens well before the refresh point...
    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS - 60_000);
    });
    await flush();
    expect(createSignedUrl).toHaveBeenCalledTimes(1);

    // ...and the URL is refreshed before the hour-long signature actually expires.
    await act(async () => {
      vi.advanceTimersByTime(60_000 + 1000);
    });
    await flush();
    expect(createSignedUrl).toHaveBeenCalledTimes(2);
    expect(Date.now()).toBeLessThan(TTL_MS);
  });

  it("clears the refresh timer on unmount and when the avatar path changes", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/any" }, error: null });

    const view = render(<ProfileAvatar photoUrl={PATH} name="Sarah Chen" />);
    await flush();
    view.rerender(<ProfileAvatar photoUrl="user-a/avatar-2.png" name="Sarah Chen" />);
    await flush();
    expect(clearSpy).toHaveBeenCalled();

    const callsBeforeUnmount = createSignedUrl.mock.calls.length;
    view.unmount();
    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS + 5000);
    });
    await flush();
    expect(createSignedUrl).toHaveBeenCalledTimes(callsBeforeUnmount);
    clearSpy.mockRestore();
  });

  it("drops cached signed URLs when the authenticated identity changes or signs out", async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/a" }, error: null });
    await resolveAvatarUrl(PATH);
    await resolveAvatarUrl(PATH);
    expect(createSignedUrl).toHaveBeenCalledTimes(1);

    expect(syncAvatarCacheWithAuthIdentity("user-a")).toBe(false);
    await resolveAvatarUrl(PATH);
    expect(createSignedUrl).toHaveBeenCalledTimes(1);

    expect(syncAvatarCacheWithAuthIdentity("user-b")).toBe(true);
    await resolveAvatarUrl(PATH);
    expect(createSignedUrl).toHaveBeenCalledTimes(2);

    expect(syncAvatarCacheWithAuthIdentity(null)).toBe(true);
    await resolveAvatarUrl(PATH);
    expect(createSignedUrl).toHaveBeenCalledTimes(3);
  });

  it("keeps legacy URLs unsigned and falls back to initials when signing fails", async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: { message: "not allowed" } });
    render(<ProfileAvatar photoUrl="other-user/avatar-1.jpg" name="James Wilson" />);
    await flush();
    expect(await screen.findByText("JW")).toBeInTheDocument();

    createSignedUrl.mockClear();
    expect(await resolveAvatarUrl("https://cdn.example.com/legacy.jpg")).toBe(
      "https://cdn.example.com/legacy.jpg",
    );
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
