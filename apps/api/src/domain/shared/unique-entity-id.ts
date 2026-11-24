import { randomUUID } from "node:crypto";

export class UniqueEntityId {
  private value: string;

  toString() {
    return this.value.toString();
  }

  equals(other: UniqueEntityId): boolean {
    return this.value === other.value;
  }

  constructor(value?: string) {
    this.value = value ?? randomUUID();
  }
}
