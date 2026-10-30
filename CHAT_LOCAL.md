# Chat experimental com IA local

Execute `node servidor-local.mjs` nesta pasta e abra <http://127.0.0.1:4173>. No chat, marque **Usar IA local experimental**. Requer Ollama em `127.0.0.1:11434` e o modelo local `granite4.2:8b` já instalado (default). Para usar outro modelo instalado, defina a variável antes de iniciar, por exemplo:

```powershell
$env:OLLAMA_MODEL='qwen2.5:7b'; node servidor-local.mjs
```

O carregamento pode demorar. Não é necessário baixar modelos nem instalar dependências Node para o servidor.

Sem o servidor ou com a opção desmarcada, o chat usa respostas prontas. Com a IA ativa, cada pergunta é enviada ao servidor e ao Ollama locais, sem histórico de turnos; não envie dados pessoais, senhas ou informações médicas. O código do portal não armazena conversas; isso não garante a política de logs de outros componentes instalados.

A IA consulta uma **base de trechos oficiais e material do usuário** (`base-oficial.json`) com busca local (SQLite FTS5), atualmente com 167 trechos: 11 de fontes oficiais da ProGrad (ingresso, documentos, calendários, contatos) e 156 de material do usuário extraído de designs do Canva (@mundouniversitariouf). Cada fonte exibe se é **Oficial (ProGrad)** ou **Material do usuário (Canva)**. A IA **não lê editais nem páginas na internet**, não acessa arquivos, shell, navegação livre nem edição do site. Para prazos e requisitos, o chat mostra os trechos e alerta que não comprovam o seu caso; confirme no documento oficial vigente.

Cada fonte exibe título, órgão, URL, data de verificação e, quando disponível, o excerto usado. Se não houver evidência na base, o chat encaminha para atendimento humano.

Execute `node --test testes-chat.mjs testes-busca.mjs` para os testes locais sem modelo. `node teste-ollama.mjs` envia uma pergunta fictícia ao modelo local e exercita a chamada de ferramenta. O servidor aceita apenas conexões no próprio computador e verifica host e origem para o endpoint; é um protótipo, **não deve ser exposto na rede ou usado em produção**.
