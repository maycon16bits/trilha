import { BaseError } from "./base.error";

export class UnauthorizedError extends BaseError {
  constructor(
    message: string = "Unauthorized",
    code = "UNAUTHORIZED",
    details?: unknown,
  ) {
    super(message, 401, code, details);
  }
}
