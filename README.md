# YGGDRASIL v3.5 — foco exclusivo no online X1

Esta edição foi criada sobre os arquivos completos da v3.4, preservando os **sprites, retratos, mapa, músicas (incluindo `duel_theme.mp3`) e kits de combate**. Nenhum arquivo gráfico ou de áudio foi alterado.

## Mudanças de rede

- **Conexão direta (WebRTC) opcional entre os dois lutadores.** O Cloudflare Durable Object faz apenas a troca segura das informações para estabelecer a conexão; quando os navegadores conseguem conectar diretamente, comandos e estados de batalha viajam entre os dois jogadores sem dar a volta pelo Cloudflare.
- **Fallback Cloudflare automático.** Se WebRTC não estiver disponível ou for bloqueado pela rede, o X1 continua usando WebSocket/Durable Objects, com o anfitrião controlando a simulação como nas versões anteriores.
- **Separação das atualizações no fallback:** pacotes curtos de movimento a cada ~44 ms (até ~23 por segundo), e snapshots de combate mais completos a cada ~120 ms (cerca de 8 por segundo), com estados extras após habilidades importantes. Isso diminui o volume de dados repetidos.
- **Controles e mira sincronizados:** cada comando de habilidade do convidado leva sua direção atual e movimento; entradas de movimento têm número de sequência, impedindo que um comando atrasado substitua um mais recente.
- **Parada segura:** se o convidado perder conexão ou parar de enviar comandos por ~450 ms, o anfitrião deixa de manter ataques e movimento antigos ativos.
- **Interposição suave de movimentos:** velocidade estimada a partir do intervalo real entre pacotes, sem presumir o mesmo intervalo para snapshots leves e completos.
- **Indicador de rede no X1:** `DIRETO P2P` ou `CLOUDFLARE`, junto ao FPS, tempo de ida e volta reportado (quando disponível) e jitter. Assim é fácil saber qual transporte está sendo usado.
- **Atualizações da HUD limitadas a ~12 Hz**, preservando a animação e renderização do combate.

## O que permanece

Cooperativo de até cinco jogadores, X1 de dois lutadores com espectadores, cartas, habilidades, supremos, artes e música original do duelo. O X1 segue **host-authoritative**: o anfitrião precisa deixar a aba ativa. A versão **não altera o motor de habilidades**.

## Publicar com GitHub Codespaces e Cloudflare

1. Extraia este ZIP na **raiz** do repositório, com `public/`, `src/`, `package.json` e `wrangler.jsonc` juntos.
2. Execute no terminal:

```sh
npm install
npm run test:protocol
npx wrangler deploy
```

3. No X1, entre com **dois jogadores e abra a partida**. No indicador superior confira `DIRETO P2P` (ideal) ou `CLOUDFLARE` (fallback). Atualize a página dos dois aparelhos para evitar cache de versão anterior.

### Limitações reais

Conexão direta **não é garantida**: o WebRTC usa servidores públicos STUN, mas não existe TURN configurado. Em redes móveis ou NATs restritivos a conexão pode falhar e retornar ao Cloudflare. Neste caso, o ganho virá dos pacotes menores e da correção do controle, mas poderá continuar havendo alguma latência. Também não houve teste de uma partida completa no serviço Cloudflare real, nem em celulares dos usuários: o ganho precisa ser medido após o deploy.

## Testes executados na preparação

- `node --check` dos scripts do Worker, do X1 e do cooperativo.
- `npm run test:protocol`: teste em memória de duas vagas de lutador + espectador, exclusividade da sinalização WebRTC, sequências de comando, direção de habilidades, e retransmissão de movimento/combate.
- Integridade do ZIP e comparação byte a byte dos assets com a v3.4.
- **Teste visual/P2P real não concluído:** o navegador de testes do ambiente bloqueou o acesso a URLs locais; um teste WebRTC isolado também não conseguiu estabelecer ICE aqui.
