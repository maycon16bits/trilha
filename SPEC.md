# SPEC — Plataforma de estudo e acompanhamento (curso pré-ENEM)

Versão 1.2 — 22/11/2026. Fonte da verdade dos requisitos. Se o código divergir deste arquivo, um dos dois está errado: atualize aqui antes de mudar o comportamento.

**Histórico**
- 1.2 (22/11/2026): entrada de usuários por **convite exclusivo** (sem cadastro público); sem confirmação de e-mail (o e-mail só serve para login); aprovação do aluno pela coordenação mantida; professor entra por convite do tipo `TEACHER`; nova tabela `invitations`; `users.status` reduzido a `ACTIVE` e `INACTIVE`.
- 1.1 (22/11/2026): usuário dividido em `users` + perfis (`students`, `staff_profiles`); dados escolares do aluno; status separado em status da conta e aprovação do aluno; modelo de dados agora referencia o `schema.prisma`; ADR substituído por decisões registradas neste arquivo (§9).
- 1.0 (20/11/2026): versão inicial.

## 1. Visão geral

Plataforma web onde:

- **Alunos** resolvem exercícios de múltipla escolha, acompanham desempenho, faltas e correções de redação.
- **Professores** cadastram exercícios e materiais, fazem chamada, corrigem redações e acompanham as turmas.
- **Coordenação** administra disciplinas, turmas, contas e liberação de acesso.

Escala: cerca de 70 alunos por ano e 7 professores. Parte dos alunos é menor de 18 anos.
Princípios: começar simples (um backend, um PostgreSQL, sem microsserviços), arquitetura limpa, segurança e privacidade desde o início.

## 2. Glossário (domínio → código)

Documentação em português; código em inglês.

| Domínio | Código |
|---|---|
| Usuário (conta de acesso, comum a todos) | `User` |
| Perfil do aluno | `Student` |
| Perfil de professor e coordenação | `StaffProfile` |
| Responsável do aluno menor | `Guardian` |
| Aluno / Professor / Coordenação | `STUDENT` / `TEACHER` / `COORDINATOR` (papéis) |
| Disciplina | `Subject` |
| Assunto | `Topic` |
| Turma | `ClassGroup` (evita a palavra reservada `class`) |
| Disciplina da turma (com professor) | `ClassSubject` |
| Matrícula | `Enrollment` |
| Exercício / Alternativa | `Question` / `Choice` |
| Lista de exercícios | `QuestionList` |
| Tentativa | `Attempt` |
| Chamada / Presença | `RollCall` / `Attendance` |
| Material | `Material` |
| Redação / Comentário de trecho | `Essay` / `EssayAnnotation` |
| Convite exclusivo para criar conta | `Invitation` |
| Token de uso único (recuperação de senha) | `AuthToken` |
| Gestor / administrador | é a **Coordenação**: papel `COORDINATOR` |

## 3. Perfis e permissões

| Ação | Aluno | Professor | Coordenação |
|---|---|---|---|
| Ver próprio desempenho, faltas e redações | ✔ (só os seus) | — | ✔ (todos) |
| Responder exercícios e estudar pelo banco | ✔ | — | — |
| Cadastrar exercícios | — | ✔ (disciplinas que leciona) | — |
| Montar listas de exercícios | — | ✔ (suas turmas) | — |
| Subir materiais | — | ✔ (suas turmas) | — |
| Fazer chamada | — | ✔ (suas turmas) | ✔ |
| Justificar falta | — | ✔ (suas turmas) | ✔ |
| Corrigir redação | — | ✔ (disciplina com `permite_redacao`) | — |
| Ver desempenho da turma | — | ✔ (suas turmas) | ✔ (todas) |
| Gerir disciplinas, turmas, matrículas | — | — | ✔ |
| Aprovar alunos e cadastrar professores | — | — | ✔ |

## 4. Fluxos principais

Não existe cadastro público: toda conta nasce de um **convite exclusivo**, criado pela coordenação (RN-22).

