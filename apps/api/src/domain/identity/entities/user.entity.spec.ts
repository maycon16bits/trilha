import { InvalidStatusTransitionError } from "../../errors/invalid-status-transition.error";
import { InvalidUserError } from "../../errors/invalid-user.error";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { UserRole } from "../enums/user-role.enum";
import { UserStatus } from "../enums/user-status.enum";
import { Email } from "../value-objects";
import { User, UserProps } from "./user.entity";

const NOW = new Date("2026-11-23T12:00:00.000Z");
const LATER = new Date("2026-11-24T12:00:00.000Z");
const HASH = "$2b$10$hash-opaco-gerado-pelo-hasher";

function makeUser(overrides: { name?: string; passwordHash?: string } = {}) {
  return User.create(
    {
      name: overrides.name ?? "Maria Souza",
      email: Email.create("maria@exemplo.com"),
      passwordHash: overrides.passwordHash ?? HASH,
      role: UserRole.STUDENT,
    },
    NOW,
  );
}

describe("User.create", () => {
  it("should be active by default, with dates matching the provided current time", () => {
    const user = makeUser();

    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.createdAt).toEqual(NOW);
    expect(user.updatedAt).toEqual(NOW);
  });

  it("should generate a new id for each user", () => {
    const a = makeUser();
    const b = makeUser();

    expect(a.id).toBeInstanceOf(UniqueEntityId);
    expect(a.id.equals(b.id)).toBe(false);
  });

  it("should store the role, email, and password hash", () => {
    const user = makeUser();

    expect(user.role).toBe(UserRole.STUDENT);
    expect(user.email.value).toBe("maria@exemplo.com");
    expect(user.passwordHash).toBe(HASH);
  });

  it("should trim leading and trailing whitespace from the name", () => {
    expect(makeUser({ name: "  Maria Souza  " }).name).toBe("Maria Souza");
  });

  it.each(["", "   "])("should reject an empty name (%p)", (name) => {
    expect(() => makeUser({ name })).toThrow(InvalidUserError);
  });

  it("should accept a name with 150 characters and reject one with 151", () => {
    expect(() => makeUser({ name: "a".repeat(150) })).not.toThrow();
    expect(() => makeUser({ name: "a".repeat(151) })).toThrow(InvalidUserError);
  });

  it.each(["", "   "])(
    "should reject an empty password hash (%p)",
    (passwordHash) => {
      expect(() => makeUser({ passwordHash })).toThrow(InvalidUserError);
    },
  );

  it("should not be affected when the caller modifies the original date", () => {
    const now = new Date(NOW);
    const user = User.create(
      {
        name: "Maria",
        email: Email.create("maria@exemplo.com"),
        passwordHash: HASH,
        role: UserRole.STUDENT,
      },
      now,
    );

    now.setFullYear(1999);

    expect(user.createdAt).toEqual(NOW);
  });
});

describe("User.restore", () => {
  const props: UserProps = {
    name: "Maria Souza",
    email: Email.create("maria@exemplo.com"),
    passwordHash: HASH,
    role: UserRole.TEACHER,
    status: UserStatus.INACTIVE,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  };

  it("should preserve the id, status, and dates restored from the database", () => {
    const id = new UniqueEntityId();
    const user = User.restore(props, id);

    expect(user.id).toBe(id);
    expect(user.status).toBe(UserStatus.INACTIVE);
    expect(user.createdAt).toEqual(props.createdAt);
    expect(user.updatedAt).toEqual(props.updatedAt);
  });
});

describe("Status transitions", () => {
  it("should deactivate an active user and update updatedAt", () => {
    const user = makeUser();

    user.deactivate(LATER);

    expect(user.status).toBe(UserStatus.INACTIVE);
    expect(user.updatedAt).toEqual(LATER);
    expect(user.createdAt).toEqual(NOW);
  });

  it("should reactivate an inactive user", () => {
    const user = makeUser();
    user.deactivate(LATER);

    user.reactivate(LATER);

    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("should reject deactivating an already inactive user", () => {
    const user = makeUser();
    user.deactivate(LATER);

    expect(() => user.deactivate(LATER)).toThrow(InvalidStatusTransitionError);
  });

  it("should reject reactivating an already active user", () => {
    expect(() => makeUser().reactivate(LATER)).toThrow(
      InvalidStatusTransitionError,
    );
  });

  it("should not change anything when a status transition is rejected", () => {
    const user = makeUser();

    expect(() => user.reactivate(LATER)).toThrow();

    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.updatedAt).toEqual(NOW);
  });
});

describe("Encapsulation", () => {
  it("should return a copy of the date to prevent external mutations", () => {
    const user = makeUser();

    user.createdAt.setFullYear(1999);

    expect(user.createdAt).toEqual(NOW);
  });

  it("should not expose the password hash when serialized to JSON", () => {
    const json = JSON.stringify(makeUser());

    expect(json).not.toContain(HASH);
    expect(json).not.toContain("passwordHash");
  });
});
