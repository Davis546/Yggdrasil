# V6.2.1 — Bots no Duelo
Patch cumulativo V6.2.0 + bots; extrair sobre o repositório existente.
- Criar sala casual 1v1 ou 2v2, marcar completar vagas com bots, escolher herói e três cartas e iniciar. O anfitrião pode ajustar a opção na sala antes de iniciar.
- 1v1: um humano e um bot. 2v2: um humano e três bots, dois humanos e dois bots ou três humanos e um bot. Com dois humanos, marcar a opção de jogar juntos contra bots para colocá-los na equipe 1; caso contrário, um humano por equipe. Com quatro humanos não há bots.
- IA por regras no servidor: aproximação, distância de ataque, movimentação lateral, esquiva de aproximação, ataque, Q/E/R, carregamento de E de Kris e apoio quando aliados feridos. Usa personagens distintos e três cartas legais sorteadas. Sem conexões de rede artificiais ou atributos extras para bots. Identificação BOT na interface. Espectadores e revanche mantêm funcionamento.
- Competitivo exige todos os lutadores humanos; bots não geram pontos. Não adiciona autenticação.
- Apenas os seis heróis suportados pelo motor de Duelo V6.2.0. Não muda as habilidades existentes, nem resolve a paridade pendente com Jornada. Mesmo solo requer conexão ao servidor. IA por regras, não aprendizado de máquina. Não há reposição de desconectados durante combate.
- Testes: npm run test:621 (regressão V6.2.0, seis bots contra alvo imóvel, preenchimento e equipes, espectador, revanche, exclusão do ranking). Sem teste em Cloudflare real ou navegador físico.
