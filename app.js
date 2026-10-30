/**
 * UFABC INGRESSANTE - INTERFACE INTERATIVA
 * Disciplina: Interação Humano-Computador (IHC)
 * Sem emojis. Ícones vetoriais SVG e feedback textual descritivo.
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initHome();
  initChecklist();
  initNextAction();
  initMindmaps();
  initFaq();
  initModalidades();
  initGlossary();
  initGlobalSearch();
  initAccessibility();
  initChat();
});

/* ==========================================================================
   1. NAVEGAÇÃO ENTRE ABAS
   ========================================================================== */
function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-item-btn");
  const contentSections = document.querySelectorAll(".content-section");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");

      navButtons.forEach(b => {
        b.classList.remove("active");
        b.removeAttribute("aria-current");
      });
      contentSections.forEach(sec => sec.classList.remove("active"));

      btn.classList.add("active");
      btn.setAttribute("aria-current", "page");

      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
        if (targetId === "tabMapas") {
          renderCurrentMindmap();
        }
      }
    });
  });
  document.querySelectorAll("[data-go-to]").forEach(btn => {
    btn.addEventListener("click", () => {
      const destination = document.querySelector(`.nav-item-btn[data-target="${btn.dataset.goTo}"]`);
      if (destination) {
        destination.click();
        const heading = document.querySelector(`#${btn.dataset.goTo} h2`);
        if (heading) {
          heading.tabIndex = -1;
          heading.focus();
        }
      }
    });
  });
}

/* ==========================================================================
   1b. TELA INICIAL (HOME): TRÊS ENTRADAS
   ========================================================================== */
function irParaSecao(targetId) {
  const destino = document.querySelector(`.nav-item-btn[data-target="${targetId}"]`);
  if (!destino) return;
  destino.click();
  const heading = document.querySelector(`#${targetId} h2`);
  if (heading) {
    heading.tabIndex = -1;
    heading.focus();
  }
}

