# Yggdrasil RPG V6.2.4 — Defesa no Vazio
Atualização cumulativa sobre a V6.2.3. Execute `npm run test:624` e `npm run deploy` após extrair no repositório existente.

## Defesa
- Mapa original WebP de 1448 × 1086, sem piso; árvore e duas casas pintadas na própria arena. Movimento livre no vazio. As duas casas têm menu por proximidade (não há mapa interno separado).
- Dez famílias com artes PNG transparentes individuais: rastejador, corredor, colosso, arqueiro, mago, invocador, corruptor, explosivo, assassino e espectral. Sprites em pose única com oscilação e espelhamento (sem folha de caminhada quadro a quadro nesta versão).
- Quatro chefes originais (Núcleo, Arauto, Vontade Corrompida e Devorador); projéteis radiais, invocação, drenagem de escudo e dano de cerco. Rotação a cada cinco ondas.
- Raízes Vida (cura), Morte (dano próximo), Vontade (redução de recarga e dano à árvore), Destino (crítico, seiva e reparação) rodam a cada cinco ondas.
- Recompensas de seiva compartilhadas; barricada, barreira de escudo, totem, raiz ofensiva e reparo. Construções colocadas automaticamente no ponto livre mais próximo do comprador em torno da árvore. Até 12 construções; ondas limitadas a 60 minions iniciais para conter carga; invocações com limite adicional. Mercador fixo, desconto periódico nas ondas 4, 9, 14 etc.
- Estado da árvore e construções sincronizado pelo host, incluindo no checkpoint. A compra cooperativa utiliza comando remoto e validação de saldo/posição/fase no host.

## Duelo / Josué
- Todos os heróis entram no Duelo com 11.500 PV, inclusive bots e transformações do Mímico. Dano PvP normalizado a 5,6× dano base (antes 0,7× com PV muito menores), mantendo limite de 24% por golpe. Ajuste inicial para evitar duelos instantâneos; precisa de teste real de duração.
- Na Jornada/Defesa/Rush, Fora do Tempo: 80% de esquiva, Q 18s e E 23s, carga do supremo 40% menor. No Duelo, conserva esquiva de 35% do balanceamento V6.2.3 e aplica recargas novas. 
- Otimizações anteriores preservadas. Nenhuma medição de ping em Cloudflare real nesta atualização.

Testes Node/VM: regressão de rede, heróis, PvP, raízes, compras locais/remotas, inimigos, boss e assets. Sem validação em dois dispositivos reais. 
