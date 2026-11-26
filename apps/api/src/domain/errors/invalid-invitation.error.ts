import { BaseError } from "./base.error";

export class InvalidInvitationError extends BaseError {
  constructor(message = "Convite inválido", code = "INVALID_INVITATION", details?: unknown) {
    super(message, 400, code, details);
  }
}
