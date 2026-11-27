# Yggdrasil V6.0.1 — Mercador das Raízes
Patch incremental sobre V6.0 (preserva os assets das versões anteriores). Extraia na raiz do repositório. Execute `npm run test:601` e `npm run deploy`.

- A cada cinco ondas (exceto final da campanha e testes diretos), portal opcional do mercador. Eventos a partir da quarta onda, com chance de 45% após chefes e 16% nas demais ondas, além das ondas múltiplas de seis. No Boss Rush todas as rodadas são de chefes. Quando ambos aparecem é possível visitar ambos ou ignorar.
- Sala segura com cenário pixel art, barraca e NPC animado separados, trilha original em loop. Use WASD ou toque na sala para se aproximar; E ou toque no NPC para conversar. Comprar uma vez por visita; saída manual. Cartas indisponíveis enquanto houver intermissão. No cooperativo, anfitrião escolhe portal, todos os jogadores precisam concluir a visita.
- Xans: intervalo base do ataque 0,18 s (antes 0,25 s), cerca de 39% mais ataques por segundo. Alcance 34, dano por golpe, Q e blink mantidos. Afeta o combate principal solo/cooperativo e suas cópias, não o motor separado de História/Duelo.
- Preserva ranking, relíquias, maldições, despertares, Boss Rush e música existente. Não requer migração adicional de armazenamento se V6.0 instalada.

Testes automatizados: `npm run test:601` — intermissões, bloqueio de cartas, compras, eventos, sincronização simulada, ranking, Boss Rush, Xans, Mímico e História. Aparência e gameplay em navegador/Cloudflare reais ainda não validados.
