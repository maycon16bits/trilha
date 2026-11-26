import type { UniqueEntityId } from "../../shared/unique-entity-id";
import type { User } from "../entities/user.entity";
import type { Email } from "../value-objects";

export interface UserRepository {
  findById(id: UniqueEntityId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  add(user: User): Promise<void>;
  save(user: User): Promise<void>;
}
