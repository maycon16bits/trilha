import { WeakPasswordError } from "../../errors/weak-password.error";

export class Password {
  private static readonly RULE = /^(?=.*[A-Za-z])(?=.*\d)\S{8,240}$/;

  private constructor(private readonly password: string) {}

  static create(value: string): Password {
    Password.validate(value);
    return new Password(value);
  }

  get value(): string {
    return this.password;
  }

  toString(): string {
    return this.password;
  }

  private static validate(password: string): void {
    if (!Password.RULE.test(password)) {
      throw new WeakPasswordError(
        "Senha fraca. Por favor, insira pelo menos 8 caracteres, com letras e números.",
      );
    }
  }
}
