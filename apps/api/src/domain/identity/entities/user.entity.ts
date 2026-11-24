import { InvalidStatusTransitionError } from "../../errors/invalid-status-transition.error";
import { InvalidUserError } from "../../errors/invalid-user.error";
import { BaseEntity } from "../../shared/base-entity";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { UserRole } from "../user-role.enum";
import { UserStatus } from "../user-status.enum";
import { Email } from "../value-objects";

export interface UserProps {
  name: string;
  email: Email;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: Email;
  passwordHash: string;
  role: UserRole;
}

export class User extends BaseEntity<UserProps> {
  private static readonly NAME_MAX_LENGTH = 150;

  private constructor(props: UserProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(input: CreateUserInput, now: Date): User {
    const name = input.name.trim();
    User.assertValidName(name);
    User.assertValidPasswordHash(input.passwordHash);

    return new User({
      name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      status: UserStatus.ACTIVE,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
  }

  static restore(props: UserProps, id: UniqueEntityId): User {
    return new User(
      {
        ...props,
        createdAt: new Date(props.createdAt),
        updatedAt: new Date(props.updatedAt),
      },
      id,
    );
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  deactivate(now: Date): void {
    this.changeStatus(UserStatus.ACTIVE, UserStatus.INACTIVE, now);
  }

  reactivate(now: Date): void {
    this.changeStatus(UserStatus.INACTIVE, UserStatus.ACTIVE, now);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.props.name,
      email: this.props.email.value,
      role: this.props.role,
      status: this.props.status,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  private changeStatus(from: UserStatus, to: UserStatus, now: Date): void {
    if (this.props.status !== from) {
      throw new InvalidStatusTransitionError(
        `Não é possível ir de ${this.props.status} para ${to}`,
      );
    }
    this.props.status = to;
    this.props.updatedAt = new Date(now);
  }

  private static assertValidName(name: string): void {
    if (name.length === 0 || name.length > User.NAME_MAX_LENGTH) {
      throw new InvalidUserError(
        `O nome deve ter entre 1 e ${User.NAME_MAX_LENGTH} caracteres`,
      );
    }
  }

  private static assertValidPasswordHash(passwordHash: string): void {
    if (passwordHash.trim().length === 0) {
      throw new InvalidUserError("O hash da senha é obrigatório");
    }
  }
}
