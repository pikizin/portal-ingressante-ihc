// Embeddings locais para a busca semântica do protótipo.
// Usa o Ollama já instalado (modelo bge-m3). Sem rede externa.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const CACHE_VERSION = 1;
const ENDPOINT = 'http://127.0.0.1:11434/api/embed';
const DEFAULT_MODEL = 'bge-m3';

// Identifica a versão do conteúdo indexado: se a base mudar, o cache é refeito.
export function baseFingerprint(records) {
  const payload = records.map(record => `${record.id}\u0000${record.title}\u0000${record.excerpt}`).join('\u0001');
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function encodeVector(vector) {
  return Buffer.from(Float32Array.from(vector).buffer).toString('base64');
}

export function decodeVector(text) {
  const buffer = Buffer.from(text, 'base64');
  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}

export function normalize(vector) {
  let sum = 0;
  for (const value of vector) sum += value * value;
  const length = Math.sqrt(sum) || 1;
  return Float32Array.from(vector, value => value / length);
}

export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export async function embedTexts(texts, { model = DEFAULT_MODEL, batch = 32, timeout = 120000 } = {}) {
  const vectors = [];
  for (let index = 0; index < texts.length; index += batch) {
    const slice = texts.slice(index, index + batch);
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: slice }),
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) throw new Error('Ollama não gerou embeddings');
    const body = await response.json();
    const part = body?.embeddings;
    if (!Array.isArray(part) || part.length !== slice.length) throw new Error('Resposta de embeddings inválida');
    vectors.push(...part);
  }
  return vectors;
}

export function embedQuery(text, options) {
  return embedTexts([text], options).then(([vector]) => normalize(vector));
}

// Carrega do cache em disco quando a base e o modelo são os mesmos; senão recalcula.
export async function loadVectors(records, { cachePath, model = DEFAULT_MODEL } = {}) {
  const fingerprint = baseFingerprint(records);
  if (cachePath) {
    try {
      const cached = JSON.parse(await readFile(cachePath, 'utf8'));
      if (cached?.version === CACHE_VERSION && cached.model === model &&
          cached.fingerprint === fingerprint && Array.isArray(cached.vectors) &&
          cached.vectors.length === records.length) {
        return new Map(records.map((record, index) => [record.id, decodeVector(cached.vectors[index])]));
      }
    } catch { /* cache ausente ou ilegível: recalcula */ }
  }
  const texts = records.map(record => `${record.title}\n${record.excerpt}`.slice(0, 1200));
  const vectors = await embedTexts(texts, { model });
  if (cachePath) {
    try {
      await writeFile(cachePath, JSON.stringify({
        version: CACHE_VERSION,
        model,
        fingerprint,
        vectors: vectors.map(encodeVector),
      }));
    } catch { /* o cache é só otimização */ }
  }
  return new Map(records.map((record, index) => [record.id, normalize(vectors[index])]));
}
