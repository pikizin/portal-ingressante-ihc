// Avaliação local da recuperação de trechos. Não chama o modelo: mede apenas a busca.
// Uso: node avaliacao-busca.mjs            (busca por palavra-chave)
//      node avaliacao-busca.mjs --hibrido  (palavra-chave + embeddings bge-m3)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSearch } from './busca-oficial.mjs';
import { loadVectors, embedQuery } from './embeddings.mjs';

// Cada caso: pergunta do ingressante e termos que deveriam aparecer nos trechos recuperados.
const casos = [
  { pergunta: 'quando começam as aulas?', esperado: /in[ií]cio|come[çc]|calend[aá]rio|aula/i },
  { pergunta: 'quais documentos preciso para a matrícula?', esperado: /document|matr[ií]cula/i },
  { pergunta: 'como funciona o BC&T?', esperado: /bc&?t|bacharelado em ci[eê]ncia/i },
  { pergunta: 'o que é um quadrimestre?', esperado: /quadrimestr/i },
  { pergunta: 'existe auxílio estudantil?', esperado: /aux[ií]lio|bolsa|benef[ií]cio/i },
  { pergunta: 'onde fica o campus de Santo André?', esperado: /campus|santo andr[eé]/i },
  { pergunta: 'como funciona o fretado?', esperado: /fretado|transporte|[oô]nibus/i },
  { pergunta: 'o que é o PROEP?', esperado: /proep/i },
  { pergunta: 'como troco de turno?', esperado: /troca de turno|mudan[çc]a de turno|turno/i },
  { pergunta: 'quantas horas complementares eu preciso?', esperado: /complementar|extensionista|horas/i },
  { pergunta: 'o que é o SiSU?', esperado: /sisu|ingresso|edital/i },
  { pergunta: 'preciso comprar jaleco?', esperado: /jaleco|laborat[oó]rio/i },
  { pergunta: 'como pego o cartão de transporte?', esperado: /cart[aã]o|transporte|bilhete/i },
  { pergunta: 'qual a nota de corte de engenharia?', esperado: /nota de corte|corte|engenharia/i },
  { pergunta: 'o restaurante universitário é gratuito?', esperado: /restaurante|ru\b|refei[çc]/i },
  { pergunta: 'como funciona o trancamento de matrícula?', esperado: /trancament|trancar/i },
  { pergunta: 'como é calculado o CR?', esperado: /coeficiente de rendimento|\bcr\b/i },
  { pergunta: 'consigo mudar de curso?', esperado: /troca.*curso|mudan[çc]a de curso|transfer[eê]ncia/i },
  { pergunta: 'quais são os campi da UFABC?', esperado: /campus|santo andr[eé]|s[aã]o bernardo/i },
  { pergunta: 'a UFABC é gratuita?', esperado: /gratuit|p[uú]blic|mensalidade/i },
  { pergunta: 'o que é o RA?', esperado: /registro acad[eê]mico|\bra\b/i },
  { pergunta: 'quais matérias tem no primeiro quadrimestre?', esperado: /mat[eé]ria|disciplina|quadrimestre/i },
  { pergunta: 'como funciona o ingresso por cotas?', esperado: /cota|reserva de vaga/i },
  { pergunta: 'tem iniciação científica?', esperado: /inicia[çc][aã]o cient[ií]fica|pesquisa/i },
  { pergunta: 'o que é coeficiente de aproveitamento?', esperado: /coeficiente de aproveitamento|\bca\b/i },
  { pergunta: 'quais atividades contam como horas complementares?', esperado: /complementar|extensionista/i },
  // Conteúdo sobre cursos: a resposta precisa vir de fonte oficial, não do material do usuário.
  { pergunta: 'quais cursos a UFABC tem?', esperado: /curso de ingresso|forma[çc][ãa]o espec[ií]fica/i, oficial: true },
  { pergunta: 'tem engenharia aeroespacial?', esperado: /aeroespacial/i },
  { pergunta: 'quero ser professor de geografia', esperado: /geografia/i, oficial: true },
  { pergunta: 'tem pedagogia?', esperado: /pedagogia/i, oficial: true },
  { pergunta: 'quanto tempo dura o curso de engenharia?', esperado: /dura|quadrimestre|ano/i, oficial: true },
];

const hibrido = process.argv.includes('--hibrido');
const base = JSON.parse(readFileSync(new URL('./base-oficial.json', import.meta.url), 'utf8'));
const search = hibrido
  ? createSearch(base, undefined, {
      vectors: await loadVectors(base, { cachePath: fileURLToPath(new URL('./.embeddings-cache.json', import.meta.url)) }),
      embedQuery: text => embedQuery(text),
    })
  : createSearch(base);

let acertos = 0;
const falhas = [];

for (const caso of casos) {
  const trechos = await search.search(caso.pergunta);
  const texto = trechos.map(t => `${t.title} ${t.excerpt}`).join(' ');
  const daFonteCerta = !caso.oficial || trechos.some(t => t.source_type === 'oficial');
  const ok = trechos.length > 0 && caso.esperado.test(texto) && daFonteCerta;
  if (ok) acertos++;
  else falhas.push({ pergunta: caso.pergunta, titulos: trechos.map(t => t.title) });
  console.log(`${ok ? 'OK  ' : 'FALHA'} | ${caso.pergunta}`);
  console.log(`       ${trechos.map(t => t.title).join(' | ') || '(nada)'}`);
}

console.log(`\nModo: ${hibrido ? 'híbrido (palavra-chave + bge-m3)' : 'palavra-chave'}`);
console.log(`Acertos: ${acertos}/${casos.length} (${((acertos / casos.length) * 100).toFixed(0)}%)`);
if (falhas.length) {
  console.log('\nFalhas:');
  for (const f of falhas) console.log(`- ${f.pergunta} → ${f.titulos.join(' | ') || '(nada)'}`);
}
search.close();
process.exit(acertos === casos.length ? 0 : 1);
