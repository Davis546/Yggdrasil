# YGGDRASIL v3.8 — Japão / Reino Nórdico independentes

## Novidades

- **Solo:** INICIAR A JORNADA → escolha **Japão (20 ondas)** ou **Reino Nórdico (5 ondas)** → escolha o protagonista. Um reino nunca inicia automaticamente após finalizar o outro.
- **Online cooperativo:** o anfitrião seleciona Japão ou Reino Nórdico na sala antes de começar; todos entram no mesmo cenário e na mesma onda. Testar chefes e X1 continuam disponíveis.
- **Chefes da onda 5 e onda 25:** Daimyō Oni ganhou retrato de seleção e entrada de combate; Jarl do Gelo ganhou ilustração própria em pixel art, com apresentação na batalha.
- **Jarl do Gelo (quinto chefe):** retrato original em pixel art adicionado à seleção de chefes e introdução da luta; mantém a sprite animada de combate.
- **Eve Lorey:** carga do supremo reduzida (por golpe: 0,7 em inimigos comuns; 1,2 contra chefes), mantendo o poder forte, porém mais demorado de carregar.
- **Imagens da seleção corrigidas:** retratos individuais, centralizados, sem outros personagens ou nomes duplicados cortados em cada cartão.
- **Animação de caminhada:** inimigos japoneses de sprite único recebem balanço e passos visuais. Nórdicos e chefes usam seus ciclos de três quadros ao caminhar. Sem alterar hitboxes, dano ou protocolo de rede.

## Publicar no Cloudflare via GitHub Codespaces

Envie **Yggdrasil_Reinos_Separados_v38.zip** para a raiz do repositório e execute:

```bash
git pull &&
unzip -o Yggdrasil_Reinos_Separados_v38.zip -d . &&
npm install &&
npm run test:server &&
npm run test:nordic &&
npm run test:campaign &&
npx wrangler deploy &&
git add -A public src tests package.json wrangler.jsonc README.md .gitignore &&
(git diff --cached --quiet || git commit -m "Yggdrasil v3.8 - mundos separados") &&
git push
```

No PC, atualize o site com Ctrl+Shift+R. No Android, feche a aba antiga e abra novamente. O projeto é publicado no Cloudflare Workers, não no GitHub Pages.

## Testes

`npm run test:server`, `npm run test:nordic`, `npm run test:campaign`, `node --check public/game.js`, `node --check src/worker.mjs`. O deploy real requer credenciais Cloudflare e não foi feito nesta entrega.
