# CLAUDE.md

## Projeto

Plataforma web para um curso pré-vestibular (ENEM): alunos resolvem exercícios e acompanham desempenho, faltas e redações; professores cadastram exercícios, materiais e fazem chamada; a coordenação administra turmas, disciplinas e acessos.

Requisitos, regras de negócio, decisões técnicas e premissas em aberto estão em `SPEC.md` (fonte da verdade). O plano de tarefas está em `TASKS.md`. O modelo de dados está em `apps/api/prisma/schema.prisma`.

## Modo de trabalho: mentor

O dono do código sou eu: desenvolvedor backend voltando a programar depois de mais de 1 ano. Os objetivos são entregar o app e reciclar conceitos (TypeScript, orientação a objetos, clean architecture, SQL, testes).

- Por padrão, **não escreva a feature inteira**. Fluxo: (1) explique o conceito e o desenho em poucas linhas; (2) eu implemento; (3) você revisa: bugs, violações de arquitetura, alternativas, sempre explicando o porquê.
- Pode gerar direto, sem eu pedir: configuração, boilerplate, seeds de desenvolvimento, Docker, CI e código repetitivo depois que eu já fiz o primeiro exemplo.
- Se eu pedir "faz pra mim", faça, mas explique as decisões e destaque o que devo revisar.
- Quando houver mais de um caminho razoável, mostre 2 opções com trade-offs e recomende uma. Eu decido.
- Passos pequenos, um commit por passo que funciona. Não avance para a próxima tarefa sem eu confirmar.
- Se eu pedir algo que contradiz o `SPEC.md`, avise e pergunte se atualizamos o SPEC.
- Se o plano mudar (estrutura, decisões, modelo de dados), atualize `SPEC.md`, `TASKS.md` e este arquivo junto com a mudança.
- Perguntas conceituais: resposta curta com exemplo em TypeScript.
- Sem pasta de ADR: decisões técnicas ficam no `SPEC.md` (§9).

## Stack

- Node 26 (`.nvmrc`) + TypeScript (modo `strict`), Express com `routing-controllers`.
- PostgreSQL 17 (Docker Compose) com Prisma 7 (adapter `pg`) e migrations versionadas.
- `typedi` (injeção de dependência), `class-validator` e `class-transformer` (validação), Jest com `ts-jest` e `supertest` (testes), `winston` (logs).
- Hash de senha: scrypt do `node:crypto` (D15), com salt e parâmetros guardados no próprio hash. Política de senha: D14.
- Ainda em aberto, a decidir nas tarefas indicadas: estratégia de autenticação (D10, T1.9). Ver `SPEC.md` §9.
- Front-end: Next.js, só depois da API.

## Estrutura do repositório

Monorepo com npm workspaces (`apps/*`). Hoje existe só `apps/api`; o front entra depois em `apps/web`.

```
apps/api/
  prisma/
    schema.prisma      # modelo de dados (fonte da verdade do banco)
    migrations/        # versionadas, nunca editar uma já aplicada
  src/
    domain/            # entidades, value objects, enums, erros de domínio, interfaces (ports)
      errors/          # erros base e tipados (sem conhecer HTTP)
      identity/        # contexto atual; depois: academic/, questions/, attendance/, essays/, materials/
        value-objects/
    application/       # casos de uso (uma classe, um método execute). A criar na T1.6
    http/              # controllers, DTOs, middlewares (presentation)
      controllers/
      middleware/
    infrastructure/    # config (env), database (Prisma), logger, adapters (hash, e-mail, storage)
    generated/         # client do Prisma (gerado, fora do Git)
    app.ts             # monta o Express (createApp)
    index.ts           # ponto de entrada
```

Contextos de negócio: `identity` (contas, perfis, login, aprovação), `academic` (disciplinas, turmas, matrículas), `questions` (exercícios, listas, tentativas, dificuldade), `attendance` (chamadas), `essays` (redações), `materials`. Dentro de `domain/`, cada contexto ganha uma pasta; em `application/` e `infrastructure/`, seguir o mesmo nome de contexto quando houver mais de um.

Regras:

- Dependência só aponta para dentro: http e infrastructure dependem de application, que depende de domain. **Domain não importa framework, ORM nem Express.** Nada de `generated/prisma` dentro de `domain/` ou `application/`.
- Repositórios e serviços externos são interfaces (ports) no domain, implementadas na infrastructure.
- Controllers são finos: validam a entrada (DTO), chamam um caso de uso e traduzem resultado ou erro.
- Autorização de negócio (quem pode o quê) fica no caso de uso, não só em guards.
- Erros de domínio tipados, traduzidos para HTTP em um único error handler.
- Se os casos de uso podem ou não usar decorators do `typedi`: em aberto (D19).

## Modelo de dados

