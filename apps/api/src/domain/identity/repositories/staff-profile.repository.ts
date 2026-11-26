import type { UniqueEntityId } from "../../shared/unique-entity-id";
import type { StaffProfile } from "../entities/staff-profile.entity";

/** Porta do perfil de professor e coordenação. O id é o id do User. */
export interface StaffProfileRepository {
  findById(id: UniqueEntityId): Promise<StaffProfile | null>;

  add(staffProfile: StaffProfile): Promise<void>;
  save(staffProfile: StaffProfile): Promise<void>;
}
