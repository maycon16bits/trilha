import express from "express";
import type { PrismaClient } from "./generated/prisma/client";

type AppDependencies = {
  prisma: Pick<PrismaClient, "$queryRaw">;
};

export function createApp({ prisma }: AppDependencies) {
  const app = express();

  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "up" });
    } catch {
      res.status(503).json({ status: "error", database: "down" });
    }
  });

  return app;
}
