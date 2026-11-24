import { ValidatePasswordService } from "./validate-password.service";
import { WeakPasswordError } from "../../errors/weak-password.error";

describe("ValidatePassword Service", () => {
  describe("should accept valid passwords", () => {
    it.each([
      "abc12345",
      "Password1",
      "1234567a",
      "Abcdef1!",
      "@#123abc",
      "A1!bcdef",
      "A1bcdefg", // Minimum length (8 characters)
      `A1${"a".repeat(70)}`, // Maximum length (72 characters)
    ])("should validate password: %s", (password) => {
      expect(() => ValidatePasswordService.validate(password)).not.toThrow();
    });
  });

  describe.only("should reject invalid passwords", () => {
    it.each([
      "12345678", // Does not contain letters
      "abcdefgh", // Does not contain numbers
      "Abc123", // Less than 8 characters
      "Abc 12345", // Contains whitespace
      "aaaaaaaaa", // Does not contain numbers
      `A1${"a".repeat(71)}`, // Exceeds maximum length (72 characters)
    ])("should reject password: %s", (password) => {
      expect(() => ValidatePasswordService.validate(password)).toThrow(
        WeakPasswordError,
      );
    });
  });
});
