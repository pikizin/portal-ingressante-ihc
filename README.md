# Portal do Ingressante UFABC

Protótipo interativo de acolhimento e navegação orientada por tarefas para novos estudantes da Universidade Federal do ABC (UFABC), desenvolvido no âmbito da disciplina de **Interação Humano-Computador (IHC)**.

O objetivo do portal é reduzir a sobrecarga cognitiva e a burocracia do processo de matrícula e primeiros passos na universidade, transformando editais e normas institucionais em uma experiência clara, acessível e focada na ação do estudante.

---

## 1. Princípios de Design e IHC

O projeto foi construído e avaliado com base em três pilares teóricos da área de IHC:

1. **10 Heurísticas de Usabilidade (Jakob Nielsen):**
   - *Visibilidade do status:* barras de progresso da trilha e checklist de documentos com persistência local.
   - *Compatibilidade com o mundo real:* vocabulário real do cotidiano universitário (T-P-I, RU, fretado, SIGAA) com siglas expandidas no contexto.
   - *Prevenção de erros:* avisos explícitos e destacados de que a lista é para auto-organização pessoal e não substitui a matrícula oficial nos sistemas da universidade.
   - *Reconhecimento em vez de recordação:* catálogo estruturado dos cursos de ingresso e formações específicas com campi e links oficiais em acordeões; listas de checagem específicas por modalidade de cota.
   - *Design minimalista:* foco em uma próxima ação por tela, ausência de elementos puramente decorativos e política rigorosa de **zero emojis** para eliminar ruído visual.

2. **Princípios Fundamentais do Design (Donald Norman):**
   - *Affordance e Significantes (Signifiers):* estados interativos visíveis (hover, foco acessível), atalho `Ctrl K` sinalizado no cabeçalho e badges institucionais de campus e cota.
   - *Mapeamento Natural (Mapping):* a trilha organiza as etapas na sequência cronológica do calouro (envio de documentos, e-mail institucional, SIGAA, carteirinha, alimentação/transporte e início das aulas).
   - *Restrições (Constraints):* o cartão de ação exige a definição da via de ingresso (SiSU, transferência, etc.) antes de exibir os passos subsequentes, evitando premissas erradas.

3. **Acessibilidade Digital (WCAG 2.2 Nível AA):**
   - *Perceptível:* contraste mínimo superior a 4.5:1 para texto padrão e 3:1 para elementos gráficos, suporte a tema claro/escuro, modo de **Alto Contraste** e controles de redimensionamento de fonte (`A+` / `A-`).
   - *Operável:* link de salto (`skip-link`) para o conteúdo principal, navegação completa por teclado (`Tab`, `Enter`, `Esc`, `Ctrl + K`) sem armadilhas de foco (*focus traps*).
   - *Compreensível:* títulos semânticos ordenados (`h1` a `h4`), atributos `aria-expanded`, `aria-live` e tags `<abbr>` com descrições das siglas.
   - *Robusto:* construído em HTML5 semântico nativo e Vanilla JavaScript, garantindo interpretação correta em leitores de tela (NVDA, TalkBack) sem dependência de frameworks client-side pesados.

---

## 2. Funcionalidades da Interface

- **Início com Orientação por Tarefa:**
  - Três entradas direcionadas: *"Vou começar agora"* (foco imediato no primeiro passo pendente da trilha), *"Já enviei os documentos"* (vai direto para a conferência por modalidade) e *"Tenho uma dúvida"* (abre o FAQ).
  - Cartão contextual de **Próxima Ação**, que adapta as orientações conforme a via de ingresso (SiSU, Transferência ou outros).
- **Trilha do Ingressante (8 passos):**
  - Passo a passo interativo das tarefas essenciais do calouro.
  - Barra de progresso dinâmica com salvamento local no navegador (`localStorage`).
- **Catálogo de Cursos & Regime Quadrimestral:**
  - Apresentação dos 5 cursos de ingresso (BC&T, BC&H, LCH, LCNE, LEiLa) e suas 29 formações específicas divididas por campi (Santo André e São Bernardo do Campo).
  - Links oficiais diretos com segurança (`rel="noopener"`).
  - Explicação didática da dinâmica dos três quadrimestres letivos por ano.
- **Documentos por Modalidade de Ingresso:**
  - Checklist estruturado por cota (Ampla Concorrência, LI-EP, PPI, PcD, Renda, Transgênero).
  - Marcador *"já separei"* com contador de progresso e persistência no cliente.
- **Perguntas Frequentes (FAQ) & Glossário:**
  - FAQ categorizado por temas críticos (matrícula, auxílios, transporte, alimentação e aulas).
  - Glossário das siglas acadêmicas indispensáveis.
- **Busca Global Instantânea (`Ctrl + K`):**
  - Modal com índice rápido construído no navegador para localizar termos, guias e cursos instantaneamente.
- **Painel Teórico IHC:**
  - Seção dedicada mapeando como as 10 heurísticas de Nielsen, os princípios de Norman e as diretrizes WCAG foram aplicados nas telas do protótipo.

---

## 3. Privacidade e Ética de Dados

- **Estado 100% no cliente:** Todas as preferências (`localStorage`: tema visual, tamanho de fonte, via de ingresso escolhida e itens checados) existem apenas no navegador do estudante. Nenhum dado é enviado a servidores externos.
- **Transparência institucional:** Não são fabricadas certezas. Prazos, convocações e exigências documentais remetem explicitamente aos editais e calendários vigentes da Pró-Reitoria de Graduação (ProGrad).

---

## 4. Estrutura do Repositório

```text
├── index.html          # Estrutura semântica e acessível do portal
├── app.css             # Estilização completa, temas claro/escuro e alto contraste
├── app.js              # Lógica de interface, catálogo de cursos, busca e persistência
├── README.md           # Apresentação do projeto e instruções de uso
└── .gitignore          # Regras de exclusão de arquivos de desenvolvimento
```

---

## 5. Como Executar

Por ser uma aplicação web estática nativa (`HTML5`, `CSS3` e `Vanilla JavaScript`), o protótipo não exige compilação, dependências `npm` ou processos de build.

### Opção A: Execução direta no navegador
Basta abrir o arquivo `index.html` diretamente em qualquer navegador web moderno (Chrome, Firefox, Safari, Edge).

### Opção B: Servidor HTTP estático local
Se desejar rodar através de um servidor local:

```powershell
# Usando npx serve
npx serve .

# Ou usando Python
python -m http.server 8080
```

Em seguida, acesse no navegador: `http://localhost:8080` (ou a porta informada).

---

## 6. Publicação do MVP (GitHub Pages)

Como a aplicação é 100% estática, a publicação pode ser realizada no GitHub Pages sem etapas adicionais:

1. No repositório no GitHub, acesse **Settings > Pages**.
2. Em **Build and deployment > Source**, selecione **Deploy from a branch**.
3. Escolha a branch `main` e a pasta `/ (root)`.
4. Clique em **Save**. O portal estará publicado e acessível publicamente via HTTPS.

