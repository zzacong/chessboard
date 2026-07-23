import { describe, expect, it } from "vitest";

import { cn } from "../lib/cn";

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", false, undefined, null, "", "bar")).toBe("foo bar");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });

  it("merges conflicting Tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("deduplicates identical classes via tailwind-merge", () => {
    // tailwind-merge keeps the last occurrence; class order follows the second string
    expect(cn("px-2 py-1", "px-2")).toBe("py-1 px-2");
  });

  it("returns empty string when no valid classes are given", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});
