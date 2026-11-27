# Yggdrasil RPG V5.6 — Devorador de Almas
Patch incremental sobre V5.5.1 cumulativa. Preserve os sprites, mapas, configurações Wrangler, servidor e demais arquivos já existentes. Não é instalação independente.

- Mímico original: 300 HP, 110 dano base, ataque com corrente; Q Corrente do Abismo (golpe frontal e atração de inimigos comuns), E Devorar Almas (explosão de área, atordoamento e cura de 18% da vida máxima), R Ascensão Mimética (dano na arena, cura de 35%, invulnerabilidade de 3s, dano +60% por 10s).
- Formas de herói: 2,2× dano base, +65% vida base, +20% velocidade e alcance, intervalo de ataque 30% menor, recargas Q/E 45% menores e multiplicador de dano adicional de 1,35×. Cartas, runas e limites nórdicos mantidos sobre os novos atributos base. Limite de dano por golpe normal em chefes para Mímico: 12% da vida máxima (outros: 4%). T/botão HERÓIS abre o seletor de heróis; B/botão CHEFES abre as almas de chefes. Mantém o desbloqueio KR1S ou vitória no Nórdico.
- Oito almas de chefes obtidas por derrota durante a partida (no cooperativo, a vitória da equipe conta). Reiniciam em nova partida, permanecem entre ondas e trocas. Cada forma usa os sprites do chefe em escala reduzida e poderes adaptados, não a IA integral do chefe. Golpes, alcance e efeitos variam entre formas; algumas compartilham a base de habilidades. Todas usam Q/E/R, com atributos próprios de chefe jogável. O menu não pausa a partida. Preserva vida proporcional, carga, cartas e recargas. Troca a cada 8s ou 5s com Imitação Suprema, não durante supremos ativos.
- HUD: removida a faixa de miniaturas de cartas/rúnicas durante a luta e a apresentação central de ondas. Contagem compacta no canto superior direito; recompensas entre ondas e avisos de ataques continuam. J = cartas japonesas, F = runas Futhark.

## Instalar
Envie Yggdrasil_v56_Atualizacao.zip para a raiz do Codespace sem extrair. Com o repositório limpo, rode na raiz:

```bash
git pull --rebase origin main &&
unzip -o Yggdrasil_v56_Atualizacao.zip &&
grep -o 'game.js?v=560' public/index.html &&
git add public/game.js public/index.html public/game.html package.json tests/v55.test.mjs tests/v56.test.mjs README_v56.md &&
git commit -m "V5.6 - Mimico Devorador de Almas" &&
git push origin main && npm run deploy
```
Não force push se houver conflito. O deploy usa a configuração Wrangler existente. Recarregue sem cache e recrie salas antigas. Não é necessário subir novos sprites ou substituir todo o jogo.

## Validação
`npm run test:56` e `npm run test:551` executados em simulação Node, incluindo os poderes, oito formas, HUD, captura, troca e cooperativo simulado com o Worker. Não houve teste em dispositivo físico, navegador real ou deploy no Cloudflare.
