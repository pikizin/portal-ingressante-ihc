import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, createServer } from './servidor-local.mjs';

test('sem evicência não chama modelo', async () => {
  let chamado = false;
  const search = { search: () => [] };
  const result = await answer('Onde vejo datas?', async () => {
    chamado = true;
    return { message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'buscar_trechos_oficiais', arguments: {} } }] } };
  }, search);
  assert.equal(result.mode, 'sem-evidencia');
  assert.equal(chamado, false);
  assert.deepEqual(result.sources, []);
});

test('recusa ferramenta desconhecida e argumentos herdados', async () => {
  const search = { search: () => [{ id: 'x', title: 'T', url: 'https://prograd.ufabc.edu.br/sisu', excerpt: 'E', verified_at: '2026-10-29', review_after: '2026-11-12', organization: 'O' }] };
  for (const fn of [
    { name: 'executar_shell', arguments: {} },
    { name: 'buscar_trechos_oficiais', arguments: { assunto: 'calendario' } },
  ]) {
    await assert.rejects(answer('teste', async () => ({ message: { tool_calls: [{ function: fn }] } }), search));
  }
});

test('recusa resposta sem chamada de ferramenta', async () => {
  const search = { search: () => [{ id: 'x', title: 'T', url: 'https://prograd.ufabc.edu.br/sisu', excerpt: 'E', verified_at: '2026-10-29', review_after: '2026-11-12', organization: 'O' }] };
  await assert.rejects(answer('teste', async () => ({ message: { content: 'Resposta sem fonte' } }), search));
});

test('trecho direto para perguntas de prazo e matrícula', async () => {
  const search = { search: () => [{ id: 'x', title: 'T', url: 'https://prograd.ufabc.edu.br/sisu', excerpt: 'E', verified_at: '2026-10-29', review_after: '2026-11-12', organization: 'O' }] };
  const result = await answer('qual o prazo da matrícula?', async () => ({ message: { content: 'X' } }), search);
  assert.equal(result.mode, 'trecho-direto');
  assert.equal(result.sources.length, 1);
});

test('servidor recusa origem externa e impede leitura de arquivos fora da lista', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const port = server.address().port;
  const request = (path, options) => fetch(`http://127.0.0.1:${port}${path}`, options);
  const forbidden = await request('/api/chat', { method: 'POST', headers: { origin: 'https://exemplo.com', 'content-type': 'application/json' }, body: '{"message":"oi"}' });
  assert.equal(forbidden.status, 403);
  const missing = await request('/FASE_2_PAINEL.md');
  assert.equal(missing.status, 404);
});
