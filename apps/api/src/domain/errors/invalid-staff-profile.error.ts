import { BaseError } from "./base.error";

export class InvalidStaffProfileError extends BaseError {
  constructor(message = "Perfil de equipe inválido", code = "INVALID_STAFF_PROFILE", details?: unknown) {
    super(message, 400, code, details);
  }
}
