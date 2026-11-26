import { isGuardianRequired } from "./guardian-requirement.policy";

describe("isGuardianRequired", () => {
  it("is not required by default, even for minors (D24 open)", () => {
    expect(isGuardianRequired(true)).toBe(false);
    expect(isGuardianRequired(false)).toBe(false);
  });

  it("requires only minors when the rule is on", () => {
    expect(isGuardianRequired(true, true)).toBe(true);
    expect(isGuardianRequired(false, true)).toBe(false);
  });
});
