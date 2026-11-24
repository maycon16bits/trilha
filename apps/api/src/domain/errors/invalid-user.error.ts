import { BaseError } from "./base.error";

export class InvalidUserError extends BaseError {
  constructor(
    message = "Usuário inválido",
    code = "INVALID_USER",
    details?: unknown,
  ) {
    super(message, 400, code, details);
  }
}
