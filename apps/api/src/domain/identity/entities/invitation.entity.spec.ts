import { InvalidInvitationError } from "../../errors/invalid-invitation.error";
import { InvitationAlreadyUsedError } from "../../errors/invitation-already-used.error";
import { InvitationExpiredError } from "../../errors/invitation-expired.error";
import { InvitationRevokedError } from "../../errors/invitation-revoked.error";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { UserRole, InvitationStatus } from "../enums";
import { Email, Phone } from "../value-objects";
import { CreateInvitationInput, Invitation } from "./invitation.entity";

const NOW = new Date("2026-11-25T15:00:00.000Z");
const EXPIRES_AT = new Date("2026-12-02T15:00:00.000Z"); // 7 dias
const HASH = "a".repeat(64);
const USER_ID = new UniqueEntityId();

function make(overrides: Partial<CreateInvitationInput> = {}) {
  return Invitation.create(
    {
      role: UserRole.STUDENT,
      email: Email.create("maria@exemplo.com"),
      phone: Phone.create("81999998888"),
      tokenHash: HASH,
      invitedBy: new UniqueEntityId(),
      expiresAt: EXPIRES_AT,
      ...overrides,
    },
    NOW,
  );
}

describe("Invitation.create", () => {
  it("is born OPEN and unused", () => {
    const invitation = make();

    expect(invitation.statusAt(NOW)).toBe(InvitationStatus.OPEN);
    expect(invitation.usedAt).toBeNull();
    expect(invitation.revokedAt).toBeNull();
    expect(invitation.userId).toBeNull();
    expect(invitation.createdAt).toEqual(NOW);
  });

  it.each([UserRole.STUDENT, UserRole.TEACHER])("accepts role %s", (role) => {
    expect(() => make({ role })).not.toThrow();
  });

  it("rejects the COORDINATOR role", () => {
    expect(() => make({ role: UserRole.COORDINATOR })).toThrow(InvalidInvitationError);
  });

  it.each(["", "abc", "A".repeat(64), "a".repeat(63), "a".repeat(65)])(
    "rejects a token hash that is not 64 lowercase hex chars (%#)",
    (tokenHash) => {
      expect(() => make({ tokenHash })).toThrow(InvalidInvitationError);
    },
  );

  it("rejects an expiry that is not in the future", () => {
    expect(() => make({ expiresAt: NOW })).toThrow(InvalidInvitationError);
    expect(() => make({ expiresAt: new Date("2026-11-24T00:00:00Z") })).toThrow(InvalidInvitationError);
    expect(() => make({ expiresAt: new Date("abc") })).toThrow(InvalidInvitationError);
  });

  it("never exposes the token hash in JSON", () => {
    const json = JSON.stringify(make());

    expect(json).not.toContain(HASH);
    expect(json).toContain("maria@exemplo.com");
  });
});

describe("Invitation.statusAt", () => {
  it("is OPEN one millisecond before expiring", () => {
    const before = new Date(EXPIRES_AT.getTime() - 1);

    expect(make().statusAt(before)).toBe(InvitationStatus.OPEN);
  });

  it("is already EXPIRED at the exact expiry instant", () => {
    expect(make().statusAt(EXPIRES_AT)).toBe(InvitationStatus.EXPIRED);
  });

  it("stays USED after the expiry date", () => {
    const invitation = make();
    invitation.accept(USER_ID, NOW);

    expect(invitation.statusAt(new Date("2027-01-01"))).toBe(InvitationStatus.USED);
  });
});

// Tabela: cada estado × cada ação.
type Setup = () => { invitation: Invitation; at: Date };
const AFTER_EXPIRY = new Date("2026-12-03T00:00:00.000Z");

const states: Record<Exclude<InvitationStatus, InvitationStatus.OPEN>, { setup: Setup; error: new () => Error }> = {
  [InvitationStatus.USED]: {
    setup: () => {
      const invitation = make();
      invitation.accept(USER_ID, NOW);
      return { invitation, at: NOW };
    },
    error: InvitationAlreadyUsedError,
  },
  [InvitationStatus.REVOKED]: {
    setup: () => {
      const invitation = make();
      invitation.revoke(NOW);
      return { invitation, at: NOW };
    },
    error: InvitationRevokedError,
  },
  [InvitationStatus.EXPIRED]: {
    setup: () => ({ invitation: make(), at: AFTER_EXPIRY }),
    error: InvitationExpiredError,
  },
};

describe("Invitation.accept", () => {
  it("records the account and the instant when OPEN", () => {
    const invitation = make();
    const later = new Date("2026-11-26T10:00:00.000Z");

    invitation.accept(USER_ID, later);

    expect(invitation.statusAt(later)).toBe(InvitationStatus.USED);
    expect(invitation.usedAt).toEqual(later);
    expect(invitation.userId?.equals(USER_ID)).toBe(true);
  });

  it.each(Object.entries(states))("fails when %s", (_name, { setup, error }) => {
    const { invitation, at } = setup();

    expect(() => invitation.accept(USER_ID, at)).toThrow(error);
  });

  it("does not change anything when it fails", () => {
    const { invitation, at } = states[InvitationStatus.REVOKED].setup();

    expect(() => invitation.accept(USER_ID, at)).toThrow();
    expect(invitation.usedAt).toBeNull();
    expect(invitation.userId).toBeNull();
  });
});

describe("Invitation.revoke", () => {
  it("revokes an OPEN invitation", () => {
    const invitation = make();

    invitation.revoke(NOW);

    expect(invitation.statusAt(NOW)).toBe(InvitationStatus.REVOKED);
    expect(invitation.revokedAt).toEqual(NOW);
  });

  it.each(Object.entries(states))("fails when %s", (_name, { setup, error }) => {
    const { invitation, at } = setup();

    expect(() => invitation.revoke(at)).toThrow(error);
  });
});

describe("Invitation.restore", () => {
  it("rebuilds a used invitation without throwing", () => {
    const id = new UniqueEntityId();
    const invitation = Invitation.restore(
      {
        role: UserRole.TEACHER,
        email: Email.create("p@exemplo.com"),
        phone: Phone.create("81999998888"),
        tokenHash: HASH,
        invitedBy: new UniqueEntityId(),
        expiresAt: new Date("2020-01-01"),
        usedAt: new Date("2019-12-31"),
        revokedAt: null,
        userId: USER_ID,
        createdAt: new Date("2019-12-01"),
      },
      id,
    );

    expect(invitation.id.equals(id)).toBe(true);
    expect(invitation.statusAt(NOW)).toBe(InvitationStatus.USED);
  });
});
