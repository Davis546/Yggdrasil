# Yggdrasil V6.1 — Ascensão Celestial

Patch incremental sobre V6.0.2; inclui também os assets e a lógica da loja V6.0.1. Não é jogo completo. Instalar na raiz do repositório que já contém a V6.0 ou superior, sem apagar assets antigos. Não substitui as músicas existentes.

## Abloy
- Herói jogável normal, na sexta página da seleção solo/cooperativa. O Mímico também pode imitá-lo.
- 112 HP, 31 de dano, ataque a cada 0,55s, alcance nominal 245. Ataque de energia explode ao atingir o alvo. Q (8s) dispara três almas explosivas. E (13s) explode à frente e atrai/atordoa inimigos comuns. R: feixe de 420 unidades por 2,4s, com dano periódico; mantém a direção escolhida no início.
- Três espíritos orbitam: dourado (escudo de 15 ao receber ataque elegível, recarga 12s), violeta (disparo automático a cada 1,65s com alvo próximo), azul (cura 5,5% da vida máxima quando abaixo de 78%, recarga 14s). Forma cósmica em toda conjuração, inclusive o feixe.
- Quatro cartas próprias e variantes rúnicas. Retrato e arte derivados do conceito enviado; sprites em quatro direções com quadros simples de movimento e paleta cósmica. Vista traseira adaptada; não são animações desenhadas individualmente. Abloy ainda não está disponível nos motores independentes de História e Duelo.

## Encontros secretos
- Nas ondas comuns de Sobrevivência a partir da onda local 6, 3,5% de chance de invasão divina e 2,5% de Espelho da Alma. Sem aparições no Boss Rush, em eventos ou testes diretos. Aviso de 3s antes de o chefe atacar; o jogador pode lutar com os monstros normalmente durante o aviso.
- Invasão divina: Tsukuyomi (Japão) ou Odin (Nórdico) em versão fortalecida, com meteoros e maldição adicionais. Aumenta a frequência dos golpes especiais abaixo de metade da vida. +160 fragmentos ao vencer. Mímico captura a alma original do deus, não uma variante separada.
- Espelho da Alma: imita a aparência e características efetivas (vida, dano, proteção, velocidade, alcance, recarga) de um jogador, escolhendo o mais forte por vida e dano. Registra suas cartas e runas; habilidades e estatísticas são adaptadas para a IA, não uma reprodução exata de todos os efeitos de cartas. +120 fragmentos ao vencer. Ambos contam para o progresso de eventos/despertar e não eliminam automaticamente os monstros da onda.

## Instalação
```bash
cd /workspaces/Yggdrasil &&
git pull --rebase origin main &&
unzip -o Yggdrasil_v61_Atualizacao.zip &&
npm run test:610 &&
git add public src tests package.json wrangler.jsonc README_v61.md &&
(git diff --cached --quiet || git commit -m "V6.1 - Abloy e Invasoes Divinas") &&
git push origin main &&
npm run deploy
```
Confirme V6.1 e `game.js?v=610`. Testes automatizados de combate e lobby simulados, não validação visual ou de rede no Cloudflare real. As chances e os valores iniciais são escolhas de balanceamento sujeitas aos testes de gameplay.


## V6.1.1 — Rework do Abloy
- Sprite sheet do Abloy refeito em pixel art mais próximo dos outros heróis.
- Forma cósmica também ganhou folha própria em estilo pixelado.
- As bolhas/espíritos não ficam mais sempre ativas: agora têm chance de aparecer no início de cada onda.
- Espírito dourado: dá escudo da rodada.
- Espírito violeta: dispara automaticamente durante a rodada.
- Espírito azul: ativa cura ao longo da rodada.
- Cartas do Abloy ajustadas para reforçar chance de aparição dos espíritos e o feixe final.