### 4.1 Entrada de alunos
1. **Entrevista e seleção** acontecem fora da plataforma. Na entrevista a coordenação obtém o e-mail e o telefone do aluno.
2. Selecionado o aluno, a coordenação cria o **convite** informando e-mail e telefone, e envia o link por e-mail ou WhatsApp.
3. O aluno abre o link e vê e-mail e telefone **já preenchidos e bloqueados**. Se estiverem errados, ele fala com a coordenação (que revoga e reemite o convite). Ele preenche o restante: nome, senha, data de nascimento, escolaridade, escola em que estuda ou estudou (e dados do responsável, se menor de 18 anos; ver D24).
4. Ao enviar o formulário a conta é criada (`users.status = ACTIVE`) com `students.approval_status = PENDING`. O convite é consumido.
5. A coordenação confere os dados num painel e **aprova** (`APPROVED`) ou **rejeita** (`REJECTED`, com motivo). O que acontece depois de uma rejeição: D21. A matrícula em turma é tratada em D13.
6. Enquanto o aluno não for aprovado, ele consegue entrar, mas só vê a tela "aguardando aprovação". Aprovado, acessa a plataforma.

### 4.2 Professores e coordenação
O fluxo é o mesmo convite, com tipo `TEACHER`: a coordenação informa e-mail e telefone, envia o link, o professor abre, vê e-mail e telefone bloqueados e preenche nome, senha e dados do perfil. A conta nasce `ACTIVE`, sem fila de aprovação (D22). Convite para novos coordenadores (`COORDINATOR`) fica para o futuro; o primeiro coordenador vem de seed. Professor e coordenação compartilham o mesmo perfil (`staff_profiles`); o papel está em `users.role`.

### 4.3 Ano letivo
1. A coordenação mantém um **catálogo de disciplinas** (livre, sem lista fixa).
2. Cria a turma (ex.: "2027"), escolhe as disciplinas dela e o professor de cada uma.
3. Matricula os alunos.
4. Ao fim do ano, **encerra a turma**: ela vira somente leitura e o histórico fica guardado. Em 2027 criam-se turmas novas e novas matrículas. O banco de exercícios continua o mesmo.

### 4.4 Exercícios
O professor cadastra o exercício, que pertence à disciplina (catálogo), não à turma. O aluno responde pela lista da aula ou pelo banco com filtros. Após responder, vê a correção. Pode refazer ou resetar suas respostas.

### 4.5 Chamada
Uma chamada por turma e por dia. O professor marca presente ou falta para cada aluno matriculado, e faltas podem ser justificadas depois.

### 4.6 Redação
O aluno entrega o papel ao professor de redação. O professor fotografa, sobe na plataforma vinculando ao aluno, marca trechos da imagem com comentários, lança a nota de cada competência e a avaliação geral, e finaliza. Só então o aluno vê.

## 5. Requisitos funcionais

**Identidade**
- RF-01 Cadastro do aluno pelo link de convite: e-mail e telefone vêm do convite e não podem ser alterados; o aluno informa nome, senha, data de nascimento, escolaridade, escola em que estuda ou estudou (e responsável, se menor; ver D24).
- RF-02 Coordenação cria convites individuais (e-mail e telefone, para aluno ou professor), vê o estado de cada um (aberto, usado, revogado, expirado), revoga e reemite.
- RF-03 Coordenação lista os alunos pendentes, confere os dados no painel, aprova ou rejeita com motivo.
- RF-04 Cadastro do professor pelo link de convite do tipo `TEACHER` (mesmas regras do RF-01).
- RF-05 Login, logout e recuperação de senha. (Em qual etapa entra a recuperação: D16.)
- RF-06 Coordenação pode inativar usuários. (Etapa: D16.)

**Acadêmico**
- RF-07 CRUD de disciplinas (nome e flag `permite_redacao`).
- RF-08 Criar turma (nome, ano letivo), escolher disciplinas e definir professor de cada.
- RF-09 Matricular e desmatricular alunos aprovados.
- RF-10 Encerrar turma.
- RF-11 Um professor pode lecionar várias disciplinas e turmas.

**Exercícios**
- RF-12 Cadastro de exercício: disciplina, assunto, enunciado, alternativas (uma correta), origem (`ENEM`, `OTHER_EXAM`, `AUTHORED`), ano da prova e fonte (opcionais).
- RF-13 Professor cria e escolhe assuntos da sua disciplina.
- RF-14 Editar e arquivar exercício. Não excluir se houver tentativas.
- RF-15 Professor monta e publica listas de exercícios por disciplina da turma.
- RF-16 Aluno vê as listas da sua turma e responde.
- RF-17 Banco de estudo com filtros: disciplina, assunto, origem, dificuldade e "ainda não respondidas".
- RF-18 Correção imediata após responder (acertou ou errou, alternativa correta).
- RF-19 Aluno pode refazer exercícios e resetar suas respostas.