function irParaPasso(id) {
  const itemEl = document.getElementById(`item_${id}`);
  if (!itemEl) return;
  const navTrilha = document.querySelector('.nav-item-btn[data-target="tabChecklist"]');
  if (navTrilha) navTrilha.click();
  itemEl.hidden = false;
  itemEl.classList.add("is-next");
  const checkbox = itemEl.querySelector("input");
  if (checkbox) checkbox.focus({ preventScroll: true });
  window.requestAnimationFrame(() => {
    itemEl.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function initHome() {
  const escolhas = document.querySelectorAll("[data-home-choice]");
  if (!escolhas.length) return;

  escolhas.forEach(btn => {
    btn.addEventListener("click", () => {
      const escolha = btn.dataset.homeChoice;
      if (escolha === "comecar") {
        const pendente = proximoPassoPendente();
        if (pendente) irParaPasso(pendente.id);
        else irParaSecao("tabChecklist");
        return;
      }
      if (escolha === "documentos") {
        irParaSecao("tabModalidades");
        return;
      }
      irParaSecao("tabChat");
    });
  });
}

/* ==========================================================================
   2. TRILHA DO INGRESSANTE (CHECKLIST ONBOARDING)
   ========================================================================== */
const CHECKLIST_ITEMS = [
  { id: "step_doc", title: "Envio de documentos para matrícula", desc: "Digitalizar RG, Histórico Escolar, Certificado de Conclusão e documentos de cotas (se aplicável).", category: "Pré-ingresso" },
  { id: "step_email", title: "Criação do e-mail institucional", desc: "Ativar a conta @aluno.ufabc.edu.br no portal do NTI para ter acesso aos sistemas e benefícios.", category: "Acesso" },
  { id: "step_sigaa", title: "Acesso ao SIGAA / portal do aluno", desc: "Primeiro login para verificar as disciplinas atribuídas automaticamente no 1º quadrimestre.", category: "Acadêmico" },
  { id: "step_carteirinha", title: "Solicitação da carteirinha estudantil", desc: "Emitir o cartão de identificação estudantil físico/digital para acesso às catracas e bibliotecas.", category: "Campus" },
  { id: "step_fretado", title: "Cadastramento no fretado intercampi", desc: "Entender os horários da linha de ônibus gratuita entre os campi Santo André e São Bernardo.", category: "Transporte" },
  { id: "step_ru", title: "Primeiro almoço no Restaurante Universitário", desc: "Conhecer o RU, adquirir créditos e verificar o cardápio semanal nutricional subsidiado.", category: "Alimentação" },
  { id: "step_tpi", title: "Compreensão da fórmula T-P-I", desc: "Compreender as horas de aula teórica, prática e dedicação individual esperadas.", category: "Sobrevivência" },
  { id: "step_bloco_a", title: "Tour das torres do Bloco A", desc: "Descobrir as conexões das Torres 1, 2 e 3 nos andares 0, 1 e 2 do Campus Santo André.", category: "Campus" }
];

function initChecklist() {
  const container = document.getElementById("checklistItemsList");
  if (!container) return;

  const savedState = JSON.parse(localStorage.getItem("ufabc_checklist_progress") || "{}");

  container.innerHTML = "";
  CHECKLIST_ITEMS.forEach((item, index) => {
    const isChecked = !!savedState[item.id];
    const itemEl = document.createElement("div");
    itemEl.className = `checklist-item ${isChecked ? "completed" : ""}`;
    itemEl.id = `item_${item.id}`;
    if (index >= 3) itemEl.hidden = true;

    itemEl.innerHTML = `
      <input type="checkbox" id="${item.id}" ${isChecked ? "checked" : ""} aria-label="${item.title}">
      <div class="checklist-content">
        <div class="checklist-title">${item.title}</div>
        <div class="checklist-desc">${item.desc}</div>
      </div>
      <span class="checklist-badge">${item.category}</span>
    `;

    const checkbox = itemEl.querySelector("input");
    checkbox.addEventListener("change", (e) => {
      savedState[item.id] = e.target.checked;
      localStorage.setItem("ufabc_checklist_progress", JSON.stringify(savedState));
      itemEl.classList.toggle("completed", e.target.checked);
      updateProgressDisplay();
    });

    container.appendChild(itemEl);
  });

  const showMore = document.getElementById("showMoreChecklist");
  if (showMore) {
    showMore.addEventListener("click", () => {
      const expanded = showMore.getAttribute("aria-expanded") === "true";
      container.querySelectorAll(".checklist-item").forEach((item, index) => {
        if (index >= 3) item.hidden = expanded;
      });
      showMore.setAttribute("aria-expanded", String(!expanded));
      showMore.textContent = expanded ? "Mostrar todos os passos" : "Mostrar menos passos";
    });
  }
  updateProgressDisplay();
}

function updateProgressDisplay() {
  const savedState = JSON.parse(localStorage.getItem("ufabc_checklist_progress") || "{}");
  const total = CHECKLIST_ITEMS.length;
  const completed = Object.values(savedState).filter(Boolean).length;
  const percentage = Math.round((completed / total) * 100);

  const fillEl = document.getElementById("heroProgressFill");
  const textEl = document.getElementById("heroProgressText");
  const subEl = document.getElementById("heroProgressSub");

  if (fillEl) fillEl.style.width = `${percentage}%`;
  if (textEl) textEl.textContent = `${completed}/${total} Concluídos (${percentage}%)`;

  const trailText = document.getElementById("trailProgressText");
  const trailFill = document.getElementById("trailProgressFill");
  if (trailText) trailText.textContent = `${completed} de ${total} passos concluídos`;
  if (trailFill) trailFill.style.width = `${percentage}%`;
  if (subEl) {
    if (percentage === 100) {
      subEl.textContent = "Você marcou todos os passos desta lista";
    } else if (percentage >= 50) {
      subEl.textContent = "Status: Mais da metade do acolhimento concluído";
    } else {
      subEl.textContent = "Status: Etapas iniciais em andamento";
    }
  }
  refreshNextAction();
}

/* ==========================================================================
   2b. PRÓXIMA AÇÃO (ORIENTAÇÃO POR TAREFA, NÃO POR ASSUNTO)
   ========================================================================== */
const VIA_STORAGE_KEY = "ufabc_via_ingresso";
const VIAS_INGRESSO = {
  sisu: { nome: "SiSU (ENEM)" },
  transferencia: { nome: "Transferência externa" },
  outro: { nome: "Outro processo" }
};
const LINK_CALENDARIOS = "https://prograd.ufabc.edu.br/calendarios";
const LINK_CONTATOS = "https://prograd.ufabc.edu.br/contatos";

function lerViaIngresso() {
  const via = localStorage.getItem(VIA_STORAGE_KEY) || "";
  return VIAS_INGRESSO[via] ? via : "";
}

function proximoPassoPendente() {
  const savedState = JSON.parse(localStorage.getItem("ufabc_checklist_progress") || "{}");
  return CHECKLIST_ITEMS.find(item => !savedState[item.id]) || null;
}

function refreshNextAction() {
  const titleEl = document.getElementById("nextActionTitle");
  const descEl = document.getElementById("nextActionDesc");
  const controls = document.getElementById("nextActionControls");
  const noteEl = document.getElementById("nextActionNote");
  const openBtn = document.getElementById("nextActionOpen");
  const doneBtn = document.getElementById("nextActionDone");
  if (!titleEl || !descEl || !controls || !openBtn || !doneBtn) return;

  const via = lerViaIngresso();
  const pendente = proximoPassoPendente();

  document.querySelectorAll("#viaSelector [data-via]").forEach(btn => {
    const ativo = btn.dataset.via === via;
    btn.classList.toggle("active", ativo);
    btn.setAttribute("aria-pressed", String(ativo));
  });

  doneBtn.hidden = !via || via === "outro" || !pendente;

  if (!via) {
    titleEl.textContent = "Diga como você ingressa na UFABC";
    descEl.textContent = "Isso muda os documentos e os prazos que você precisa conferir. A escolha fica salva apenas neste navegador.";
    controls.hidden = true;
    if (noteEl) noteEl.textContent = "";
    return;
  }

  controls.hidden = false;

  if (via === "outro") {
    titleEl.textContent = "Confirme seu processo no edital oficial";
    descEl.textContent = "Ainda não temos uma lista específica para o seu processo de ingresso neste protótipo. Consulte o edital do seu processo e fale com a ProGrad.";
    openBtn.textContent = "Abrir contatos oficiais";
    if (noteEl) noteEl.textContent = "O protótipo não confirma matrícula nem prazos.";
    return;
  }

  if (!pendente) {
    titleEl.textContent = "Você marcou todos os passos desta lista";
    descEl.textContent = "Confira o calendário acadêmico oficial para as datas do seu quadrimestre. As datas podem mudar.";
    openBtn.textContent = "Abrir calendário oficial";
    if (noteEl) noteEl.textContent = "Lista do protótipo: não substitui o calendário nem o edital.";
    return;
  }

  titleEl.textContent = pendente.title;
  descEl.textContent = pendente.desc;
  openBtn.textContent = "Abrir este passo";
  if (noteEl) {
    const restantes = CHECKLIST_ITEMS.filter(item => {
      const savedState = JSON.parse(localStorage.getItem("ufabc_checklist_progress") || "{}");
      return !savedState[item.id];
    }).length;
    noteEl.textContent = `Via escolhida: ${VIAS_INGRESSO[via].nome}. ${restantes} de ${CHECKLIST_ITEMS.length} passos pendentes.`;
  }
}

function initNextAction() {
  const selector = document.getElementById("viaSelector");
  const openBtn = document.getElementById("nextActionOpen");
  const doneBtn = document.getElementById("nextActionDone");
  if (!selector || !openBtn || !doneBtn) return;

  selector.querySelectorAll("[data-via]").forEach(btn => {
    btn.addEventListener("click", () => {
      localStorage.setItem(VIA_STORAGE_KEY, btn.dataset.via);
      refreshNextAction();
    });
  });

  openBtn.addEventListener("click", () => {
    const via = lerViaIngresso();
    const pendente = proximoPassoPendente();
    if (!via || via === "outro" || !pendente) {
      window.open(via === "outro" ? LINK_CONTATOS : LINK_CALENDARIOS, "_blank", "noopener");
      return;
    }
    const itemEl = document.getElementById(`item_${pendente.id}`);
    if (!itemEl) return;
    irParaPasso(pendente.id);
  });

  doneBtn.addEventListener("click", () => {
    const pendente = proximoPassoPendente();
    if (!pendente) return;
    const savedState = JSON.parse(localStorage.getItem("ufabc_checklist_progress") || "{}");
    savedState[pendente.id] = true;
    localStorage.setItem("ufabc_checklist_progress", JSON.stringify(savedState));
    const checkbox = document.getElementById(pendente.id);
    if (checkbox) checkbox.checked = true;
    const itemEl = document.getElementById(`item_${pendente.id}`);
    if (itemEl) {
      itemEl.classList.add("completed");
      itemEl.classList.remove("is-next");
    }
    updateProgressDisplay();
    refreshNextAction();
  });

  refreshNextAction();
}

/* ==========================================================================
   3. MAPAS MENTAIS & FLUXOS ESTILO MERMAID
   ========================================================================== */
const MINDMAPS_DATA = {
  matricula: {
    title: "1ª matrícula (automática) vs 2ª matrícula (ajuste e prioridades)",
    caption: "No 1º quadrimestre, o ingressante não escolhe disciplinas; a ProGrad realiza a matrícula automática em turmas introdutórias. A partir do 2º quadrimestre, o estudante escolhe suas turmas e concorre por prioridade regulamentar.",
    definition: `
graph TD
    classDef mainNode fill:#004d40,stroke:#00251a,stroke-width:2px,color:#ffffff;
    classDef subNode fill:#e8efec,stroke:#00796b,stroke-width:1.5px,color:#14221d;
    classDef alertNode fill:#fef7e0,stroke:#b06000,stroke-width:1.5px,color:#b06000;

    A[Ingresso SISU na UFABC]:::mainNode --> B[1º quadrimestre letivo]
    B --> B1[Matrícula 100% automática pela ProGrad]:::subNode
    B1 --> B2[Turmas predefinidas: FUV, BCC, EHC, etc.]
    B2 --> B3[Sem risco de perder vaga de calouro]

    A --> C[2º quadrimestre em diante]:::mainNode
    C --> C1[Fase 1: inscrição pelo SIGAA]:::subNode
    C1 --> C2[Processamento automático de vagas]
    
    C2 --> D{Critérios de prioridade em conflito}:::alertNode
    D --> P1[1º Curso da disciplina - afinidade]
    D --> P2[2º Turno oficial do discente]
    D --> P3[3º Maior coeficiente de progressão - CPk]
    D --> P4[4º Maior coeficiente de aproveitamento - CA]

    C2 --> E[Resultado do processamento]
    E --> E1[Deferido: vaga garantida]
    E --> E2[Indeferido: chutado da turma]
    E2 --> F[Fase de ajuste e reajuste livre]:::subNode
`
  },
  interdisciplinar: {
    title: "Arquitetura interdisciplinar: do ingresso ao pós-BI",
    caption: "A UFABC adota o regime em dois ciclos: o primeiro ciclo é o Bacharelado Interdisciplinar (BC&T ou BC&H) ou Licenciatura; o segundo ciclo permite ingressar na formação profissional específica sem prestar novo vestibular.",
    definition: `
graph LR
    classDef entrada fill:#004d40,stroke:#00251a,stroke-width:2px,color:#ffffff;
    classDef saida fill:#00796b,stroke:#004d40,stroke-width:1.5px,color:#ffffff;
    classDef posBi fill:#e8efec,stroke:#004d40,stroke-width:1px,color:#14221d;

    BC_T[BC&T: Ciência e Tecnologia]:::entrada --> ENG_AERO[Engenharia Aeroespacial]:::posBi
    BC_T --> ENG_BIO[Engenharia Biomédica]:::posBi
    BC_T --> ENG_GES[Engenharia de Gestão]:::posBi
    BC_T --> ENG_ENE[Engenharia de Energia]:::posBi
    BC_T --> BCC[Ciência da Computação]:::saida
    BC_T --> NEURO[Neurociência]:::saida
    BC_T --> FIS_MAT[Física / Química / Matemática]:::posBi

    BC_H[BC&H: Ciências e Humanidades]:::entrada --> RI[Relações Internacionais]:::saida
    BC_H --> ECON[Ciências Econômicas]:::posBi
    BC_H --> POL_PUB[Políticas Públicas]:::saida
    BC_H --> FILO[Filosofia]:::posBi

    LIC[Licenciaturas Interdisciplinares]:::entrada --> LIC_ESP[Licenciatura em Física/Química/Matemática/Biológicas]:::saida
`
  },
  transferencia: {
    title: "Transferência interna e mudança de curso de ingresso (Resolução 250)",
    caption: "Fluxo normativo regido pelo CONSEPE para transferência entre BC&T, BC&H, LCNE e LCH com aproveitamento total do RA e histórico.",
    definition: `
graph TD
    classDef etapa fill:#004d40,stroke:#00251a,stroke-width:2px,color:#ffffff;
    classDef condicao fill:#fef7e0,stroke:#b06000,stroke-width:1.5px,color:#b06000;
    classDef acao fill:#e8efec,stroke:#00796b,stroke-width:1.5px,color:#14221d;

    R[Requisitos iniciais]:::condicao --> R1[Estar matriculado há pelo menos 3 quadrimestres]
    R --> R2[Cursos permitidos: BC&T, BC&H, LCNE, LCH]
    R --> R3[Tentativa única no histórico institucional]

    R1 --> ED[Publicação do edital pela ProGrad]:::etapa
    ED --> INS[Inscrição online: curso + turno + campus]:::acao
    INS --> VAGAS[Vagas remanescentes de evasão e desligamentos]

    VAGAS --> CLASS{Classificação dos candidatos}:::condicao
    CLASS --> C1[1º Maior índice de afinidade - Ik]
    CLASS --> C2[2º Maior coeficiente de aproveitamento - CA]
    CLASS --> C3[3º Maior coeficiente de rendimento - CR]

    CLASS --> HOM[Resultado final e homologação]:::etapa
    HOM --> EFET[Efetivação: mantém RA e histórico escolar]:::acao
`
  },
  trancamento: {
    title: "Trancamento total de matrícula (Resolução 243)",
    caption: "Suspensão temporária das atividades acadêmicas sem prejuízo de coeficiente nem cômputo para tempo limite de jubilamento.",
    definition: `
graph TD
    classDef normNode fill:#004d40,stroke:#00251a,stroke-width:2px,color:#ffffff;
    classDef ruleNode fill:#e8efec,stroke:#00796b,stroke-width:1.5px,color:#14221d;
    classDef warnNode fill:#fef7e0,stroke:#b06000,stroke-width:1.5px,color:#b06000;

    INI[Solicitação de trancamento no SIGAA]:::normNode --> PRAZO{Dentro do prazo do calendário?}:::warnNode
    
    PRAZO -->|Sim| REGRAS[Regras de concessão]:::ruleNode
    PRAZO -->|Não| INDEF[Indeferido: exige justificativa médica ou força maior]

    REGRAS --> L1[Válido exclusivamente para o quadrimestre inteiro]
    REGRAS --> L2[Limite de até 3 quadrimestres no curso]
    REGRAS --> L3[Não há reprovação por falta nas turmas]

    REGRAS --> EFEITOS[Efeitos acadêmicos]:::normNode
    EFEITOS --> E1[Coeficientes CR, CA e CP ficam congelados]
    EFEITOS --> E2[Não conta para tempo máximo de jubilamento]
    EFEITOS --> E3[Vínculo permanece ativo sem benefícios de bolsa]

    EFEITOS --> RETORNO[Retorno automático no quadrimestre seguinte]:::ruleNode
`
  }
};

let currentMindmapKey = "matricula";

function initMindmaps() {
  const buttons = document.querySelectorAll(".mindmap-tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentMindmapKey = btn.getAttribute("data-map");
      renderCurrentMindmap();
    });
  });
}

