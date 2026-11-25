import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Max, Min, validateSync } from "class-validator";

export class Env {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const env = plainToInstance(Env, source, { enableImplicitConversion: true });
  const errors = validateSync(env);

  if (errors.length > 0) {
    const details = errors
      .map((error) => `- ${error.property}: ${Object.values(error.constraints ?? {}).join(", ")}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
  }

  return env;
}
