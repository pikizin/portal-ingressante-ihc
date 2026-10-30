# Fase 2 — Fundação editorial e painel

Status: especificação inicial; nenhuma autenticação, banco ou painel foi implantado. O portal existente continua sendo um protótipo estático e seu conteúdo acadêmico precisa de validação oficial antes da publicação.

## Inventário inicial

| Conteúdo | Local atual | Risco e trabalho editorial |
| --- | --- | --- |
| Boas-vindas, navegação, apresentação, campi e painel IHC | `index.html` | Separar textos de interface, páginas, contatos e informações sobre serviços. Confirmar detalhes dos campi com fontes oficiais. |
| Trilha de 8 passos | `CHECKLIST_ITEMS`, `app.js` | Separar tarefas, ordem, contexto e links; não tratar conclusão como confirmação de matrícula. |
| Quatro diagramas | `MINDMAPS_DATA`, `app.js` | Conferir regras e resoluções; fornecer equivalente textual. Não aceitar Mermaid editável sem análise específica de segurança. |
| Perguntas frequentes | `FAQ_DATA`, `app.js` | Revisar afirmações sobre matrícula, aulas, transporte e prazos; acrescentar fontes e datas. |
| Modalidades e locais | `MODALIDADES_CONFIG`, `app.js` | Alta prioridade: conferir documentos, denominações, direitos, locais e horários no edital e nas páginas oficiais vigentes; não inferir requisitos. |
| Glossário | `ESSENTIAL_SIGLAS`, `app.js` | Revisar definições e associar fontes. |
| Busca | `initGlobalSearch`, `app.js` | O índice é construído no navegador; deverá refletir apenas versões publicadas. |

O aviso geral de protótipo não substitui a revisão individual. Não há nesta especificação uma afirmação de que os conteúdos atuais foram validados.

## Modelo editorial proposto

Cada item possui identificador estável, tipo, título, resumo, conteúdo estruturado, categorias, origem oficial, responsável editorial, data de verificação, data opcional de revisão e estado. Tipos específicos acrescentam campos: pergunta/resposta; etapa/ação/prazo; sigla/expansão; modalidade/documentos/condições; local/endereço/horário.

- Fluxo: **rascunho → em revisão → publicado → arquivado**. Novas alterações em conteúdo publicado geram uma revisão; a versão pública não muda até nova publicação.
- Fonte oficial: URL HTTPS validada, título, órgão e data de acesso. Não tratar um endereço ou um resumo como prova de que o conteúdo foi conferido.
- Histórico imutável de versões e eventos, pré-visualização restrita, comparação de alterações e restauração por nova publicação.
- Definir tratamento de conteúdo vencido: avisar o responsável e sinalizar ao leitor; não apagar silenciosamente informações essenciais.
- Campos estruturados e conjunto limitado de blocos para páginas, navegação e chamadas. Segredos, permissões e código não são conteúdo livremente editável.

## Papéis e fronteiras

| Papel | Permissão proposta |
| --- | --- |
| Editor | Criar e alterar rascunhos; solicitar revisão. |
| Revisor/publicador | Revisar, publicar, arquivar e restaurar versões autorizadas. |
| Administrador | Gerenciar usuários e papéis, além das funções editoriais; ação registrada. |

Login com Google identifica a pessoa, mas não concede papel. Autorizações devem ser verificadas no servidor em cada leitura privada e mutação, negando acesso por padrão. Identidade estável do provedor deve ser vinculada ao cadastro autorizado; e-mail verificado e restrição por domínio, se utilizados, não substituem a autorização explícita. Acesso público não exige login.

## Referência UFABC Next — leitura localizada, não auditoria

Código consultado em `D:/ufabc-next/apps/core/src`:

- `plugins/custom/authorization.ts:28-35`: verifica uma permissão de administrador no servidor. Adotar o princípio de autorização explícita, com testes para cada rota.
- `plugins/external/rate-limit.ts:4-8`: configura limitação de requisições; dimensionar e testar limites próprios.
- `plugins/external/oauth2.ts:45-75`: a implementação observada codifica dados em `state` e valida valores permitidos, mas não mostra ali um valor imprevisível vinculado à sessão. **Não copiar esse fluxo como proteção contra CSRF OAuth**. Verificar o fluxo completo e usar mecanismo comprovado de state e PKCE apropriado à integração.
- `hooks/board-authenticate.ts:13` retorna antes do bloco de verificação e `app.ts:110` registra esse hook para o board. Há um risco aparente de autenticação ignorada para essa superfície; exposição efetiva depende da configuração e de outras camadas, ainda não verificadas. Não reproduzir esse comportamento.
- `plugins/external/cors.ts:8-10` usa origem `*`; não presumir equivalência com uma política restritiva. Escolher origens necessárias e testar o comportamento real.

Essas observações vêm de leitura estática limitada, sem teste de exploração e sem avaliação completa do UFABC Next. Reutilizar requisitos e boas práticas verificadas, não copiar código ou pressupor que o projeto de referência esteja integralmente seguro.

## Requisitos de segurança

1. OAuth/OIDC com implementação mantida, verificação correta do retorno e state vinculado à sessão; avaliar PKCE e validação de identidade conforme o provedor e a biblioteca escolhidos.
2. Sessões seguras: cookies `HttpOnly`, `Secure` em HTTPS, política `SameSite` apropriada, expiração, logout e revogação. Proteção CSRF para mutações com autenticação por cookie; validar origem quando aplicável.
3. Validar entrada e permissões no servidor; negar por padrão e testar acesso cruzado entre usuários e papéis. Aplicar limitação de requisições e cabeçalhos de segurança adequados.
4. Preferir texto e blocos estruturados a HTML arbitrário. Se HTML for necessário, sanitizar no servidor e na apresentação conforme o contexto; validar URLs. Rever separadamente arquivos enviados e diagramas.
5. Registrar autoria, revisão e publicação sem tokens ou conteúdo sensível nos logs. Definir backup, restauração e retenção; testar a recuperação antes de produção.
6. Conteúdo, documentos recuperados e respostas do futuro chat são dados não confiáveis, não instruções. A LLM não recebe privilégios de edição nem segredos.

## Etapas e critérios de aceite

1. **Conteúdo e decisões:** revisar inventário, fontes, responsáveis, hospedagem e quem administra. Nenhuma fonte é considerada validada sem revisão humana.
2. **Arquitetura:** comparar CMS existente e painel próprio; escolher armazenamento, autenticação e custos. Documentar migração e rollback; não configurar serviços até autorização.
3. **Protótipo privado:** edição de FAQ e página, com rascunho, prévia e testes locais. Não simular login Google como segurança real.
4. **Identidade e autorização:** implementar login, papéis, revogação e testes de acesso positivo e negativo em ambiente de teste.
5. **Publicação:** versão publicada separada de rascunho, revisão, histórico e restauração; busca indexa só material publicado.
6. **Aceite:** testes de teclado/leitor de tela, segurança, backups, revisão editorial e teste com ingressantes. Publicação externa exige autorização separada.

## Decisões em aberto

- CMS existente ou painel próprio; stack e hospedagem.
- Organização responsável e pessoas autorizadas a editar e publicar.
- Conta/projeto Google e domínios de retorno; segredos fora do repositório.
- Padrão de versionamento e licença da biblioteca Mermaid local; primeiro commit ainda não autorizado.
- Escopo de alertas de vencimento, privacidade e atendimento humano.
