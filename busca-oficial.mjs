import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const stopwords = new Set(['como', 'onde', 'qual', 'quais', 'quando', 'para', 'pelo', 'pela', 'mais', 'esse', 'essa', 'meus', 'minha', 'preciso', 'quero', 'sobre', 'pode', 'tenho', 'qualquer', 'com', 'que', 'uma', 'dos', 'das', 'por', 'sao', 'tem', 'foi', 'eles', 'estao', 'vou', 'existe']);

export function createSearch(records, today = () => new Date().toISOString().slice(0, 10)) {
  if (!Array.isArray(records)) throw new Error('Base inválida');
  const db = new DatabaseSync(':memory:');
  db.exec("CREATE VIRTUAL TABLE trechos USING fts5(id UNINDEXED, title, excerpt, keywords, tokenize='unicode61 remove_diacritics 2')");
  const insert = db.prepare('INSERT INTO trechos (id, title, excerpt, keywords) VALUES (?, ?, ?, ?)');
  const byId = new Map();
  for (const record of records) {
    if (!record || !['id', 'title', 'excerpt', 'keywords', 'organization', 'url', 'verified_at', 'review_after', 'status'].every(key => typeof record[key] === 'string') || !/^[a-z0-9-]+$/.test(record.id) || byId.has(record.id) || record.status !== 'experimental' || !/^\d{4}-\d{2}-\d{2}$/.test(record.review_after)) throw new Error('Trecho inválido');
    const url = new URL(record.url);
    if (url.protocol !== 'https:' || url.hostname !== 'prograd.ufabc.edu.br' || url.username || url.password) throw new Error('Fonte inválida');
    byId.set(record.id, record);
    insert.run(record.id, record.title, record.excerpt, record.keywords);
  }
  const query = db.prepare('SELECT id FROM trechos WHERE trechos MATCH ? ORDER BY bm25(trechos, 0, 3, 2, 1) LIMIT 12');
  return {
    search(text) {
      const words = [...new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
        .filter(word => word.length >= 3 && !stopwords.has(word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))))].slice(0, 12);
      if (!words.length) return [];
      const expression = words.map(word => `"${word}"`).join(' OR ');
      const years = words.filter(word => /^20\d{2}$/.test(word));
      return query.all(expression).map(row => byId.get(row.id))
        .filter(record => record.review_after >= today() && (!years.length || years.some(year => `${record.title} ${record.excerpt} ${record.keywords}`.includes(year))))
        .slice(0, 3);
    },
    close() { db.close(); },
  };
}

export function loadSearch() {
  return createSearch(JSON.parse(readFileSync(new URL('./base-oficial.json', import.meta.url), 'utf8')));
}
