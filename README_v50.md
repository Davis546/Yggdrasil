# Yggdrasil v5.0 — Seleção dos Heróis

Atualização cumulativa desde v4.9, inclui v4.9.9 (Tela Livre) e todas as alterações intermediárias. Extrair na raiz do repositório.

- Oito cartas independentes extraídas dos quatro GIFs aprovados enviados pelo criador, sem redesenho. WebP animado sem perdas a partir dos quadros decodificados dos GIFs (2 ou 4 quadros e temporização original), e imagem estática para preferência de movimento reduzido.
- Duas cartas por página: Kris/Loid, Xans/Eve Lorey, Kali/Mollitiam, Moretti/L0ID. Setas, arraste com toque/mouse e indicadores de página; arraste não seleciona herói. Só a dupla visível carrega animações. Imagens completas com object-fit contain.
- Solo, jornada, testes de bosses, cooperativo e troca no lobby usam os botões originais. O X1 recebe a mesma apresentação para os seis heróis já permitidos naquele modo, sem alterar regras ou incluir novos combatentes.
- L0ID continua bloqueado até cumprir as condições existentes. O nome correto L0ID é identificado na interface mesmo se o zero da arte se parece com um O. Kris usa o nome Santa Trindade.
- Nenhum sprite de combate, música, habilidade ou regra de servidor alterado nesta versão. As funcionalidades v4.9.9 continuam presentes.

## Testes
`npm run test:selection50` verifica navegação, arraste e bloqueio de clique, carregamento apenas das cartas visíveis, preferência de movimento reduzido, assets e integração. Execute também `npm run test:server`, `npm run test:ui499` e testes anteriores. Não houve partida real no Cloudflare nesta sessão.