function renderCurrentMindmap() {
  const container = document.getElementById("mermaidContainer");
  const titleEl = document.getElementById("mindmapActiveTitle");
  const captionEl = document.getElementById("mindmapActiveCaption");
  if (!container) return;

  const mapData = MINDMAPS_DATA[currentMindmapKey];
  if (!mapData) return;

  if (titleEl) titleEl.textContent = mapData.title;
  if (captionEl) captionEl.textContent = mapData.caption;

  container.removeAttribute("data-processed");
  container.innerHTML = mapData.definition;

  if (window.mermaid) {
    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "neutral",
        securityLevel: "loose"
      });
      window.mermaid.run({ nodes: [container] });
    } catch (e) {
      console.error("Erro ao renderizar Mermaid:", e);
    }
  }
}

/* ==========================================================================
   4. PERGUNTAS E RESPOSTAS (FAQ ACCORDION)
   ========================================================================== */
const FAQ_DATA = [
  {
    cat: "Matrícula",
    q: "Quando começam as aulas para calouros na UFABC?",
    a: "Para os ingressantes via SiSU do processo anual regular, as aulas dos calouros iniciam sempre no 2º Quadrimestre Letivo da universidade (em torno de junho). O 1º quadrimestre letivo do ano é cursado prioritariamente pelos veteranos."
  },
  {
    cat: "Matrícula",
    q: "Preciso ir presencialmente para efetuar a matrícula?",
    a: "Não. A matrícula é realizada 100% de forma online através de link seguro enviado pela ProGrad ao e-mail cadastrado no SiSU. As digitalizações dos documentos pessoais e escolares não necessitam de autenticação em cartório."
  },
  {
    cat: "Matrícula",
    q: "Eu preciso escolher matérias no meu primeiro quadrimestre?",
    a: "Não! No primeiro quadrimestre de ingresso, a ProGrad faz a matrícula automática em turmas introdutórias do seu curso (ex: Funções de Uma Variável, Bases Computacionais da Ciência, Evolução Histórica da Ciência). A escolha livre de matérias só começa a partir do seu segundo quadrimestre."
  },
  {
    cat: "Aulas",
    q: "O que acontece se eu reprovar em uma disciplina do 1º quadrimestre?",
    a: "Você não perde a vaga na universidade nem é jubilado por uma reprovação inicial. A matéria reprovada precisará ser cursada novamente em quadrimestre futuro. Atenção: a nota entra no cálculo do CR, mas seu CA considera apenas aprovações."
  },
  {
    cat: "Transporte",
    q: "Como funciona o ônibus Fretado entre Santo André e São Bernardo?",
    a: "O fretado é gratuito para toda a comunidade discente da UFABC. Ele circula durante todo o período de aulas ligando os dois campi. O embarque é realizado mediante apresentação da carteirinha da UFABC física ou digital no celular."
  },
  {
    cat: "Alimentação",
    q: "Como funciona o Restaurante Universitário (RU) e quanto custa?",
    a: "O RU oferece almoço e jantar subsidiados, com cardápios que incluem opções tradicionais e opções veganas/vegetarianas completas. Os créditos são inseridos na carteirinha estudantil via portal online ou no guichê do campus."
  },
  {
    cat: "Trocas",
    q: "É possível trocar de turno ou campus logo que entro na UFABC?",
    a: "Para mudança de turno no primeiro quadrimestre, apenas em casos excepcionais previstos em edital de permuta ou comprovação imediata de trabalho incompatível com o horário. A transferência interna regular exige ter concluído no mínimo 3 quadrimestres."
  },
  {
    cat: "Acadêmico",
    q: "O que é o sistema T-P-I que aparece no plano de ensino?",
    a: "É a métrica de carga horária da UFABC: T = Teoria (horas com professor), P = Prática (horas em laboratório) e I = Indivíduo (horas semanais de estudo autônomo recomendadas fora da sala de aula)."
  },
  {
    cat: "Acadêmico",
    q: "O que é Trancamento de Matrícula e como ele me protege?",
    a: "Regulado pela Resolução CONSEPE 243, o trancamento permite suspender as atividades por um quadrimestre inteiro sem ser reprovado por falta nem perder o vínculo com a universidade, congelando seus coeficientes."
  }
];

