# Yggdrasil RPG — V5.5.0 · O Imitador Supremo

Patch incremental sobre a V5.4.1. Não é um jogo independente: os arquivos de áudio, sprites e configurações que já estão no repositório continuam necessários. Faça backup/commit antes de aplicar.

## Instalação
1. Extraia o ZIP na raiz do repositório (onde já existem `public/`, `src/` e `package.json`).
2. Substitua somente os arquivos de mesmo nome e preserve os demais. Não apague as pastas completas.
3. Faça commit/push no GitHub. Caso o Cloudflare não faça deploy automaticamente, execute `npm run deploy` na raiz usando a configuração Wrangler existente.
4. Recarregue a página sem cache. Todos os jogadores da sala devem usar a versão nova. Recrie salas antigas após o deploy.

## Mímico
- Secreto: vitória no Reino Nórdico completo (não no teste direto do chefe final) ou código `KR1S` na seleção. Desbloqueio armazenado no navegador.
- Sobrevivência solo e cooperativa; o Mímico não foi adicionado ao modo História ou ao Duelo competitivo.
- Tecla T ou botão MÍMICO: escolha a forma original ou qualquer um dos nove personagens, inclusive L0ID, Moretti e Josué. Na forma original, Q também abre o seletor; copie uma forma para usar seu kit Q/E/R. O jogo não pausa durante a escolha.
- Formas copiadas têm +20% de dano base e recargas base de Q/E 10% menores. Troca de forma a cada 8s. HP proporcional, cartas, runas, bênçãos, recargas e carga do supremo preservados; não restaura cartas de uso único. A carta/runa especial Imitação Suprema reduz a espera para 5s. Mantém a regra de cinco cartas iniciais distintas no Nórdico normal.
- No cooperativo, a transformação é validada pelo host e replicada aos convidados. A identidade original continua sendo Mímico, inclusive após reconexão.
- Retrato original recuperado da biblioteca. Sprite próprio provisório 4 direções × 3 quadros, feito a partir do conceito visual; a folha original específica não foi localizada. Pode ser substituída por `public/assets/heroes/mimic_sheet.png` (336×448, quadros 112×112, linhas baixo/esquerda/direita/cima).

## História · Montanhas
- `mount1`: Santuário Superior (recorte do atlas, sem painel lateral).
- `mount2`: Fortaleza de Amaterasu.
- `mount3`: Fortaleza dos Anões, neve, pontes, áreas de cristais e acampamentos.
- Novas áreas caminháveis desenhadas sobre as imagens; entradas, saída para o templo dos anões e inimigos reposicionados. Preservados os interiores, minimapa e demais mapas. A arte é isométrica e colisões são corredores poligonais aproximados, não uma máscara pixel a pixel.

## Validação
`npm run test:55` na instalação completa. Executado com os testes de simulação do cliente e do servidor e com verificação de conectividade dos mapas (44 portais, 10 interiores, 59 objetos interativos). Não foi realizado teste com aparelhos físicos nem uma sessão real no Cloudflare. A atualização não altera o endereço do servidor.
