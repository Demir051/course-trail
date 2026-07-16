import { describe, expect, it } from "vitest";
import { parsePlaylistInput } from "@/lib/youtube/parse-playlist";

describe("parsePlaylistInput", () => {
  it("parses playlist URLs", () => {
    const result = parsePlaylistInput(
      "https://www.youtube.com/playlist?list=PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9",
    );
    expect(result).toEqual({
      ok: true,
      playlistId: "PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9",
    });
  });

  it("parses watch URLs with list param", () => {
    const result = parsePlaylistInput(
      "https://www.youtube.com/watch?v=abc123&list=PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.playlistId).toBe("PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9");
    }
  });

  it("accepts bare playlist IDs", () => {
    const result = parsePlaylistInput("PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9");
    expect(result).toEqual({
      ok: true,
      playlistId: "PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9",
    });
  });

  it("rejects non-YouTube hosts", () => {
    const result = parsePlaylistInput("https://example.com/playlist?list=PL123");
    expect(result.ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(parsePlaylistInput("").ok).toBe(false);
  });
});
