# Yggdrasil v4.9.7 — Encontro dos Reinos

Atualização cumulativa: inclui a v4.9.6 (Futhark durante as 19 escolhas do Nórdico), além das correções de rede, suportes e FPS livre anteriores. Instale sobre a v4.9 ou posterior.

- Após a seleção de personagem, cada jogador entra automaticamente num pátio seguro, usando a arte existente do Templo do Japão ou do refúgio nevado de Midgard conforme o reino da sala. Os retratos voltam ao clicar em Trocar personagem.
- Movimentação por WASD/setas ou joystick no celular; personagens e nomes dos aliados visíveis, atualização local imediata, interpolação remota. O mapa é uma área de espera sem inimigos nem poderes, separada da simulação de combate. Nenhum atributo, posição, carta ou recarga do lobby passa para a jornada.
- Até cinco jogadores; o código permanece disponível, e o anfitrião escolhe o momento de iniciar. Permanecem os requisitos anteriores: mínimo de dois jogadores, personagens distintos e três passivas por jogador no Nórdico. A dificuldade e o reino continuam configuráveis pelo anfitrião.
- Mensagens de posição pequenas, limitadas no servidor (55 ms mínimo) e no cliente (75 ms durante movimento, 1 s quando parado). O servidor usa o identificador real da conexão, limita as coordenadas e ignora movimentos após início. Reconexão e migração de anfitrião preservadas. A posição de espera pode voltar ao ponto inicial após hibernação do objeto.
- Testes: `npm run test:lobby497`, `npm run test:futhark496`, `npm run test:server` e regressões. 26 arquivos de teste automatizado aprovados. O navegador local bloqueou navegação HTTP; não houve validação visual em navegador real nem teste de produção em celulares físicos.
