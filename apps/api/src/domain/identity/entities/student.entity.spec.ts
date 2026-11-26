import { InvalidStatusTransitionError } from "../../errors/invalid-status-transition.error";
import { InvalidStudentError } from "../../errors/invalid-student.error";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { ApprovalStatus, EducationLevel, SchoolSituation, SchoolType } from "../enums";
import { CreateStudentInput, Student } from "./student.entity";

// 12:00 em Recife (UTC-3). Nenhum teste usa a data real.
const NOW = new Date("2026-11-25T15:00:00.000Z");
const LATER = new Date("2026-11-26T15:00:00.000Z");
const APPROVER = new UniqueEntityId();

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

function makeInput(overrides: Partial<CreateStudentInput> = {}): CreateStudentInput {
  return {
    userId: new UniqueEntityId(),
    birthDate: day("2008-03-10"),
    educationLevel: EducationLevel.HIGH_SCHOOL_3,
    schoolName: "Escola Estadual Central",
    schoolSituation: SchoolSituation.STUDYING,
    schoolType: SchoolType.PUBLIC,
    ...overrides,
  };
}

function makeStudent(overrides: Partial<CreateStudentInput> = {}, now = NOW) {
  return Student.create(makeInput(overrides), now);
}

describe("Student.create", () => {
  it("is born PENDING, with no decision recorded", () => {
    const student = makeStudent();

    expect(student.approvalStatus).toBe(ApprovalStatus.PENDING);
    expect(student.decidedBy).toBeNull();
    expect(student.decidedAt).toBeNull();
    expect(student.rejectionReason).toBeNull();
    expect(student.createdAt).toEqual(NOW);
    expect(student.updatedAt).toEqual(NOW);
  });

  it("uses the user id as its own id", () => {
    const userId = new UniqueEntityId();

    expect(makeStudent({ userId }).id.equals(userId)).toBe(true);
  });

  it("keeps the school type optional", () => {
    expect(makeStudent({ schoolType: undefined }).schoolType).toBeNull();
  });

  it("trims the school name", () => {
    expect(makeStudent({ schoolName: "  Escola X  " }).schoolName).toBe("Escola X");
  });

  it.each(["", "   ", "a".repeat(151)])("rejects an invalid school name (%#)", (schoolName) => {
    expect(() => makeStudent({ schoolName })).toThrow(InvalidStudentError);
  });

  it("accepts a school name with 150 characters", () => {
    expect(() => makeStudent({ schoolName: "a".repeat(150) })).not.toThrow();
  });

  it("rejects a birth date in the future", () => {
    expect(() => makeStudent({ birthDate: day("2026-11-26") })).toThrow(InvalidStudentError);
  });

  it("accepts a birth date equal to today (Recife)", () => {
    expect(() => makeStudent({ birthDate: day("2026-11-25") })).not.toThrow();
  });

  it("uses the Recife day, not UTC, to decide what is 'future'", () => {
    // 01:00 UTC de 26/11 ainda é 22:00 de 25/11 em Recife.
    const lateNight = new Date("2026-11-26T01:00:00.000Z");

    expect(() => makeStudent({ birthDate: day("2026-11-25") }, lateNight)).not.toThrow();
    expect(() => makeStudent({ birthDate: day("2026-11-26") }, lateNight)).toThrow(InvalidStudentError);
  });

  it("rejects an invalid date", () => {
    expect(() => makeStudent({ birthDate: new Date("abc") })).toThrow(InvalidStudentError);
  });

  it("creates the guardian inside the aggregate, consent = now", () => {
    const student = makeStudent({
      guardian: {
        name: "Ana",
        relationship: "Mãe",
        contact: "81999998888",
        policyVersion: "2026-01",
      },
    });

    expect(student.guardian?.name).toBe("Ana");
    expect(student.guardian?.consentedAt).toEqual(NOW);
  });

  it("does not require a guardian for a minor while D24 is open", () => {
    expect(() => makeStudent({ birthDate: day("2012-01-01") })).not.toThrow();
  });
});

