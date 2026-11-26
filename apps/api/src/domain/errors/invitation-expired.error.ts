import { BaseError } from "./base.error";

export class InvitationExpiredError extends BaseError {
  constructor(message = "O convite expirou. Fale com a coordenação.", code = "INVITATION_EXPIRED", details?: unknown) {
    super(message, 410, code, details);
  }
}
