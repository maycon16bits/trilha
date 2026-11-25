import { InvalidEmailError } from "../../errors/invalid-email.error";
import { Email } from "./email.vo";

describe("Email", () => {
  it("create a valid email", () => {
    expect(Email.create("maria@exemplo.com").value).toBe("maria@exemplo.com");
  });

  it("Remove spaces and convert to lowercase.", () => {
    expect(Email.create("  Maria@Exemplo.COM ").value).toBe("maria@exemplo.com");
  });

  it.each(["", "   ", "sem-arroba", "a@b", "a b@c.com", "@c.com", "a@@c.com"])("rejeita %p", (invalid) => {
    expect(() => Email.create(invalid)).toThrow(InvalidEmailError);
  });

  it("Rejects emails with more than 254 characters.", () => {
    expect(() => Email.create(`${"a".repeat(250)}@b.com`)).toThrow(InvalidEmailError);
  });

  it("Compare by value, not by reference.", () => {
    expect(Email.create("A@b.com").equals(Email.create("a@B.com"))).toBe(true);
    expect(Email.create("a@b.com").equals(Email.create("c@b.com"))).toBe(false);
  });

  it("toString returns the normalized email.", () => {
    expect(String(Email.create(" A@B.com "))).toBe("a@b.com");
  });
});
