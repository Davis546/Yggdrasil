# V5.6.2 — Correção da seleção
Patch incremental sobre V5.6.1. Não altera game.js, poderes, atributos, sprites, mapas nem servidor.
A carta solitária de uma página pode ocupar as duas colunas; quando há dois personagens, cada carta ocupa uma coluna. Remove a regra antiga exclusiva de Josué que sobrepunha o Mímico. Atualiza a chave de cache do CSS nos três pontos de entrada.
Verificado em Chromium com HTML real e script de seleção, isolando os scripts de gameplay: seleção solo e cooperativa a 1280x720, 832x384 e 384x832, sem interseção das cartas. Não testado em servidor Cloudflare real.
Instalação: extrair na raiz do repositório V5.6.1, enviar public/hero-select50.css, public/index.html, public/game.html e public/duel.html e fazer deploy. O game.js continua v=561 de propósito.
