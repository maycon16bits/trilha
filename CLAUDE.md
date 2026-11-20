# CLAUDE.md

## Projeto

Plataforma web para um curso pré-vestibular (ENEM): alunos resolvem exercícios e acompanham desempenho, faltas e redações; professores cadastram exercícios, materiais e fazem chamada; a coordenação administra turmas, disciplinas e acessos.

Requisitos e regras de negócio estão em `SPEC.md` (fonte da verdade). O plano de tarefas está em `TASKS.md`.

## Modo de trabalho: mentor

O dono do código sou eu: desenvolvedor backend voltando a programar depois de mais de 1 ano. Os objetivos são entregar o app e reciclar conceitos (TypeScript, orientação a objetos, clean architecture, SQL, testes).

- Por padrão, **não escreva a feature inteira**. Fluxo: (1) explique o conceito e o desenho em poucas linhas; (2) eu implemento; (3) você revisa: bugs, violações de arquitetura, alternativas, sempre explicando o porquê.
- Pode gerar direto, sem eu pedir: configuração, boilerplate, seeds de desenvolvimento, Docker, CI e código repetitivo depois que eu já fiz o primeiro exemplo.
- Se eu pedir "faz pra mim", faça, mas explique as decisões e destaque o que devo revisar.
- Quando houver mais de um caminho razoável, mostre 2 opções com trade-offs e recomende uma. Eu decido.
- Passos pequenos, um commit por passo que funciona. Não avance para a próxima tarefa sem eu confirmar.
- Se eu pedir algo que contradiz o `SPEC.md`, avise e pergunte se atualizamos o SPEC.
- Perguntas conceituais: resposta curta com exemplo em TypeScript.

## Stack

- Node + TypeScript (modo `strict`), Express com `routing-controllers`.
- PostgreSQL com migrations versionadas.
- A decidir na tarefa T1.2 (registrar em `docs/adr/`): ORM ou query builder, container de injeção de dependência, biblioteca de validação, test runner, estratégia de autenticação.
- Front-end: só depois da API (provável React + TypeScript).

## Arquitetura

Clean architecture, organizada por módulo e, dentro de cada módulo, por camada:

```
src/
  modules/
    identity/        # usuários, login, aprovação
    academic/        # disciplinas, turmas, matrículas
    questions/       # exercícios, listas, tentativas, dificuldade
    attendance/      # chamadas e presenças
    essays/          # redações e correção
    materials/       # materiais de aula
      domain/          # entidades, value objects, erros de domínio, interfaces (ports)
      application/     # casos de uso (uma classe, um método execute)
      infrastructure/  # repositórios, ORM, storage, hashing
      presentation/    # controllers, DTOs, mapeamento de erros
  shared/            # utilidades e tipos comuns
```

Regras:

- Dependência só aponta para dentro: presentation e infrastructure dependem de application, que depende de domain. **Domain não importa framework, ORM nem Express.**
- Repositórios e serviços externos são interfaces no domain/application, implementadas na infrastructure.
- Controllers são finos: validam a entrada (DTO), chamam um caso de uso e traduzem resultado ou erro.
- Autorização de negócio (quem pode o quê) fica no caso de uso, não só em guards.
- Erros de domínio tipados, traduzidos para HTTP em um único error handler.

## Convenções

- Código e nomes de identificadores em inglês; documentação e comentários de negócio em português. Glossário no `SPEC.md`.
- IDs em UUID. Datas de calendário (chamada) como `DATE`, sem fuso; fuso de referência America/Recife.
- Nunca editar uma migration já aplicada: criar outra.
- Sem segredos no repositório. Sem dados pessoais nos logs (há menores de idade).

## Regras de negócio que não podem quebrar

- A primeira tentativa de um aluno em um exercício nunca é apagada nem alterada; a dificuldade deriva dela.
- O gabarito nunca vai ao aluno antes de ele responder.
- Aluno só vê os próprios dados; professor só vê as turmas que leciona; turma encerrada é somente leitura.
- Disciplinas e turmas são criadas pela coordenação. Nunca fixar nomes de disciplinas no código.
- Fotos de redação e materiais são privados (URL assinada e temporária).

## Qualidade

- Casos de uso: testes unitários com repositórios falsos (in-memory).
- Repositórios: testes de integração contra PostgreSQL real (Docker).
- Antes de dizer que uma tarefa terminou: rodar lint, typecheck e testes.

## Comandos

(preencher na tarefa T1.1: dev, build, lint, test, migrate)
