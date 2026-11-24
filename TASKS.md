# TASKS — Etapa 1: Fundação

Meta da etapa: um backend rodando com banco, **convite exclusivo** para alunos e professores, aprovação do aluno pela coordenação, login e autorização por papel, tudo testado.

Atualizado em 22/11/2026 (commit `4c19b74` no GitHub + schema Prisma novo). IDs mantêm a numeração original; letras (a, b, c) são sub-passos.

## Como trabalhar cada tarefa

1. Peça ao Claude o briefing da tarefa (conceito, desenho, armadilhas).
2. Implemente você mesmo.
3. Peça a revisão do que escreveu.
4. Ajuste, rode lint, typecheck e testes, e faça o commit.

Em cada tarefa: **Pratica** é o conceito que você está reciclando; **Pronto quando** é o critério de conclusão.

## O fluxo que as tarefas implementam

1. A coordenação (gestor) cria um **convite** com e-mail e telefone do selecionado e envia o link por e-mail ou WhatsApp.
2. A pessoa abre o link, vê e-mail e telefone **bloqueados** e preenche o resto. Para aluno: dados pessoais e escolares. Para professor: nome, senha e perfil.
3. **Aluno:** a conta nasce `ACTIVE` com aprovação `PENDING`; ele entra, mas só vê "aguardando aprovação". A coordenação confere no painel e aprova ou rejeita.
4. **Professor:** a conta nasce `ACTIVE`, sem aprovação (D22).
5. Não existe cadastro público e e-mail não é confirmado.

## Estado atual

| Tarefa | Situação | O que falta |
|---|---|---|
| T1.1 Setup | Feita, com pendências | Script `test` na raiz; `engines.node` (`>=24`) × `.nvmrc` (26.13.1); decidir sobre as pastas de skills do Prisma versionadas (`apps/api/.agents`, `.claude`, `.windsurf`, `skills-lock.json`) |
| T1.2 Decisões técnicas | Parcial | Faltam autenticação (D10) e hash (D15); registrar no SPEC §9 (sem ADR) |
| T1.3 Banco e config | Quase pronta | O schema (23 tabelas) e a migration inicial existem **só na sua máquina**: commitar. Faltam `.env.example` e geração automática do client |
| T1.4 Base HTTP | Pronta, com ressalvas | Ver T1.4b |
| T1.5 Domínio de identidade | Em andamento | `Email` pronto; faltam enums novos, telefone, senha, `User`, `Student`, `StaffProfile`, `Guardian`, `Invitation` |
| T1.6 a T1.11 | Não iniciadas | — |

## Ordem sugerida

1. T1.1b, T1.3b, T1.4b (pendências rápidas; evitam retrabalho)
2. T1.5a a T1.5i (domínio)
3. T1.6a a T1.6e (casos de uso com fakes)
4. T1.7a a T1.7c (persistência)
5. T1.8a (seed), T1.9a a T1.9c (login), T1.10a (autorização): a coordenação precisa conseguir entrar antes de criar convites
6. T1.8b a T1.8d (endpoints de convite, aceite e painel de aprovação)
7. T1.10b, T1.10c
8. T1.11

## Decisões em aberto que travam tarefas

Estão no `SPEC.md` §9.2. Resolva cada uma antes de chegar na tarefa indicada.

| Decisão | Trava | Recomendação |
|---|---|---|
| D14 regras de senha | T1.5d | definir mínimo e máximo; máximo ≤ 72 bytes se for bcrypt |
| D18 campos de `staff_profiles` | T1.5g | listar o que você quer guardar do professor |
| D24 consentimento do menor | T1.5h | seguir sem exigir responsável até falar com o curso (regra isolada, fácil de mudar) |
| D19 casos de uso com ou sem `typedi` | T1.6a | classes simples + composition root, para a camada application não depender de framework |
| D23 validade do convite | T1.6b | 7 dias, configurável |
| D22 professor sem aprovação | T1.6e | confirmar com o curso |
| D15 bcrypt ou argon2 | T1.8b | considerar instalação em Docker e CI |
| D10 autenticação (JWT ou sessão) | T1.9b | decidir como revogar acesso de usuário inativado |
| D13 aprovar × matricular | T1.8d | aprovar só muda o status; matrícula na Etapa 2 |
| D21 aluno rejeitado | T1.8d | definir: fim do processo ou novo convite |
| D16 RF-05 e RF-06 na Etapa 1? | T1.9 | decidir antes de fechar a etapa; sem confirmação de e-mail, recuperar senha por e-mail exige cuidado |

