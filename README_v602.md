# Yggdrasil V6.0.2 — Portais Errantes

Patch incremental sobre V6.0.1. Não substitui o jogo inteiro.

- Portais físicos animados na arena, após limpar a onda, a partir da quarta onda.
- Chefes: 8% mercador, 12% evento (20% total). Ondas comuns: 3% mercador, 5% evento (8% total). Sem aparições garantidas; máximo um por onda. Não aparecem no teste de chefes nem no fim da campanha.
- O HUD mostra direção, tipo e tempo restante. O jogador tem 25 segundos para tocar o portal. No cooperativo, qualquer integrante vivo pode levar o grupo à sala; o anfitrião controla a decisão de entrada por proximidade e sincroniza as coordenadas.
- Sem menu de escolha de portal. Cartas só aparecem após expirar o portal, sair da loja ou concluir o evento. A recompensa da onda é registrada uma única vez.
- Mercador, música, cartas, relíquias, Xans, Mímico e modo História preservados. A menor frequência de eventos torna o despertar mais difícil.

## Instalação
Enviar o ZIP ao diretório raiz do repositório já atualizado para V6.0.1 e executar:

```sh
cd /workspaces/Yggdrasil &&
git pull --rebase origin main &&
unzip -o Yggdrasil_v602_Atualizacao.zip &&
npm run test:602 &&
git add public tests package.json README_v602.md &&
(git diff --cached --quiet || git commit -m "V6.0.2 - Portais Errantes") &&
git push origin main &&
npm run deploy
```

Testes automatizados em ambiente local: chances, proximidade, expiração, compras, cartas, evento, coop simulado, 64 rodadas do Boss Rush, Xans, Mímico e História. Não validado visualmente no navegador nem em uma partida real no Cloudflare.
