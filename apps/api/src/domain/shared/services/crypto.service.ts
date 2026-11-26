import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { Service } from "typedi";

const SCRYPT = { N: 16384, r: 8, p: 1 } as const;
const SALT_BYTES = 16;
const KEY_BYTES = 64;

const MAX_N = 2 ** 17;
const MAX_R = 16;
const MAX_P = 4;
const MIN_KEY_BYTES = 16;
const MAX_KEY_BYTES = 128;

const TOKEN_BYTES = 32;

const STORED_FORMAT = /^scrypt\$N=(\d+),r=(\d+),p=(\d+)\$([0-9a-f]+)\$([0-9a-f]+)$/;

type ScryptParams = { N: number; r: number; p: number };

@Service()
export class CryptoService {
  async hashPassword(password: string): Promise<string> {
    const salt = this.createSalt();
    const key = await this.deriveKey(password, salt, SCRYPT, KEY_BYTES);

    return `scrypt$N=${SCRYPT.N},r=${SCRYPT.r},p=${SCRYPT.p}` + `$${salt.toString("hex")}$${key.toString("hex")}`;
  }

  async verifyPassword(password: string, stored: string): Promise<boolean> {
    const parsed = this.parseStored(stored);
    if (!parsed) {
      return false;
    }

    try {
      const key = await this.deriveKey(password, parsed.salt, parsed.params, parsed.hash.length);
      return timingSafeEqual(key, parsed.hash);
    } catch {
      return false;
    }
  }

  generateToken(): string {
    return randomBytes(TOKEN_BYTES).toString("base64url");
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private createSalt(): Buffer {
    return randomBytes(SALT_BYTES);
  }

  private deriveKey(password: string, salt: Buffer, params: ScryptParams, keyLength: number): Promise<Buffer> {
    const options: ScryptOptions = {
      N: params.N,
      r: params.r,
      p: params.p,
      maxmem: 256 * params.N * params.r,
    };

    return new Promise((resolve, reject) => {
      scrypt(password, salt, keyLength, options, (error, key) => {
        if (error) {
          reject(error);
        } else {
          resolve(key);
        }
      });
    });
  }

  private parseStored(stored: string): { params: ScryptParams; salt: Buffer; hash: Buffer } | null {
    const match = STORED_FORMAT.exec(stored);
    if (!match) {
      return null;
    }

    const [, n, r, p, saltHex, hashHex] = match;
    if (!n || !r || !p || !saltHex || !hashHex) {
      return null;
    }

    const params = { N: Number(n), r: Number(r), p: Number(p) };
    const salt = Buffer.from(saltHex, "hex");
    const hash = Buffer.from(hashHex, "hex");

    const valid =
      params.N >= 2 &&
      params.N <= MAX_N &&
      params.r >= 1 &&
      params.r <= MAX_R &&
      params.p >= 1 &&
      params.p <= MAX_P &&
      salt.length >= SALT_BYTES &&
      hash.length >= MIN_KEY_BYTES &&
      hash.length <= MAX_KEY_BYTES;

    return valid ? { params, salt, hash } : null;
  }
}