describe("Student.ageAt", () => {
  const ageOn = (birth: string, reference: Date) =>
    makeStudent({ birthDate: day(birth) }, new Date("2026-01-01T15:00:00Z")).ageAt(reference);

  it("is 17 on the day before the 18th birthday (17 years and 364 days)", () => {
    expect(ageOn("2008-11-26", NOW)).toBe(17);
  });

  it("is 18 on the exact birthday", () => {
    expect(ageOn("2008-11-25", NOW)).toBe(18);
  });

  it("is 18 the day after the birthday", () => {
    expect(ageOn("2008-11-24", NOW)).toBe(18);
  });

  it("uses the Recife calendar day, not UTC", () => {
    // 22:00 de 25/11 em Recife (já 26/11 em UTC): ainda não fez 18.
    const lateNight = new Date("2026-11-26T01:00:00.000Z");

    expect(ageOn("2008-11-26", lateNight)).toBe(17);
  });

  it("handles a Feb 29 birthday: counts the year only on Mar 1 in non-leap years", () => {
    expect(ageOn("2004-02-29", new Date("2026-02-28T15:00:00Z"))).toBe(21);
    expect(ageOn("2004-02-29", new Date("2026-03-01T15:00:00Z"))).toBe(22);
  });

  it("handles a Feb 29 birthday in a leap year", () => {
    expect(ageOn("2004-02-29", new Date("2028-02-29T15:00:00Z"))).toBe(24);
  });
});

describe("Student.isMinor", () => {
  it("is true at 17 years and 364 days and false at 18", () => {
    const seventeen = makeStudent({ birthDate: day("2008-11-26") });
    const eighteen = makeStudent({ birthDate: day("2008-11-25") });

    expect(seventeen.isMinor(NOW)).toBe(true);
    expect(eighteen.isMinor(NOW)).toBe(false);
  });
});

describe("Student.approve", () => {
  it("moves PENDING to APPROVED and records who and when", () => {
    const student = makeStudent();

    student.approve(APPROVER, LATER);

    expect(student.approvalStatus).toBe(ApprovalStatus.APPROVED);
    expect(student.decidedBy?.equals(APPROVER)).toBe(true);
    expect(student.decidedAt).toEqual(LATER);
    expect(student.updatedAt).toEqual(LATER);
    expect(student.createdAt).toEqual(NOW);
  });

  it.each(["approve", "reject"] as const)("refuses to approve an already decided student (first: %s)", (first) => {
    const student = makeStudent();
    if (first === "approve") student.approve(APPROVER, NOW);
    else student.reject(APPROVER, "motivo", NOW);

    expect(() => student.approve(APPROVER, LATER)).toThrow(InvalidStatusTransitionError);
  });
});

describe("Student.reject", () => {
  it("moves PENDING to REJECTED with a trimmed reason", () => {
    const student = makeStudent();

    student.reject(APPROVER, "  Dados não conferem  ", LATER);

    expect(student.approvalStatus).toBe(ApprovalStatus.REJECTED);
    expect(student.rejectionReason).toBe("Dados não conferem");
    expect(student.decidedBy?.equals(APPROVER)).toBe(true);
    expect(student.decidedAt).toEqual(LATER);
  });

  it.each(["", "   "])("requires a reason (%p)", (reason) => {
    const student = makeStudent();

    expect(() => student.reject(APPROVER, reason, LATER)).toThrow(InvalidStudentError);
    expect(student.approvalStatus).toBe(ApprovalStatus.PENDING);
  });

  it.each(["approve", "reject"] as const)("refuses to reject an already decided student (first: %s)", (first) => {
    const student = makeStudent();
    if (first === "approve") student.approve(APPROVER, NOW);
    else student.reject(APPROVER, "motivo", NOW);

    expect(() => student.reject(APPROVER, "outro", LATER)).toThrow(InvalidStatusTransitionError);
  });
});

describe("Student.restore and copies", () => {
  it("rebuilds any state without throwing", () => {
    const id = new UniqueEntityId();
    const student = Student.restore(
      {
        birthDate: day("1990-01-01"),
        educationLevel: EducationLevel.OTHER,
        schoolName: "x",
        schoolSituation: SchoolSituation.FINISHED,
        schoolType: null,
        approvalStatus: ApprovalStatus.REJECTED,
        decidedBy: APPROVER,
        decidedAt: NOW,
        rejectionReason: "motivo",
        guardian: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
      id,
    );

    expect(student.id.equals(id)).toBe(true);
    expect(student.approvalStatus).toBe(ApprovalStatus.REJECTED);
  });

  it("returns copies of the dates", () => {
    const student = makeStudent();

    student.birthDate.setFullYear(1900);
    student.createdAt.setFullYear(1900);

    expect(student.birthDate).toEqual(day("2008-03-10"));
    expect(student.createdAt).toEqual(NOW);
  });
});