function initFaq() {
  const container = document.getElementById("faqAccordionContainer");
  const searchInput = document.getElementById("faqSearchInput");
  const filterPills = document.querySelectorAll(".faq-pill-btn");

  let activeCat = "Todas";
  let queryText = "";

  function renderFaq() {
    if (!container) return;
    container.innerHTML = "";

    const filtered = FAQ_DATA.filter(item => {
      const matchCat = activeCat === "Todas" || item.cat === activeCat;
      const matchQuery = !queryText || item.q.toLowerCase().includes(queryText.toLowerCase()) || item.a.toLowerCase().includes(queryText.toLowerCase());
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-muted);">Nenhuma pergunta encontrada para sua busca.</div>`;
      return;
    }

    filtered.forEach((item, idx) => {
      const el = document.createElement("div");
      el.className = "faq-item";
      el.innerHTML = `
        <button class="faq-question-btn" type="button" aria-expanded="false" aria-controls="faq_ans_${idx}">
          <span><span class="faq-badge">${item.cat}</span>${item.q}</span>
          <svg class="faq-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="faq-answer-panel" id="faq_ans_${idx}" role="region">
          ${item.a}
        </div>
      `;

      const btn = el.querySelector(".faq-question-btn");
      btn.addEventListener("click", () => {
        const isOpen = el.classList.contains("open");
        el.classList.toggle("open", !isOpen);
        btn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
      });

      container.appendChild(el);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      queryText = e.target.value.trim();
      renderFaq();
    });
  }

  filterPills.forEach(p => {
    p.addEventListener("click", () => {
      filterPills.forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      activeCat = p.getAttribute("data-cat");
      renderFaq();
    });
  });

  renderFaq();
}

