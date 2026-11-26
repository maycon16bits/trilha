import type { UniqueEntityId } from "../../shared/unique-entity-id";
import type { Student } from "../entities/student.entity";

export interface StudentRepository {
  findById(id: UniqueEntityId): Promise<Student | null>;

  add(student: Student): Promise<void>;
  /** Aprovação, rejeição e demais mudanças. */
  save(student: Student): Promise<void>;
}
