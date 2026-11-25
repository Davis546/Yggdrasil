# Yggdrasil v4.9.9 — Tela Livre

- Menu inicial em tela inteira, com a arte anterior e configurações centralizadas.
- Sete toques rápidos no cenário (fora dos controles) abrem Ajustar Tela. O botão também aparece no menu e nas configurações.
- Zoom acidental bloqueado durante a navegação/jogo principal com viewport e touch-action. Na recuperação, a pinça é reabilitada. Restaurar Tela tenta retornar a escala nativa a 100% e restaura o tamanho dos controles. O navegador pode ignorar a solicitação: nesse caso, use a pinça ou a opção de zoom do navegador. Não há API universal para impor zoom nativo.
- Solo pausa a simulação; cooperativo mantém a partida dos colegas, limpa os controles locais e não dá imunidade.
- Todos os oito personagens têm a mesma velocidade no lobby. NPCs mostram uma fala por interação, fecham automaticamente e bloqueiam spam (0,65 s após fechar).
- Preserva FPS livre, artes, música, combate e multiplayer. Tela separada do X1 não foi modificada por esta atualização.
- Testes automatizados em Node; validação visual e zoom real no Android ainda pendentes.

Atualização cumulativa sobre v4.9: extrair o ZIP na raiz, npm install, npm run test:server, npm run test:ui499, npx wrangler deploy e commit/push.
