// conflict.error.ts
import { BaseError } from "./base.error";

export class ConflictError extends BaseError {
  constructor(
    message = "Conflito com o estado atual do recurso",
    code = "CONFLICT",
    details?: unknown,
  ) {
    super(message, 409, code, details);
  }
}
