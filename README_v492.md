# Yggdrasil v4.9.2 — Network Overhaul

Atualização cumulativa para v4.9 (inclui v4.9.1). Sem alteração de arte, música, sprites ou regras solo/X1. Todos os clientes devem recarregar a página após publicar.

- Escala cooperativa 1–5 jogadores: vida dos bosses +50% por jogador extra; dano +25%, frequência +15%; mobs +75% de vida, +25% de quantidade e dano máximo 130% do valor da dificuldade escolhida. Escala congelada por onda, recalculada na próxima.
- Reconexão por token privado de 192 bits, ID estável e reserva de 120 segundos. Nova tentativa 3 segundos após falha; heartbeat detecta conexão travada. A aba pode ser recarregada (sessionStorage). Desconectados saem da simulação e não impedem avanço de onda; ao retornar, recuperam o estado salvo, sem reviver se mortos. Proteção de até 3 segundos uma vez por partida.
- Migração automática para um aliado conectado com checkpoint completo armazenado em memória no servidor, alvo de 650 ms entre checkpoints (podem ocorrer atrasos com conexão ruim). Checkpoints incluem estados de boss, atores, cartas, cooldowns, escolhas de recompensa, invocações, temporizadores e escala. O novo host reconstrói a simulação; epochs impedem pacotes atrasados. Se a queda ocorrer antes do primeiro checkpoint, o servidor retorna à sala para reiniciar. Uma reserva expirada não permite reconectar.
- O modo de escolha de ultimate de Kris não bloqueia a simulação após uma migração. Se houver menu pendente do antigo host, ele pode ser interrompido. Ofertas ainda não escolhidas podem ser sorteadas novamente ao recuperar uma recompensa; cartas já adquiridas são preservadas pelo checkpoint. A proteção é limitada por estado salvo, não é uma proteção antitrapaça definitiva.
- Movimentação leve em até 20 Hz; inputs só são enviados quando mudam ou a cada 150 ms. Estados de combate são espaçados sob congestionamento, e o servidor serializa uma vez por transmissão. Checkpoints são enviados somente ao servidor, não a todos os convidados.
- O host ainda simula o co-op; não é um servidor de combate autoritativo. X1 não foi alterado. Reinício/deploy do Durable Object ou perda de todos os checkpoints pode encerrar partidas; a recuperação não é persistência durável. O teste não garante ping/FPS de aparelhos reais nem latência de migração; validar no Cloudflare com múltiplos aparelhos.

## Testes
`npm run test:network492` — VM com canvas/DOM simulados e WebSockets simulados: migração, retorno, expiração, token, cartas, D20, boss, proteção, sequência e tráfego ocioso. Regressão: `npm run test:server`, `npm run test:coop491`, `npm run test:v49`, `npm run test:mollitiam-jp`, `npm run test:pecador48`.

## Publicação sobre v4.9 ou v4.9.1
```sh
git pull --ff-only && unzip -o Yggdrasil_v492_Atualizacao.zip -d . && npm install && npm run test:server && npm run test:coop491 && npm run test:network492 && npm run test:v49 && npm run test:mollitiam-jp && npm run test:pecador48 && npx wrangler deploy && git add -A public src tests package.json README.md README_v491.md README_v492.md && (git diff --cached --quiet || git commit -m "Yggdrasil v4.9.2 - Network Overhaul") && git push
```
