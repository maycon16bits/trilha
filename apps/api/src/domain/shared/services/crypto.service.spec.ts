import Container from "typedi";
import { CryptoService } from "./crypto.service";

describe("Crypto Service", () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = Container.get(CryptoService);
  });

  it("should create a salt with the default length", () => {
    const salt = cryptoService.createSalt();
    expect(typeof salt).toBe("string");
    expect(salt).toHaveLength(32);
  });

  it("should create a salt with the custom length", () => {
    const salt = cryptoService.createSalt(32);
    expect(typeof salt).toBe("string");
    expect(salt).toHaveLength(64);
  });

  it("should create a hash with salt", async () => {
    const hash = await cryptoService.createHashWithSalt(
      "12345121213123812381937128371983719283796",
      "salt",
    );
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(128);
  });

  it("should create a hash with salt with the custom length", async () => {
    const hash = await cryptoService.createHashWithSalt("123456", "salt");
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(128);
  });

  it("should create a hash", async () => {
    const hash = await cryptoService.createHash("123456");
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
  });
});
