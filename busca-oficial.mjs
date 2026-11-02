import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { cosine } from './embeddings.mjs';

const stopwords = new Set([
  // palavras funcionais
  'como', 'onde', 'qual', 'quais', 'quando', 'para', 'pelo', 'pela', 'mais', 'esse', 'essa',
  'meus', 'minha', 'preciso', 'quero', 'sobre', 'pode', 'tenho', 'qualquer', 'com', 'que',
  'uma', 'dos', 'das', 'por', 'sao', 'tem', 'foi', 'eles', 'estao', 'vou', 'existe',
  'meu', 'seu', 'sua', 'sem', 'nao', 'sim', 'muito', 'pouco', 'todo', 'toda', 'todos',
  'todas', 'outro', 'outra', 'aqui', 'ali', 'la', 'ja', 'gente', 'coisa', 'tipo',
  // verbos e pedidos genéricos que aparecem em quase todo trecho
  'funciona', 'funcionam', 'funcionar', 'fazer', 'faz', 'feito', 'saber', 'gostaria',
  'queria', 'devo', 'deve', 'posso', 'consigo', 'fica', 'ficam', 'pego', 'pegar',
  'comprar', 'usar', 'uso', 'necessario', 'necessaria', 'obrigatorio', 'obrigatoria',
  'explicar', 'explica', 'contar', 'ajuda', 'duvida', 'duvidas',
]);

const hoje = () => new Date().toISOString().slice(0, 10);
const designDe = record => (record.id.match(/^canva-([A-Za-z0-9]+)-p\d+$/) || [])[1] || record.id;

export function createSearch(records, today = hoje, options = {}) {
  if (!Array.isArray(records)) throw new Error('Base inválida');
  const db = new DatabaseSync(':memory:');
  db.exec("CREATE VIRTUAL TABLE trechos USING fts5(id UNINDEXED, title, excerpt, keywords, tokenize='unicode61 remove_diacritics 2')");
  const insert = db.prepare('INSERT INTO trechos (id, title, excerpt, keywords) VALUES (?, ?, ?, ?)');
  const byId = new Map();
  for (const record of records) {
    const sourceType = record.source_type || 'material_usuario';
    if (!record || !['id', 'title', 'excerpt', 'keywords', 'organization', 'url', 'verified_at', 'review_after', 'status', 'source_type'].every(key => typeof record[key] === 'string') || !/^[a-z0-9-]+$/i.test(record.id) || byId.has(record.id) || record.status !== 'experimental' || !/^\d{4}-\d{2}-\d{2}$/.test(record.review_after) || !['oficial', 'material_usuario'].includes(sourceType)) throw new Error('Trecho inválido');
    const url = new URL(record.url);
    if (url.protocol !== 'https:') throw new Error('Fonte inválida');
    if (sourceType === 'oficial' && url.hostname !== 'prograd.ufabc.edu.br') throw new Error('Fonte oficial inválida');
    if (sourceType === 'material_usuario' && url.hostname !== 'www.canva.com' && url.hostname !== 'canva.com') throw new Error('Fonte de material do usuário inválida');
    if (url.username || url.password) throw new Error('Fonte inválida');
    byId.set(record.id, record);
    insert.run(record.id, record.title, record.excerpt, record.keywords);
  }

  const vectors = options.vectors instanceof Map ? options.vectors : null;
  const embedQuery = typeof options.embedQuery === 'function' ? options.embedQuery : null;
  const hibrida = Boolean(vectors && embedQuery);
  const query = db.prepare('SELECT id, bm25(trechos, 0, 4, 2, 1) AS score FROM trechos WHERE trechos MATCH ? ORDER BY score LIMIT 24');

  function termos(text) {
    const raw = text.match(/[\p{L}\p{N}]+/gu) || [];
    return [...new Set(raw
      .map(word => word.toLowerCase())
      .filter(word => {
        const plain = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (stopwords.has(plain)) return false;
        // Siglas curtas (BC, TI, RA) valem; palavras comuns precisam de 3+ letras.
        return plain.length >= 3 || /^[a-z]{2}$/.test(plain);
      }))].slice(0, 12);
  }

  // Trechos válidos, na ordem do bm25 (melhor primeiro), já com os filtros de ano e revisão.
  function ranquearFts(text) {
    const words = termos(text);
    if (!words.length) return [];
    const expression = words.map(word => `"${word}"`).join(' OR ');
    const years = words.filter(word => /^20\d{2}$/.test(word));
    const rows = query.all(expression);
    if (!rows.length) return [];
    // bm25 é negativo: quanto menor, melhor. Descarta resultados muito piores que o primeiro.
    const limite = rows[0].score * 0.35;
    const resultado = [];
    for (const row of rows) {
      if (row.score > limite) continue;
      const record = byId.get(row.id);
      if (!record || record.review_after < today()) continue;
      if (years.length && !years.some(year => `${record.title} ${record.excerpt} ${record.keywords}`.includes(year))) continue;
      resultado.push(record);
    }
    return resultado;
  }

  // Limita a três trechos, no máximo dois por design, para não repetir páginas do mesmo material.
  function escolher(ordenados) {
    const selecionados = [];
    const porDesign = new Map();
    for (const record of ordenados) {
      if (!record || selecionados.includes(record)) continue;
      const design = designDe(record);
      const usados = porDesign.get(design) || 0;
      if (usados >= 2) continue;
      porDesign.set(design, usados + 1);
      selecionados.push(record);
      if (selecionados.length === 3) break;
    }
    return selecionados;
  }

  function buscarPorPalavra(text) {
    return escolher(ranquearFts(text));
  }

  async function buscarHibrida(text) {
    const porPalavra = ranquearFts(text);
    let vetor = null;
    try { vetor = await embedQuery(text); } catch { /* Ollama fora: segue só com a busca por palavra */ }
    if (!vetor) return escolher(porPalavra);

    const porSignificado = [];
    for (const record of records) {
      const vetorDoTrecho = vectors.get(record.id);
      if (!vetorDoTrecho || record.review_after < today()) continue;
      porSignificado.push({ record, similaridade: cosine(vetor, vetorDoTrecho) });
    }
    porSignificado.sort((a, b) => b.similaridade - a.similaridade);

    const pontuados = new Map();
    porPalavra.forEach((record, index) => {
      pontuados.set(record.id, { record, pontos: 0.45 * (1 - index / 24) });
    });
    for (const item of porSignificado.slice(0, 10)) {
      if (item.similaridade < 0.32) continue;
      const atual = pontuados.get(item.record.id);
      const bonus = 0.55 * item.similaridade;
      if (atual) atual.pontos += bonus;
      else pontuados.set(item.record.id, { record: item.record, pontos: bonus });
    }
    // Empate técnico: fonte oficial ganha. O portal promete fonte oficial para conteúdo acadêmico.
    for (const item of pontuados.values()) {
      if (item.record.source_type === 'oficial') item.pontos += 0.08;
    }
    const ordenados = [...pontuados.values()].sort((a, b) => b.pontos - a.pontos);
    if (!ordenados.length) return [];
    const corte = ordenados[0].pontos * 0.5;
    return escolher(ordenados.filter(item => item.pontos >= corte).map(item => item.record));
  }

  return {
    mode: hibrida ? 'hibrida' : 'palavra-chave',
    search: hibrida ? buscarHibrida : buscarPorPalavra,
    close() { db.close(); },
  };
}

export function loadRecords() {
  return JSON.parse(readFileSync(new URL('./base-oficial.json', import.meta.url), 'utf8'));
}

export function loadSearch(options = {}) {
  return createSearch(loadRecords(), hoje, options);
}
