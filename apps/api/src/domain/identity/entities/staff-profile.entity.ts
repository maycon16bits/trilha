import { InvalidStaffProfileError } from "../../errors/invalid-staff-profile.error";
import { BaseEntity } from "../../shared/base-entity";
import { UniqueEntityId } from "../../shared/unique-entity-id";

export interface StaffProfileProps {
  qualification: string | null; // formação (D18: campos a confirmar)
  hiredAt: Date | null; // DATE
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaffProfileInput {
  userId: UniqueEntityId; // tem o mesmo id do usuário
  qualification?: string | null;
  hiredAt?: Date | null;
}

// Perfil de professor e coordenação. Os campos dependem da D18.
export class StaffProfile extends BaseEntity<StaffProfileProps> {
  static readonly QUALIFICATION_MAX_LENGTH = 150;

  private constructor(props: StaffProfileProps, id: UniqueEntityId) {
    super(props, id);
  }

  static create(input: CreateStaffProfileInput, now: Date): StaffProfile {
    const qualification = StaffProfile.normalizeQualification(input.qualification);

    if (input.hiredAt && Number.isNaN(input.hiredAt.getTime())) {
      throw new InvalidStaffProfileError("A data de contratação é inválida");
    }

    return new StaffProfile(
      {
        qualification,
        hiredAt: input.hiredAt ? new Date(input.hiredAt) : null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
      input.userId,
    );
  }

  static restore(props: StaffProfileProps, id: UniqueEntityId): StaffProfile {
    return new StaffProfile(
      {
        ...props,
        hiredAt: props.hiredAt ? new Date(props.hiredAt) : null,
        createdAt: new Date(props.createdAt),
        updatedAt: new Date(props.updatedAt),
      },
      id,
    );
  }

  get qualification(): string | null {
    return this.props.qualification;
  }

  get hiredAt(): Date | null {
    return this.props.hiredAt ? new Date(this.props.hiredAt) : null;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  toJSON() {
    return {
      id: this.id,
      qualification: this.props.qualification,
      hiredAt: this.props.hiredAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private static normalizeQualification(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.length > StaffProfile.QUALIFICATION_MAX_LENGTH) {
      throw new InvalidStaffProfileError(`A formação deve ter até ${StaffProfile.QUALIFICATION_MAX_LENGTH} caracteres`);
    }
    return trimmed;
  }
}