**Desempenho**
- RF-20 Painel do aluno: feitas, acertos e erros; por disciplina e assunto; faltas do mês e histórico; últimas redações.
- RF-21 Painel da turma (professor): desempenho e faltas por aluno e por assunto.
- RF-22 Dificuldade do exercício calculada automaticamente (RN-08).

**Chamada**
- RF-23 Professor registra a chamada do dia para a turma.
- RF-24 Falta pode ser justificada, com texto.
- RF-25 Aluno vê faltas do mês atual e o histórico completo.

**Materiais**
- RF-26 Professor sobe PDFs e slides por disciplina da turma. Aluno baixa os da sua turma.

**Redações**
- RF-27 Professor da disciplina com `permite_redacao` sobe a foto da redação de um aluno da turma, informando o tema.
- RF-28 Marcar trechos da imagem e escrever comentários (competência opcional).
- RF-29 Lançar nota das 5 competências e avaliação geral, e finalizar.
- RF-30 Aluno vê o histórico: foto, comentários por trecho, notas por competência, nota final e avaliação geral.
- RF-31 Professor pode editar uma correção finalizada; registra a data da edição.

## 6. Regras de negócio

- RN-01 O aluno só acessa a plataforma com conta `ACTIVE` **e** aprovação `APPROVED`. Aluno `PENDING` ou `REJECTED` consegue entrar, mas só vê a tela de estado da aprovação (nenhum outro dado). Professor e coordenação acessam com conta `ACTIVE`. A aprovação é verificada no banco a cada requisição, nunca confiada ao token.
- RN-02 Aluno vê só os próprios dados. Professor, só as turmas que leciona. Coordenação, tudo.
- RN-03 Professor só cadastra exercício em disciplina que leciona em alguma turma ativa.
- RN-04 O gabarito nunca é enviado ao aluno antes de ele responder, nem nas listagens.
- RN-05 Todo exercício tem exatamente uma alternativa correta.
- RN-06 A tentativa é imutável (só se acrescenta). A primeira tentativa de um aluno em um exercício é marcada `is_first` e nunca é apagada.
- RN-07 **Reset:** marca `reset_at` nas tentativas do aluno (no escopo escolhido). Não apaga nada, não altera `is_first` nem a dificuldade. Depois disso o aluno pode responder de novo.
- RN-08 **Dificuldade** = percentual de acerto na primeira tentativa, considerando todos os alunos de todas as turmas e anos. Acima de 80% é `EASY`. Acima de 40% até 80% é `MEDIUM`. Até 40% é `HARD`. Com menos de N primeiras tentativas (N = 10, configurável) é `UNRATED`.
- RN-09 O painel do aluno conta as tentativas não resetadas. O painel do professor usa a primeira tentativa de cada aluno.
- RN-10 Uma chamada por turma e por dia, só com alunos de matrícula ativa. Datas de calendário não têm fuso (fuso de referência: America/Recife).
- RN-11 A contagem principal de faltas são as não justificadas. As justificadas aparecem separadas, com o motivo.
- RN-12 Turma `CLOSED` é somente leitura. As matrículas e o histórico permanecem.
- RN-13 Nenhuma disciplina é fixa no código. Seeds só para desenvolvimento.
- RN-14 Cada competência da redação vale 0, 40, 80, 120, 160 ou 200. A nota final é a soma (0 a 1000), calculada pelo sistema.
- RN-15 Redação em rascunho não é visível ao aluno.
- RN-16 Fotos de redação e materiais ficam em armazenamento privado, acessados por URL assinada e temporária.
- RN-17 Aluno menor de 18 anos exige dados do responsável e consentimento registrado. **Em revisão (D24):** hoje o menor preenche o formulário sozinho, e a regra pode mudar depois de conversar com o curso.
- RN-18 Exercício com tentativas não pode ser excluído. Alterar o gabarito recalcula `is_correct` das tentativas e gera registro de auditoria.
- RN-19 A idade do aluno não é armazenada: é calculada a partir da data de nascimento e da data de referência (America/Recife). Quem faz 18 anos hoje já é maior de idade.
- RN-20 Tokens de uso único (convite e recuperação de senha) têm expiração, são consumidos uma vez e só o **hash** é guardado. O token em texto puro aparece uma única vez, para a coordenação, na criação.
- RN-21 Um aluno só tem perfil `students` se `users.role = STUDENT`; professor e coordenação só têm `staff_profiles`. O banco não impede isso sozinho: é regra do caso de uso, coberta por teste de integração.
- RN-22 **Convite exclusivo:** não existe cadastro público. O convite é individual (e-mail e telefone da pessoa), de uso único, com validade (D23) e revogável pela coordenação. E-mail e telefone vêm do convite, nunca do corpo da requisição de aceite. Só pode haver um convite aberto por e-mail; reemitir revoga o anterior. Não se convida um e-mail que já tem conta.
- RN-23 O e-mail não é verificado: serve apenas para login. Por isso o link do convite deve ser tratado como segredo (não registrar em log, consumir por `POST`) e a coordenação confere os dados na aprovação.

