# V6.2.2 — Unificação do Duelo

Atualização incremental cumulativa para o repositório existente da V6.2.1. Mantém a Jornada e os demais modos. `npm run test:622` gera novamente o runtime a partir de `public/game.js` e executa testes de regressão e de combate.

O Duelo utiliza agora o código original da Jornada, isolado em dois runtimes de equipe no servidor. Todos os 11 heróis estão disponíveis; ataques, Q/E/R, recargas, dash, transformações de herói e efeitos de suporte são reaproveitados. O PvP utiliza 3x a vida base, 70% do dano calculado antes de defesas, limite de 34% da vida por golpe e seleção de três cartas sem efeitos de insta-kill. Formas de boss do Mímico não são disponibilizadas no Duelo, pois não há bosses para capturar. O sorteio dos espíritos de Abloy ocorre na abertura da partida. A interface ocupa o espaço disponível, com controles e recargas no estilo Jornada. O renderer reaproveita os sprites e efeitos originais em modo leve. O 1v1/2v2, bots e fluxo de ranking continuam no servidor.

Limitações: adaptações do combate PvE para PvP não são equivalência absoluta; efeitos visuais de alto custo, áudio e mecânicas exclusivas de ondas não são idênticos. O teste automatizado verifica execução dos heróis, não o balanceamento de todas as combinações. A interface foi exercitada com snapshots e websocket simulados em Chromium, sem todos os assets do repositório. Não houve teste de ping/estabilidade no Cloudflare real ou em dois celulares físicos. Os testes antigos do motor separado não são o critério da nova versão.

Instalação: extrair por cima do repositório existente, executar `npm run test:622`, incluir `scripts` no commit e executar `npm run deploy`. Todos devem atualizar a página e criar sala nova.
