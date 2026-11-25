import { BaseError } from "./base.error";

export class WeakPasswordError extends BaseError {
  constructor(message = "Senha fraca", code = "WEAK_PASSWORD", details?: unknown) {
    super(message, 400, code, details);
  }
}