## 7. Modelo de dados

A fonte da verdade do modelo é `apps/api/prisma/schema.prisma` (23 tabelas, 12 enums). Esta seção resume o que cada tabela guarda e as decisões de modelagem. Se divergir, atualize os dois.

### 7.1 Decisões de modelagem

- **Usuário dividido em conta e perfis.** `users` guarda só o que vale para todos (nome, e-mail, senha, telefone, papel, status da conta). Os dados que mudam por perfil ficam em `students` (aluno) e `staff_profiles` (professor e coordenação). Matrícula, tentativa, falta e redação apontam para `students`; disciplina da turma, exercício, material e correção apontam para `staff_profiles`.
- **Dois estados, dois lugares.** `users.status` é o estado da conta: `ACTIVE` ou `INACTIVE`. `students.approval_status` é a fila da coordenação: `PENDING`, `APPROVED`, `REJECTED`. As regras de acesso estão na RN-01.
- **A conta só existe depois do convite ser aceito.** O convite (`invitations`) guarda e-mail, telefone e papel; não cria `users`. Por isso `users.password_hash` é sempre preenchido, e não há estado "convidado sem senha". O estado do convite (aberto, usado, revogado, expirado) é derivado de `used_at`, `revoked_at` e `expires_at`.
- **Idade derivada** (RN-19). Só se guarda `birth_date`.
- **Dificuldade não é coluna.** É uma consulta de agregação sobre as primeiras tentativas (um bom exercício de SQL).
- **Exclusão:** `RESTRICT` por padrão, para o histórico não sumir por acidente. `CASCADE` só em registros que não existem sem o pai (alternativas, imagens do enunciado, itens de lista, comentários de redação, responsável, tokens).

### 7.2 Tabelas

Nomes de tabela em inglês, `snake_case`; colunas em `snake_case` no banco e `camelCase` no Prisma.

**Identidade**
- `users`: id, role, status (`ACTIVE`, `INACTIVE`), name, email (único, já normalizado, só para login), password_hash, phone, timestamps.
- `students` (1:1 com `users`): birth_date, education_level, school_name, school_situation (`STUDYING` ou `FINISHED`), school_type (opcional), approval_status, approved_by, approved_at, rejection_reason, timestamps.
- `guardians` (1:1 com `students`): nome, parentesco, contato, consentimento_em (`consented_at`), versão da política (`policy_version`).
- `staff_profiles` (1:1 com `users`): qualification, hired_at, timestamps. Campos além desses: D18.
- `invitations`: role, email, phone (os dois travados para o convidado), token_hash, invited_by (→ `staff_profiles`), expires_at, used_at, revoked_at, user_id (conta criada ao aceitar).
- `auth_tokens`: user_id, type (hoje só `PASSWORD_RESET`, reservado para D16), token_hash, expires_at, used_at.

