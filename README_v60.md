# Yggdrasil 6.0 — Ecos das Sete Raízes

Patch incremental para a V5.9/V5.9.1. Não exclua o restante do repositório. Inclui o Worker e wrangler.jsonc (mesmas configurações e binding LOBBY da base, adicionando /ranking às rotas). Se você personalizou seu wrangler, preserve suas configurações e adicione /ranking a assets.run_worker_first em vez de substituí-lo.

## Instalar
1. Envie o ZIP para a raiz do Codespace e extraia com `unzip -o Yggdrasil_v60_Atualizacao.zip`.
2. `npm run test:600` (requer src/duel-engine.mjs da instalação anterior, que não é substituído).
3. `git add public src/worker.mjs tests package.json wrangler.jsonc README_v60.md`; commit, push e `npm run deploy`.
4. Abra o jogo, confira V6.0 e use o menu Ranking Mundial para escolher seu apelido público. Não precisa recriar o Worker ou o Durable Object.

## Sistemas novos (Sobrevivência e Boss Rush; solo e cooperativo)
- Modificadores de onda a partir da terceira onda: meteoros com círculos de aviso (1,2s antes do impacto), gelo e maldição; ataques calculados pelo anfitrião. HUD compacto.
- Mercador das Raízes: a cada cinco ondas concluídas, antes de escolher a carta, abre a seção de compras na recompensa. Fragmentos: 25 por onda e 90 extras por evento. Uma compra por visita, três itens permanentes por partida (dano +5%, velocidade +5%, dano recebido -5%), elixir 35% de cura. Não usa essência nem substitui a carta. Arte pixel vetorial original.
- Cartas amaldiçoadas: chance de 24% de oferecer uma, a partir da onda 3, máximo duas diferentes. Dano +35% / dano recebido +25%; crítico +20 pontos percentuais / dano recebido +20%; movimento +18% / dano -15%. Escolha opcional; preservam bônus do Boss Rush. As cartas entram na seleção normal, inclusive como alternativa à runa no Nórdico.
- Salas de evento: portal automático após certas ondas (chance 16% a partir da onda 4, garantido a cada 6, exceto final de campanha); três variantes: selos, elites, meteoros. Mapa de ruínas desenhado em Canvas, com caminhos e obstáculos para jogadores; inimigos atravessam a decoração por não terem pathfinding. Complete o desafio para ganhar fragmentos e 12% de cura. O evento não altera o número da onda. As salas são parte da partida e sincronizadas no coop.
- Relíquias: 12% de chance por chefe, por jogador; 8 relíquias, máximo três equipadas; equipar/retirar entre ondas. Sem duplicatas. Inventário, maldições, itens e despertar acompanham as transformações do Mímico.
- Despertar: cada um dos dez heróis tem desafio individual (Q, E, ataques, dash, abates ou chefes conforme o personagem), mais dois eventos e três chefes derrotados. Desperta na partida, bônus comum de dano +10%, recargas e bônus individual; aura/paleta sobre os sprites existentes, não sprites inteiramente novos. Reinicia com a partida.
- Ranking mundial: endpoint /ranking, armazenamento persistente do Durable Object já configurado, instância separada do lobby; top 100 por modo (Japão, Nórdico, Boss Rush), solo/cooperativo e Normal/Pecador, incluindo todos os heróis. Apelido público opcional, melhor resultado por apelido/herói/categoria, ondas concluídas e não ondas apenas iniciadas. Nomes não são contas autenticadas: recordes do cliente são não verificados e podem ser manipulados; não usar para prêmios competitivos sem validação server-authoritative. Não inclui História ou Duelo (sistemas sem ondas). Testes diretos de boss não pontuam.

## Validação
`npm run test:600`: testes de meteoros e hitbox, compra e limites, penalidades das cartas, três salas, raridade e slots das relíquias, preservação na transformação, despertar, snapshot e compra coop simulada, ranking e armazenamento simulado entre instâncias. Regressões de 64 rodadas e sala de cinco jogadores, Mímico e História. A tentativa de navegador Chromium local foi bloqueada pela configuração do ambiente (ERR_BLOCKED_BY_ADMINISTRATOR); não houve validação visual real nem deploy no servidor do usuário. As músicas, os bosses e as cartas originais foram preservados. Ajuste fino da dificuldade depende de partidas reais.
