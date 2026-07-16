import { describe, expect, it } from "vitest";
import { parseYoutubeInput } from "@/lib/youtube/parse-input";

describe("parseYoutubeInput", () => {
  it("parses playlist URLs", () => {
    const result = parseYoutubeInput(
      "https://www.youtube.com/playlist?list=PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9",
    );
    expect(result).toEqual({
      ok: true,
      kind: "playlist",
      playlistId: "PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9",
    });
  });

  it("prefers playlist when watch URL has list=", () => {
    const result = parseYoutubeInput(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe("playlist");
      if (result.kind === "playlist") {
        expect(result.playlistId).toBe("PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9");
      }
    }
  });

  it("parses single watch URLs", () => {
    const result = parseYoutubeInput(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(result).toEqual({
      ok: true,
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("parses youtu.be URLs", () => {
    const result = parseYoutubeInput("https://youtu.be/dQw4w9WgXcQ");
    expect(result).toEqual({
      ok: true,
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("parses shorts URLs", () => {
    const result = parseYoutubeInput(
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    );
    expect(result).toEqual({
      ok: true,
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("accepts bare video IDs", () => {
    const result = parseYoutubeInput("dQw4w9WgXcQ");
    expect(result).toEqual({
      ok: true,
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("rejects non-YouTube hosts", () => {
    const result = parseYoutubeInput("https://example.com/watch?v=dQw4w9WgXcQ");
    expect(result.ok).toBe(false);
  });
});