**Acadêmico**
- `subjects`: nome (único), allows_essay, is_active.
- `topics`: subject_id, nome (único por disciplina).
- `class_groups`: nome, school_year, status (`ACTIVE`, `CLOSED`), closed_at.
- `class_subjects`: class_group_id, subject_id, teacher_id (→ `staff_profiles`). Único (turma, disciplina).
- `enrollments`: student_id, class_group_id, status (`ACTIVE`, `WITHDRAWN`). Único (aluno, turma).

**Exercícios**
- `questions`: subject_id, topic_id, statement (Markdown com KaTeX), source (`ENEM`, `OTHER_EXAM`, `AUTHORED`), exam_year, source_reference, created_by, is_archived, timestamps.
- `question_images`: imagens anexas ao enunciado.
- `choices`: question_id, letter, text, is_correct. Único (exercício, letra).
- `question_lists` e `question_list_items`: lista (class_subject_id, título, data da aula, publicada) e itens com posição.
- `attempts` (só se acrescenta): student_id, question_id, choice_id, class_group_id, question_list_id (opcional), is_correct, is_first, reset_at, created_at.

**Chamada, materiais, redações, auditoria**
- `roll_calls`: class_group_id, date (`DATE`), registered_by. Único (turma, data).
- `attendances`: roll_call_id, student_id, status (`PRESENT`, `ABSENT`, `ABSENT_EXCUSED`), justification, excused_by, excused_at. Único (chamada, aluno).
- `materials`: class_subject_id, título, file_key, mime, size_bytes, data da aula (opcional), uploaded_by.
- `essays`: student_id, class_group_id, theme, image_key, status (`DRAFT`, `PUBLISHED`), score_c1..c5, final_score, general_feedback, graded_by, published_at, timestamps.
- `essay_annotations`: essay_id, x, y, width, height (proporção de 0 a 1 da imagem), text, competency (1 a 5, opcional).
- `audit_logs`: actor_id, action, entity_type, entity_id, details (JSON, sem dados pessoais), created_at.

### 7.3 O que o Prisma não declara (SQL manual na migration)

| Onde | O quê | Regra |
|---|---|---|
| `choices` | índice único parcial em `(question_id)` onde `is_correct` | RN-05 |
| `attempts` | índice único parcial em `(student_id, question_id)` onde `is_first` | RN-06 |
| `essays` | `CHECK`: notas em {0, 40, 80, 120, 160, 200} e `final_score` entre 0 e 1000 | RN-14 |
| `invitations` | índice único parcial em `(email)` onde `used_at IS NULL AND revoked_at IS NULL` | RN-22 |

## 8. Requisitos não funcionais

- **Segurança:** senha com hash forte (bcrypt ou argon2, ver D15), mensagens de login genéricas, limite de tentativas em login e nas rotas públicas do convite, validação de toda entrada, HTTPS, CORS restrito, autorização conferida nos casos de uso e não só nos controllers.
- **Privacidade (LGPD):** dados de menores e fotos de redação são dados pessoais. Logs sem dados pessoais, política de privacidade, política de retenção, consentimento do responsável. Eu não sou advogado: revisar isso com um profissional antes de publicar.
- **Qualidade:** casos de uso com testes unitários, repositórios com testes de integração em PostgreSQL real.
- **Operação:** backup do banco, logs estruturados, endpoint de saúde.

## 9. Decisões técnicas e premissas

Não há pasta de ADR: o projeto tem uma pessoa só, então as decisões ficam registradas aqui.

### 9.1 Decisões tomadas

| Tema | Escolha |
|---|---|
| Runtime e linguagem | Node 26 (`.nvmrc`), TypeScript `strict` |
| HTTP | Express com `routing-controllers` |
| Banco e ORM | PostgreSQL 17 com Prisma 7 (adapter `pg`), migrations versionadas |
| Injeção de dependência | `typedi` |
| Validação | `class-validator` e `class-transformer` |
| Testes | Jest com `ts-jest` e `supertest` |
| Logs | `winston` |
| Front-end | Next.js, só depois da API |
| Estrutura de pastas | por camada (`domain`, `application`, `http`, `infrastructure`); ver CLAUDE.md |
| Entrada de usuários | convite exclusivo por e-mail e telefone; sem cadastro público; aluno passa por aprovação, professor não |
| E-mail | só para login, sem confirmação |
| Papel de gestão | mantido `COORDINATOR` (gestor = coordenação) |
| Migration inicial | schema inteiro de uma vez; mudanças futuras viram novas migrations (D20) |
| Comportamento do login para aluno não aprovado | o login funciona e o aluno só acessa a tela de estado da aprovação (D12) |

