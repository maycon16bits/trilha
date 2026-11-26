import { InvalidGuardianError } from "../../errors/invalid-guardian.error";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { CreateGuardianInput, Guardian } from "./guardian.entity";

const NOW = new Date("2026-11-25T12:00:00.000Z");

function input(overrides: Partial<CreateGuardianInput> = {}): CreateGuardianInput {
  return {
    name: "Ana Souza",
    relationship: "Mãe",
    contact: "81999998888",
    policyVersion: "2026-01",
    ...overrides,
  };
}

describe("Guardian.create", () => {
  it("records the consent at the given 'now'", () => {
    const guardian = Guardian.create(input(), NOW);

    expect(guardian.consentedAt).toEqual(NOW);
    expect(guardian.policyVersion).toBe("2026-01");
  });

  it("generates a new id each time", () => {
    const a = Guardian.create(input(), NOW);
    const b = Guardian.create(input(), NOW);

    expect(a.id.equals(b.id)).toBe(false);
  });

  it("trims whitespace", () => {
    const guardian = Guardian.create(input({ name: "  Ana Souza  " }), NOW);

    expect(guardian.name).toBe("Ana Souza");
  });

  it.each([
    ["name", { name: "" }],
    ["name", { name: "a".repeat(151) }],
    ["relationship", { relationship: "   " }],
    ["relationship", { relationship: "a".repeat(51) }],
    ["contact", { contact: "" }],
    ["contact", { contact: "a".repeat(255) }],
    ["policyVersion", { policyVersion: "" }],
    ["policyVersion", { policyVersion: "a".repeat(21) }],
  ])("rejects an invalid %s", (_field, overrides) => {
    expect(() => Guardian.create(input(overrides), NOW)).toThrow(InvalidGuardianError);
  });

  it("accepts the maximum lengths", () => {
    expect(() =>
      Guardian.create(
        input({
          name: "a".repeat(150),
          relationship: "a".repeat(50),
          contact: "a".repeat(254),
          policyVersion: "a".repeat(20),
        }),
        NOW,
      ),
    ).not.toThrow();
  });

  it("returns a copy of the consent date", () => {
    const guardian = Guardian.create(input(), NOW);

    guardian.consentedAt.setFullYear(1990);

    expect(guardian.consentedAt).toEqual(NOW);
  });
});

describe("Guardian.restore", () => {
  it("rebuilds without reapplying creation rules", () => {
    const id = new UniqueEntityId();
    const guardian = Guardian.restore(
      {
        name: "x",
        relationship: "y",
        contact: "z",
        consentedAt: NOW,
        policyVersion: "old",
      },
      id,
    );

    expect(guardian.id.equals(id)).toBe(true);
    expect(guardian.policyVersion).toBe("old");
  });
});
