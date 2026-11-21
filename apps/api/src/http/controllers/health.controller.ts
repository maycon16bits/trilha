import type { Response } from "express";
import { Get, JsonController, Res } from "routing-controllers";
import { Inject, Service } from "typedi";
import { PRISMA, QueryClient } from "../../infrastructure/database/tokens";

@Service()
@JsonController("/health")
export class HealthController {
  constructor(@Inject(PRISMA) private readonly db: QueryClient) {}

  @Get()
  async check(@Res() res: Response) {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return { status: "ok", database: "up" };
    } catch {
      return res.status(503).json({ status: "error", database: "down" });
    }
  }
}
