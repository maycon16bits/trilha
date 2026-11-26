import { InvalidStatusTransitionError } from "../../errors/invalid-status-transition.error";
import { InvalidStudentError } from "../../errors/invalid-student.error";
import { BaseEntity } from "../../shared/base-entity";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { ApprovalStatus, EducationLevel, SchoolSituation, SchoolType } from "../enums";
import { isGuardianRequired } from "../policies/guardian-requirement.policy";
import { CreateGuardianInput, Guardian } from "./guardian.entity";

export interface StudentProps {
  birthDate: Date; // data de calendário (DATE no banco); a idade é calculada
  educationLevel: EducationLevel;
  schoolName: string;
  schoolSituation: SchoolSituation;
  schoolType: SchoolType | null;
  approvalStatus: ApprovalStatus;
  decidedBy: UniqueEntityId | null; // quem aprovou ou rejeitou (approved_by)
  decidedAt: Date | null; // quando (approved_at)
  rejectionReason: string | null;
  guardian: Guardian | null; // faz parte do agregado
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentInput {
  userId: UniqueEntityId; // o aluno TEM o mesmo id do usuário
  birthDate: Date;
  educationLevel: EducationLevel;
  schoolName: string;
  schoolSituation: SchoolSituation;
  schoolType?: SchoolType | null;
  guardian?: CreateGuardianInput | null;
}

// Fuso de referência do curso (CLAUDE.md): a "data de hoje" para idade e
// validação é a de Recife, não a do servidor.
const REFERENCE_TIME_ZONE = "America/Recife";
const MAJORITY_AGE = 18;

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

function todayIn(instant: Date): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REFERENCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);

  return { year: part("year"), month: part("month"), day: part("day") };
}

// DATE do banco chega como meia-noite UTC: os campos UTC são o dia correto.
function dayOf(birthDate: Date): CalendarDay {
  return {
    year: birthDate.getUTCFullYear(),
    month: birthDate.getUTCMonth() + 1,
    day: birthDate.getUTCDate(),
  };
}

function isAfter(a: CalendarDay, b: CalendarDay): boolean {
  return a.year > b.year || (a.year === b.year && (a.month > b.month || (a.month === b.month && a.day > b.day)));
}

export class Student extends BaseEntity<StudentProps> {
  static readonly SCHOOL_NAME_MAX_LENGTH = 150;

  private constructor(props: StudentProps, id: UniqueEntityId) {
    super(props, id);
  }

  // Aluno NOVO: nasce PENDING, esperando a coordenação.
  static create(input: CreateStudentInput, now: Date): Student {
    if (Number.isNaN(input.birthDate.getTime())) {
      throw new InvalidStudentError("A data de nascimento é inválida");
    }
    if (isAfter(dayOf(input.birthDate), todayIn(now))) {
      throw new InvalidStudentError("A data de nascimento não pode estar no futuro");
    }

    const schoolName = input.schoolName.trim();
    if (schoolName.length === 0 || schoolName.length > Student.SCHOOL_NAME_MAX_LENGTH) {
      throw new InvalidStudentError(`O nome da escola deve ter entre 1 e ${Student.SCHOOL_NAME_MAX_LENGTH} caracteres`);
    }

    const guardian = input.guardian ? Guardian.create(input.guardian, now) : null;

    const student = new Student(
      {
        birthDate: new Date(input.birthDate),
        educationLevel: input.educationLevel,
        schoolName,
        schoolSituation: input.schoolSituation,
        schoolType: input.schoolType ?? null,
        approvalStatus: ApprovalStatus.PENDING,
        decidedBy: null,
        decidedAt: null,
        rejectionReason: null,
        guardian,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
      input.userId,
    );

    if (isGuardianRequired(student.isMinor(now)) && !guardian) {
      throw new InvalidStudentError("Aluno menor de idade precisa informar o responsável");
    }

    return student;
  }

  // Reconstrução a partir do banco: não reaplica regras de "nascimento".
  static restore(props: StudentProps, id: UniqueEntityId): Student {
    return new Student(
      {
        ...props,
        birthDate: new Date(props.birthDate),
        decidedAt: props.decidedAt ? new Date(props.decidedAt) : null,
        createdAt: new Date(props.createdAt),
        updatedAt: new Date(props.updatedAt),
      },
      id,
    );
  }

  get birthDate(): Date {
    return new Date(this.props.birthDate);
  }

  get educationLevel(): EducationLevel {
    return this.props.educationLevel;
  }

  get schoolName(): string {
    return this.props.schoolName;
  }

  get schoolSituation(): SchoolSituation {
    return this.props.schoolSituation;
  }

  get schoolType(): SchoolType | null {
    return this.props.schoolType;
  }

  get approvalStatus(): ApprovalStatus {
    return this.props.approvalStatus;
  }

  get decidedBy(): UniqueEntityId | null {
    return this.props.decidedBy;
  }

  get decidedAt(): Date | null {
    return this.props.decidedAt ? new Date(this.props.decidedAt) : null;
  }

  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }

  get guardian(): Guardian | null {
    return this.props.guardian;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  // Idade em anos completos na data de referência (RN-19).
  ageAt(reference: Date): number {
    const birth = dayOf(this.props.birthDate);
    const today = todayIn(reference);
    const hadBirthdayThisYear = today.month > birth.month || (today.month === birth.month && today.day >= birth.day);

    return today.year - birth.year - (hadBirthdayThisYear ? 0 : 1);
  }

  isMinor(reference: Date): boolean {
    return this.ageAt(reference) < MAJORITY_AGE;
  }

  approve(approverId: UniqueEntityId, now: Date): void {
    this.assertPending(ApprovalStatus.APPROVED);

    this.props.approvalStatus = ApprovalStatus.APPROVED;
    this.props.decidedBy = approverId;
    this.props.decidedAt = new Date(now);
    this.props.rejectionReason = null;
    this.props.updatedAt = new Date(now);
  }

  reject(approverId: UniqueEntityId, reason: string, now: Date): void {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      throw new InvalidStudentError("O motivo da rejeição é obrigatório");
    }
    this.assertPending(ApprovalStatus.REJECTED);

    this.props.approvalStatus = ApprovalStatus.REJECTED;
    this.props.decidedBy = approverId;
    this.props.decidedAt = new Date(now);
    this.props.rejectionReason = trimmed;
    this.props.updatedAt = new Date(now);
  }

  toJSON() {
    return {
      id: this.id,
      birthDate: this.props.birthDate,
      educationLevel: this.props.educationLevel,
      schoolName: this.props.schoolName,
      schoolSituation: this.props.schoolSituation,
      schoolType: this.props.schoolType,
      approvalStatus: this.props.approvalStatus,
      decidedBy: this.props.decidedBy,
      decidedAt: this.props.decidedAt,
      rejectionReason: this.props.rejectionReason,
      guardian: this.props.guardian,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private assertPending(target: ApprovalStatus): void {
    if (this.props.approvalStatus !== ApprovalStatus.PENDING) {
      throw new InvalidStatusTransitionError(`Não é possível ir de ${this.props.approvalStatus} para ${target}`);
    }
  }
}
