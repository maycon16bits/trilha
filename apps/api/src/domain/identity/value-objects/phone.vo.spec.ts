import { InvalidPhoneError } from "../../errors";
import { Phone } from "./phone.vo";

describe("Phone Value Object", () => {
  describe("create", () => {
    it.each([
      ["(81) 98765-4321", "81987654321"],
      ["81987654321", "81987654321"],
      ["81 3333-4444", "8133334444"],
      ["+55 81 98765-4321", "5581987654321"],
    ])("should create a phone from %s", (input, expected) => {
      const phone = Phone.create(input);

      expect(phone).toBeInstanceOf(Phone);
      expect(phone.value).toBe(expected);
    });

    it.each(["123456789", "81 98765", "+1 202 555 0123", "00 55 81 98765-4321"])(
      "should throw InvalidPhoneError for %s",
      (input) => {
        expect(() => Phone.create(input)).toThrow(InvalidPhoneError);
      },
    );
  });

  describe("value", () => {
    it("should return the normalized phone number", () => {
      const phone = Phone.create("(81) 98765-4321");

      expect(phone.value).toBe("81987654321");
    });
  });

  describe("toString", () => {
    it("should return the normalized phone number", () => {
      const phone = Phone.create("(81) 98765-4321");

      expect(phone.toString()).toBe("81987654321");
    });
  });
});
