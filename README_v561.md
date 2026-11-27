# Yggdrasil V5.6.1 — Almas Divinas
Atualização incremental sobre V5.6. Não substitui a instalação cumulativa anterior, os assets ou o Worker.

- Mímico original: 150 HP, 38 dano base, Q/E/R próprios, ascensão +25% dano por 10s. Heróis copiados: +20% dano base, Q/E com recarga 10% menor, demais atributos originais. Removidos multiplicador extra e limite de 12% da vida do chefe por golpe; volta o limite comum de 4% (golpes de dano verdadeiro seguem regras existentes).
- Oito formas com atributos próprios e 24 habilidades adaptadas das mecânicas da IA: Shogun (corte/guarda com contra-ataque/chuva de lâminas); Reuni (investida com cura/3 onis aliados/dilúvio de sangue com cura ao acertar); Tsukuomi (projéteis/teleporte/luas abissais); Jarl (lanças/congelamento/chuva de gelo); Odin (Gungnir/trovões marcados/escudo e nove projéteis); Cavaleiro (execução/investida/pacto dracônico); Dragão (sopro com zonas de fogo/repulsão/chuva de fogo); Pecado (lanças/maldição que enfraquece inimigos/juízo com 2 ecos aliados).
- Marcas causam dano após aviso no chão; a autoridade continua no host. Almas permanecem apenas na partida. T = heróis; B = chefes; senha KR1S. HUD compacto preservado.
- Decisões: formas de chefe não reproduzem toda a IA, mas possuem poderes específicos adaptados a controles Q/E/R. Invocações duram 7 segundos, desaparecem na troca de forma e utilizam sprites existentes de oni/fantasma. Não é possível trocar enquanto golpes marcados ainda estão pendentes.

## Instalação
Suba o ZIP na raiz do Codespace e execute:

```bash
cd /workspaces/Yggdrasil &&
git pull --rebase origin main &&
unzip -o Yggdrasil_v561_Atualizacao.zip &&
grep -o 'game.js?v=561' public/index.html &&
git add public/game.js public/index.html public/game.html tests/v55.test.mjs tests/v56.test.mjs tests/v561.test.mjs package.json README_v561.md &&
(git diff --cached --quiet || git commit -m "V5.6.1 - Almas Divinas") &&
git push origin main && npm run deploy
```

## Validação
`node --check public/game.js` e `npm run test:561` passaram: balanceamento, 8 formas, captura, cooldown, cartas, runas, HUD, renderização simulada e replicação cooperativa simulada com Worker. Não testado em navegador real, partida online real ou dispositivo físico.
