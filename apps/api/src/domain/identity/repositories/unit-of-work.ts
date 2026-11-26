import type { InvitationRepository } from "./invitation.repository";
import type { StaffProfileRepository } from "./staff-profile.repository";
import type { StudentRepository } from "./student.repository";
import type { UserRepository } from "./user.repository";

export interface IdentityRepositories {
  users: UserRepository;
  students: StudentRepository;
  staffProfiles: StaffProfileRepository;
  invitations: InvitationRepository;
}

export interface UnitOfWork {
  run<T>(work: (repositories: IdentityRepositories) => Promise<T>): Promise<T>;
}
