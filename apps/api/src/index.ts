import "reflect-metadata";
import { createApp } from "./app";
import { loadEnv } from "./shered/config/env";
import { createPrismaClient } from "./shered/database/prisma";

const env = loadEnv();
const prisma = createPrismaClient(env.DATABASE_URL);
const app = createApp({ prisma });

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