/* ==========================================================================
   5. ACESSO POR MODALIDADE & LUGARES NO CAMPUS
   ========================================================================== */
const MODALIDADES_CONFIG = {
  ac: {
    nome: "Ampla concorrência (AC)",
    sub: "Modalidade geral de ingresso sem reserva de vagas",
    docs: [
      "Documento de identidade oficial com foto (RG ou CNH)",
      "Certificado de conclusão do ensino médio",
      "Histórico escolar completo do ensino médio",
      "Título de eleitor e comprovante de quitação eleitoral",
      "Certificado de quitação do serviço militar (homens de 18 a 45 anos)"
    ],
    locais: [
      { nome: "Comissão de homologação", sala: "Atendimento online via SIGAA / E-mail institucional", desc: "Homologação documental e análise de recursos de matrícula de todas as modalidades: comissao.homologacao@ufabc.edu.br." },
      { nome: "Seção de matrículas e registro acadêmico (ProGrad)", sala: "Campus Santo André - Bloco A, Torre 1, 2º Andar", desc: "Local para retirada de documentos oficiais, declarações de matrícula e certidões acadêmicas." },
      { nome: "Restaurante Universitário (RU)", sala: "Campus Santo André: Ao lado do Bloco B / SBC: Térreo do Bloco Beta", desc: "Acesso com carteirinha estudantil. Horários: Almoço (11h às 14h) e Jantar (17h30 às 20h30)." },
      { nome: "Terminal do fretado intercampi", sala: "Campus Santo André: Estacionamento do Bloco A / SBC: Portaria Principal", desc: "Ônibus direto entre Santo André e São Bernardo." }
    ]
  },
  renda: {
    nome: "Cotas de renda (L1, L2)",
    sub: "Renda familiar bruta per capita igual ou inferior a 1 salário mínimo",
    docs: [
      "Todos os documentos básicos da modalidade geral",
      "Formulário socioeconômico de comprovação de renda preenchido",
      "Comprovantes de rendimento de todos os membros do grupo familiar (CTPS, holerites, extratos bancários)",
      "Comprovante de residência atualizado (últimos 3 meses)",
      "Autodeclaração de pertencimento e documentação de ações afirmativas (se L2)"
    ],
    locais: [
      { nome: "Divisão de assuntos comunitários e permanência (ProAP)", sala: "Campus Santo André - Bloco A, Torre 1, 1º Andar", desc: "Gestão dos auxílios estudantis do PAAE: auxílio-permanência, auxílio-alimentação e auxílio-transporte." },
      { nome: "Comissão de homologação", sala: "Atendimento preferencialmente online via SIGAA / E-mail institucional", desc: "Análise e homologação documental de todas as modalidades de ingresso (renda, cotas, heteroidentificação, PCD e ações afirmativas): comissao.homologacao@ufabc.edu.br." }
    ]
  },
  pcd: {
    nome: "Pessoas com deficiência (PCD) / acessibilidade",
    sub: "Candidatos com deficiência e necessidades educacionais especiais",
    docs: [
      "Documentação básica de conclusão do ensino médio",
      "Laudo médico pericial recente com CID da condição de deficiência",
      "Relatório descritivo de recursos pedagógicos e de acessibilidade necessários"
    ],
    locais: [
      { nome: "NAE - Núcleo de Acessibilidade da UFABC", sala: "Campus Santo André - Bloco A, Torre 1, Sala Térrea (Acesso Rampa)", desc: "Acolhimento de estudantes com deficiência, empréstimo de tecnologia assistiva, intérpretes de Libras e adaptação de material didático." },
      { nome: "Rotas acessíveis e elevadores", sala: "Bloco A (todas as torres possuem elevadores com identificação sonora e em Braille)", desc: "Conexões planas e rampas nos andares 0, 1 e 2." }
    ]
  },
  trans: {
    nome: "Ações afirmativas (transgêneros, indígenas e quilombolas)",
    sub: "Candidatos inscritos nas reservas suplementares de inclusão social",
    docs: [
      "Documentação básica de conclusão de estudos",
      "Autodeclaração específica da modalidade de ação afirmativa",
      "Formulário de inclusão e solicitação de uso de nome social no SIGAA / UFABC",
      "Declaração de pertencimento comunitário (indígenas e quilombolas)"
    ],
    locais: [
      { nome: "Assessoria de diversidade e direitos humanos", sala: "Campus Santo André - Bloco A, Torre 2, 1º Andar", desc: "Apoio e garantia do uso do nome social em chamadas, sistemas e carteirinha sem burocracia." },
      { nome: "Coletivos e centros acadêmicos", sala: "Campus Santo André: Vivência estudantil / SBC: Térreo", desc: "Espaço de integração comunitária e acolhimento dos estudantes ingressantes." }
    ]
  },
  noturno: {
    nome: "Ingressante noturno / estudante trabalhador",
    sub: "Estudantes matriculados no turno noturno com jornada de trabalho diurna",
    docs: [
      "Documentação básica de ingresso",
      "Declaração da empresa com horário de jornada de trabalho (caso solicite permuta ou adaptação de estágio)",
      "Carteira de trabalho física ou digital"
    ],
    locais: [
      { nome: "Secretaria de atendimento acadêmico do turno noturno", sala: "Campus Santo André - Bloco A, Torre 1, Térreo", desc: "Atendimento estendido até as 21h30 para recebimento de requerimentos de estudantes que trabalham durante o dia." },
      { nome: "Ponto do fretado noturno", sala: "Partidas programadas logo após o término da última aula das 22h30", desc: "Transporte seguro para integração com linhas de trem e metrô." }
    ]
  }
};