Já decididas: D12 (aluno pendente entra e vê só o estado), D17 (professor entra por convite), D20 (migration inicial inteira).

---

## Pendências das tarefas anteriores

### T1.1b Fechar o setup
- Scripts de raiz: adicionar `test` (e `build`), pois o CLAUDE.md exige rodar lint, typecheck e testes.
- Alinhar `engines.node` com o `.nvmrc`.
- Decidir sobre as pastas de skills do Prisma (cerca de 80 arquivos): manter de propósito ou colocar no `.gitignore`.
- Renomear `apps/api/prisma7.config.ts` para `prisma.config.ts`: assim o Prisma o encontra sozinho e some o `--config` de todos os comandos (atualizar a seção Comandos do CLAUDE.md).
- **Pronto quando:** `npm run lint`, `npm run typecheck` e `npm test` funcionam a partir da raiz; a seção Comandos do CLAUDE.md bate com o que existe e você executou cada comando.

### T1.2 Decisões técnicas (sem ADR)
- Decisões já tomadas estão no SPEC §9.1. Faltam: autenticação (D10) e algoritmo de hash (D15).
- Para cada uma: opções, escolha, consequência, escrito em 3 a 5 linhas no SPEC §9.
- Pontos a enfrentar: se JWT, como revogar (usuário inativado, logout); se sessão, onde guarda; qual o limite de tamanho de senha do algoritmo.
- **Pratica:** avaliar trade-offs e registrar decisões.
- **Pronto quando:** D10 e D15 saem de "Aberta" no SPEC, com o porquê.

### T1.3b Fechar banco e configuração
- Commitar `prisma/schema.prisma` e `prisma/migrations` (hoje só existem localmente; o GitHub não tem nenhum dos dois).
- Criar `apps/api/.env.example` (`DATABASE_URL`, `PORT`, `LOG_LEVEL`, `WEB_BASE_URL` para montar o link do convite...), sem segredos reais. O `.gitignore` já prevê `!.env.example`.
- Tornar a geração do client Prisma automática. Hoje `src/generated` é ignorado pelo Git, então um clone novo falha no typecheck e nos testes até alguém rodar `prisma generate`. Opções: script `postinstall` ou passo documentado e no CI. Teste num clone limpo.
- **Pronto quando:** clone limpo → `npm ci` → copiar `.env.example` → `docker compose up -d db` → `npm run dev:api` → `GET /health` responde `{status: "ok", database: "up"}`; e `npm run typecheck` e `npm test` passam sem passo manual escondido.

### T1.4b Fechar a base HTTP
1. **Status HTTP nos erros de domínio.** O `BaseError` guarda `statusCode`, ou seja, o domain conhece HTTP, e já há erros errados: `InvalidEmailError` devolve 403 e `WeakPasswordError` devolve 401. Os dois são erro de entrada (400). Opção A: corrigir os números e manter. Opção B: o domain guarda só `code` e o error handler mapeia `code → status` num lugar só. Recomendo B, antes de existirem dezenas de erros. Se B, ajustar os testes existentes.
2. **404 em JSON.** Rota inexistente hoje devolve a página HTML do Express. Deve virar `NOT_FOUND` no formato `{ error: { code, message } }`, com teste.
3. **Erros que vão faltar:** `Forbidden` (403), `NotFound` (404), `Conflict` já existe, e um para transição de estado inválida. Criar só os que a Etapa 1 exigir.
4. **Erros do routing-controllers** (`AuthorizationRequiredError`, `AccessDeniedError`): mapear para 401 e 403 com códigos próprios; hoje caem em `HTTP_ERROR` genérico.
5. **Mensagens de erro:** escolher um idioma para o que o usuário vê. Hoje o `Email` usa inglês e os demais erros usam português.
6. **Logger.** Nome do serviço já corrigido. Falta: colocar `logs` e `*.log` no `.gitignore` (o logger grava em `logs/` relativo à pasta de execução), trocar `any` por `Record<string, unknown>` (8 avisos de lint) e decidir se integra (injetar `ILogger` no error handler no lugar de `console`) ou apaga até precisar. Nunca logar e-mail, telefone, nome, corpo da requisição nem o token do convite (que vem na URL ou no corpo).
7. **Dependências no lugar certo.** `routing-controllers` e `winston` estão na raiz; `winston` não está declarado em `apps/api`. Na raiz: `npm uninstall routing-controllers winston`; depois `npm install winston routing-controllers -w apps/api`.
8. **Aviso do ts-jest** (TS151002): ativar `isolatedModules` no `tsconfig` ou ajustar o jest.
9. **Estado global do typedi nos testes.** O `Container` global guarda uma instância só (comentário em `app.spec.ts`). Isso vai atrapalhar os testes HTTP das T1.8 a T1.10; planeje um container por app ou reset entre testes.
- **Pronto quando:** rota inexistente devolve 404 JSON (teste); a decisão do item 1 está aplicada e `InvalidEmailError` e `WeakPasswordError` devolvem 400; 401 e 403 saem no formato padrão (testes); zero avisos de lint; `logs` ignorado pelo Git; dependências declaradas só onde são usadas.

