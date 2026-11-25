import { BaseError } from "./base.error";

export class InvalidEmailError extends BaseError {
  constructor(message = "Email inválido", code = "INVALID_EMAIL", details?: unknown) {
    super(message, 400, code, details);
  }
}
