// Teste opt-in com pergunta fictícia; não registra conversas reais.
import { answer } from './servidor-local.mjs';
let step = 0;
try {
  const result = await answer('Onde encontro o calendário acadêmico?', async payload => {
    step++;
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(110000),
    });
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const body = await response.json();
    console.log(`Etapa ${step}: ferramentas=${body.message?.tool_calls?.length ?? 0}, caracteres=${body.message?.content?.length ?? 0}`);
    return body;
  });
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(`Falha no teste de IA local: ${error.message}`);
  process.exitCode = 1;
}