function initModalidades() {
  const selectorGrid = document.getElementById("modalidadeSelectorGrid");
  const titleEl = document.getElementById("modSelectedTitle");
  const subEl = document.getElementById("modSelectedSub");
  const docsList = document.getElementById("modDocsList");
  const locaisList = document.getElementById("modLocaisList");

  if (!selectorGrid) return;

  const docsProgress = document.getElementById("modDocsProgress");

  // Checklist de documentos: marcação local, sem envio a servidor.
  function renderDocs(key, config) {
    if (!docsList) return;
    const salvos = JSON.parse(localStorage.getItem("ufabc_docs_checklist") || "{}");
    const marcados = salvos[key] || {};
    docsList.replaceChildren();

    const atualizarProgresso = () => {
      if (!docsProgress) return;
      const feitos = config.docs.filter((_, index) => marcados[index]).length;
      if (feitos === 0) {
        docsProgress.textContent = `Nenhum dos ${config.docs.length} documentos marcados ainda.`;
      } else if (feitos === config.docs.length) {
        docsProgress.textContent = `Todos os ${config.docs.length} documentos separados. Confira o edital antes de enviar.`;
      } else {
        docsProgress.textContent = `${feitos} de ${config.docs.length} documentos separados.`;
      }
    };

    config.docs.forEach((doc, index) => {
      const item = document.createElement("li");
      item.className = "doc-item";
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = `doc_${key}_${index}`;
      input.checked = Boolean(marcados[index]);
      const text = document.createElement("span");
      text.textContent = doc;
      label.appendChild(input);
      label.appendChild(text);
      item.appendChild(label);
      item.classList.toggle("checked", input.checked);

      input.addEventListener("change", () => {
        if (input.checked) marcados[index] = true;
        else delete marcados[index];
        salvos[key] = marcados;
        localStorage.setItem("ufabc_docs_checklist", JSON.stringify(salvos));
        item.classList.toggle("checked", input.checked);
        atualizarProgresso();
      });

      docsList.appendChild(item);
    });

    atualizarProgresso();
  }

  function renderDetails(key) {
    const config = MODALIDADES_CONFIG[key];
    if (!config) return;

    if (titleEl) titleEl.textContent = config.nome;
    if (subEl) titleEl.textContent = config.nome;
    if (subEl) subEl.textContent = config.sub;

    renderDocs(key, config);

    if (locaisList) {
      locaisList.innerHTML = config.locais.map(l => `
        <div class="location-item">
          <div class="loc-name">${l.nome}</div>
          <div class="loc-room">${l.sala}</div>
          <div class="loc-desc">${l.desc}</div>
        </div>
      `).join("");
    }
  }

  selectorGrid.innerHTML = "";
  Object.keys(MODALIDADES_CONFIG).forEach((key, index) => {
    const item = MODALIDADES_CONFIG[key];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `modalidade-card-btn ${index === 0 ? "active" : ""}`;
    btn.innerHTML = `
      <div class="mod-title">${item.nome}</div>
      <div class="mod-subtitle">${item.sub}</div>
    `;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".modalidade-card-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderDetails(key);
    });

    selectorGrid.appendChild(btn);
  });

  renderDetails("ac");
}

/* ==========================================================================
   6. SIGLAS ESSENCIAIS DO INGRESSANTE (SEM RUÍDOS COMO SUAP)
   ========================================================================== */
const ESSENTIAL_SIGLAS = [
  { sigla: "T-P-I", nome: "Teoria, prática, indivíduo", desc: "Métrica semanal da UFABC. Ex: 4-0-4 significa 4 horas de aula teórica com professor e 4 horas semanais esperadas de estudo individual fora da sala.", categoria: "Acadêmico" },
  { sigla: "CR", nome: "Coeficiente de rendimento", desc: "Média ponderada dos conceitos em todas as matérias cursadas, incluindo reprovações.", categoria: "Acadêmico" },
  { sigla: "CA", nome: "Coeficiente de aproveitamento", desc: "Média ponderada dos conceitos calculada apenas nas matérias em que o aluno foi aprovado.", categoria: "Acadêmico" },
  { sigla: "CP", nome: "Coeficiente de progressão", desc: "Percentual de créditos já integralizados pelo discente em relação ao total exigido pelo curso.", categoria: "Acadêmico" },
  { sigla: "BC&T", nome: "Bacharelado em Ciência e Tecnologia", desc: "Curso interdisciplinar de entrada de exatas que dá acesso a engenharias, computação e ciências exatas.", categoria: "Cursos" },
  { sigla: "BC&H", nome: "Bacharelado em Ciências e Humanidades", desc: "Curso interdisciplinar de entrada com ênfase em ciências sociais, econômicas e humanas.", categoria: "Cursos" },
  { sigla: "SIGAA", nome: "Sistema Integrado de Gestão Acadêmica", desc: "Portal oficial de notas, histórico, turmas virtuais e onde são feitas as matrículas a partir do 2º quadrimestre.", categoria: "Sistemas" },
  { sigla: "Fretado", nome: "Ônibus gratuito intercampi", desc: "Linha gratuita que conecta os campi Santo André e São Bernardo do Campo com apresentação de carteirinha estudantil.", categoria: "Campus" },
  { sigla: "RU", nome: "Restaurante Universitário", desc: "Refeições com valor subsidiado preparadas por nutricionistas nos dois campi da universidade.", categoria: "Campus" },
  { sigla: "NAE", nome: "Núcleo de Acessibilidade", desc: "Setor responsável por acolhimento de PCDs, tecnologia assistiva, intérpretes de Libras e adaptações de acessibilidade.", categoria: "Acessibilidade" },
  { sigla: "ProGrad", nome: "Pró-Reitoria de Graduação", desc: "Órgão central responsável pelas matrículas, editais de ingresso e normativas dos cursos de graduação.", categoria: "Acadêmico" },
  { sigla: "ProAP", nome: "Pró-Reitoria de Assuntos Comunitários", desc: "Órgão gestor dos auxílios de permanência, moradia e alimentação (PAAE) para estudantes em vulnerabilidade.", categoria: "Acadêmico" }
];

function initGlossary() {
  const container = document.getElementById("glossaryCardsContainer");
  const searchInput = document.getElementById("glossarySearchInput");
  const filterPills = document.querySelectorAll(".glossary-pill-btn");

  let currentCategory = "Todos";
  let searchTerm = "";

  function render() {
    if (!container) return;
    container.innerHTML = "";

    const filtered = ESSENTIAL_SIGLAS.filter(item => {
      const matchCat = currentCategory === "Todos" || item.categoria === currentCategory;
      const matchText = item.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.desc.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-muted);">Nenhum termo encontrado para os critérios selecionados.</div>`;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement("div");
      card.className = "ui-card";
      card.innerHTML = `
        <div class="card-header">
          <div class="card-icon-wrapper">
            <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          </div>
          <div class="card-title-group">
            <span class="card-tag">${item.categoria}</span>
            <h3>${item.sigla}</h3>
            <div style="font-size:0.8rem; font-weight:600; color:var(--text-main);">${item.nome}</div>
          </div>
        </div>
        <div class="card-body">${item.desc}</div>
      `;
      container.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();
      render();
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener("click", () => {
      filterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.getAttribute("data-category");
      render();
    });
  });

  render();
}

