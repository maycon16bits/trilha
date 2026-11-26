import { BaseError } from "./base.error";

export class InvalidStudentError extends BaseError {
  constructor(message = "Aluno inválido", code = "INVALID_STUDENT", details?: unknown) {
    super(message, 400, code, details);
  }
}
