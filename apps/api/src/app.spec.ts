import request from "supertest";
import { createApp } from "./app";

describe("GET /health", () => {
  // Um único mock: o typedi guarda uma instância só do controller, então o
  // prisma entregue na primeira criação do app é o que vale. Mudamos o
  // comportamento do mock em cada teste, em vez de criar outro.
  const queryRaw = jest.fn();
  const app = createApp({ prisma: { $queryRaw: queryRaw } as never });

  it("retorna 200 quando o banco responde", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "up" });
  });

  it("retorna 503 quando o banco falha", async () => {
    queryRaw.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "error", database: "down" });
  });
});
