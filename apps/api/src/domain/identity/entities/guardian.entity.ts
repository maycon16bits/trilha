import { InvalidGuardianError } from "../../errors/invalid-guardian.error";
import { BaseEntity } from "../../shared/base-entity";
import { UniqueEntityId } from "../../shared/unique-entity-id";

export interface GuardianProps {
  name: string;
  relationship: string;
  contact: string;
  consentedAt: Date;
  policyVersion: string;
}

// O consentimento (consentedAt) é decidido pela entidade: é o "agora" da
// criação. Quem chama não informa a data.
export interface CreateGuardianInput {
  name: string;
  relationship: string;
  contact: string;
  policyVersion: string;
}

// Entidade FILHA do agregado Student: só é criada e salva através dele.
export class Guardian extends BaseEntity<GuardianProps> {
  static readonly NAME_MAX_LENGTH = 150;
  static readonly RELATIONSHIP_MAX_LENGTH = 50;
  static readonly CONTACT_MAX_LENGTH = 254;
  static readonly POLICY_VERSION_MAX_LENGTH = 20;

  private constructor(props: GuardianProps, id?: UniqueEntityId) {
    super(props, id);
  }

  static create(input: CreateGuardianInput, now: Date): Guardian {
    const props = {
      name: Guardian.required("nome", input.name, Guardian.NAME_MAX_LENGTH),
      relationship: Guardian.required("parentesco", input.relationship, Guardian.RELATIONSHIP_MAX_LENGTH),
      contact: Guardian.required("contato", input.contact, Guardian.CONTACT_MAX_LENGTH),
      policyVersion: Guardian.required("versão da política", input.policyVersion, Guardian.POLICY_VERSION_MAX_LENGTH),
      consentedAt: new Date(now),
    };

    return new Guardian(props);
  }

  static restore(props: GuardianProps, id: UniqueEntityId): Guardian {
    return new Guardian({ ...props, consentedAt: new Date(props.consentedAt) }, id);
  }

  get name(): string {
    return this.props.name;
  }

  get relationship(): string {
    return this.props.relationship;
  }

  get contact(): string {
    return this.props.contact;
  }

  get consentedAt(): Date {
    return new Date(this.props.consentedAt);
  }

  get policyVersion(): string {
    return this.props.policyVersion;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.props.name,
      relationship: this.props.relationship,
      contact: this.props.contact,
      consentedAt: this.props.consentedAt,
      policyVersion: this.props.policyVersion,
    };
  }

  private static required(label: string, value: string, max: number): string {
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > max) {
      throw new InvalidGuardianError(`O campo ${label} do responsável deve ter entre 1 e ${max} caracteres`);
    }
    return trimmed;
  }
}
