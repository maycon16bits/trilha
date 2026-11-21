import type { NextFunction, Request, Response } from "express";
import {
  ExpressErrorMiddlewareInterface,
  HttpError,
  Middleware,
} from "routing-controllers";
import { Service } from "typedi";
import { BaseError } from "../../domain/errors/base.error";

type ErrorBody = {
  error: { code: string; message: string; details?: unknown };
};
type ValidationIssue = {
  property: string;
  constraints?: Record<string, string>;
};

function validationIssuesOf(error: HttpError): ValidationIssue[] | undefined {
  const issues = (error as HttpError & { errors?: unknown }).errors;
  return Array.isArray(issues) && issues.length > 0
    ? (issues as ValidationIssue[])
    : undefined;
}

function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  );
}

function toResponse(error: unknown): { status: number; body: ErrorBody } {
  // 1. Erros da aplicação: o próprio erro diz o status e o code.
  if (error instanceof BaseError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  // 2. Erros do routing-controllers (DTO inválido, rota inexistente...).
  if (error instanceof HttpError) {
    const issues = validationIssuesOf(error);
    if (issues) {
      const details = issues.map((issue) => ({
        field: issue.property,
        messages: Object.values(issue.constraints ?? {}),
      }));
      return {
        status: 400,
        body: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Dados inválidos",
            details,
          },
        },
      };
    }
    return {
      status: error.httpCode,
      body: { error: { code: "HTTP_ERROR", message: error.message } },
    };
  }

  // 3. Erros de bibliotecas com status 4xx (ex.: JSON malformado no corpo).
  if (hasStatus(error) && error.status >= 400 && error.status < 500) {
    return {
      status: error.status,
      body: { error: { code: "BAD_REQUEST", message: "Requisição inválida" } },
    };
  }

  // 4. Qualquer outra coisa é um bug: resposta genérica, sem vazar detalhes.
  return {
    status: 500,
    body: {
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
    },
  };
}

@Middleware({ type: "after" })
@Service()
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  error(
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (res.headersSent) return next(error);

    const { status, body } = toResponse(error);
    if (status >= 500) console.error(error);

    res.status(status).json(body);
  }
}
