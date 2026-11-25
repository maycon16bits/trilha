import { BaseError } from "./base.error";

export class InvalidPhoneError extends BaseError {
  constructor(message = "Telefone inválido", code = "INVALID_PHONE", details?: unknown) {
    super(message, 400, code, details);
  }
}
