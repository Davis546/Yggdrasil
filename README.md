# YGGDRASIL — As Sete Raízes · v3.0

Atualização focada no modo **X1 Online**. Base: projeto v2.9, com todas as artes, personagens, poderes, chefes, música e cooperativo preservados.

## Mudanças reais

- **X1 multiplayer:** movimento local previsto no convidado e reconciliação suave com a posição autoritativa do anfitrião; evita o efeito de travar/recuar a cada resposta da rede. Quadros de estado numerados para ignorar estados fora de ordem. Diminui envios de inputs repetidos (com heartbeat) e descarta envios quando o WebSocket está congestionado.
- **Renderização:** câmera acompanha o personagem e desenha somente a parte visível da arena, em vez de escalar/desenhar o mapa inteiro em cada quadro. Qualidade de X1 configurável (Auto, HD, Leve, Desempenho); no celular o modo Auto adapta a resolução caso o FPS caia.
- **Eve Lorey e Kali:** sprites normalizados por quadro com transparência, sem recortes vazando de uma célula para outra. Escala visual dos dois aumentada no X1; imagens originais de personagem preservadas.
- **Eve Lorey:** seu dash do vazio mostra dois portais pixel art animados, na saída e na chegada, com efeitos sonoros, além do deslocamento instantâneo calculado pelo anfitrião.
- **Cartas do X1:** 22 ilustrações grandes extraídas do atlas de cartas do próprio jogo e aplicadas às cartas do duelo, com molduras e cores por raridade. Mantido o sistema de 3 cartas por jogador antes da luta.
- **Combate:** animação curta de avanço/recuo durante os ataques, efeitos de magia temporal e espelhos, rastro do espelho da Kali, e pré-visualização cosmética dos comandos dos convidados para não parecer que o botão ficou sem resposta. A lógica de dano permanece com o anfitrião.
- **Interface:** botões ilustrados Q/E/R preservados, indicador FPS/ping/jitter e número **v3.0** na tela principal e no X1. URLs de assets atualizadas para `?v=30` para facilitar recarregamento após deploy.

## O que não muda

- O modo cooperativo de até 3 jogadores, a seleção dos cinco protagonistas, o modo Pecador, os chefes (Samurai, Reuni, Tsukuomi, Pecado), a música do X1, a cura, as cartas especiais e o rework dos poderes.
- O X1 permanece **host-authoritative**: quem cria a sala processa o combate, os outros recebem o mesmo estado pela conexão Cloudflare Workers + Durable Objects. Ele ainda não é um servidor dedicado de simulação.

## Publicação no GitHub Codespaces e Cloudflare

O ZIP deve ser extraído na **raiz do repositório**, que contém `package.json`, `wrangler.jsonc`, `src/` e `public/`.

```bash
git pull && unzip -o Yggdrasil_Cloudflare_X1_Fluidez_Portal_v30.zip -d . && npm install && git add public src package.json wrangler.jsonc README.md && (git diff --cached --quiet || git commit -m "Yggdrasil v3.0 - X1 fluidez e portais") && git push && npx wrangler deploy
```

Após publicar, atualize a página em ambos os dispositivos. Na tela inicial e no cabeçalho da arena X1 deve aparecer **v3.0**.

## Testes realizados

- `node --check`: `public/duel.js`, `public/game.js`, `src/worker.mjs` e `public/audio.js`.
- Teste local com **duas janelas de navegador simulando mensagens do WebSocket**: jogador convidado moveu-se, anfitrião recebeu a direção, e as posições exibidas ficaram próximas; nenhuma exceção JavaScript. O dash de Eve criou os dois efeitos de portal na simulação do anfitrião.
- Arquivos de arte validados: 12 quadros de Kali, 12 de Eve Lorey, quatro imagens do portal, 22 ilustrações de cartas; todas as imagens estão presentes no pacote.

**Limitação importante:** por restrições do ambiente, a partida real entre dois dispositivos publicados na Cloudflare não foi executada. A melhora da fluidez deve ser confirmada no seu site e em celulares reais.
