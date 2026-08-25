import { describe, it, expect } from "vitest";
import { toOutcode } from "./monetisation";

describe("toOutcode", () => {
  it("extracts the outcode from a full postcode with a space", () => {
    expect(toOutcode("M20 2RN")).toBe("M20");
  });

  it("extracts the outcode from a full postcode with no space", () => {
    expect(toOutcode("M202RN")).toBe("M20");
  });

  it("is case-insensitive and normalises to uppercase", () => {
    expect(toOutcode("m20 2rn")).toBe("M20");
  });

  it("accepts an outcode on its own", () => {
    expect(toOutcode("M20")).toBe("M20");
  });

  it("handles a single-letter-prefix outcode (e.g. W1A)", () => {
    expect(toOutcode("W1A 1AA")).toBe("W1A");
  });

  it("handles a double-digit district (e.g. SW19)", () => {
    expect(toOutcode("SW19 8AA")).toBe("SW19");
  });

  it("returns null for garbage input rather than a wrong guess", () => {
    expect(toOutcode("not a postcode")).toBeNull();
    expect(toOutcode("12345")).toBeNull();
    expect(toOutcode("")).toBeNull();
  });
});
