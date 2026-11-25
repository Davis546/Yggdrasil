# v4.9.6 — Runas do Norte

Veja [README_v496.md](README_v496.md).

# v4.9.5 — FPS livre

Veja [README_v495.md](README_v495.md).

# Yggdrasil v4.9

Veja [README_v49.md](README_v49.md) para as novidades, instalação e limites de testes.

## Patch v4.8.1 — Mollitiam Japão

- Apenas no Japão: E cura 12,5% (ou 17,5% com carta F) em vez de 25% (35% com F).
- Apenas no Japão: invulnerabilidade após sofrer dano cai de 0,76 s para 0,18 s.
- Reino Nórdico e outros heróis permanecem inalterados.
- Versão dos scripts atualizada para evitar cache.

# Yggdrasil v4.8 — Mollitiam e Desafio Pecador Nórdico

**Atualização incremental sobre a versão v4.7 completa já instalada.** Todos os assets, músicas, cartas, reinos e bosses da v4.7 permanecem inalterados, exceto pelos ajustes de dificuldade listados abaixo. Este ZIP sozinho não substitui a instalação base.

## Novo personagem jogável: Mollitiam

Mollitiam é um gigante ancestral de pele rochosa, armadura de pedras e um machado imenso. Tank de linha de frente: muita vida, dano pesado, movimento e ataques lentos. Disponível na seleção solo, cooperativo, desafio direto contra chefes e X1.

- **Vida:** 320 HP, **dano base:** 130 por golpe; **crítico:** 200 antes de modificadores e defesa.
- **Ataque básico:** machado, intervalo de 1,36 s; **velocidade:** 57, abaixo dos demais heróis.
- **Q — Pisão de Guerra:** onda de choque circular (112 px), elimina inimigos comuns atingidos; causa dano controlado contra bosses. Recarga de 11,5 s.
- **E — Raízes de Yggdrasil:** cura Mollitiam e os aliados vivos em 25% de suas vidas máximas; 30 s de recarga.
- **R — Titã Rúnico:** supremo de carga lenta (3%/5% por acerto normal/chefe); dura 8 segundos, golpes contra chefes causam o dobro do dano e o machado ataca 35% mais rápido.
- **Carta especial F — Coração de Yggdrasil:** após obter a carta, uso único por partida; por 8 s reduz em 40% o dano recebido, aumenta em 30% a velocidade de ataque e em 50% o dano contra chefes, aumenta o raio do Q, cura 35% com E e evita efeitos leves de lentidão/maldição. **F não substitui Q, E nem R.**
- **Arte:** retrato de seleção, sprite sheet real de 16 quadros (4×4, 1280×1280, PNG com transparência) e carta em PNG. As imagens foram mantidas sem redução de resolução e os quadros recortados sem esticar ou perder detalhes.
- **Campanhas:** Japão e Nórdico; regra nórdica de cinco cartas japonesas, passivas e runas permanece. Mollitiam pode ganhar sua carta especial nas recompensas ou começar com ela no desafio direto contra chefes.
- **X1:** selecionável e reconhecido pelo servidor. Para balancear PvP, os valores de HP/dano seguem a escala original do duelo; Q, E e R funcionam em relação aos adversários, sem efeitos de dano infinito.

## Chefes do modo Pecador — apenas Reino Nórdico

Em relação à dificuldade Pecador nórdica da v4.7, os chefes recebem:

- **×1,60 de vida** além do multiplicador Pecador já existente;
- **×1,38 de dano extra** para golpes de chefes e seus projéteis;
- **+22% de frequência de ataques**, ao reduzir temporizadores de ataque mais depressa;
- **+13% de velocidade de movimento** comparado ao Pecador anterior;
- Reforço também para o dragão da onda 15 (vida e ataques).

**Nenhum reforço adicional** no modo Normal, nos chefes do Japão nem nos inimigos comuns. Não foram alteradas a música, o visual, a ordem das ondas (Jarl 5, Odin 10, Cavaleiro 15, Pecado 20) ou os demais personagens.

## Instalação no GitHub Codespaces (já com v4.7 instalada)

1. Faça upload de `Yggdrasil_v48_Mollitiam_PecadorNordico.zip` na **raiz** do repositório GitHub (aba *Code*).
2. Abra o Codespaces e execute o bloco:

```bash
git pull --ff-only &&
unzip -o Yggdrasil_v48_Mollitiam_PecadorNordico.zip -d . &&
npm install &&
npm run test:mollitiam &&
npm run test:pecador48 &&
npm run test:server &&
npm run test:nordic &&
npm run test:campaign &&
npm run test:bosses &&
npm run test:cards &&
npm run test:pecado47 &&
npx wrangler deploy &&
git add -A public src tests package.json README.md &&
(git diff --cached --quiet || git commit -m "Yggdrasil v4.8 - Mollitiam e Pecador Nordico") &&
git push
```

**Limitação da validação:** testes automatizados de integridade, regras e servidor passaram. A publicação no Cloudflare e o teste visual no Android/celular ainda precisam ser confirmados após o deploy.

## v4.9.1 — Ascensão Cooperativa

Escala dinâmica de 1 a 5 jogadores. Consulte [README_v491.md](README_v491.md) para multiplicadores, testes e publicação.

## v4.9.2 — Network Overhaul
Atualização cumulativa v4.9 → v4.9.2: escala cooperativa, reconexão e migração de anfitrião. Consulte [README_v492.md](README_v492.md) para implantação e limitações.

## v4.9.3 — Performance Update
Sombras pré-renderizadas, interpolação, diagnóstico de RTT e borda, preferência regional e redução de tráfego. Consulte [README_v493.md](README_v493.md).

## v4.9.4 — Ascensão dos Suportes
Kali e Moretti receberam cura e buffs coletivos calculados pelo anfitrião, incluindo convidados. HUD de efeitos ativos, reflexos otimizados e autoria de projéteis corrigida. Veja [README_v494.md](README_v494.md). Teste: `npm run test:support494`.

## V4.9.7 — Encontro dos Reinos

Lobby jogável e seguro para até cinco jogadores, com Templo do Japão e Midgard. Consulte [README_v497.md](README_v497.md). Atualização cumulativa inclui V4.9.6.
