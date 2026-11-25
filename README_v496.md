# Yggdrasil v4.9.6 — Runas do Norte

- Após as ondas 1 a 19 do reino Nórdico, as três opções de recompensa são exclusivamente Futhark. A onda 20 encerra a campanha ao derrotar Pecado, como antes.
- As cinco cartas japonesas iniciais e as três passivas de partida continuam conforme a v4.5.3. O Japão mantém seu próprio baralho.
- Limite de runas de recompensa ampliado de 5 para 19; não há repetição de runas adquiridas, nem suprimentos substituindo recompensas. Os limites de atributos existentes continuam ativos.
- As 24 runas do Futhark antigo incluem as novas Laguz (cura entre ondas), Ingwaz (chance de eco de dano), Dagaz (recarga de E) e Othala (chance de coração e cura por eliminação). As cartas exclusivas aparecem como variantes rúnicas douradas a partir da onda 5, preservando o poder original e o uso único de F quando aplicável.
- Validação de escolhas remotas no anfitrião usa o mesmo conjunto de runas válidas que o sorteio, rejeitando cartas japonesas, suprimentos e duplicatas durante a evolução nórdica. As runas são replicadas no estado e no checkpoint existentes.
- Testes: `npm run test:cards`, `npm run test:futhark496`, demais testes de regressão. Os clientes online são simulados; ainda não houve partida real no Cloudflare.
