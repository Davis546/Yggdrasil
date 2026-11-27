# Yggdrasil V5.8 — Ascensão
Atualização do modo História, sobre V5.7. Inclui novamente a correção de seleção V5.6.2 e os arquivos de mapas/áudio/interiores da V5.7. Requer V5.6.1/5.7 com os sprites e retratos dos heróis instalados. Sobrevivência e Duelo mantêm o motor V5.6.1; o HTML aponta intencionalmente para game.js?v=561.

## História
- Seleção de dez heróis, com bloqueios originais de L0ID e Mímico (desbloqueio no modo Sobrevivência). Poder inicial de vida/dano 60% do original, crescimento e ficha exclusiva por personagem. O save local existente é migrado; níveis anteriores preservados até 30, pontos reconstituídos conforme nível. A ficha não afeta os outros modos.
- C ou botão FICHA: atributos, perícias, estatísticas e poderes. +5 atributos e +2 perícias por nível; começam em 5/0. Limite de nível 30, atributos 45, perícias 5 (gradualmente liberadas). Pontos consumidos de forma permanente; sem reset de build nesta versão.
- Força: dano físico e vida; Agilidade: velocidade, ataque e esquiva; Intelecto: recarga; Vontade: magia e resistência. Dez perícias funcionais: Combate, Fortitude, Reflexos, Pontaria (alcance), Furtividade, Investigação (alcance de exame), Medicina, Diplomacia (suprimentos), Feitiçaria, Concentração. Não existem ainda testes de diálogo ramificados nem pistas secretas específicas.
- XP: comum 5; chefe 150; primeira missão principal 750 ao entregar a Caine. 500 EXP para nível 2, exigência crescente. Recompensas de elite/miniboss/secundária definidas para próximas missões, não há missões secundárias nesta versão. Níveis 5/10/20 aprimoram Q/E/R; 15 +8% de dano; 25 cura +20%; 30 +15% de magia de habilidade. Não há nova habilidade de nível 25 ou despertar narrativo exclusivo ainda.
- Q/E/R, J ou toque para ataque, espaço esquiva, WASD/setas, Shift correr, Z/F conversar/examinar, M mapa, C ficha, H suprimento, T formas do Mímico. R carrega em combate. Habilidades adaptadas à escala do mapa, não motor compartilhado com Sobrevivência. Mímico copia habilidades de heróis mantendo atributos e progressão, não captura chefes no História nesta versão. Clones têm visual simplificado.
- XXXX: disparos de arma de fogo com traçadores e som sintetizado; distância de combate e separação dos aliados. NPCs estáticos próximos são redistribuídos em áreas caminháveis. Minimapa: ouro objetivos, lilás NPCs, azul aliados, verde jogador; nomes no mapa ampliado. Sombramante maior (24 unidades vs 16).
- Missão 01 e mapas simplificados V5.7 preservados. Sem novas missões além da invasão.

## Instalação
Na raiz: unzip -o Yggdrasil_v58_Atualizacao.zip; npm run test:580; git add public tests/story-v58.test.mjs package.json README_v58.md README_v57.md README_v562.md; commit, push, npm run deploy. História deve apontar para story.js?v=580. Não instalar a correção 5.6.2 separadamente.

## Testes
Node: rotas, preparação, ondas, chefe, derrota, persistência, níveis, atributos, perícias, painel simulado, poderes dos 10 personagens, separação de aliados. Não validado em celular físico nem no Cloudflare; navegação do Chromium bloqueada neste ambiente.
