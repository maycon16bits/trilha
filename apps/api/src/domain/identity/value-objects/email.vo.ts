import { InvalidEmailError } from "../../errors/invalid-email.error";

export class Email {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MAX_LENGTH = 254;

  private constructor(private readonly email: string) {}

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();
    Email.validate(normalized);
    return new Email(normalized);
  }

  get value(): string {
    return this.email;
  }

  toString(): string {
    return this.email;
  }

  equals(other: Email): boolean {
    return this.email === other.email;
  }

  private static validate(email: string): void {
    if (email.length > Email.MAX_LENGTH || !Email.PATTERN.test(email)) {
      throw new InvalidEmailError(
        "Por favor, informe um endereço de e-mail válido.",
      );
    }
  }
}
