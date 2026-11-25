import { InvalidPhoneError } from "../../errors";

export class Phone {
  private static readonly RULE = /^(?:55)?[1-9]{2}9?\d{8}$/;

  private constructor(private readonly phone: string) {}

  static create(value: string): Phone {
    const phone = value.replace(/\D/g, "");

    this.validate(phone);

    return new Phone(phone);
  }

  get value(): string {
    return this.phone;
  }

  toString(): string {
    return this.phone;
  }

  private static validate(phone: string): void {
    if (!Phone.RULE.test(phone)) {
      throw new InvalidPhoneError("Formato de telefone errado. Por favor, utilize o formato (xx) xxxxx-xxxx.");
    }
  }
}