/* ==========================================================================
   7. BUSCA GLOBAL COM MODAL (CTRL + K)
   ========================================================================== */
function initGlobalSearch() {
  const modalBackdrop = document.getElementById("searchModalBackdrop");
  const modalInput = document.getElementById("searchModalInput");
  const resultsContainer = document.getElementById("searchResultsList");
  const searchTriggerBtn = document.getElementById("searchTriggerBtn");
  const searchCloseBtn = document.getElementById("searchCloseBtn");
  let previousFocus = null;

  function openSearch() {
    if (!modalBackdrop) return;
    previousFocus = document.activeElement;
    modalBackdrop.classList.add("open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    modalInput.value = "";
    modalInput.focus();
    renderResults("");
  }

  function closeSearch() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  if (searchCloseBtn) searchCloseBtn.addEventListener("click", closeSearch);

  if (searchTriggerBtn) {
    searchTriggerBtn.addEventListener("click", openSearch);
  }

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      modalBackdrop && modalBackdrop.classList.contains("open") ? closeSearch() : openSearch();
    }
    if (e.key === "Escape" && modalBackdrop && modalBackdrop.classList.contains("open")) {
      closeSearch();
    }
    if (e.key === "Tab" && modalBackdrop && modalBackdrop.classList.contains("open")) {
      const focusable = Array.from(modalBackdrop.querySelectorAll("input, button"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) closeSearch();
    });
  }

  function renderResults(query) {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = "";

    const searchPool = [
      ...CHECKLIST_ITEMS.map(i => ({ title: i.title, desc: i.desc, tab: "tabChecklist", type: "Trilha" })),
      ...FAQ_DATA.map(f => ({ title: f.q, desc: f.a, tab: "tabFaq", type: "Dúvidas frequentes", faq: true })),
      ...ESSENTIAL_SIGLAS.map(g => ({ title: `${g.sigla} - ${g.nome}`, desc: g.desc, tab: "tabSiglas", type: "Siglas" })),
      { title: "Mapas Mentais de Matrícula e Cursos", desc: "Visualizações do sistema de 1ª e 2ª matrícula, transferência e pós-BI.", tab: "tabMapas", type: "Mapas" },
      { title: "Lugares e Documentos por Modalidade", desc: "Acesso direcionado para Ampla Concorrência, Cotas de Renda, Escola Pública e PCD.", tab: "tabModalidades", type: "Modalidades" },
      { title: "Guia de Bloco A (Campus Santo André)", desc: "Torres 1, 2 e 3 e conexões nos andares 0, 1 e 2.", tab: "tabCampus", type: "Campus" }
    ];

    const q = query.toLowerCase().trim();
    const matches = searchPool.filter(p => !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).slice(0, 8);

    if (matches.length === 0) {
      const empty = document.createElement("li");
      empty.className = "search-empty";
      empty.textContent = `Nenhum resultado para "${query}".`;
      resultsContainer.appendChild(empty);
      return;
    }

    matches.forEach(m => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "search-result-item";
      const content = document.createElement("span");
      const title = document.createElement("span");
      title.className = "search-result-title";
      title.textContent = m.title;
      const desc = document.createElement("span");
      desc.className = "search-result-desc";
      desc.textContent = `${m.desc.slice(0, 100)}…`;
      const type = document.createElement("span");
      type.className = "checklist-badge";
      type.textContent = m.type;
      content.append(title, desc);
      button.append(content, type);
      button.addEventListener("click", () => {
        closeSearch();
        const tabBtn = document.querySelector(`.nav-item-btn[data-target="${m.tab}"]`);
        if (tabBtn) {
          tabBtn.click();
          if (m.faq) {
            const allFilter = document.querySelector('.faq-pill-btn[data-cat="Todas"]');
            const faqInput = document.getElementById("faqSearchInput");
            if (allFilter) allFilter.click();
            if (faqInput) {
              faqInput.value = "";
              faqInput.dispatchEvent(new Event("input"));
            }
            const faqButton = Array.from(document.querySelectorAll(".faq-question-btn"))
              .find(item => item.textContent.includes(m.title));
            if (faqButton) {
              faqButton.click();
              faqButton.focus();
              return;
            }
          }
          const heading = document.querySelector(`#${m.tab} h2`);
          if (heading) {
            heading.tabIndex = -1;
            heading.focus();
          }
        }
      });
      li.appendChild(button);
      resultsContainer.appendChild(li);
    });
  }

  if (modalInput) {
    modalInput.addEventListener("input", (e) => {
      renderResults(e.target.value);
    });
  }
}

/* ==========================================================================
   8. CONTROLES DE ACESSIBILIDADE E TEMA
   ========================================================================== */
function initAccessibility() {
  const btnTheme = document.getElementById("btnToggleTheme");
  const btnContrast = document.getElementById("btnToggleContrast");
  const btnFontIncrease = document.getElementById("btnFontIncrease");
  const btnFontDecrease = document.getElementById("btnFontDecrease");

  const currentTheme = localStorage.getItem("ufabc_ui_theme") || "light";
  document.documentElement.setAttribute("data-theme", currentTheme);

  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const nextTheme = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("ufabc_ui_theme", nextTheme);
      if (document.getElementById("tabMapas").classList.contains("active")) {
        renderCurrentMindmap();
      }
    });
  }

  if (btnContrast) {
    btnContrast.addEventListener("click", () => {
      const isHigh = document.documentElement.getAttribute("data-contrast") === "high";
      document.documentElement.setAttribute("data-contrast", isHigh ? "normal" : "high");
      btnContrast.classList.toggle("active", !isHigh);
    });
  }

  let fontScale = 16;
  if (btnFontIncrease) {
    btnFontIncrease.addEventListener("click", () => {
      if (fontScale < 22) {
        fontScale += 1;
        document.documentElement.style.setProperty("--font-base-size", `${fontScale}px`);
      }
    });
  }
  if (btnFontDecrease) {
    btnFontDecrease.addEventListener("click", () => {
      if (fontScale > 13) {
        fontScale -= 1;
        document.documentElement.style.setProperty("--font-base-size", `${fontScale}px`);
      }
    });
  }
}

