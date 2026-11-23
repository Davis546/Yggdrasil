# YGGDRASIL — As Sete Raízes | v2.9

**Atualização de acabamento visual e correções do X1 (Cloudflare Workers + Durable Objects).**

## O que mudou

- **Uma única arena X1**, com dimensão de mundo 1920 × 1400 e câmera suave que acompanha cada lutador. O cenário japonês não é mais reproduzido em quatro cópias.
- **Eve Lorey**: corrigido o nome nas telas; a spritesheet `public/assets/heroes/eve_sheet.png` contém 12 quadros corretamente isolados, não várias miniaturas dentro de um mesmo quadro.
- **Kali**: spritesheet de 12 quadros, transparência ajustada e retrato atualizado em pixel art.
- **Seleção**: retratos em pixel art de Kali e Eve Lorey, gerados a partir das referências dos personagens.
- **Ataque de Kali**: espelho ornamental desenhado (`public/assets/effects/mirror_projectile.png`), girando em voo, com estilhaços e efeitos no impacto. A identificação do espelho também passa pela sincronização do cooperativo.
- **Combate X1**: golpes corpo a corpo com arcos mágicos em camadas e brilhos curtos, ataques com efeitos mais legíveis e sons leves sintetizados por WebAudio.
- **Q / E / R**: ícones ilustrados para Loid, Kris, Xans, Eve Lorey e Kali (`public/assets/ui/abilities/`). Usados no X1 e nos botões da interface mobile do cooperativo.
- **Versão**: a interface e scripts agora mostram **v2.9**, com parâmetros `?v=29` nos arquivos alterados para evitar visualizar recursos antigos em cache.

## O que foi preservado

Cooperativo até 3 jogadores, modo X1 e espectadores, salas, cartas, lutas contra Samurai, Reuni, Tsukuomi e Pecado, sprites de Loid/Kris/Xans, músicas, habilidades especiais, modo automático e desempenho para celulares fracos.

## Publicar pelo GitHub Codespaces no Cloudflare

1. Extraia o conteúdo do ZIP na raiz do repositório (a raiz precisa conter `wrangler.jsonc`, `package.json`, a pasta `src` e a pasta `public`).
2. No terminal dentro da raiz:

```bash
npm install
npx wrangler deploy
```

3. Confira o link `.workers.dev` que aparecer, e atualize a página em todos os aparelhos. Na abertura do jogo e no X1, verifique o texto **v2.9**.

Se tiver enviado o próprio ZIP para a raiz do GitHub, no Codespaces extraia-o primeiro:

```bash
unzip -o Yggdrasil_Cloudflare_X1_Pixel_Art_v29.zip -d .
npm install
npx wrangler deploy
```

Para salvar os arquivos extraídos também no repositório, faça **separadamente**:

```bash
git add public src package.json wrangler.jsonc README.md
git commit -m "Yggdrasil v2.9 - X1 e pixel art"
git push
```

## Testes e limitações

- JavaScript verificado com `node --check` (`game.js`, `duel.js`, `audio.js`, `src/worker.mjs`).
- Imagens inspecionadas: **12 quadros preenchidos de Kali e 12 de Eve Lorey**.
- Teste visual local com duas personagens no X1 (Kali e Eve Lorey) concluído sem erro de JavaScript.
- Teste funcional local do espelho no X1: reduziu corretamente a vida do adversário de 11.200 para 11.087.
- **Não foi feita uma partida remota real de 2 jogadores no Cloudflare nem teste em celulares físicos**; ainda é necessário conferir a sincronização e o FPS na hospedagem.

O X1 continua **host-authoritative**: o anfitrião processa dano e estado, e a sala distribui os resultados via WebSocket. A atualização preserva essa arquitetura para não refazer a rede neste ciclo de acabamento visual.
