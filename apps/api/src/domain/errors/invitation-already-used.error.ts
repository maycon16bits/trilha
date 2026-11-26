import { BaseError } from "./base.error";

export class InvitationAlreadyUsedError extends BaseError {
  constructor(message = "O convite já foi utilizado.", code = "INVITATION_ALREADY_USED", details?: unknown) {
    super(message, 409, code, details);
  }
}
