# Yggdrasil v4.9.1 — Ascensão Cooperativa

Patch sobre v4.9. Escala por jogadores conectados no início de cada onda, inclusive em desafios diretos. Percentuais relativos à dificuldade e ao reino selecionados; não se acumulam com a antiga escala cooperativa de HP. O modo solo e o X1 não mudam.

| Jogadores | HP comuns | Dano comuns | Quantidade inicial | HP bosses | Dano bosses | Frequência base bosses | Velocidade bosses |
|---|---|---|---|---|---|---|---|
|1|100%|100%|100%|100%|100%|100%|100%|
|2|175%|110%|125%|150%|125%|115%|105%|
|3|250%|120%|150%|200%|150%|130%|110%|
|4|325%|130%|175%|250%|175%|145%|115%|
|5|400%|130%|200%|300%|200%|160%|120%|

O servidor informa os membros da sala; o anfitrião continua simulando o combate e transmite os estados e o número de jogadores usado na onda. Mortes não alteram a escala. Saídas são consideradas na onda seguinte. A saída do anfitrião continua fechando a sala, como na v4.9. Tempos de aviso dos golpes preservados; a escala de frequência afeta os temporizadores de recarga, não significa que toda animação ficará proporcionalmente mais rápida. Limites de invocações de inimigos e efeitos existentes preservados para desempenho; quantidade inicial de inimigos arredondada ao inteiro mais próximo. O dragão ancestral recebe a escala de boss; ecos do Pecado recebem a escala de inimigo comum; selos rúnicos preservam a vida original. Nenhum asset alterado.

## Testes
20 arquivos de teste executados com sucesso, incluindo `npm run test:coop491` (VM com DOM/canvas simulados e servidor com WebSockets simulados, ambas as dificuldades e reinos). A regressão do Mollitiam teve apenas o localizador da assinatura de função e o cache-buster atualizados. Não houve teste em aparelhos reais, multiplayer real pela internet nem deploy Cloudflare.

## Publicação incremental
```bash
git pull --ff-only && unzip -o Yggdrasil_v491_Atualizacao.zip -d . && npm install && npm run test:server && npm run test:coop491 && npm run test:v49 && npm run test:mollitiam-jp && npm run test:pecador48 && npx wrangler deploy && git add -A public src tests package.json README.md README_v491.md && (git diff --cached --quiet || git commit -m "Yggdrasil v4.9.1 - Ascensao Cooperativa") && git push
```
A versão completa consiste em três ZIPs independentes a extrair na mesma raiz. Não é necessário o patch incremental se instalar as três partes.
