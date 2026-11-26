import { UniqueEntityId } from "../../shared/unique-entity-id";
import { User } from "../entities/user.entity";
import { Student } from "../entities/student.entity";
import { ApprovalStatus, EducationLevel, SchoolSituation, UserRole, UserStatus } from "../enums";
import { Email } from "../value-objects";
import { canAccessStudentArea } from "./student-access.policy";

const NOW = new Date("2026-11-25T15:00:00.000Z");

function makePair(options: { role?: UserRole; status?: UserStatus; approval?: ApprovalStatus; sameId?: boolean } = {}) {
  const id = new UniqueEntityId();
  const user = User.restore(
    {
      name: "Maria",
      email: Email.create("maria@exemplo.com"),
      passwordHash: "hash",
      role: options.role ?? UserRole.STUDENT,
      status: options.status ?? UserStatus.ACTIVE,
      createdAt: NOW,
      updatedAt: NOW,
    },
    id,
  );
  const student = Student.restore(
    {
      birthDate: new Date("2008-01-01"),
      educationLevel: EducationLevel.HIGH_SCHOOL_3,
      schoolName: "Escola",
      schoolSituation: SchoolSituation.STUDYING,
      schoolType: null,
      approvalStatus: options.approval ?? ApprovalStatus.APPROVED,
      decidedBy: null,
      decidedAt: null,
      rejectionReason: null,
      guardian: null,
      createdAt: NOW,
      updatedAt: NOW,
    },
    options.sameId === false ? new UniqueEntityId() : id,
  );
  return { user, student };
}

describe("canAccessStudentArea", () => {
  it("allows an ACTIVE and APPROVED student", () => {
    const { user, student } = makePair();

    expect(canAccessStudentArea(user, student)).toBe(true);
  });

  it.each([ApprovalStatus.PENDING, ApprovalStatus.REJECTED])("denies when the approval is %s", (approval) => {
    const { user, student } = makePair({ approval });

    expect(canAccessStudentArea(user, student)).toBe(false);
  });

  it("denies an INACTIVE account", () => {
    const { user, student } = makePair({ status: UserStatus.INACTIVE });

    expect(canAccessStudentArea(user, student)).toBe(false);
  });

  it("denies a user that is not a student", () => {
    const { user, student } = makePair({ role: UserRole.TEACHER });

    expect(canAccessStudentArea(user, student)).toBe(false);
  });

  it("denies when the student belongs to another user", () => {
    const { user, student } = makePair({ sameId: false });

    expect(canAccessStudentArea(user, student)).toBe(false);
  });
});
