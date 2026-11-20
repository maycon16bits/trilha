# SPEC — Plataforma de estudo e acompanhamento (curso pré-ENEM)

Versão 1.0 — 20/11/2026. Fonte da verdade dos requisitos. Se o código divergir deste arquivo, um dos dois está errado: atualize aqui antes de mudar o comportamento.

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
| Usuário | `User` |
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

### 4.1 Entrada de alunos
1. O aluno cria a conta (dados pessoais; se menor de 18, dados do responsável e consentimento).
2. Confirma o e-mail. Só então entra na fila de aprovação (status `PENDING_APPROVAL`).
3. A coordenação revisa e **aprova** (`ACTIVE`, com matrícula numa turma) ou **rejeita** (`REJECTED`, com motivo).
4. Enquanto não for aprovado, o aluno só vê a tela "aguardando liberação".

### 4.2 Professores
A coordenação cadastra o professor (nome e e-mail). Ele define a senha por link ou senha provisória com troca obrigatória no primeiro acesso.

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
- RF-01 Cadastro de aluno (nome, e-mail, senha, telefone, data de nascimento; se menor: responsável e consentimento).
- RF-02 Confirmação de e-mail antes de entrar na fila de aprovação.
- RF-03 Coordenação lista pendentes, aprova ou rejeita com motivo.
- RF-04 Coordenação cadastra professores.
- RF-05 Login, logout e recuperação de senha.
- RF-06 Coordenação pode inativar usuários.

**Acadêmico**
- RF-07 CRUD de disciplinas (nome e flag `permite_redacao`).
- RF-08 Criar turma (nome, ano letivo), escolher disciplinas e definir professor de cada.
- RF-09 Matricular e desmatricular alunos aprovados.
- RF-10 Encerrar turma.
- RF-11 Um professor pode lecionar várias disciplinas e turmas.

**Exercícios**
- RF-12 Cadastro de exercício: disciplina, assunto, enunciado, alternativas (uma correta), origem (`ENEM`, `OUTRO_VESTIBULAR`, `AUTORAL`), ano da prova e fonte (opcionais).
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

- RN-01 O aluno só acessa a plataforma com status `ACTIVE`.
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
- RN-17 Aluno menor de 18 anos exige dados do responsável e consentimento registrado.
- RN-18 Exercício com tentativas não pode ser excluído. Alterar o gabarito recalcula `is_correct` das tentativas e gera registro de auditoria.

## 7. Modelo de dados (rascunho)

Os nomes de tabelas e colunas ficam em inglês na implementação. Aqui estão em português para facilitar a leitura.

- **usuarios**: id, papel, status (`PENDING_EMAIL`, `PENDING_APPROVAL`, `ACTIVE`, `REJECTED`, `INACTIVE`), nome, email (único), senha_hash, telefone, data_nascimento, email_confirmado_em, aprovado_por, aprovado_em, motivo_rejeicao, criado_em.
- **responsaveis**: usuario_id, nome, parentesco, contato, consentimento_em, versao_politica.
- **disciplinas**: id, nome, permite_redacao, ativa.
- **assuntos**: id, disciplina_id, nome (único por disciplina).
- **turmas**: id, nome, ano_letivo, status (`ACTIVE`, `CLOSED`), encerrada_em.
- **turma_disciplinas**: id, turma_id, disciplina_id, professor_id. Único (turma, disciplina).
- **matriculas**: id, aluno_id, turma_id, status. Único (aluno, turma).
- **exercicios**: id, disciplina_id, assunto_id, enunciado, origem, ano_prova, fonte, criado_por, arquivado, timestamps.
- **alternativas**: id, exercicio_id, letra, texto, correta.
- **listas** e **lista_exercicios**: lista (turma_disciplina_id, titulo, data_aula opcional, publicada), itens com ordem.
- **tentativas** (só se acrescenta): id, aluno_id, exercicio_id, alternativa_id, correta, lista_id (opcional), turma_id, is_first, reset_at, criado_em. Índice único parcial em (aluno_id, exercicio_id) onde `is_first` é verdadeiro.
- **chamadas**: id, turma_id, data (DATE), registrada_por. Único (turma, data).
- **presencas**: id, chamada_id, aluno_id, status (`PRESENT`, `ABSENT`, `ABSENT_EXCUSED`), justificativa, justificada_por.
- **materiais**: id, turma_disciplina_id, titulo, arquivo_key, mime, tamanho, data_aula (opcional), enviado_por.
- **redacoes**: id, aluno_id, turma_id, tema, imagem_key, status (`DRAFT`, `PUBLISHED`), nota_c1..c5, nota_final, comentario_geral, corrigida_por, publicada_em, atualizada_em.
- **redacao_anotacoes**: id, redacao_id, x, y, largura, altura (todos em proporção de 0 a 1 da imagem), texto, competencia (1–5, opcional).
- **auditoria**: quem, o quê, quando (ações da coordenação e alterações de gabarito).

A dificuldade não é uma coluna. É uma consulta de agregação sobre as primeiras tentativas (um bom exercício de SQL).

## 8. Requisitos não funcionais

- **Segurança:** senha com hash forte (bcrypt ou argon2), mensagens de login genéricas, limite de tentativas em login e cadastro, validação de toda entrada, HTTPS, CORS restrito, autorização conferida nos casos de uso e não só nos controllers.
- **Privacidade (LGPD):** dados de menores e fotos de redação são dados pessoais. Logs sem dados pessoais, política de privacidade, política de retenção, consentimento do responsável. Eu não sou advogado: revisar isso com um profissional antes de publicar.
- **Qualidade:** casos de uso com testes unitários, repositórios com testes de integração em PostgreSQL real.
- **Operação:** backup do banco, logs estruturados, endpoint de saúde.

## 9. Premissas a confirmar

- D1 Mínimo de 10 primeiras tentativas para classificar a dificuldade; vale para todos os anos.
- D2 Exatamente 40% de acerto cai em `HARD`.
- D3 Painel do aluno reflete resets; painel do professor usa só a primeira tentativa (RN-09).
- D4 Coordenação e professor da turma podem justificar falta.
- D5 Qualquer professor da turma pode registrar a chamada do dia.
- D6 Enunciado em Markdown com fórmulas (KaTeX) e imagens anexas, pois matemática, física e química precisam disso.
- D7 Gabarito pode ser corrigido após respostas, com recálculo e auditoria (RN-18).
- D8 Tema da redação é texto livre por redação, sem cadastro de temas.
- D9 Uma imagem por redação no MVP.
- D10 Estratégia de autenticação (JWT curto com refresh em cookie httpOnly ou sessão no servidor) decidida na etapa 1.
- D11 Retenção de dados de ex-alunos: definir política com apoio jurídico.

## 10. Fora do MVP

Correção de redação por IA, relatório para pais, ranking, notificações, app de celular, exercícios discursivos, resolução comentada de exercícios, importação em massa de exercícios.
