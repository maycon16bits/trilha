import "reflect-metadata";
import { scryptSync } from "node:crypto";
import { CryptoService } from "./crypto.service";

describe("CryptoService", () => {
  const service = new CryptoService();
  const password = "Senha1234";

  describe("hashPassword", () => {
    it("returns the self-contained format with params, salt and hash", async () => {
      const stored = await service.hashPassword(password);

      expect(stored).toMatch(/^scrypt\$N=16384,r=8,p=1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    });

    it("fits the password_hash column (255 chars)", async () => {
      const stored = await service.hashPassword(password);

      expect(stored.length).toBeLessThanOrEqual(255);
    });

    it("does not contain the plain password", async () => {
      const stored = await service.hashPassword(password);

      expect(stored).not.toContain(password);
    });

    it("generates different hashes for the same password (random salt)", async () => {
      const first = await service.hashPassword(password);
      const second = await service.hashPassword(password);

      expect(first).not.toBe(second);
    });
  });

  describe("verifyPassword", () => {
    it("accepts the correct password", async () => {
      const stored = await service.hashPassword(password);

      await expect(service.verifyPassword(password, stored)).resolves.toBe(true);
    });

    it("rejects a wrong password", async () => {
      const stored = await service.hashPassword(password);

      await expect(service.verifyPassword("Senha12345", stored)).resolves.toBe(false);
    });

    it("is case sensitive", async () => {
      const stored = await service.hashPassword(password);

      await expect(service.verifyPassword(password.toLowerCase(), stored)).resolves.toBe(false);
    });

    it("rejects a tampered hash", async () => {
      const stored = await service.hashPassword(password);
      const last = stored.slice(-1) === "0" ? "1" : "0";
      const tampered = stored.slice(0, -1) + last;

      await expect(service.verifyPassword(password, tampered)).resolves.toBe(false);
    });

    it("still verifies a hash created with other params (cost can change)", async () => {
      const salt = Buffer.from("00112233445566778899aabbccddeeff", "hex");
      const key = scryptSync(password, salt, 64, { N: 1024, r: 8, p: 1 });
      const old = `scrypt$N=1024,r=8,p=1$${salt.toString("hex")}$${key.toString("hex")}`;

      await expect(service.verifyPassword(password, old)).resolves.toBe(true);
    });

    it.each([
      ["empty", ""],
      ["random text", "abc"],
      ["another algorithm", "bcrypt$N=16384,r=8,p=1$aa$bb"],
      ["missing parts", "scrypt$N=16384,r=8,p=1$00ff"],
      ["non-hex salt", "scrypt$N=16384,r=8,p=1$zz$00ff"],
      ["N not a power of 2", `scrypt$N=1000,r=8,p=1$${"00".repeat(16)}$${"00".repeat(64)}`],
      ["N above the limit", `scrypt$N=4294967296,r=8,p=1$${"00".repeat(16)}$${"00".repeat(64)}`],
      ["hash too short", `scrypt$N=16384,r=8,p=1$${"00".repeat(16)}$00ff`],
    ])("returns false for a malformed value (%s)", async (_name, value) => {
      await expect(service.verifyPassword(password, value)).resolves.toBe(false);
    });
  });

  describe("generateToken", () => {
    it("generates a url-safe token with 43 characters (32 bytes)", () => {
      expect(service.generateToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it("generates a different token each time", () => {
      expect(service.generateToken()).not.toBe(service.generateToken());
    });
  });

  describe("hashToken", () => {
    it("returns SHA-256 in hex (64 chars, the invitations column size)", () => {
      expect(service.hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    });

    it("is deterministic and differs from the token", () => {
      const token = service.generateToken();

      expect(service.hashToken(token)).toBe(service.hashToken(token));
      expect(service.hashToken(token)).not.toBe(token);
    });
  });
});
