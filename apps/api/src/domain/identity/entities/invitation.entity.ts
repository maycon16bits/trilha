import { InvalidInvitationError } from "../../errors/invalid-invitation.error";
import { InvitationAlreadyUsedError } from "../../errors/invitation-already-used.error";
import { InvitationExpiredError } from "../../errors/invitation-expired.error";
import { InvitationRevokedError } from "../../errors/invitation-revoked.error";
import { BaseEntity } from "../../shared/base-entity";
import { UniqueEntityId } from "../../shared/unique-entity-id";
import { InvitationStatus, UserRole } from "../enums";
import { Email, Phone } from "../value-objects";

export interface InvitationProps {
  role: UserRole;
  email: Email;
  phone: Phone;
  tokenHash: string; // só o hash; o token puro nunca entra na entidade
  invitedBy: UniqueEntityId;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  userId: UniqueEntityId | null; // conta criada ao aceitar
  createdAt: Date;
}

export interface CreateInvitationInput {
  role: UserRole;
  email: Email;
  phone: Phone;
  tokenHash: string;
  invitedBy: UniqueEntityId;
  expiresAt: Date; // a validade vem de configuração (D23), não da entidade
}

const ALLOWED_ROLES: readonly UserRole[] = [UserRole.STUDENT, UserRole.TEACHER];
const SHA256_HEX = /^[0-9a-f]{64}$/;

export class Invitation extends BaseEntity<InvitationProps> {
  private constructor(props: InvitationProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(input: CreateInvitationInput, now: Date): Invitation {
    if (!ALLOWED_ROLES.includes(input.role)) {
      throw new InvalidInvitationError("Só é possível convidar aluno ou professor");
    }
    if (!SHA256_HEX.test(input.tokenHash)) {
      throw new InvalidInvitationError("O hash do token deve ter 64 caracteres hexadecimais");
    }
    if (Number.isNaN(input.expiresAt.getTime()) || input.expiresAt.getTime() <= now.getTime()) {
      throw new InvalidInvitationError("A validade do convite deve estar no futuro");
    }

    return new Invitation({
      role: input.role,
      email: input.email,
      phone: input.phone,
      tokenHash: input.tokenHash,
      invitedBy: input.invitedBy,
      expiresAt: new Date(input.expiresAt),
      usedAt: null,
      revokedAt: null,
      userId: null,
      createdAt: new Date(now),
    });
  }

  static restore(props: InvitationProps, id: UniqueEntityId): Invitation {
    return new Invitation(
      {
        ...props,
        expiresAt: new Date(props.expiresAt),
        usedAt: props.usedAt ? new Date(props.usedAt) : null,
        revokedAt: props.revokedAt ? new Date(props.revokedAt) : null,
        createdAt: new Date(props.createdAt),
      },
      id,
    );
  }

  get role(): UserRole {
    return this.props.role;
  }

  get email(): Email {
    return this.props.email;
  }

  get phone(): Phone {
    return this.props.phone;
  }

  // Necessário para o repositório gravar; nunca sai em toJSON.
  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get invitedBy(): UniqueEntityId {
    return this.props.invitedBy;
  }

  get expiresAt(): Date {
    return new Date(this.props.expiresAt);
  }

  get usedAt(): Date | null {
    return this.props.usedAt ? new Date(this.props.usedAt) : null;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt ? new Date(this.props.revokedAt) : null;
  }

  get userId(): UniqueEntityId | null {
    return this.props.userId;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  // Estado derivado. Precedência: usado > revogado > expirado > aberto.
  // No instante exato de expires_at o convite JÁ está expirado.
  statusAt(now: Date): InvitationStatus {
    if (this.props.usedAt) {
      return InvitationStatus.USED;
    }
    if (this.props.revokedAt) {
      return InvitationStatus.REVOKED;
    }
    if (now.getTime() >= this.props.expiresAt.getTime()) {
      return InvitationStatus.EXPIRED;
    }
    return InvitationStatus.OPEN;
  }

  accept(userId: UniqueEntityId, now: Date): void {
    this.assertOpen(now);

    this.props.usedAt = new Date(now);
    this.props.userId = userId;
  }

  revoke(now: Date): void {
    this.assertOpen(now);

    this.props.revokedAt = new Date(now);
  }

  // Sem tokenHash: o hash não precisa aparecer em nenhuma resposta.
  toJSON() {
    return {
      id: this.id,
      role: this.props.role,
      email: this.props.email.value,
      phone: this.props.phone.value,
      invitedBy: this.props.invitedBy,
      expiresAt: this.props.expiresAt,
      usedAt: this.props.usedAt,
      revokedAt: this.props.revokedAt,
      userId: this.props.userId,
      createdAt: this.props.createdAt,
    };
  }

  private assertOpen(now: Date): void {
    switch (this.statusAt(now)) {
      case InvitationStatus.OPEN:
        return;
      case InvitationStatus.USED:
        throw new InvitationAlreadyUsedError();
      case InvitationStatus.REVOKED:
        throw new InvitationRevokedError();
      case InvitationStatus.EXPIRED:
        throw new InvitationExpiredError();
    }
  }
}
