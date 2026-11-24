import { WeakPasswordError } from "../../errors/weak-password.error";

export class ValidatePasswordService {
  private static readonly RULE = /^(?=.*[A-Za-z])(?=.*\d)\S{8,72}$/;

  static validate(password: string): void {
    if (!ValidatePasswordService.RULE.test(password)) {
      console.log("erro dentro do log: ");
      console.log("senha: ", password);
      throw new WeakPasswordError(
        "Senha fraca. Por favor, insira pelo menos 8 caracteres, com letras e números.",
      );
    }
  }
}