- `users` guarda só a conta (nome, e-mail, senha, telefone, papel, status). Dados específicos ficam em `students` (aluno) e `staff_profiles` (professor e coordenação). Não colocar campos de aluno em `users`.
- Todo aluno tem exatamente um contato de emergência (`emergency_contacts`: nome, parentesco, telefone e `is_guardian`, que diz se a pessoa é o responsável pelo aluno). Professor e coordenação não têm. O banco não impede aluno sem contato: é regra do caso de uso (RN-24).
- Dois estados: `users.status` (conta: `ACTIVE`, `INACTIVE`) e `students.approval_status` (`PENDING`, `APPROVED`, `REJECTED`).
- **Não existe cadastro público.** Toda conta nasce de um convite (`invitations`) criado pela coordenação com e-mail e telefone, que o convidado não pode alterar. Aceitar o convite é enviar o formulário: a conta (`users` + perfil) nasce nesse momento, e a senha nunca é guardada antes (o convite não é uma conta). O convite é de uso único, com validade e revogável. O papel do gestor é `COORDINATOR`.
- O e-mail não é verificado e serve só para login.
- A idade do aluno não é armazenada; calcula-se a partir de `birth_date`.
- A dificuldade do exercício não é coluna; é agregação sobre `attempts`.
- O enunciado do exercício é uma lista ordenada de blocos (`question_blocks`), no mínimo 3, e o último é o enunciado (RN-26). Os tipos de bloco ainda são provisórios (D25).
- Índices únicos parciais e `CHECK` que o Prisma não declara entram como SQL manual na migration (lista no `SPEC.md` §7.3). Como as migrations já foram aplicadas, mudanças no schema viram migrations novas.

## Convenções

- Código e nomes de identificadores em inglês; documentação e comentários de negócio em português. Glossário no `SPEC.md`.
- Prisma: modelos em PascalCase singular, tabelas e colunas em `snake_case` via `@@map` e `@map`.
- IDs em UUID. Datas de calendário (chamada, nascimento) como `DATE`, sem fuso; fuso de referência America/Recife.
- Nunca editar uma migration já aplicada: criar outra.
- Sem segredos no repositório. Sem dados pessoais nos logs (há menores de idade).
- Prettier: 120 colunas, aspas duplas, ponto e vírgula, vírgula final. ESLint com `typescript-eslint`; `any` gera aviso.
- Dependências são declaradas no workspace que as usa (`apps/api`), não na raiz. Versões exatas (`save-exact` no `.npmrc`).

## Regras de negócio que não podem quebrar

- A primeira tentativa de um aluno em um exercício nunca é apagada nem alterada; a dificuldade deriva dela.
- O gabarito nunca vai ao aluno antes de ele responder.
- Aluno só acessa com conta `ACTIVE` e aprovação `APPROVED`; aluno pendente ou rejeitado só vê a tela de estado. A aprovação é conferida no banco a cada requisição, não no token. Aluno só vê os próprios dados; professor só vê as turmas que leciona; turma encerrada é somente leitura.
- E-mail e telefone de um convite nunca vêm do corpo da requisição de aceite; o link do convite é segredo (não vai para log; consumir por `POST`).
- Só a coordenação justifica falta; o professor vê a justificativa e pode corrigir um lançamento errado de chamada (RN-25).
- Disciplinas e turmas são criadas pela coordenação. Nunca fixar nomes de disciplinas no código.
- Fotos de redação e materiais são privados (URL assinada e temporária).
- Tokens de uso único (convite, recuperação de senha): só o hash é guardado, com expiração.

## Qualidade

- Casos de uso: testes unitários com repositórios falsos (in-memory).
- Repositórios: testes de integração contra PostgreSQL real (Docker).
- Antes de dizer que uma tarefa terminou: rodar lint, typecheck e testes.

## Comandos

Rodar a partir da raiz do repositório, salvo indicação. Usar o Node do `.nvmrc` (`nvm use`).

| O quê | Comando |
|---|---|
| Instalar dependências | `npm ci` |
| Subir o banco | `docker compose up -d db` |
| Servidor em desenvolvimento | `npm run dev:api` (compila e reinicia ao salvar) |
| Build | `npm run build -w apps/api` |
| Iniciar o build | `npm run start -w apps/api` |
| Lint (raiz) | `npm run lint` |
| Corrigir lint | `npm run lint:fix -w apps/api` |
| Typecheck (raiz) | `npm run typecheck` |
| Formatar | `npm run format -w apps/api` |
| Testes | `npm test -w apps/api` |

Prisma (rodar dentro de `apps/api`; o Prisma encontra o `prisma7.config.ts` sozinho, não precisa de `--config`):

| O quê | Comando |
|---|---|
| Gerar o client | `npx prisma generate` |
| Criar e aplicar migration (dev) | `npx prisma migrate dev --name <nome>` |
| Aplicar migrations existentes | `npx prisma migrate deploy` |
| Validar o schema | `npx prisma validate` |

Variáveis de ambiente: copiar `apps/api/.env.example` para `apps/api/.env` (ainda a criar, T1.3b). `DATABASE_URL` é obrigatória; `PORT` padrão 3000.

Pendente na T1.1b: script `test` na raiz, `.env.example`, geração automática do client Prisma.
