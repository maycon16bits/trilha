import { WeakPasswordError } from "../../errors/weak-password.error";
import { Password } from "./password.vo";

describe("Password", () => {
  it("create a valid password", () => {
    expect(Password.create("123456john").value).toBe("123456john");
  });

  it("throw error if the password has lass then 8 characters", () => {
    expect(() => Password.create("1234567")).toThrow(WeakPasswordError);
  });

  it("throw error if the password has only numbers", () => {
    expect(() => Password.create("12345678")).toThrow(WeakPasswordError);
  });

  it("throw error if the password has only letters", () => {
    expect(() => Password.create("johndoejohndoe")).toThrow(WeakPasswordError);
  });
});
