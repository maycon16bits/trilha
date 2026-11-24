import { BaseError } from "./base.error";

export class InvalidPhoneError extends BaseError {
  constructor(
    message = "Telefone inválido",
    code = "INVALID_EMAIL",
    details?: unknown,
  ) {
    super(message, 400, code, details);
  }
}
