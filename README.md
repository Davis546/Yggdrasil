# YGGDRASIL v3.7 — Reino Nórdico (expansão jogável)

## O que foi adicionado

- A campanha japonesa vai até a **onda 20 (Pecado)** e segue automaticamente para o **Reino Nórdico, ondas 21–25**, sem perder as cartas ou habilidades já obtidas.
- **Arena nórdica grande (1448 x 1086)**, em pixel art, com câmera seguindo o jogador. Carregamento automático do mapa congelado a partir da onda 21.
- **Inimigos nórdicos com sprites animados nas quatro direções:** Draugr (machado), Lobo Glacial (investida), Berserker (fica mais agressivo com pouca vida), Feiticeira Rúnica (projéteis de gelo em leque). Há lentidão temporária por gelo; o modo Pecador aumenta o desafio.
- **Onda 25: Jarl do Gelo**, chefe de duas fases com lanças glaciais, chuva de gelo com aviso no chão, runas e invocações. Ao derrotá-lo, a campanha conclui o capítulo nórdico.
- **Acesso rápido:** na abertura, clique em **TESTAR REINO NÓRDICO** para entrar na onda 21, ou use **TESTAR CHEFES → JARL DO GELO** para a luta imediata.
- **Cooperativo online (até cinco):** o anfitrião pode selecionar Reino Nórdico no menu da sala; os novos inimigos e seus estados estão sincronizados com o protocolo existente. X1 foi preservado.
- **Seleção de personagens** agora apresenta cinco cartões individualmente clicáveis, mantendo a arte aprovada em recortes individuais; a seleção do X1 também foi atualizada.
- **Xans:** rosto esquelético adicionado aos sprites de combate, preservando a capa, roupas e poderes.
- Versão atualizada na UI para **v3.7**.

## Publicar no Cloudflare usando o mesmo repositório

1. No GitHub, faça upload deste ZIP para a raiz do repositório (ou envie os arquivos extraídos).
2. No Codespaces, execute:

```bash
git pull && unzip -o Yggdrasil_Reino_Nordico_v37.zip -d . && npm install && npm run test:server && npx wrangler deploy
```

3. Abra o endereço `.workers.dev` informado pelo Wrangler. No PC, atualize com Ctrl+Shift+R; no celular, feche a aba anterior e abra o endereço novamente.

**Observação:** `git pull` baixa arquivos do GitHub, mas não os envia; para persistir as mudanças do Codespaces, faça `git add . && git commit -m "Yggdrasil v3.7" && git push` depois de conferir o conteúdo. Antes de executar `git add .`, evite versionar ZIPs antigos ou segredos.

## Qualidade, validação e limites

Scripts executados: `node --check public/game.js`, `node --check public/duel.js`, `node --check src/worker.mjs`, `npm run test:server` e testes isolados de progressão e criação de ondas 20/21/25. O serviço Cloudflare real, efeitos visuais e sincronização sob carga com cinco celulares ainda precisam de testes no seu site. Nenhum link público foi criado nesta entrega.

**Arquivos principais:** `public/index.html`, `public/game.html`, `public/game.js`, `public/duel.html`, `public/duel.js`, `public/assets/nordic/`, `public/assets/enemies/nordic_*`, `src/worker.mjs`.
