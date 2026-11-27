# Yggdrasil RPG — V5.5.1 · Mímico: Imitador Supremo

Patch cumulativo para V5.4.1 ou V5.5.0. Preserve os demais arquivos do repositório, incluindo áudio, configuração Wrangler, dependências e demais sprites. Não é uma instalação independente.

## Novidades
- Arte original enviada pelo jogador na seleção e na carta do Mímico.
- 12 poses originais de caminhada/repouso e 4 poses originais de ataque com corrente; transparência, alinhamento e animação nas quatro direções. A pose de ataque é exibida no começo de cada golpe, sem alterar a autoridade do host.
- Todas as nove formas jogáveis copiáveis têm seus próprios sprites existentes em uma variante cromática escarlate (inclusive a forma de sapo). Preserva a silhueta e as animações do personagem copiado. As variantes são carregadas sob demanda para reduzir o custo inicial em celulares.
- Código secreto KR1S ou vitória completa no Reino Nórdico, sem teste direto de chefes. Progresso salvo no navegador. T/botão MÍMICO abre a lista; Q também abre na forma original. As formas copiadas mantêm Q, E, R, cartas compatíveis e as respectivas habilidades. Dano base +20%, recargas base Q/E -10%; intervalo de troca de 8s (5s com Imitação Suprema). Os limites de chefes e as habilidades especiais de dano fixo continuam seguindo regras existentes. Não restaura HP nem recarga ao trocar de forma.
- Novo mapa nevado enviado pelo jogador substitui o Santuário Superior (mount1) no modo História. Área central ampla, três portais existentes nas trilhas norte, sul e oeste, caminho leste para exploração; colisões aproximadas por polígono e obstáculos. As outras duas montanhas da V5.5 permanecem, inclusive a fortaleza dos anões e seu interior. Nenhum mapa, portal ou interior adicional foi removido.
- Mímico disponível no modo Sobrevivência solo/cooperativo, não no Duelo ou História.

## Instalação (GitHub e Cloudflare)
1. Sincronize o Codespace com `git pull --rebase origin main` antes de extrair, se possível. Resolva conflitos antes de continuar.
2. Extraia este ZIP na raiz do repositório (`public`, `src`, `package.json`), substituindo apenas os arquivos de mesmo nome. Não apague pastas.
3. Execute na raiz:

```bash
git add public src tests package.json README_v55.md README_v551.md
git commit -m "V5.5.1 - Mimico original e montanhas nevadas"
git pull --rebase origin main && git push origin main && npm run deploy
```

O deploy depende da configuração e credenciais Wrangler já existentes. Se houver conflito ou falha, não force push; resolva antes. Se não houver dependências instaladas, execute `npm install` antes do deploy. Recarregue o site sem cache e recrie as salas antigas.

## Testes
`npm run test:551` foi executado no ambiente de trabalho, com validação de dimensões de sprites, renderização simulada dos ataques e das nove cópias, transformação e sincronização cooperativa simuladas, recarga, HP, cartas, runas, colisões e conectividade dos 44 portais. Sem teste em navegador/dispositivo físico ou deploy real. As formas alternativas são recoloridas, não redesenhadas individualmente.
