import { BaseError } from "./base.error";

export class InvitationRevokedError extends BaseError {
  constructor(
    message = "O convite foi cancelado. Fale com a coordenação.",
    code = "INVITATION_REVOKED",
    details?: unknown,
  ) {
    super(message, 410, code, details);
  }
}
