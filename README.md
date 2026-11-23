# YGGDRASIL v3.9 — Trilha nórdica e correção dos chefes

## Atualização 3.9

- Japão (20 ondas) e Reino Nórdico (5 ondas) continuam separados no solo e na sala cooperativa; X1 e demais modos preservados.
- **Sumiço dos chefes resolvido no renderer:** os quadros de caminhada eram calculados com uma propriedade `phase` não inicializada no boss; produziam valores NaN em `canvas.drawImage`. Agora os cinco chefes (Daimyō Oni, Reuni, Tsukuyomi, Pecado e Jarl do Gelo) usam índices inteiros válidos, mesmo quando chegam dados incompletos do online.
- **Jarl do Gelo:** novo atlas de 16 quadros recortados com transparência (8 poses de caminhada/repouso e 8 de ataque/magia). A sprite agora tem 136 unidades de exibição, sombra de apoio, ataques sinalizados, efeitos glaciais persistentes e barra de vida acima do corpo. Ajustados posição inicial e HP (8200 no Normal), com ataques mais frequentes na segunda fase.
- **Interface:** cartões de heróis centralizados, responsivos; novos retratos normalizados de Loid, Kris, Xans, Eve Lorey e Kali sem recortes extremos; cartões dos chefes com `contain`; correção de cache das páginas (`game.js?v=39`, `audio.js?v=39`).
- **Música do Reino Nórdico:** `Warhammer 40,000 Darktide - Immortal Imperium 8-bit cover - Kr4ppy` nas ondas nórdicas, via `assets/audio/nordic_theme.mp3`.
- **Música do Jarl:** `Dragonforce - Through The Fire And Flames (8 Bit) - pandoozles`, via `assets/audio/nordic_boss.mp3`, apenas durante a luta com o Jarl; após derrotá-lo a trilha retorna ao tema nórdico.
- **Ondas 15 e 20:** a onda 20 mantém a trilha própria de Pecado já existente. A OST exclusiva da onda 15 ainda depende do áudio a ser fornecido, por isso a trilha antiga permanece para ela por enquanto.
- As músicas enviadas foram convertidas para MP3 160 kbps para reduzir o tamanho de carregamento, sem alterar a composição.

## Publicação Cloudflare Workers via GitHub Codespaces

1. Envie o arquivo **Yggdrasil_Bosses_Musicas_v39.zip** para a raiz do repositório, sem renomear.
2. Cole no terminal:

```bash
git pull &&
unzip -o Yggdrasil_Bosses_Musicas_v39.zip -d . &&
npm install &&
npm run test:server &&
npm run test:nordic &&
npm run test:campaign &&
npm run test:bosses &&
npm run test:music &&
npx wrangler deploy &&
git add -A public src tests package.json wrangler.jsonc README.md .gitignore &&
(git diff --cached --quiet || git commit -m "Yggdrasil v3.9 - bosses e musicas") &&
git push
```

Se o arquivo tiver outro nome dentro do Codespaces, ajuste só o nome após `unzip -o`. Se algum comando falhar, a sequência para nessa etapa e as alterações seguintes não são executadas. Não é necessário enviar o ZIP na hora de `git push`; basta o conteúdo extraído e os arquivos rastreados.

## Testes disponíveis

- `npm run test:server` — rede / X1
- `npm run test:nordic` — criaturas e chefe nórdico
- `npm run test:campaign` — reinos independentes, seleção online e recarga de Eve Lorey
- `npm run test:bosses` — 1080 situações de renderização simuladas nos cinco chefes
- `npm run test:music` — troca de trilhas por ondas, entrada e derrota do chefe

Os testes automatizados não substituem uma inspeção visual em um navegador real no site publicado. O deploy precisa das credenciais Cloudflare do proprietário. As trilhas são covers fornecidos pelo usuário; confirme as permissões de distribuição pública antes de publicar o jogo.
