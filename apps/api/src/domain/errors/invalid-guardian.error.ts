import { BaseError } from "./base.error";

export class InvalidGuardianError extends BaseError {
  constructor(message = "Responsável inválido", code = "INVALID_GUARDIAN", details?: unknown) {
    super(message, 400, code, details);
  }
}