---

## T1.5 Domínio de identidade

Tudo em `src/domain/identity`, sem importar Express, Prisma ou typedi, com testes unitários sem banco. O modelo segue o schema: `User` (conta), `Student` (perfil do aluno, com aprovação), `StaffProfile` (professor e coordenação), `Guardian` (responsável) e `Invitation` (convite).

### T1.5a Value object `Email` ✔
- Feito (`email.vo.ts` e testes). Falta apenas o erro dele devolver 400 (T1.4b, item 1).

### T1.5b Enums ajustados ao modelo
- `UserStatus`: apenas `ACTIVE` e `INACTIVE`. Remover `PENDING_EMAIL`, `INVITED`, `PENDING_APPROVAL` e `REJECTED` se ainda existirem no domínio.
- **Criar:** `ApprovalStatus` (`PENDING`, `APPROVED`, `REJECTED`), `EducationLevel`, `SchoolSituation` (`STUDYING`, `FINISHED`), `SchoolType` (`PUBLIC`, `PRIVATE`). `UserRole` já está certo.
- **Pronto quando:** os valores batem exatamente com o `schema.prisma`; nenhum arquivo do domain importa os enums gerados pelo Prisma.

### T1.5c Value object `Phone`
- O telefone vem do convite e é imutável para o convidado, então precisa de formato canônico. Decidir como normalizar e armazenar (sugestão: só dígitos, com o código do país, por exemplo `5581999998888`) e quais formatos brasileiros aceitar (DDD + 8 ou 9 dígitos; entrada com parênteses, espaços e hífen).
- **Pratica:** value object com normalização, como o `Email`.
- **Pronto quando:** testes para formatos válidos com máscara, sem DDD, curto demais, com letras e vazio; dois formatos do mesmo número são iguais (`equals`); erro tipado de entrada inválida (400).

### T1.5d Senha
- Resolver D14 (regras de senha) e registrar no SPEC.
- Separar dois conceitos: a senha digitada (validada pelas regras, `WeakPasswordError`) e o hash (texto opaco, produzido pelo `PasswordHasher`). A entidade só aceita o hash.
- Nenhum `toString`, `toJSON` ou mensagem de erro pode expor a senha.
- **Pronto quando:** testes para curta, longa, vazia e válida; `JSON.stringify` e mensagens de erro não contêm a senha.

### T1.5e Entidade `User`
- Só a conta: id (UUID), papel, status, nome, `Email`, hash de senha (sempre presente), `Phone` (opcional), datas.
- Construtor privado; fábricas estáticas que validam invariantes; `restore` para reconstruir do banco sem reaplicar regras de "novo usuário".
- A conta nasce `ACTIVE`. Métodos de negócio: inativar e reativar (se D16 trouxer RF-06). Transição inválida lança erro de domínio tipado.
- Passar o "agora" como parâmetro (ou um `Clock`) para os testes não dependerem do relógio.
- **Pronto quando:** não existe forma de criar `User` inválido (um teste por invariante); sem setters públicos; `restore` reconstrói qualquer estado válido sem lançar.

