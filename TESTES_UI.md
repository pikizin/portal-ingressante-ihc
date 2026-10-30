# Testes de interface

Dois níveis, do mais barato ao mais caro:

## 1. Testes sem navegador

```powershell
node --test testes-busca.mjs testes-chat.mjs
```

Cobrem a busca de trechos, a validação da base, o modo trecho direto e as recusas do servidor (origem, ferramenta desconhecida, resposta sem fonte).

Qualidade da recuperação, sem chamar o modelo:

```powershell
node avaliacao-busca.mjs            # busca por palavra-chave
node avaliacao-busca.mjs --hibrido  # palavra-chave + embeddings bge-m3
```

O modo híbrido exige o Ollama local com o modelo `bge-m3`. O resultado atual é 24/26; as duas falhas são lacunas de conteúdo (trancamento e cotas), não erro de busca.

## 2. Testes de interface no navegador

O script `testes-ui-cdp.mjs` abre a página no Chrome headless, clica nos controles e confere o resultado no DOM, incluindo o que fica salvo no navegador.

Pré-requisitos: servidor local rodando e Chrome com porta de depuração.

```powershell
# terminal 1
node servidor-local.mjs

# terminal 2
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
Start-Process $chrome -ArgumentList "--headless=new","--remote-debugging-port=9222","--user-data-dir=$env:TEMP\opencode\chrome-ui-test","about:blank"

node testes-ui-cdp.mjs
```

O teste limpa o `localStorage` no início, então pode ser repetido sem interferência da execução anterior. Ele cobre:

- home como tela inicial, com as três entradas e o botão da trilha;
- cada entrada abrindo a seção correspondente ("Vou começar" já destaca o passo pendente);
- cartão de próxima ação pedindo a via de ingresso;
- controles escondidos antes da escolha;
- avanço para o próximo passo ao marcar "Já fiz este passo";
- progresso do herói e persistência no `localStorage`;
- destaque e foco ao abrir um passo;
- marcação pela lista refletindo no cartão;
- checklist de documentos por modalidade, com progresso e persistência.

Para encerrar o Chrome de teste:

```powershell
Get-Process chrome | Where-Object { $_.Path -eq "C:\Program Files\Google\Chrome\Application\chrome.exe" } | Stop-Process -Force
```

Prefira fechar só a instância de teste pelo título da janela ou pelo PID retornado por `Start-Process`.
