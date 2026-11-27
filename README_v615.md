# Yggdrasil RPG V6.1.5 — Online mais leve

Patch cumulativo sobre V6.1.4 (inclui artes anteriores do Abloy), requer o repositório existente do jogo. Não substitui o motor do Duelo, nem o código da História. Todos os participantes devem recarregar o jogo após o deploy e criar uma sala nova.

## Cooperativo
- Câmera sem screen shake para anfitrião e convidados; dano ainda sinalizado por números, som e flash breve.
- Predição local de movimento e ataque visual, correção suave, velocidade medida no tempo simulado do anfitrião, animação de cada aliado independente; teleporte deliberado mantém saltos e confirmação do host.
- Movimento compacto normalmente a 20 Hz; snapshots adaptativos de 120–320 ms em combate e mais espaçados fora dele. Filas grandes descartam atualizações visuais antigas, sem descartar deliberadamente comandos discretos.
- Estado de combate mantém todos os inimigos e os limites anteriores de projéteis/efeitos. Precisão de rede de três casas decimais; checkpoints completos a cada 2s, e adicionais em mudanças críticas. Uma migração inesperada pode perder cerca de 2s de progresso em condições normais (mais se congestionado).
- Renderização automática mais leve, HUD em até 10 Hz em combate, descarte de efeitos fora da câmera. Redução temporária da resolução somente no automático se o FPS cair; volta à resolução anterior após estabilização ou saída da sala.
- Servidor repassa velocidades, tempo simulado e onda; evita serializar duas vezes o estado de combate. Não altera ranking, regras, danos ou IA. A autoridade do combate continua no navegador do anfitrião.

## Validação
`npm run test:615` testa Abloy, Mímico, encontros, servidor (se o duel-engine.mjs já estiver no repositório), fila, movimento, câmera e 5 jogadores/36 inimigos/120 projéteis em simulação. Comparação local de 100 snapshots com a V6.1.4: cerca de 21,5% menos bytes nos pacotes de estado; não é medição da latência real. Testes de regressão do Boss Rush e dos portais também executados (somente adaptando o identificador de versão esperado nos testes antigos, localmente).

Ping e FPS reais dependem da localização do Durable Object, da rede e do desempenho do host/dispositivos. Não foi testado em uma partida real no Cloudflare nem em celulares físicos. Não há garantia de ping específico. Instale no repositório existente, sem apagar arquivos. Não há migração do Durable Object.
