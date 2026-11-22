import { IsEmail, IsInt, Min } from "class-validator";
import { Body, Get, JsonController, Post } from "routing-controllers";
import request from "supertest";
import { Service } from "typedi";
import { createApp } from "../../app";
import { ConflictError, UnauthorizedError } from "../../domain/errors";

class EmailAlreadyUsedError extends ConflictError {
  constructor() {
    super("E-mail já cadastrado", "EMAIL_ALREADY_USED");
  }
}

class CreateThingDto {
  @IsEmail() email!: string;
  @IsInt() @Min(1) age!: number;
}

@Service()
@JsonController("/test")
class TestController {
  @Post("/validate")
  validate(@Body() _body: CreateThingDto) {
    return { ok: true };
  }

  @Get("/conflict")
  conflict() {
    throw new EmailAlreadyUsedError();
  }

  @Get("/unauthorized")
  unauthorized() {
    throw new UnauthorizedError("Credenciais inválidas", "INVALID_CREDENTIALS");
  }

  @Get("/boom")
  boom() {
    throw new Error("segredo interno do banco");
  }
}

describe("tratamento global de erros", () => {
  const app = createApp({
    prisma: { $queryRaw: jest.fn() } as never,
    controllers: [TestController],
  });

  it("subclasse de erro vira o status e o code dela", async () => {
    const res = await request(app).get("/test/conflict");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: "EMAIL_ALREADY_USED", message: "E-mail já cadastrado" },
    });
  });

  it("erro genérico com code próprio funciona sem mexer no handler", async () => {
    const res = await request(app).get("/test/unauthorized");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "Credenciais inválidas" },
    });
  });

  it("DTO inválido devolve 400 com os campos errados", async () => {
    const res = await request(app)
      .post("/test/validate")
      .send({ email: "nao-e-email", age: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "email" }),
        expect.objectContaining({ field: "age" }),
      ]),
    );
  });

  it("campo fora do DTO é recusado", async () => {
    const res = await request(app)
      .post("/test/validate")
      .send({ email: "a@b.com", age: 20, role: "COORDINATOR" });

    expect(res.status).toBe(400);
  });

  it("DTO válido passa", async () => {
    const res = await request(app)
      .post("/test/validate")
      .send({ email: "a@b.com", age: 20 });

    expect(res.status).toBe(200);
  });

  it("erro inesperado vira 500 sem vazar detalhes", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const res = await request(app).get("/test/boom");

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("segredo");
  });

  it("JSON malformado vira 400", async () => {
    const res = await request(app)
      .post("/test/validate")
      .set("Content-Type", "application/json")
      .send("{ invalido");

    expect(res.status).toBe(400);
  });
});
