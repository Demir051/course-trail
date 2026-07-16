import { describe, expect, it } from "vitest";
import { formatDuration, parseDurationIso8601 } from "@/lib/youtube/duration";

describe("duration helpers", () => {
  it("parses ISO-8601 durations", () => {
    expect(parseDurationIso8601("PT1H2M3S")).toBe(3723);
    expect(parseDurationIso8601("PT15M")).toBe(900);
    expect(parseDurationIso8601("PT45S")).toBe(45);
  });

  it("formats seconds for display", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3723)).toBe("1:02:03");
  });
});