### 9.2 Premissas a confirmar

| ID | Premissa | Estado |
|---|---|---|
| D1 | Mínimo de 10 primeiras tentativas para classificar a dificuldade; vale para todos os anos. | Premissa |
| D2 | Exatamente 40% de acerto cai em `HARD`. | Premissa |
| D3 | Painel do aluno reflete resets; painel do professor usa só a primeira tentativa (RN-09). | Premissa |
| D4 | Coordenação e professor da turma podem justificar falta. | Premissa |
| D5 | Qualquer professor da turma pode registrar a chamada do dia. | Premissa |
| D6 | Enunciado em Markdown com fórmulas (KaTeX) e imagens anexas (`question_images`), pois matemática, física e química precisam disso. | Premissa |
| D7 | Gabarito pode ser corrigido após respostas, com recálculo e auditoria (RN-18). | Premissa |
| D8 | Tema da redação é texto livre por redação, sem cadastro de temas. | Premissa |
| D9 | Uma imagem por redação no MVP. | Premissa |
| D10 | Estratégia de autenticação: JWT curto com refresh em cookie httpOnly ou sessão no servidor. Se for JWT, decidir como revogar. | **Aberta** (T1.9) |
| D11 | Retenção de dados de ex-alunos: definir política com apoio jurídico. | Aberta |
| D12 | Login de aluno com aprovação pendente ou rejeitada: o login funciona (senha correta) e a sessão só alcança o endpoint de estado da aprovação. | **Decidida** (§4.1, RN-01) |
| D13 | Aprovar o aluno só muda a aprovação, e a matrícula em turma é um passo separado (RF-09, Etapa 2). Alternativa: aprovar já escolhendo a turma. | **Aberta** (turmas só existem na Etapa 2) |
| D14 | Regras de senha: tamanho mínimo e máximo, e se há regra de composição. O máximo depende do algoritmo (bcrypt só considera 72 bytes). | **Aberta** (T1.5c) |
| D15 | Algoritmo de hash: bcrypt ou argon2. | **Aberta** (T1.8b) |
| D16 | RF-05 (recuperação de senha) e RF-06 (inativar usuário): entram na Etapa 1 ou na 2? Atenção: como o e-mail não é verificado (RN-23), a recuperação por e-mail só é segura se o e-mail do convite estiver certo; alternativa é a coordenação reemitir um convite de redefinição. | **Aberta** |
| D17 | Primeiro acesso do professor: convite do tipo `TEACHER` (o professor define a própria senha ao aceitar). | **Decidida** (§4.2) |
| D18 | Campos de `staff_profiles` além de `qualification` e `hired_at`. | **Aberta** |
| D19 | Casos de uso usam decorators do `typedi` (a camada application passa a depender dele) ou são classes simples ligadas num composition root. | **Aberta** (T1.6) |
| D20 | Migration inicial com o schema inteiro ou tabelas criadas por etapa. | **Decidida:** schema inteiro; mudanças futuras viram novas migrations (não há banco em produção) |
| D21 | Aluno rejeitado: o fim do processo, ou ele pode corrigir os dados e reenviar? Se puder reenviar, o convite já usado não serve e é preciso um fluxo de correção (ou a coordenação emite novo convite). | **Aberta** (T1.8d) |
| D22 | Professor não passa por aprovação: a conta nasce `ACTIVE` ao aceitar o convite, já que a coordenação o convidou diretamente. | **Premissa** (confirmar) |
| D23 | Validade do convite: sugestão de 7 dias, configurável por variável de ambiente. | **Aberta** (T1.6) |
| D24 | Consentimento do responsável (RN-17): hoje o menor preenche o formulário sozinho, sem supervisão. A regra e o formulário podem mudar depois de conversar com o curso e, se possível, com um advogado. O schema (`guardians`) fica como está até lá. | **Aberta** (aguardando o curso) |

## 10. Fora do MVP

Correção de redação por IA, relatório para pais, ranking, notificações, app de celular, exercícios discursivos, resolução comentada de exercícios, importação em massa de exercícios.
