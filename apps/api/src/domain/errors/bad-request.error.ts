import { BaseError } from "./base.error";

export class BadRequestError extends BaseError {
  constructor(message = "Requisição inválida", code = "BAD_REQUEST", details?: unknown) {
    super(message, 400, code, details);
  }
}
