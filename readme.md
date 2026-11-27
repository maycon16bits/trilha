# Trilha

Plataforma web de estudo e acompanhamento para um curso pré-vestibular (ENEM).

- **Alunos** resolvem exercícios de múltipla escolha, acompanham desempenho, faltas e correções de redação.
- **Professores** cadastram exercícios e materiais, fazem chamada e corrigem redações.
- **Coordenação** administra disciplinas, turmas, convites e a aprovação de alunos.

Não existe cadastro público: toda conta nasce de um **convite exclusivo** criado pela coordenação, e o aluno ainda passa por aprovação antes de acessar a plataforma.

> **Status:** em desenvolvimento — Etapa 1 (Fundação: convites, aprovação, login e autorização). O front-end (Next.js) entra depois da API.

## Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar](#como-rodar)
- [Comandos](#comandos)
- [Banco de dados (Prisma)](#banco-de-dados-prisma)
- [Testes](#testes)
- [Documentação do projeto](#documentação-do-projeto)
- [Roadmap](#roadmap)

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node 26 (`.nvmrc`), TypeScript em modo `strict` |
| HTTP | Express + `routing-controllers` |
| Banco | PostgreSQL 17 (Docker Compose) |
| ORM | Prisma 7 (adapter `pg`), migrations versionadas |
| Injeção de dependência | `typedi` |
| Validação | `class-validator` + `class-transformer` |
| Testes | Jest + `ts-jest` + `supertest` |
| Logs | `winston` |
| Front-end (futuro) | Next.js |

## Arquitetura

Monorepo com npm workspaces. Hoje existe só a API (`apps/api`); o front entra em `apps/web`.

A API segue **clean architecture** com separação por camadas e contextos de negócio (DDD):

```
apps/api/
  prisma/
    schema.prisma      # modelo de dados (fonte da verdade do banco)
    migrations/        # versionadas
  src/
    domain/            # entidades, value objects, erros de domínio, interfaces (ports)
    application/       # casos de uso (uma classe, um método execute)
    http/              # controllers, DTOs, middlewares
    infrastructure/    # config, Prisma, logger, adapters (hash, e-mail, storage)
    app.ts             # monta o Express
    index.ts           # ponto de entrada
```

Regras principais:

- A dependência só aponta para dentro: `http` e `infrastructure` → `application` → `domain`.
- O `domain` não importa Express, Prisma nem nenhum framework.
- Repositórios e serviços externos são interfaces no `domain`, implementadas na `infrastructure`.
- Controllers são finos: validam a entrada, chamam um caso de uso e traduzem o resultado.
- A autorização de negócio (quem pode o quê) é conferida dentro do caso de uso.

Contextos de negócio: `identity`, `academic`, `questions`, `attendance`, `essays`, `materials`.

## Pré-requisitos

- [nvm](https://github.com/nvm-sh/nvm) (ou Node na versão do `.nvmrc`)
- Docker e Docker Compose

## Como rodar

```bash
# 1. Node na versão do projeto
nvm use

# 2. Dependências
npm ci

# 3. Variáveis de ambiente
cp apps/api/.env.example apps/api/.env
# edite apps/api/.env se necessário

# 4. Banco
docker compose up -d db

# 5. Client do Prisma e migrations (dentro de apps/api)
cd apps/api
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
cd ../..

# 6. Servidor em desenvolvimento
npm run dev:api
```

Verifique em `GET http://localhost:3000/health`. A resposta esperada é:

```json
{ "status": "ok", "database": "up" }
```

### Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `DATABASE_URL` | sim | — | URL de conexão do PostgreSQL |
| `PORT` | não | `3000` | Porta da API |

> O arquivo `.env.example` e a geração automática do client do Prisma ainda estão sendo finalizados (tarefas T1.1b e T1.3b do `TASKS.md`).

## Comandos

Executar a partir da raiz do repositório.

| O quê | Comando |
|---|---|
| Instalar dependências | `npm ci` |
| Subir o banco | `docker compose up -d db` |
| Servidor em desenvolvimento | `npm run dev:api` |
| Build | `npm run build -w apps/api` |
| Iniciar o build | `npm run start -w apps/api` |
| Lint | `npm run lint` |
| Corrigir lint | `npm run lint:fix -w apps/api` |
| Typecheck | `npm run typecheck` |
| Formatar | `npm run format -w apps/api` |
| Testes | `npm test -w apps/api` |

## Banco de dados (Prisma)

Rodar dentro de `apps/api`. O arquivo de configuração tem nome diferente do padrão, então é preciso passar `--config`.

| O quê | Comando |
|---|---|
| Gerar o client | `npx prisma generate --config prisma7.config.ts` |
| Criar e aplicar migration (dev) | `npx prisma migrate dev --name <nome> --config prisma7.config.ts` |
| Aplicar migrations existentes | `npx prisma migrate deploy --config prisma7.config.ts` |
| Validar o schema | `npx prisma validate --config prisma7.config.ts` |

Decisões de modelagem que valem destacar:

- `users` guarda só a conta; os dados de cada perfil ficam em `students` e `staff_profiles`.
- Dois estados separados: status da conta (`ACTIVE`, `INACTIVE`) e aprovação do aluno (`PENDING`, `APPROVED`, `REJECTED`).
- O estado do convite (aberto, usado, revogado, expirado) é derivado de datas, não é coluna.
- A dificuldade de um exercício não é armazenada: é uma agregação sobre as primeiras tentativas dos alunos.
- Regras que o Prisma não declara (índices únicos parciais e `CHECK`) entram como SQL manual nas migrations.
- Uma migration já aplicada nunca é editada; mudanças viram migrations novas.

## Testes

- **Casos de uso:** testes unitários com repositórios em memória, sem banco.
- **Repositórios:** testes de integração contra PostgreSQL real (Docker), em planejamento (T1.7c).

```bash
npm test -w apps/api
```

## Documentação do projeto

| Arquivo | Conteúdo |
|---|---|
| [`SPEC.md`](SPEC.md) | Requisitos, regras de negócio, modelo de dados e decisões técnicas (fonte da verdade) |
| [`TASKS.md`](TASKS.md) | Plano de tarefas da etapa atual |
| [`CLAUDE.md`](CLAUDE.md) | Convenções e modo de trabalho com o assistente |
| [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) | Modelo de dados |

## Roadmap

1. **Fundação** (em andamento): convites, aprovação de alunos, login e autorização por papel.
2. Estrutura do curso: disciplinas, turmas e matrículas.
3. Exercícios: cadastro, listas, tentativas e correção.
4. Desempenho do aluno e dificuldade calculada.
5. Chamada e faltas.
6. Materiais.
7. Redações com comentários na foto.
8. Painel do professor.
9. Front-end (Next.js) e publicação.

## Segurança e privacidade

Parte dos usuários é menor de idade, então a privacidade é tratada desde o início: senhas com hash forte, tokens de uso único guardados só como hash, logs sem dados pessoais, arquivos privados acessados por URL assinada e temporária. O checklist completo será publicado no fechamento da Etapa 1.