### T1.5f Entidade `Student` e idade
- Perfil do aluno: data de nascimento, escolaridade, escola, situação, tipo de escola (opcional), aprovação (`approval_status`, aprovador, data, motivo). Nasce `PENDING`.
- Cálculo da idade (RN-19) com data de referência vinda de um `Clock` (America/Recife). Casos: 17 anos e 364 dias, 18 anos exatos hoje, nascimento em 29/02, nascimento no futuro (inválido).
- Transições: aprovar (`PENDING → APPROVED`, registra quem e quando), rejeitar (`PENDING → REJECTED`, motivo obrigatório). Outras transições lançam `InvalidStatusTransitionError` (o que acontece depois de rejeitar: D21).
- Regra de acesso da RN-01: onde mora "aluno acessa só com conta `ACTIVE` e `APPROVED`"? Sugestão: um método ou serviço de domínio que recebe o `User` e o `Student`.
- **Pronto quando:** testes de idade e de transição; rejeitar sem motivo é recusado; nenhum teste depende da data real.

### T1.5g Entidade `StaffProfile`
- Perfil de professor e coordenação. Resolver D18 (quais campos).
- **Pronto quando:** criação válida e inválida testadas; campos batem com o schema.

### T1.5h Responsável (`Guardian`)
- Responsável: nome, parentesco, contato, `consented_at`, versão da política.
- **RN-17 está em revisão (D24):** hoje o menor preenche sozinho. Implemente a entidade e o cálculo "é menor?", mas isole a regra "menor exige responsável" num único ponto (uma função ou política), de modo que ligar, desligar ou mudar seja uma alteração pequena. Decida se, enquanto D24 está aberta, a regra fica desligada.
- **Pronto quando:** `Guardian` válido e inválido testado; a regra de exigência está num só lugar, com teste do comportamento escolhido.

### T1.5i Entidade `Invitation`
- Campos: papel (por enquanto só `STUDENT` ou `TEACHER`; `COORDINATOR` é recusado), `Email`, `Phone`, hash do token, quem convidou, validade, usado em, revogado em, conta criada.
- O estado **não** é um campo: é derivado (`OPEN`, `USED`, `REVOKED`, `EXPIRED`) a partir dos instantes e do "agora". Defina e teste a fronteira da validade (no instante exato da expiração já está expirado?).
- Métodos: criar (valida papel permitido), aceitar (só se `OPEN`; registra a conta criada e o instante), revogar (só se `OPEN`). Outras tentativas lançam erro de domínio tipado distinto para cada estado.
- O token em texto puro **não** vive na entidade: só o hash (SHA-256 em hexadecimal tem 64 caracteres, o tamanho da coluna). Quem gera o token é uma porta (T1.6a).
- **Pratica:** estado derivado em vez de coluna de status.
- **Pronto quando:** testes para cada estado × cada ação (tabela), incluindo a fronteira da validade; papel `COORDINATOR` e `STUDENT` na criação recusados ou aceitos conforme a regra escolhida; nenhum teste usa a data real.

---

## T1.6 Casos de uso do convite

### T1.6a Portas, `Actor` e fakes
- Decidir D19 (typedi nos casos de uso ou composition root).
- **`Actor`:** quem age (id e papel), passado a todo caso de uso. A conferência "é coordenador?" acontece **dentro** do caso de uso.
- Portas: `UserRepository`, `InvitationRepository` (buscar por hash do token, buscar convite aberto por e-mail), `PasswordHasher`, `TokenGenerator` (devolve o token puro e o hash), `Clock`.
- Aceitar um convite grava a conta, o perfil e o convite consumido **de uma vez**. Opção A: repositórios separados e um mecanismo de transação. Opção B: uma porta que faz a operação inteira, atomicamente. Recomendo B para este tamanho de projeto.
- `InMemory…` e fakes determinísticos. Testes dos repositórios como **suíte de contrato** reutilizável (a T1.7 roda a mesma suíte contra o PostgreSQL).
- **Pronto quando:** a suíte de contrato passa contra os repositórios in-memory; nenhuma interface importa framework ou ORM.

