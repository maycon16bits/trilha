import express from "express";
import { useContainer, useExpressServer, type RoutingControllersOptions } from "routing-controllers";
import { Container } from "typedi";
import { PRISMA, type QueryClient } from "./infrastructure/database/tokens";
import { HealthController } from "./http/controllers/health.controller";
import { ErrorHandlerMiddleware } from "./http/middleware/error-handler.middleware";

type AppDependencies = {
  prisma: QueryClient;
  controllers?: RoutingControllersOptions["controllers"];
};

export function createApp({ prisma, controllers = [HealthController] }: AppDependencies) {
  Container.set(PRISMA, prisma);
  useContainer(Container);

  const app = express();
  useExpressServer(app, {
    controllers,
    middlewares: [ErrorHandlerMiddleware],
    defaultErrorHandler: false,
    validation: { whitelist: true, forbidNonWhitelisted: true },
  });

  return app;
}