/* Respostas prontas por padrão; IA local é opcional e requer servidor local. */
function initChat() {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");
  const useAI = document.getElementById("chatUseAI");
  const status = document.getElementById("chatStatus");
  if (!form || !input || !messages) return;

  const answers = {
    inicio: {
      text: "Vamos por partes: comece consultando as orientações oficiais do processo pelo qual você ingressou. Depois, confira o que ainda precisa fazer. Se não encontrar seu processo, peça ajuda à ProGrad.",
      label: "Consultar orientações de ingresso da ProGrad",
      url: "https://prograd.ufabc.edu.br/"
    },
    matricula: {
      text: "Os documentos e prazos dependem do processo de ingresso e do edital vigente. O link abaixo é específico para ingresso via SiSU; para outros processos, consulte a página da ProGrad. O protótipo não confirma sua matrícula.",
      label: "Consultar a página oficial do SiSU na UFABC",
      url: "https://prograd.ufabc.edu.br/sisu"
    },
    aulas: {
      text: "Para encontrar as datas, consulte o calendário acadêmico oficial e as orientações específicas do seu ingresso. As datas podem mudar.",
      label: "Consultar calendários oficiais",
      url: "https://prograd.ufabc.edu.br/calendarios"
    },
    apoio: {
      text: "Você não precisa resolver tudo sozinho. A página de contatos da ProGrad pode ajudar a encontrar o canal adequado. Se a dúvida for sobre uma situação pessoal, procure atendimento humano e não compartilhe dados sensíveis neste protótipo.",
      label: "Consultar contatos oficiais da ProGrad",
      url: "https://prograd.ufabc.edu.br/contatos"
    },
    estagio: {
      text: "Ainda não temos informações oficiais sobre estágio nesta base experimental. Consulte a Pró-Reitoria de Graduação ou a coordenação do seu curso para orientações sobre estágio obrigatório e não obrigatório.",
      label: "Consultar contatos oficiais da ProGrad",
      url: "https://prograd.ufabc.edu.br/contatos"
    },
    desconhecido: {
      text: "Ainda não sei orientar essa dúvida. Este protótipo reconhece apenas alguns assuntos e não substitui atendimento humano. Tente uma das sugestões ou consulte a ProGrad.",
      label: "Consultar contatos oficiais da ProGrad",
      url: "https://prograd.ufabc.edu.br/contatos"
    }
  };

  function appendMessage(author, text) {
    const message = document.createElement("div");
    message.className = `chat-message ${author === "Você" ? "chat-user" : "chat-assistant"}`;
    const name = document.createElement("strong");
    name.textContent = `${author}: `;
    message.append(name, document.createTextNode(text));
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendSources(sources, mode) {
    const wrapper = document.createElement("div");
    wrapper.className = "chat-sources";
    const heading = document.createElement("strong");
    heading.textContent = mode === "sem-evidencia" ? "Atendimento:" : "Fontes (base experimental):";
    wrapper.appendChild(heading);
    if (mode === "sem-evidencia") {
      const p = document.createElement("p");
      p.textContent = "Este protótipo não tem evidência para sua dúvida. Procure atendimento humano.";
      wrapper.appendChild(p);
      const link = document.createElement("a");
      link.href = "https://prograd.ufabc.edu.br/contatos";
      link.textContent = "Contatos oficiais da ProGrad";
      wrapper.appendChild(link);
    } else {
      sources.forEach(source => {
        if (!source || typeof source.url !== "string") return;
        try {
          const url = new URL(source.url);
          if (url.protocol !== "https:") return;
          const item = document.createElement("div");
          item.className = "chat-source-item";
          const link = document.createElement("a");
          link.href = url.href;
          link.textContent = source.label || "Fonte";
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          const meta = document.createElement("div");
          meta.className = "chat-source-meta";
          const tipo = source.source_type === "oficial" ? "Oficial (ProGrad)" : "Material do usuário (Canva)";
          meta.textContent = `${tipo} · ${source.organization || ""} · verificada em ${source.verified_at || ""}`;
          item.appendChild(link);
          item.appendChild(meta);
          if (mode === "trecho-direto" && source.excerpt) {
            const excerpt = document.createElement("p");
            excerpt.className = "chat-source-excerpt";
            excerpt.textContent = source.excerpt;
            item.appendChild(excerpt);
          }
          wrapper.appendChild(item);
        } catch { /* ignorar fonte inválida */ }
      });
    }
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  async function respondWithAI(text, fallbackTopic) {
    appendMessage("Você", text);
    if (status) status.textContent = "Consultando a IA local. Isso pode levar alguns instantes…";
    try {
      if (location.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(location.hostname)) {
        throw new Error("Abra o portal pelo servidor local para usar a IA.");
      }
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }), signal: AbortSignal.timeout(120000)
      });
      const result = await response.json();
      if (!response.ok || typeof result.reply !== "string") throw new Error("IA local indisponível.");
      appendMessage("IA local (experimental)", result.reply);
      appendSources(result.sources || [], result.mode || "ia-experimental");
    } catch (error) {
      const fallback = answers[fallbackTopic] || answers.desconhecido;
      console.warn("[chat] IA local indisponível:", error && error.message ? error.message : error);
      appendMessage("Orientação", `A IA local não respondeu agora. Resposta pronta: ${fallback.text}`);
      appendSources([], "sem-evidencia");
    } finally {
      if (status) status.textContent = "";
    }
  }

  // Assuntos sem cobertura na base: o chat responde com o texto pronto, sem consultar a IA.
  const semCobertura = new Set(["estagio"]);

  function respond(text, topic) {
    if (useAI && useAI.checked && !semCobertura.has(topic)) {
      void respondWithAI(text, topic);
      return;
    }
    const answer = answers[topic] || answers.desconhecido;
    appendMessage("Você", text);
    appendMessage("Orientação", answer.text);
  }

  document.querySelectorAll("[data-chat-topic]").forEach(button => {
    button.addEventListener("click", () => respond(button.textContent, button.dataset.chatTopic));
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const query = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let topic = "desconhecido";
    if (/ajuda|contato|apoio|atendimento/.test(query)) topic = "apoio";
    else if (/estagio|estagios|emprego|trabalho/.test(query)) topic = "estagio";
    else if (/matricula|documento|edital|sisu|cota/.test(query)) topic = "matricula";
    else if (/aula|calendario|data|quadrimestre/.test(query)) topic = "aulas";
    else if (/comec|primeiro|inicio|perdid|orienta/.test(query)) topic = "inicio";
    input.value = "";
    respond(text, topic);
  });
}