### T1.6b `CreateInvitation` e `RevokeInvitation`
- Só coordenação. Valida e-mail e telefone (VOs), recusa e-mail que já tem **conta**, e recusa ou substitui convite aberto do mesmo e-mail (RN-22: só um aberto; reemitir revoga o anterior). Validade vem de configuração (D23).
- Devolve o token em texto puro **uma única vez**, para a coordenação montar o link. Guarda só o hash.
- **Pronto quando:** testes para convite válido, papel inválido, e-mail já com conta, e-mail com convite aberto, reemitir, revogar convite aberto, revogar convite já usado (recusado), aluno e professor tentando criar (recusado).

### T1.6c `GetInvitation` (consulta)
- Recebe o token, devolve papel, e-mail e telefone para pré-preencher o formulário, ou o motivo de não servir (inexistente, expirado, usado, revogado). Nunca devolve o hash nem dados de quem convidou.
- Decidir e registrar se a resposta HTTP diferencia "expirado" de "inexistente" (sugestão: sim, com a mensagem "fale com a coordenação", já que o token é aleatório e impossível de adivinhar).
- **Pronto quando:** testes para os quatro estados e para token que nunca existiu.

### T1.6d `AcceptStudentInvitation`
- Entrada: token e dados do formulário (nome, senha, data de nascimento, escolaridade, escola, situação, tipo e, se aplicável, responsável). **E-mail e telefone vêm do convite, nunca da entrada.**
- Fluxo: validar o convite, gerar o hash da senha, criar `User` (`STUDENT`, `ACTIVE`) + `Student` (aprovação `PENDING`) + `Guardian` se houver, marcar o convite usado, salvar tudo numa operação.
- Papel e status vêm do caso de uso, nunca da entrada. Saída: só o id.
- Dois aceites simultâneos do mesmo token: um sucesso, um erro (a garantia final é do banco, T1.7c).
- **Pronto quando:** testes para aceite válido, token expirado/usado/revogado, convite de professor usado no fluxo de aluno (recusado), senha inválida, menor (conforme a decisão da T1.5h), senha pura nunca persistida, e-mail/telefone vindos da entrada ignorados.

### T1.6e `AcceptTeacherInvitation`
- Mesmo desenho, para convite `TEACHER`: cria `User` (`TEACHER`, `ACTIVE`) + `StaffProfile`. Sem fila de aprovação (D22).
- Reaproveite a validação do convite entre os dois casos de uso; evite duplicar a lógica.
- **Pronto quando:** testes análogos aos da T1.6d; professor nasce `ACTIVE`.

---

## T1.7 Persistência de identidade

### T1.7a Migration de ajuste
- O `schema.prisma` mudou depois da sua migration inicial: sai `PENDING_EMAIL`/`INVITED` de `UserStatus`, sai `email_confirmed_at`, `password_hash` vira obrigatório, `AuthTokenType` fica só com `PASSWORD_RESET`, entra a tabela `invitations`.
- Gerar com `prisma migrate dev --name invitation_flow`. Não há dados em produção; se o seu banco local tiver linhas de teste, o Prisma avisa e pede reset.
- Conferir que existe no SQL manual: índice único parcial de `choices` e de `attempts`, `CHECK` de `essays` e o novo índice único parcial de `invitations` (`email` onde `used_at IS NULL AND revoked_at IS NULL`). Os que faltarem entram numa migration com SQL escrito à mão.
- **Pronto quando:** a cadeia de migrations aplica do zero num banco vazio (`migrate reset`); a pasta `migrations` está commitada; os nomes batem com o SPEC §7.

### T1.7b Mapper e repositórios PostgreSQL
- Repositórios Prisma das portas da T1.6a, com mappers nos dois sentidos (usando `restore`). A tradução de enums do Prisma para os do domínio mora no mapper.
- Violação de unicidade (`P2002`) vira o erro de domínio correspondente (e-mail duplicado, convite aberto duplicado).
- O aceite grava `users`, `students`/`staff_profiles` (+ `guardians`) e atualiza `invitations` dentro de uma **transação**, com condição `used_at IS NULL` na atualização do convite.
- **Pronto quando:** teste de ida e volta (entidade → linha → entidade igual); `domain/` e `application/` não importam `generated`, `@prisma` nem `express`.

