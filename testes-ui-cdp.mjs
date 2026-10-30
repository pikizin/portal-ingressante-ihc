// Teste de interface via Chrome DevTools Protocol (CDP).
// Pré-requisitos: servidor local em http://127.0.0.1:4173 e Chrome/Edge headless com
// --remote-debugging-port=9222. Exemplo no PowerShell:
//   $chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
//   Start-Process $chrome -ArgumentList "--headless=new","--remote-debugging-port=9222",
//     "--user-data-dir=$env:TEMP\opencode\chrome-ui-test","about:blank"
//   node testes-ui-cdp.mjs
const list = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json());
const page = list.find(item => item.type === 'page');
if (!page) throw new Error('Nenhuma aba disponível');

const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
const exceptions = [];

ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
  if (message.method === 'Runtime.exceptionThrown') {
    exceptions.push(message.params?.exceptionDetails?.exception?.description || 'exceção sem descrição');
  }
});

const send = (method, params = {}) => new Promise(resolve => {
  const id = ++nextId;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
await new Promise(resolve => ws.addEventListener('open', resolve));
await send('Page.enable');
await send('Runtime.enable');

async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.result?.exceptionDetails) {
    throw new Error(response.result.exceptionDetails.exception?.description || 'erro na avaliação');
  }
  return response.result?.result?.value;
}

async function load(suffix = '') {
  await send('Page.navigate', { url: `http://127.0.0.1:4173/${suffix}` });
  for (let tentativa = 0; tentativa < 80; tentativa++) {
    await sleep(250);
    try {
      const pronto = await evaluate("document.readyState === 'complete' && !!document.getElementById('nextActionTitle')");
      if (pronto) return;
    } catch { /* contexto da página trocando durante a navegação */ }
  }
  throw new Error('a página não terminou de carregar');
}

const resultados = [];
const checar = (nome, obtido, esperado) => {
  const ok = String(obtido).includes(esperado);
  resultados.push({ ok, nome, obtido: String(obtido).slice(0, 160) });
};

await load();
await evaluate("localStorage.clear()");
await load(`?limpo=${Date.now()}`);

checar('card inicial pede a via de ingresso',
  await evaluate("document.getElementById('nextActionTitle').textContent"),
  'Diga como você ingressa');

checar('controles escondidos sem via escolhida',
  await evaluate("document.getElementById('nextActionControls').hidden"),
  'true');

const tituloAposVia = await evaluate(`
  document.querySelector('#viaSelector [data-via="sisu"]').click();
  document.getElementById('nextActionTitle').textContent;
`);
checar('após escolher SiSU mostra o primeiro passo',
  tituloAposVia,
  'Envio de documentos');

checar('botão da via fica marcado para leitor de tela',
  await evaluate("document.querySelector('#viaSelector [data-via=\"sisu\"]').getAttribute('aria-pressed')"),
  'true');

const depoisDeConcluir = await evaluate(`
  document.getElementById('nextActionDone').click();
  JSON.stringify({
    titulo: document.getElementById('nextActionTitle').textContent,
    progresso: document.getElementById('heroProgressText').textContent,
    salvo: localStorage.getItem('ufabc_checklist_progress')
  });
`);
checar('concluir passo avança para o próximo', depoisDeConcluir, 'Criação do e-mail institucional');
checar('progresso do herói atualiza', depoisDeConcluir, '1/8');
checar('estado do checklist é salvo', depoisDeConcluir, 'step_doc');

const aposAbrirPasso = await evaluate(`
  document.getElementById('nextActionOpen').click();
  JSON.stringify({
    destacado: document.getElementById('item_step_email').classList.contains('is-next'),
    foco: document.activeElement?.id
  });
`);
checar('abrir passo destaca o item na lista', aposAbrirPasso, '"destacado":true');
checar('abrir passo leva o foco ao checkbox', aposAbrirPasso, '"foco":"step_email"');

checar('desmarcar na lista volta a ser a próxima ação',
  await evaluate(`
    document.getElementById('step_doc').click();
    document.getElementById('nextActionTitle').textContent;
  `),
  'Envio de documentos');

// Remarca o passo para a verificação de persistência ficar significativa.
await evaluate("document.getElementById('step_doc').click()");

const docs = await evaluate(`
  document.querySelector('.nav-item-btn[data-target="tabModalidades"]').click();
  JSON.stringify({
    total: document.querySelectorAll('#modDocsList .doc-item').length,
    progresso: document.getElementById('modDocsProgress').textContent
  });
`);
checar('lista de documentos renderiza', docs, '"total":5');
checar('progresso de documentos começa vazio', docs, 'Nenhum dos 5');

const docMarcado = await evaluate(`
  document.getElementById('doc_ac_0').click();
  document.getElementById('modDocsProgress').textContent + ' | ' + localStorage.getItem('ufabc_docs_checklist');
`);
checar('marcar documento atualiza o progresso', docMarcado, '1 de 5');
checar('marcação de documento é salva', docMarcado, '{"ac":{"0":true}}');

const outraModalidade = await evaluate(`
  document.querySelectorAll('.modalidade-card-btn')[1].click();
  JSON.stringify({
    progresso: document.getElementById('modDocsProgress').textContent,
    total: document.querySelectorAll('#modDocsList .doc-item').length
  });
`);
checar('trocar de modalidade usa lista própria', outraModalidade, 'Nenhum dos 5');

await load(`?persistencia=${Date.now()}`);

checar('via e progresso persistem após recarregar',
  await evaluate("document.getElementById('nextActionTitle').textContent"),
  'Criação do e-mail institucional');

const docsDepoisDeRecarregar = await evaluate(`
  document.querySelector('.nav-item-btn[data-target="tabModalidades"]').click();
  document.getElementById('modDocsProgress').textContent;
`);
checar('documentos marcados persistem após recarregar', docsDepoisDeRecarregar, '1 de 5');

for (const item of resultados) {
  console.log(`${item.ok ? 'OK  ' : 'FALHA'} | ${item.nome}`);
  if (!item.ok) console.log(`       obtido: ${item.obtido}`);
}
console.log(`\n${resultados.filter(r => r.ok).length}/${resultados.length} verificações passaram`);
console.log('Exceções na página:', exceptions.length ? exceptions : 'nenhuma');
ws.close();
process.exit(resultados.every(r => r.ok) && exceptions.length === 0 ? 0 : 1);
