# V5.7 — A invasão dos Onis
Patch incremental para V5.6.1, inclui correção V5.6.2.

Modo História: fale com Caine no distrito comercial, avise os três moradores fixos, procure Lisa e retorne a Caine. Depois do diálogo, três ondas e o comandante Oni. Caine, Lisa e Hayato atacam os inimigos automaticamente. Proteja a praça e a própria vida. Derrota retorna à preparação. Fale com Caine após a vitória para gravar a conclusão por herói neste navegador.

Montanhas: três trilhas largas, com arte simplificada, novas coordenadas e colisões; vila preservada. Interiores e retratos existentes incluídos, moradores nos interiores e guardião do refúgio. Trilha de menu e batalha existentes, som de espada e efeitos sintetizados; botão SOM. Áudio depende de permissão do navegador. O comandante usa sprite do Reuni como recurso provisório.

Sobrevivência e Mímico: game.js V5.6.1 intacto, correção visual de seleção V5.6.2 inclusa.

Instalação: unzip -o Yggdrasil_v57_Atualizacao.zip na raiz do repositório, npm run test:570, git add public tests/story-v57.test.mjs package.json README_v57.md README_v562.md, commit, push e npm run deploy. O HTML da história deve apontar para story.js?v=570; a sobrevivência mantém game.js?v=561 intencionalmente.

Testes: lógica de missão, rotas, NPCs, renderização simulada, persistência, derrota; regressões V5.6/V5.6.1 e V5.5 coop. Não validado em navegador físico ou no Cloudflare.
