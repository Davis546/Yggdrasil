# Yggdrasil v4.9.4 — Ascensão dos Suportes

Atualização cumulativa para a v4.9 em diante (inclui os arquivos de atualização v4.9.1–v4.9.3). Instalação recomendada sobre a v4.9.3. A versão completa é distribuída em três ZIPs independentes; extrair todos na mesma raiz.

## Kali
- Q — Reflexo Protetor: cura 10% da vida máxima de cada aliado vivo, incluindo a própria Kali; 50% de chance de evitar dano por 5 s (cartas existentes podem ampliar); recarga base 18 s.
- E — Espelhos da Alma: um reflexo por aliado vivo; ataques de 35% do dano do copiado; regeneração de 2% da vida máxima por segundo por 6 s; recarga 18 s.
- R — Santuário dos Espelhos: cura imediata de 20%, redução de dano recebido de 35%, dano causado +15% por 10 s e um reflexo por aliado vivo. Reflexos do mesmo conjurador e alvo são renovados em vez de duplicados.

## Moretti
- Q — Reescrever o Destino: cura 8%, dano +20%, frequência de ataque +18%, recuperação de Q/E/esquiva +22% por 8 s; recarga base 14 s.
- E — Distorção da Realidade: velocidade de movimento +25% por 8 s e mantém o campo que enfraquece e desacelera inimigos; recarga 18 s.
- R — A Vontade da População: cura 15%, dano +25%, frequência de ataque +20%, redução de dano recebido 20%, regeneração de 2% por segundo por 10 s; mantém as manifestações espectrais e o efeito de 20 natural.
- Os valores de Moretti são multiplicados pela potência do D20 (0,5 / 1 / 1,25 / 1,75 / 2,5). F e vantagem nos dados mantidos. Bônus de categorias distintas combinam multiplicativamente para dano e frequência; efeitos da mesma categoria não acumulam força, prevalece a maior potência enquanto ativo.

## Coop
Os efeitos são calculados apenas pelo anfitrião, inclusive quando a habilidade é disparada por um convidado. A lista de aliados vivos é compartilhada e deduplicada: o anfitrião também recebe os efeitos; não há cura dupla nem ressurreição por estes poderes. A cura é limitada à vida máxima. Os efeitos alcançam a equipe viva inteira, independentemente da distância. O D20 é único e replicado com o estado dos jogadores. HUD mostra o nome e tempo restante dos bônus; cura recebida recebe indicador verde. O projétil da Kali carrega o ID do verdadeiro autor. Checkpoints preservam buffs, D20 e reflexos para a recuperação da partida. As otimizações de rede e gráficos da v4.9.3 são preservadas. Reflexos não ordenam inimigos a cada frame; procuram alvo na cadência do ataque e não são desenhados fora da tela. Até 25 reflexos visíveis em uma sala com cinco Kalis.

## Validação
23/23 arquivos de teste passaram em Node.js, incluindo simulação de cinco clientes independentes e o relay real do código Worker com WebSockets simulados, nas três composições de anfitrião (Kris, Kali, Moretti). Testes de Q/E/R, cura real, dano, cooldown, D20, HUD, autoria de projéteis, checkpoints, modo solo, reconexão anterior e regressões. O teste do cache foi atualizado para ler a versão do package.json. Não foram testados aparelhos reais, Cloudflare em produção ou uma partida pública; não há garantia de latência, FPS ou ausência total de bugs. O X1 mantém o balanceamento e código anteriores.

## Publicação
Extraia o ZIP na raiz, npm install, npm run test:server, npm run test:support494, npx wrangler deploy. Todos os jogadores devem recarregar a página e criar uma sala nova para não misturar versões do cliente.
