# YGGDRASIL V4.9 — O AUTOR DA REALIDADE E O SOMBRAMANTE

Atualização incremental sobre 4.8.1. A edição completa recompõe v4.4 + v4.5.1 + v4.6 + v4.7 + v4.8 + v4.8.1 + v4.9. Não substitui músicas ou artes anteriores. A imagem nova de Mollitiam não é usada.

## Novidades
- Moretti disponível desde o início. D20 por habilidade, Q suporte ofensivo e recarga, E campo de distorção, R proteção e regeneração com manifestações e alteração da arena em 20 natural; F exclusivo, vantagem no dado.
- L0ID: segredo `L0ID` ou vitória na campanha japonesa Pecador, armazenado no navegador. Q aura, E dez sombras, R eclipse, F cortes adicionais, imunidade e dez sombras. O Loid antigo permanece com quatro sombras.
- Novos retratos, artes de cartas, folhas PNG transparentes de 36 quadros por herói, 192×192 por quadro. Efeitos reaproveitam o limite existente de partículas; sombras buscam alvos em intervalos. Os PNG individuais também estão presentes.
- Co-op: host decide as rolagens, combate e efeitos e replica estados. O Worker aceita os novos heróis em co-op. O duelo X1 antigo continua usando seu elenco original; não se implementou o balanceamento PvP dos novos heróis.
- Desbloqueio local ao navegador, não vinculado a uma conta nem protegida contra manipulação do armazenamento local.

## Validação
- `npm run test:server` executado; testes anteriores de regressão executados (18 arquivos, incluindo os dois do servidor). Atualizados somente os testes que verificavam o sufixo de cache 481 para 49.
- `npm run test:v49`: execução do JS em VM com DOM/canvas simulados; atributos, faixa de D20, Q/E/R/F, invocações, teleporte, vitória simulada e bloqueio do desafio direto. Cabeçalhos PNG verificados. Não equivale a uma partida completa no navegador.
- Chromium do ambiente bloqueou navegação HTTP local e arquivo local (ERR_BLOCKED_BY_ADMINISTRATOR). Não validado visualmente em Android, em uma partida real completa ou com dois dispositivos conectados ao Cloudflare. Deploy não executado aqui. Alguns quadros de habilidade reaproveitam poses da folha original, e os efeitos de proteção/distorção são desenhados no canvas; não são animações desenhadas quadro a quadro inteiramente novas.

## Atualização (base 4.8.1 instalada)
Coloque o ZIP de atualização na raiz do repositório e execute:

```bash
git pull --ff-only && unzip -o Yggdrasil_v49_Atualizacao.zip -d . && npm install && npm run test:server && npm run test:v49 && npm run test:mollitiam-jp && npm run test:pecador48 && npx wrangler deploy && git add -A public src tests package.json README.md README_v49.md && (git diff --cached --quiet || git commit -m "Yggdrasil v4.9 - Moretti e L0ID") && git push
```

A edição completa é dividida em ZIPs independentes; extraia todos na raiz do projeto antes de instalar dependências. Não é necessário baixar a atualização se usar todas as partes completas.
