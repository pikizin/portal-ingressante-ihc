import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const inputPath = 'file:///C:/Users/Magniel/Downloads/mundo_universitario_ufabc.json';
const outputPath = fileURLToPath(new URL('./base-oficial.json', import.meta.url));

function limpar(texto) {
  if (!texto) return '';
  return texto
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function ehSubstantivo(texto) {
  const t = limpar(texto);
  if (t.length < 60) return false;
  const lixo = [
    'titulo slide 1', 'outro modo de card', 'asdasda', 'asdasdasd', 'xt y',
    'x', 'y', 'z', 'm', 'xd', 'busca', 'informações', 'pontos positivos',
    'o ambiente da ufabc', 'as aulas na ufabc', 'sistema de quadrimestres',
    'comunidade', 'considerações finais', 'primeira matrícula', 'mapa mental',
    'informações', 'pontos positivos'
  ];
  const tl = t.toLowerCase();
  if (lixo.includes(tl)) return false;
  return true;
}

const entradas = [];
const idsVistos = new Set();

const dados = JSON.parse(readFileSync(fileURLToPath(inputPath), 'utf8'));

for (const design of dados.designs || []) {
  for (const pagina of design.paginas || []) {
    const texto = limpar(pagina.texto);
    if (!ehSubstantivo(texto)) continue;
    const id = `canva-${design.id_canva}-p${pagina.numero}`;
    if (idsVistos.has(id)) continue;
    idsVistos.add(id);

    entradas.push({
      id,
      title: `${design.titulo} — página ${pagina.numero}`,
      organization: 'Material do usuário — Canva (@mundouniversitariouf)',
      url: design.url_canva,
      excerpt: texto.slice(0, 900),
      keywords: `${design.titulo} ${texto.slice(0, 300)}`.toLowerCase(),
      verified_at: dados.data_extracao || '2026-10-29',
      review_after: '2026-11-12',
      status: 'experimental',
      source_type: 'material_usuario'
    });
  }
}

let oficiais = [];
try {
  oficiais = JSON.parse(readFileSync(outputPath, 'utf8'));
} catch { /* ignora */ }
const idsOficiais = new Set(oficiais.map(e => e.id));
const novas = entradas.filter(e => !idsOficiais.has(e.id));
const resultado = [...oficiais, ...novas];

writeFileSync(outputPath, JSON.stringify(resultado, null, 2));

console.log(`Oficiais existentes: ${oficiais.length}`);
console.log(`Novas entradas do Canva: ${novas.length}`);
console.log(`Total na base: ${resultado.length}`);
novas.forEach(e => console.log(' +', e.id, '|', e.title.slice(0, 70)));