### T1.7c Testes de integração
- Banco de testes separado do de desenvolvimento. Configuração Jest própria (`*.int.spec.ts`, script `test:integration`, em série). Aplicar migrations antes da suíte; limpar as tabelas entre testes.
- Rodar a suíte de contrato da T1.6a contra o PostgreSQL, mais o que só o banco prova: dois aceites simultâneos do mesmo token (um sucesso, um erro); dois convites abertos para o mesmo e-mail (o banco recusa); `students.user_id` só para papel `STUDENT` (RN-21).
- **Pronto quando:** os mesmos testes dos repositórios in-memory passam no PostgreSQL; `npm test` (unitários) segue sem precisar de banco.

---

## T1.8 Endpoints (convite, aceite e painel de aprovação)

### T1.8a Seed do coordenador (desenvolvimento)
- Script idempotente; e-mail e senha vêm de variáveis de ambiente. Cria `User` (`COORDINATOR`, `ACTIVE`) + `StaffProfile` pelo domínio e pelo `PasswordHasher` real. Recusa rodar com `NODE_ENV=production`.
- **Pronto quando:** `npm run seed` cria o coordenador; rodar de novo não falha nem duplica; nenhuma senha real no repositório.

### T1.8b Endpoints de convite (coordenação)
- Resolver D15 e implementar o adapter real do `PasswordHasher` (teste: hash diferente da senha, hashes diferentes para a mesma senha, verify certo e errado) e o `TokenGenerator` (32 bytes aleatórios, hash SHA-256).
- Rotas da coordenação: criar convite (resposta com o link, **só nessa resposta**), listar convites com o estado, revogar, reemitir. O link usa `WEB_BASE_URL` (variável validada em `Env`).
- Interface útil para o gestor (para o front, depois): botão "copiar link" e link `wa.me` com a mensagem pronta.
- **Pronto quando:** teste HTTP para criar, listar, revogar e reemitir; a listagem **não** devolve o token nem o hash; sem token 401; aluno e professor 403; o link só aparece na resposta de criação.

### T1.8c Consulta e aceite do convite (rotas públicas)
- O token é um segredo: para não cair em log de acesso nem em cache, **consulta e aceite usam `POST` com o token no corpo** (por exemplo `POST /invitations/lookup` e `POST /invitations/accept/student`), não token na URL.
- DTO de aceite **sem** campos de e-mail e telefone: com `forbidNonWhitelisted`, enviá-los dá 400 (teste). O mesmo vale para `role`, `status` e `approvalStatus`.
- Mapear os erros de convite (inexistente, expirado, usado, revogado) para respostas claras no formato padrão.
- **Pronto quando:** teste HTTP de aceite de aluno e de professor; convite reaproveitado dá erro; tentativa de enviar e-mail diferente do convite é recusada; a resposta nunca contém hash nem token.

### T1.8d Painel de aprovação (coordenação)
- Casos de uso `ListPendingStudents`, `GetPendingStudent` (dados completos para conferência), `ApproveStudent`, `RejectStudent` (motivo obrigatório). Cada um recebe o `Actor` e confere que é coordenador.
- Decidir D21 (o que acontece com o aluno rejeitado) e D13 (aprovar só muda o status; matrícula é a Etapa 2).
- Aprovar registra aprovador e data. Opcional: gravar em `audit_logs`.
- **Pronto quando:** fluxo completo por requisições (aceite → aparece na lista → aprovar ou rejeitar → sai da lista); aprovar quem já está `APPROVED` ou `REJECTED` é recusado; rejeitar sem motivo dá 400; sem token 401, token de aluno ou professor 403.

---

## T1.9 Login e autenticação

### T1.9a Caso de uso `Login`
- Porta `TokenService` e o caso de uso. Credenciais erradas e e-mail inexistente: **mesma** resposta (mesmo código e mensagem) e, se possível, mesmo tempo (verificar hash contra um hash falso quando o e-mail não existe).
- Aluno com aprovação `PENDING` ou `REJECTED` **consegue entrar** (D12): o login responde com o papel e o estado da aprovação. Conta `INACTIVE`: definir e testar (sugestão: mensagem específica só depois de acertar a senha).
- **Pronto quando:** testes para ativo e aprovado, aluno pendente, aluno rejeitado, conta inativa, senha errada, e-mail inexistente (resposta idêntica à da senha errada), e-mail com maiúsculas diferentes; o token não carrega dados pessoais (só id e papel).

