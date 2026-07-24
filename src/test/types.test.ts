import { describe, expect, it } from "vitest";

import { DEPTH_MAP } from "@/types";

describe("DEPTH_MAP", () => {
  it("has the correct depth for easy difficulty", () => {
    expect(DEPTH_MAP.easy).toBe(1);
  });

  it("has the correct depth for medium difficulty", () => {
    expect(DEPTH_MAP.medium).toBe(3);
  });

  it("has the correct depth for hard difficulty", () => {
    expect(DEPTH_MAP.hard).toBe(5);
  });

  it("contains exactly three difficulty levels", () => {
    expect(Object.keys(DEPTH_MAP)).toHaveLength(3);
  });

  it("values are ordered easy < medium < hard", () => {
    expect(DEPTH_MAP.easy).toBeLessThan(DEPTH_MAP.medium);
    expect(DEPTH_MAP.medium).toBeLessThan(DEPTH_MAP.hard);
  });
});
