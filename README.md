# Yggdrasil v4.7 — Pecado na onda 20 do Reino Nórdico

Patch incremental **sobre a versão v4.6 já instalada**. Não substitui os arquivos gráficos, as trilhas sonoras ou os sprites existentes; só altera o código, os testes e as telas.

## Campanhas e chefes

- **Japão** continua com 20 ondas, incluindo Tsukuyomi (onda 15) e o Pecado original (onda 20), que permanece com 11.200 HP base e seus ataques atuais.
- **Nórdico** passa a ter 20 ondas; Jarl do Gelo na 5ª, Odin na 10ª, Cavaleiro Inominável e seu dragão na 15ª, e **Pecado na onda 20**, sem substituir a luta do Japão.
- O Pecado nórdico reutiliza seu sprite e seus padrões originais com as três fases já existentes (100–70%, 70–35%, 35–0%). Tem 17.500 HP base no modo Normal, além dos multiplicadores existentes de dificuldade e cooperativo.
- Exclusivamente na luta nórdica, Pecado invoca ecos de chefes anteriores de tipo aleatório, com **25% da vida base** do chefe imitado, golpes menos fortes e limite de um eco ativo. Reaproveita os sprites existentes.
- Menu de teste direto e escolha no online incluem o novo **Pecado — Nórdico**.

## Heróis e cartas

- Loid permanece rápido (0,24 s por golpe), mas a carga do supremo por acerto caiu de 9% para **1,4% nos inimigos comuns** e de 12% para **2,2% nos chefes**. O combate e o dano dos golpes não foram enfraquecidos.
- Kris mantém **Q = transformação**, **R = supremo** e **F = Forma do Sapo**, somente depois de conseguir a carta. O celular usa o botão F já existente. A carta continua de uso único por partida.
- Jornadas normais e cooperativas começam com **5 cartas japonesas comuns/raras**, sem cartas especiais gratuitas. Após superar a onda 5 nórdica, a especial do herói aparece entre as recompensas Futhark. No teste direto contra chefe, a carta especial pode ser entregue no início.
- Odin, Eve Lorey, cartas Futhark, passivas nórdicas, dragão, música da onda 15 e todos os outros recursos da v4.6 foram preservados.

## Instalação

1. Garanta que **Yggdrasil v4.6 já esteja instalado** no seu repositório.
2. Envie `Yggdrasil_v47_Patch_sobre_v46.zip` para a raiz do repositório GitHub.
3. No Codespaces:

```bash
git pull --ff-only &&
unzip -o Yggdrasil_v47_Patch_sobre_v46.zip -d . &&
bash aplicar_v47.sh &&
npm install &&
npm run test:pecado47 &&
npm run test:campaign &&
npm run test:heroes &&
npm run test:cards &&
npm run test:eve &&
npm run test:server &&
npx wrangler deploy &&
git add -A public src tests package.json README.md aplicar_v47.sh &&
(git diff --cached --quiet || git commit -m "Yggdrasil v4.7 - Pecado Nordico e balanceamento") &&
git push
```

Os testes automatizados verificam as regras; o jogo publicado deve ser testado visualmente no celular, especialmente a fase 3 e as invocações do Pecado nórdico.
