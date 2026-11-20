# TASKS — Etapa 1: Fundação

Meta da etapa: um backend rodando com banco, cadastro de aluno com aprovação pela coordenação, cadastro de professor, login e autorização por papel, tudo testado.

## Como trabalhar cada tarefa

1. Peça ao Claude o briefing da tarefa (conceito, desenho, armadilhas).
2. Implemente você mesmo.
3. Peça a revisão do que escreveu.
4. Ajuste, rode lint, typecheck e testes, e faça o commit.

Em cada tarefa: **Pratica** é o conceito que você está reciclando; **Pronto quando** é o critério de conclusão.

---

## T1.1 Setup do projeto
- Repositório Git, Node LTS, TypeScript `strict`, ESLint e Prettier, scripts (dev, build, lint, test), estrutura de pastas do CLAUDE.md.
- **Pratica:** tsconfig, organização por módulo e camada.
- **Pronto quando:** `npm run dev` sobe o servidor e lint e typecheck passam. Preencher a seção Comandos do CLAUDE.md.
- Claude pode gerar as configurações; a estrutura de pastas é sua.

## T1.2 Decisões de arquitetura (ADR)
- Escrever `docs/adr/0001-stack.md` decidindo: ORM ou query builder, container de DI, validação, test runner e estratégia de autenticação (D10 do SPEC).
- **Pratica:** avaliar trade-offs e registrar decisões.
- **Pronto quando:** o ADR existe, com a opção escolhida, as descartadas e o porquê.

## T1.3 Banco e configuração
- Docker Compose com PostgreSQL, variáveis de ambiente validadas na inicialização, conexão, migration inicial e endpoint `/health` que testa o banco.
- **Pratica:** configuração por ambiente, migrations.
- **Pronto quando:** `docker compose up` e `/health` responde com o banco conectado.

## T1.4 Base HTTP
- `routing-controllers` configurado, validação de DTO, error handler global, erros de domínio tipados.
- **Pratica:** middlewares, validação, mapeamento de erros para HTTP.
- **Pronto quando:** um erro de domínio de teste vira a resposta HTTP correta e uma entrada inválida devolve 400 com mensagem clara.

## T1.5 Domínio de usuário
- Entidade `User` com invariantes, value objects (`Email`, regras de senha), enums de papel e status. Testes unitários sem banco.
- **Pratica:** OOP em TypeScript (encapsulamento, invariantes), TDD.
- **Pronto quando:** não dá para criar um `User` inválido e as regras estão cobertas por testes.

## T1.6 Caso de uso: cadastro de aluno
- `RegisterStudent` com as portas `UserRepository` e `PasswordHasher`, repositório in-memory para testes. Regra do menor de idade (responsável e consentimento, RN-17).
- **Pratica:** casos de uso, inversão de dependência, testes com fakes.
- **Pronto quando:** testes cobrem: cadastro válido, e-mail duplicado, menor sem responsável.

## T1.7 Persistência de usuários
- Migrations de `users` e `guardians`, repositório PostgreSQL, mapper entre entidade e linha do banco, testes de integração.
- **Pratica:** modelagem, migrations, separação entre entidade de domínio e modelo de persistência.
- **Pronto quando:** os mesmos testes do repositório in-memory passam contra o PostgreSQL.

## T1.8 Endpoints de cadastro e aprovação
- `POST` de cadastro do aluno, confirmação de e-mail (pode ser simulada em desenvolvimento), listar pendentes, aprovar e rejeitar com motivo (coordenação). Seed de um coordenador inicial para desenvolvimento.
- **Pratica:** controllers finos, DTOs, fluxo de estados.
- **Pronto quando:** o fluxo completo funciona por requisições e as transições de status inválidas são recusadas.

## T1.9 Login e autenticação
- Caso de uso `Login`, emissão de credencial conforme o ADR, `authorizationChecker` e `currentUserChecker` do routing-controllers. Login bloqueado para status diferente de `ACTIVE`.
- **Pratica:** autenticação, hash de senha, tokens ou sessão.
- **Pronto quando:** usuário ativo entra, pendente e rejeitado não, e a mensagem de erro de login é genérica.

## T1.10 Papéis e cadastro de professor
- Autorização por papel nas rotas. Coordenação cadastra professor, que define a senha no primeiro acesso. Limite de tentativas em login e cadastro.
- **Pratica:** autorização, rate limit.
- **Pronto quando:** aluno não acessa rotas da coordenação (teste automatizado) e o professor consegue entrar.

## T1.11 Fechamento da etapa
- README com como rodar o projeto, checklist de segurança básica (hash, mensagens genéricas, logs sem dados pessoais), CI simples rodando lint, typecheck e testes.
- **Pratica:** documentação, CI.
- **Pronto quando:** o CI passa num push e outra pessoa consegue rodar o projeto só pelo README.

---

## Próximas etapas (resumo)

2. Estrutura do curso: disciplinas, turmas, matrículas, encerramento de turma.
3. Exercícios: cadastro, filtros, listas, tentativas, correção.
4. Desempenho do aluno e dificuldade calculada.
5. Chamada e faltas.
6. Materiais.
7. Redações com comentários na foto.
8. Painel do professor.
9. Front-end, segurança, testes com alunos reais e publicação.
