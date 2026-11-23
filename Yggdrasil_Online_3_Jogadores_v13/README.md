# YGGDRASIL — As Sete Raízes · v1.3

## O que mudou

- **Loid — Supremo R:** o Domínio da Escuridão dura **5 segundos**, em vez de 9. A velocidade/carga por acerto do Supremo não foi modificada. Durante o domínio, suas esquivas sombrias seguem extremamente rápidas.
- **Kris — Supremo Defesa:** invulnerabilidade de **3 segundos**, em vez de 6. Suas outras opções de Supremo continuam como antes.
- **Chefes reforçados:** mais pontos de vida, perseguição mais rápida e ataques mais frequentes. Para reduzir derrotas instantâneas por grandes combinações, um acerto de dano normal fica limitado a 4% da vida máxima do chefe; o salto lendário do Sapo continua retirando **25% de vida máxima** (efeito verdadeiro, uso único por partida).
- **Online cooperativo de teste:** de **2 a 3 jogadores**, com salas de seis caracteres e personagens Loid, Kris e Cross. Um cliente (o anfitrião) simula inimigos, chefes e ondas; até dois convidados enviam movimentos e golpes em tempo real. Os convidados recebem snapshots do estado da luta e interpolação dos movimentos para suavizar a visualização.
- As **cartas** aparecem depois de 3 segundos e cada jogador escolhe a sua. A próxima onda começa quando todos os participantes fizeram suas escolhas.
- Modo **Teste de Chefes** no cooperativo: Samurai (onda 5), Reuni (onda 10), Tsukuomi (onda 15), Pecado (onda 20).
- Preservados: os gráficos, sprites, sons e músicas das versões anteriores, Q/E/R/F, cartas, poderes especiais e controles em celular vertical/horizontal.

## Rodar no computador

Requisitos: **Node.js 18 ou mais recente**, nenhuma dependência externa do NPM.

1. Extraia o ZIP.
2. Abra um terminal na pasta onde está o arquivo `package.json`.
3. Execute `npm start`.
4. Acesse **http://localhost:3000** no navegador.
5. Na tela inicial, clique **ONLINE COOPERATIVO**, crie uma sala e compartilhe o código de seis caracteres.
6. Seus amigos entram no mesmo endereço e digitam o código. Cada pessoa escolhe Loid, Kris ou Cross. O anfitrião inicia quando todos estiverem prontos.

**Jogar com amigos de outras redes:** é necessário publicar este projeto **Node.js** em hospedagem com suporte a WebSocket (como Railway ou Render). Configuração: raiz do repositório/pasta, comando de início `npm start`, variável `PORT` fornecida pela plataforma. Use o endereço HTTPS criado pela hospedagem; o jogo escolhe WSS automaticamente.

**GitHub Pages e Netlify Drop não executam esse servidor WebSocket.** Eles só são adequados para o modo solo/estático, não para salas online desta versão.

## Controles

- **WASD**: andar
- **J / mouse / botão ATAQUE**: ataque básico
- **Espaço**: esquiva
- **Q**: poder principal
- **E**: poder secundário; segurar para carregar o Corte Dimensional do Kris
- **R**: Supremo, carregado por acertos
- **F**: carta de habilidade exclusiva (quando equipada)
- **1, 2, 3**: escolha das cartas; **1 a 4** nas opções do Supremo de Kris
- Celular: joystick e botões na tela, em retrato ou paisagem.

## Arquivos

- `server.js`: HTTP + servidor de salas via WebSocket (sem dependências externas).
- `public/index.html`: interface inicial, seleção e jogo.
- `public/game.js`: simulação da batalha, sprites e rede cooperativa.
- `public/audio.js`: áudio.
- `public/assets/`: sprites, mapas, ícones e OSTs.

## Limitações da versão online de testes

- O servidor de salas foi testado localmente com três clientes simulados. Ainda precisa ser publicado para que amigos em redes diferentes possam testar.
- O **anfitrião é a autoridade** sobre inimigos, dano e ondas. Não há servidor de simulação dedicado, proteção contra trapaça ou reconexão automática se o anfitrião sair.
- Salas são temporárias; reiniciar o servidor apaga os códigos e encerra as partidas.
- A qualidade da conexão de cada jogador afeta a latência. Para o teste, use redes estáveis e mantenha a aba do anfitrião ativa.
- Este é um protótipo cooperativo: balanço e sincronização avançada ainda poderão ser refinados após testes reais em três dispositivos.
