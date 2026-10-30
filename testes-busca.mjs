import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSearch } from './busca-oficial.mjs';

test('retorna trecho de calendário quando pergunta sobre datas', () => {
  const today = () => '2026-10-29';
  const search = createSearch([
    { id: 'calendario-2026', title: 'Calendário acadêmico 2026', excerpt: 'Calendário acadêmico 2026', keywords: 'calendário acadêmico 2026 datas aulas quadrimestre', organization: 'ProGrad', url: 'https://prograd.ufabc.edu.br/calendarios', verified_at: '2026-10-29', review_after: '2026-11-12', status: 'experimental', source_type: 'oficial' },
    { id: 'sisu-2026-edital', title: 'Edital de ingresso via SiSU 2026', excerpt: 'Este Edital normatiza o ingresso em 2026', keywords: 'sisu 2026 edital ingresso documentos matrícula processo vagas cotas', organization: 'ProGrad', url: 'https://prograd.ufabc.edu.br/sisu', verified_at: '2026-10-29', review_after: '2026-11-12', status: 'experimental', source_type: 'oficial' },
  ], today);
  const resultados = search.search('onde vejo o calendário acadêmico 2026?');
  assert.ok(resultados.length >= 1);
  assert.equal(resultados[0].id, 'calendario-2026');
  search.close();
});

test('não retorna trechos com revisão vencida', () => {
  const today = () => '2026-11-13';
  const search = createSearch([
    { id: 'calendario-2026', title: 'Calendário acadêmico 2026', excerpt: 'Calendário acadêmico 2026', keywords: 'calendário acadêmico 2026 datas', organization: 'ProGrad', url: 'https://prograd.ufabc.edu.br/calendarios', verified_at: '2026-10-29', review_after: '2026-11-12', status: 'experimental', source_type: 'oficial' },
  ], today);
  assert.deepEqual(search.search('calendário 2026'), []);
  search.close();
});

test('rejeita base com trecho inválido', () => {
  assert.throws(() => createSearch([{ id: 'a-b', title: 'T', excerpt: 'E', keywords: 'x', organization: 'O', url: 'https://prograd.ufabc.edu.br/sisu', verified_at: '2026-10-29', review_after: '2026-11-12', status: 'producao' }]));
});
