# Yggdrasil V6.1.6 — Multiplayer fluido

Patch cumulativo da V6.1.5, para o repositório existente. Não apague arquivos antigos. Não substitui o motor do modo Duelo ou História. Após publicar, recarregue o jogo em todos os aparelhos e crie uma sala nova.

## Rede
- Protocolo negociado com compactação de listas de inimigos, projéteis e efeitos: os nomes dos campos são compartilhados entre objetos com o mesmo formato. Não há redução adicional de precisão em relação à V6.1.5, nem remoção de entidades de combate. Cada snapshot é independente; um pacote descartado não invalida o seguinte. O checkpoint também é compactado no envio e decodificado no servidor para recuperação. Clientes antigos continuam recebendo o formato anterior.
- Em condições favoráveis, intervalos-alvo de movimento de 40 ms (antes 50 ms) e de estado de 100 ms (antes 120 ms). Com fila de envio alta, as atualizações completas são mais espaçadas e os controles mantêm prioridade. A taxa real depende da frequência dos frames e da conexão.
- Mudanças de direção, parada e início/fim de ataque não esperam o limite de 40 ms dos comandos contínuos; enviadas no próximo frame possível. Reenvio do estado de controle após congestão. O host continua decidindo dano, IA, cartas e progressão.
- Compensação limitada de atraso visual nos aliados e extrapolação de projéteis limitada para não continuarem avançando indefinidamente quando faltam pacotes. Sem tremedeira de câmera no cooperativo. Menos partículas de ambiente no automático e desenho de aliados fora da tela evitado, sem mudar a simulação.

## Validação
`npm run test:616` verifica as regressões de combate e rede da V6.1.5, round-trip dos snapshots compactos, pacotes independentes, mudança/parada de comandos, extrapolação limitada, servidor com clientes modernos e legados, e checkpoints. O teste de servidor precisa do `src/duel-engine.mjs` já existente no repositório; não incluímos uma cópia antiga dele neste patch. Testado localmente usando a dependência da versão-base. Testes de Boss Rush e portais também executados localmente com a referência de versão atualizada nos testes antigos.

Fixture de 100 snapshots com cinco jogadores, 36 inimigos e 120 projéteis: de aproximadamente 3,26 MB para 2,01 MB de JSON enviado pelo host (−38,5%); de 3,07 MB para 1,89 MB de JSON dos estados encaminhados por convidado (−38,4%). Não inclui tráfego de movimento, compressão do transporte, cabeçalhos ou alterações na frequência real de envio. Não é medição de ping, FPS ou banda em produção.

Não altera localização do Durable Object, o endereço do jogo, a música, o balanceamento ou as artes. O ping real depende de rotas de rede, localização do servidor, dispositivo e host. O servidor continua centralizado e o combate continua no navegador anfitrião. Não testado no Cloudflare real nem em celulares físicos. A próxima etapa estrutural, se o atraso persistir, seria separar salas por objeto e/ou mover o motor de combate para servidor autoritativo, com testes de carga e migração apropriados.
