# Yggdrasil V6.3.2 — As Leis da Existência
Patch cumulativo sobre V6.3.1. Código V01D continua disponível para teste solo da onda 20 sem progresso/ranking. Não altera o Duelo ou os poderes originais dos heróis.

- Egito: a cada ciclo, vida máxima -22% até destruir três cristais de vida; recuperação garantida na transição.
- Nórdico: janela de roubo de poder (Q/E/R), até 8 acúmulos de +7% no dano dos ataques originais do Explorador, temporários. Aos 50% ele protege-se por até 14s: três núcleos, cura de 2,5% da vida máxima por núcleo restante; depois a luta continua.
- Japão: histórico local de 4s (4 amostras/s); os ecos repetem posições, direção e instantes de ataques básicos, com dano em proximidade. Não reproduzem todo o sistema de poderes do herói.
- Grécia: uma habilidade aleatória Q/E/R por herói bloqueada por 11s no máximo; destruir a manifestação remove o bloqueio.
- Ciclo adicional: singularidade com atração de jogadores/projéteis, zona segura, quatro cópias destrutíveis com ataque anunciado e chefe identificado por aura pulsante, espiral de projéteis, altares de sacrifício ou poder (8s), tempo fragmentado (1,5s). Em equipe, primeiro jogador que toca um altar define a escolha; omissão fortalece o chefe.
- As raízes ainda ajudam periodicamente; uma ressurreição automática compartilhada por partida, 38% PV e 3s de proteção.
- Últimos 5%: desafio de 30s no vazio monocromático, sem música, boss protegido. Alterna zona segura, gravidade, projéteis, colunas, gelo e linhas. Depois a música volta e o golpe final é liberado. Cronômetro não avança com menu de supremo solo aberto.
- OST exclusiva: arquivo M4A fornecido pelo usuário, TPR – The Decisive Battle (3min18s), reprodução local. Outros bosses preservam Void War Boss Music.
- Host processa regras, convidados recebem estado compacto. Até 110 projéteis no emissor adicional e 18 avisos do sistema anterior. Não há envio de áudio pela rede. O histórico de replay é local ao host e reinicia após recuperação do anfitrião. As novas manifestações usam desenho Canvas e sprites existentes, não novas folhas de arte.
- Testes: npm run test:632. Simulação VM e servidor, não Cloudflare publicado; balanceamento, FPS, ping e áudio em celulares reais pendentes.
