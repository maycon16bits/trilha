import { Token } from "typedi";
import type { PrismaClient } from "../../generated/prisma/client";

export type QueryClient = Pick<PrismaClient, "$queryRaw">;
export const PRISMA = new Token<QueryClient>("PRISMA");
