import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

export function createPrismaClient(databaseUrl: string) {
  const prisma = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter: prisma });
}
