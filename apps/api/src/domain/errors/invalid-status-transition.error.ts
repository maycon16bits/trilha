import { BaseError } from "./base.error";

export class InvalidStatusTransitionError extends BaseError {
  constructor(message = "Transição de status inválida", code = "INVALID_STATUS_TRANSITION", details?: unknown) {
    super(message, 409, code, details);
  }
}