### T1.9b Emissão e verificação de credencial
- Implementar a estratégia da D10. Segredo vem de variável de ambiente validada na inicialização (acrescentar em `Env`; tamanho mínimo). Vida curta. Se houver refresh em cookie: `httpOnly`, `Secure`, `SameSite`, e pensar em CSRF.
- Endpoints de login e logout. Resposta: papel e estados, nunca o hash.
- **Pronto quando:** token expirado, adulterado e de outro segredo são recusados; a aplicação não sobe sem o segredo; logout invalida a credencial conforme a estratégia.

### T1.9c `authorizationChecker`, `currentUserChecker` e estado do aluno
- Configurar `@Authorized()`, `@Authorized(papel)` e `@CurrentUser()`. Decidir se cada requisição recarrega o usuário do banco (inativação vale na hora) ou confia no token até expirar, e registrar o porquê. 401 e 403 distintos, no formato padrão.
- **A aprovação nunca vem do token:** o guard das rotas de aluno consulta `approval_status` no banco a cada requisição (RN-01).
- Rota `GET /me`: devolve o próprio papel e estados. É a **única** rota que um aluno `PENDING` ou `REJECTED` alcança.
- **Pronto quando:** rota de teste protegida: sem token 401, token válido 200, papel errado 403; aluno pendente ou rejeitado recebe 403 em qualquer rota de aluno e 200 em `/me`; ao ser aprovado passa a acessar sem fazer login de novo; usuário inativado perde o acesso (conforme a estratégia, testado).

---

## T1.10 Autorização e limites

### T1.10a Autorização dentro dos casos de uso
- Revisar todos os casos de uso exclusivos da coordenação (criar, revogar e listar convites; listar, aprovar e rejeitar alunos): a conferência do `Actor` acontece no caso de uso, além do guard da rota.
- **Pronto quando:** teste unitário (sem HTTP) de cada um: aluno e professor são recusados.

### T1.10b Limite de tentativas
- Rate limit no login e nas rotas públicas do convite (consulta e aceite), por IP e, no login, também por e-mail. Atenção a `trust proxy`. Armazenamento em memória zera ao reiniciar; registrar a limitação. Resposta 429 no formato padrão, com limites configuráveis por variável de ambiente.
- **Pronto quando:** a (N+1)-ésima tentativa recebe 429 e outras rotas não são afetadas; os limites vêm de configuração validada.

### T1.10c Teste de autorização por papel
- Teste em tabela: cada rota protegida × (sem token, aluno pendente, aluno aprovado, professor, coordenação).
- **Pronto quando:** aluno não acessa nenhuma rota da coordenação (automatizado); professor entra e acessa só o que é do papel dele; criar uma rota nova sem entrada na tabela é fácil de notar na revisão.

---

## T1.11 Fechamento da etapa
- README: pré-requisitos, `nvm use`, instalar, `.env`, banco, gerar client, migrar, seed, rodar, testar (unitário e integração), como criar o primeiro convite, problemas comuns.
- Checklist de segurança, com evidência de cada item (no README ou no SPEC): hash forte; mensagens de login genéricas; logs sem dados pessoais e **sem o token do convite** (procurar no código e olhar a saída da aplicação); **CORS restrito** (hoje não há CORS configurado); cabeçalhos de segurança (por exemplo `helmet`); rate limit; token do convite só como hash no banco; nenhum segredo no repositório; `npm audit` revisado. Para o front, depois: `Referrer-Policy: no-referrer` na página do convite.
- CI (GitHub Actions): Node pela `.nvmrc`, serviço PostgreSQL, `npm ci`, geração do client, migrations, lint, typecheck, testes unitários e de integração.
- Atualizar CLAUDE.md e SPEC com o que foi decidido na etapa.
- **Pratica:** documentação, CI.
- **Pronto quando:** o CI passa num push e falha de verdade quando você quebra um teste de propósito; outra pessoa consegue rodar o projeto só pelo README; checklist preenchido com evidência.

---

## Próximas etapas (resumo)

2. Estrutura do curso: disciplinas, turmas, matrículas, encerramento de turma.
3. Exercícios: cadastro, filtros, listas, tentativas, correção.
4. Desempenho do aluno e dificuldade calculada.
5. Chamada e faltas.
6. Materiais.
7. Redações com comentários na foto.
8. Painel do professor.
9. Front-end (Next.js), segurança, testes com alunos reais e publicação.
