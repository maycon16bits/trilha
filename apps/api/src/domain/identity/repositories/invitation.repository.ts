import type { Invitation } from "../entities/invitation.entity";
import type { Email } from "../value-objects";

export interface InvitationRepository {
  findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  findOpenByEmail(email: Email, now: Date): Promise<Invitation | null>;
  add(invitation: Invitation): Promise<void>;
  save(invitation: Invitation): Promise<void>;
}
