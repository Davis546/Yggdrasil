# Yggdrasil v4.6 — Passivas nórdicas, cartas Futhark e heróis rebalanceados

Base: v4.4 (ou versão posterior). Este é um patch incremental que inclui as mudanças da v4.5, as correções de cartas/Eve, a seleção de bênçãos e os novos atributos dos heróis.

## O que mudou
- **Loid**: intervalo base entre ataques **0,24 s** (antes 0,29 s), tornando-o o personagem com maior velocidade de ataques básicos.
- **Kris**: **46 pontos de dano base** (antes 34), maior entre os protagonistas (Eve continua com 42).
- No Reino Nórdico, o jogador começa com **5 cartas japonesas** (4 comuns/raras e uma especial do personagem), e escolhe **20 possíveis cartas Futhark nas recompensas entre ondas**. São no máximo 5 runas permanentes além das cartas iniciais; após isso, oferece suprimentos.
- **6 passivas nórdicas** disponíveis: cada jogador escolhe exatamente 3 antes de entrar na campanha, no boss direto ou no cooperativo. A escolha é separada das cartas e runas.
- Passivas: Sabedoria de Odin (-20% recarga Q/E), Fúria de Týr (+30% dano base), Pele de Ymir (+20% vida / -8% dano recebido), Passos de Sleipnir (+12% movimento e -15% dash), Bênção de Eir (+5 p.p. chance de coração / +50% cura do coração), Olhos de Huginn (+10 p.p. crítico / +10% dano contra chefes).
- **Eve Lorey**: Q e R originais preservados. Carta especial **Retorno ao Auge** ativa no **F** (6 s, +100% de dano e velocidade, -65% intervalo do dash durante o efeito).
- **Odin** na onda 10 nórdica; **Cavaleiro Inominável + dragão independente** na onda 15. Música M4A fornecida pelo usuário na onda 15. Artes e animações preservadas sem redimensionamento ou recompressão.
- Os tetos de balanceamento nórdico seguem em vigor para vida, dano, crítico e mobilidade.

## Instalação pelo terminal do GitHub Codespaces
1. Os arquivos da **v4.4 completa** (ou v4.5 mais recente) precisam ter sido extraídos na raiz do projeto.
2. Envie `Yggdrasil_v46_Atualizacao.zip` à raiz do repositório.
3. Execute:

```bash
git pull --ff-only && unzip -o Yggdrasil_v46_Atualizacao.zip -d . && bash aplicar_v46.sh && npm install && npm run test:heroes && npm run test:eve && npm run test:cards && npm run test:bosses && npm run test:server && npm run test:odin && npx wrangler deploy && git add -A public src tests package.json wrangler.jsonc README.md .gitignore && (git diff --cached --quiet || git commit -m "Yggdrasil v4.6 - passivas e balanceamento") && git push
```

A execução dos testes **não equivale** a publicar ou testar visualmente no celular. Confirme o site após o deploy.

**Direitos de áudio**: a gravação M4A da onda 15 é de terceiros. Verifique a licença/permissão para distribuição em um jogo público.
