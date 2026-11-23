# YGGDRASIL v3.6 — seleção oficial + X1 com simulação no servidor

## Principais mudanças

- **Seleção de personagens:** a arte indicada pelo usuário é usada como tela visual de seleção em **jornada, cooperativo e X1**. Os cinco retratos da imagem permanecem intactos. As cinco áreas sobrepostas são clicáveis, inclusive no celular.
- **X1 autoritativo no Cloudflare:** a simulação de posições, golpes, recargas, dano e desfecho saiu do navegador do anfitrião e roda no **Durable Object**. Os dois lutadores enviam comandos de movimentação/ação para o servidor. Os espectadores recebem o mesmo estado de combate.
- **Rede:** movimento em pacotes menores a até 20 Hz e estado completo com efeitos e vida a cerca de 10 Hz, além de estado imediato após usar uma habilidade. Os clientes fazem predição visual e interpolação; **não podem escolher quanto dano causaram**.
- **Movimento fantasma/tecla presa:** o servidor zera o movimento se não receber comandos em aproximadamente 250 ms. Quando a janela perde foco, o cliente tenta enviar movimento neutro.
- **Gráficos, músicas e habilidades:** usam os arquivos da v3.5 sem alterações; a OST do duelo permanece em `public/assets/audio/duel_theme.mp3`.
- **Cooperativo (até 5 jogadores):** mantido como estava na v3.5. O modo coop ainda usa simulação no anfitrião. **Somente o X1 passa a ser autoritativo no servidor** nesta atualização.

## Cloudflare, não servidor físico exclusivo

O X1 passa a ser executado por uma instância de **Cloudflare Durable Object** em vez de depender do computador do dono da sala. Isso é uma **simulação centralizada no servidor**, não o aluguel de uma máquina física dedicada. O DO da versão ainda compartilha uma única instância para todas as salas da aplicação. Existe custo potencial de tempo ativo para timers durante partidas.

## Publicação com GitHub Codespaces

1. Faça backup do repositório e envie o ZIP `Yggdrasil_Cloudflare_Servidor_X1_v36.zip` para a raiz do repositório **ou** envie os arquivos extraídos, mantendo `public/`, `src/` e `wrangler.jsonc` na raiz.
2. Dentro do terminal, execute:

```bash
# Execute a linha do unzip somente se o ZIP estiver presente no Codespaces:
unzip -o Yggdrasil_Cloudflare_Servidor_X1_v36.zip -d .
npm install
npm run test:server
npx wrangler deploy
```

3. Abra o domínio `.workers.dev` confirmado pelo `wrangler deploy`. Recarregue o jogo nos dois aparelhos para evitar arquivos em cache.
4. Entre no **X1 Online**, crie a sala, escolha dois personagens e três cartas por lutador. Um espectador pode participar.

## Testes que rodaram localmente

```bash
node --check public/duel.js
node --check src/worker.mjs
node --check src/duel-engine.mjs
npm run test:server
```

- Simulação central: dois lutadores andaram e atacaram; o servidor calculou os danos.
- Anfitrião, convidado e espectador receberam os mesmos números de vida nos snapshots.
- O servidor ignorou um snapshot falso enviado pelo cliente.
- O mecanismo de quatro sombras do Loid continuou no conjunto de habilidades.
- Verificado HTML: cinco botões clicáveis em cada tela de seleção, e arte oficial presente.

**Não foram medidos FPS ou latência real no Cloudflare com dois celulares.** O teste automatizado do navegador local foi bloqueado pelo ambiente. Esta é uma atualização para testes de internet, não garantia de “lag zero”.
