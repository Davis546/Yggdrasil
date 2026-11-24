# YGGDRASIL v4.5 — ODIN, FUTHARK E DRAGÃO DE FOGO

Base: v4.4. Japão e X1 mantidos. No Reino Nórdico, o Jarl é chefe da onda 5, Odin da 10, e o Cavaleiro Inominável da 15.

## Novidades da versão
- **Odin (onda 10)**: sprites 4x4, 16 quadros de caminhada, Gungnir, investida, corvos, escudo e tempestade rúnica; ataques com aviso antes do dano.
- **Onda 15**: ao chegar a 50% de HP, o Cavaleiro invoca um dragão que passa a ser uma **criatura inimiga autônoma**, com HP próprio. Ele permanece lançando fogo a cada 2–3 segundos com aviso de 1,05 s, e pode ser atingido. Ambos precisam ser derrotados para concluir a onda. Destruir três selos silencia brevemente o dragão.
- **Música**: `public/assets/audio/nameless_wave15.m4a`, arquivo fornecido pelo criador, toca no combate da onda nórdica 15 enquanto cavaleiro ou dragão estiver vivo.
- **Cartas**: exatamente 20 Futhark com figuras apenas das runas, sem ilustrações. No começo do Nórdico: 4 runas distintas aleatórias + 1 carta especial ligada ao personagem = 5 cartas totais (limite). O resto das ondas oferece apenas suprimentos.
- **Especiais**: Kris Forma do Sapo, Xans Gaster Blaster, Loid Descarga de Granita, Kali Espelho Protetor, Eve Lorey Retorno ao Auge.
- **Eve Q com carta**: por 6 s, +100% de dano e velocidade, dash recarrega 65% mais rápido. Depois da duração, os bônus somem.
- **Cura**: inimigos comuns do Nórdico têm 14% de chance base de derrubar um pequeno coração; Fehu aumenta em 4 pontos percentuais. Japão continua com 5%.
- **Otimização celular**: limites de efeitos e atualizações da interface mais espaçadas; não alteramos resolução/pixels das imagens nem a qualidade dos áudios. O ajuste dinâmico NÃO reduz mais a resolução do canvas com queda de FPS.

## Instalação incremental em Codespaces (v4.4 já extraída)
1. Suba `Yggdrasil_v45_Atualizacao_v44.zip` na raiz do repositório.
2. Execute:

```bash
git pull --ff-only && unzip -o Yggdrasil_v45_Atualizacao_v44.zip -d . && bash aplicar_v45.sh && npm install && npm run test:server && npm run test:nordic && npm run test:campaign && npm run test:bosses && npm run test:music && npm run test:cards && npm run test:nameless && npm run test:sprites && npm run test:balance && npm run test:animations && npm run test:odin && npx wrangler deploy && git add -A public src tests package.json wrangler.jsonc README.md .gitignore && (git diff --cached --quiet || git commit -m "Yggdrasil v4.5 - Odin Futhark e Dragao") && git push
```

## Direitos de música
O arquivo M4A foi fornecido pelo usuário e poderá conter direitos de terceiros. Para disponibilizar o site publicamente, confirme que existe autorização/licença para distribuir essa gravação.

## Testes
Testes locais incluem 20 runas, sorteios repetidos, 5 cartas (4 runas+1 especial), Eve Q temporário, Odin fase 2, dragão independente, combate e renderização animada. A publicação real e a jogabilidade visual no Android devem ser verificadas no site após deploy.

---

# YGGDRASIL v4.4 — Sprites e animações dos chefes funcionando

Base v4.3 integral, com as cinco cartas japonesas e limites de atributos do Reino Nórdico mantidos.

- Cavaleiro e dragão: 16 quadros **reais** cada, derivados diretamente das imagens fornecidas pelo criador, em células 320x320, sem ampliar/reduzir os pixels originais; jogo usa os estados de caminhada, ataque, magia e invocação.
- As quatro lutas japonesas (Daimyō Oni, Reuni, Tsukuyomi e Pecado) ganharam estados visuais de preparo, investida e golpe no **spritesheet que já existia**. As folhas japonesas só têm 3 poses por direção, portanto estas animações combinam suas poses originais com movimento e efeitos; não são artes de ataque totalmente novas.
- Jarl do Gelo alterna entre poses de machado (quadros 8–11) e magias (12–15).
- No online, o host envia também `walking` e `attackPose`, evitando chefes estáticos nos convidados.
- Fallback para arte estática do Cavaleiro/Dragão quando a animação não carrega; nenhum chefe fica com hitbox invisível se uma imagem falhar.
- `index.html` e `game.html` agora usam `game.js?v=44` para eliminar código antigo de cache.
- Testes adicionais: `npm run test:animations`, `npm run test:sprites`, `npm run test:bosses`.
- Arquivos visuais e trilhas anteriores preservados integralmente; apenas os atlas do Cavaleiro e do Dragão foram reconstruídos com pixels originais sem interpolação.

Para publicar via Cloudflare Workers: descompactar a atualização sobre a v4.3, rodar testes, executar `npx wrangler deploy` e dar commit em `public`, `src`, `tests`, `package.json` e `README.md`.

---

# YGGDRASIL v4.3 — Cartas japonesas e animação do Cavaleiro

- **Reino Nórdico:** 5 cartas japonesas comuns/raras, sorteadas sem repetição para cada herói no solo e no online; cartas nórdicas não são sorteadas nesta campanha. O Japão mantém o baralho e a progressão originais.
- **Limite permanente de 5 cartas:** a cada onda nórdica o jogador escolhe 1 de 3 **suprimentos temporários** (cura/esquiva/recarga), que não acrescentam cartas. A recompensa de derrotar o Cavaleiro continua habilitando seu poder especial sem ocupar uma sexta vaga.
- **Teto nórdico de atributos:** vida 145% da base (por exemplo, Loid até 159 HP); dano 130%; velocidade 120%; frequência de ataque limitada a 85% da recarga base; defesa 25%; crítico 32%; também há limites para habilidades e outros bônus. Esses limites não se aplicam à campanha japonesa.
- **Boss 15 nórdico:** quadros de golpe, investida, invocação e habilidades do dragão agora seguem o tempo real de cada movimento. O `game.js` e os sprites recebem parâmetro de cache `v=43` em ambas as páginas para evitar reutilizar JavaScript antigo. O cavaleiro mantém tamanho normal e o dragão tamanho grande. Nenhuma arte/áudio foi reduzido ou recomprimido.
- **Testes:** `npm run test:balance && npm run test:cards && npm run test:sprites && npm run test:nameless` além dos testes anteriores. Os testes locais não substituem a conferência visual no celular após o deploy.

## Instalação: sobre a v4.2 já extraída no Codespaces

Extraia o ZIP compacto da v4.3 na raiz do projeto, execute `npm install`, testes, `npx wrangler deploy`, e envie o commit. O ZIP compacto **não** contém o jogo completo; todos os demais arquivos devem permanecer da v4.2.

---

# Yggdrasil v4.2 — Sprites animados do Cavaleiro e Dragão

Base: v4.1 completa (cartas da v4.0, Japão e Reino Nórdico, coop, X1 e músicas mantidos). A jornada nórdica inicia com **5 cartas aleatórias únicas por jogador**, em vez de 20.

- Cavaleiro Inominável da onda nórdica 15 agora usa folha de 16 quadros com idle, caminhada, preparo de golpe, corte e invocação; tamanho normal de personagem (88 unidades visuais), alinhado pelo chão.
- Dragão ancestral gigante usa outra folha de 16 quadros, anima cabeça, asas, sopro e garras conforme o golpe. Fica completamente visível na tela, atrás dos personagens, no celular e computador.
- Quadros 4×4 de 320 px em PNG RGBA sem perdas, baseados nos sprites enviados, com corte exato e sem amostragem de quadros vizinhos.
- Estado de ataque e efeitos do dragão sincronizados pelo anfitrião online; manutenção dos ataques e valores originais da v4.1.
- Teste novo: `npm run test:sprites`. Para publicar: `npx wrangler deploy` após extrair as partes do pacote.

---

# YGGDRASIL v4.1 — O Cavaleiro Inominável (Nórdico onda 15)

**Jogo pronto para Cloudflare Workers.** A campanha japonesa permanece com 20 ondas e Tsukuyomi na onda 15. A campanha nórdica possui agora 15 ondas (etapas internas 21 a 35). O Jarl está nas ondas nórdicas 5 e 10; o Cavaleiro Inominável é o chefe final nórdico da onda 15. A fase do dragão ativa ao chegar a 50% HP, com ataques telegráficos, três selos destrutíveis e carta lendária de recompensa. A OST do cavaleiro é uma composição chiptune original incluída em `nameless_ost.mp3`.

**Testes:** `npm run test:server && npm run test:nordic && npm run test:campaign && npm run test:bosses && npm run test:music && npm run test:cards && npm run test:nameless`

**Publicar:** `npx wrangler deploy`

---

# YGGDRASIL v4.0 — Cartas Nórdicas Exclusivas

## Novo baralho do Reino Nórdico

- **30 cartas nórdicas novas**, com nomes, efeitos, ilustrações em SVG e identidade rúnica própria.
- Ao **começar diretamente o Reino Nórdico** (solo ou cooperativo), cada personagem recebe **5 cartas sorteadas sem repetição**, sem tela de escolha.
- Todos os presentes no cooperativo ganham 5 cartas independentes, administradas pelo anfitrião. Os IDs são sincronizados na rede quando a fase muda.
- Recompensas após cada onda nórdica oferecem somente **cartas nórdicas**; as japonesas não aparecem. O baralho do Japão não foi modificado.
- As cartas nórdicas aumentam dano, vida, velocidade, recargas, crítico, defesa e efeitos especiais, com **tetos rígidos** para evitar atributos absurdos: dano 2,85x base; vida 3,5x base; velocidade 1,75x base; proteção 58%; crítico 60%; esquiva 44%; outros atributos e tempos também limitados.
- O jogador não precisa escolher entre as 5 cartas iniciais, mas ainda escolhe 1 de 3 cartas após vencer cada onda.

## Equilíbrio da Eve Lorey

- A ultimate ganha 3% por acerto normal e 4,5% por acerto em chefe (antes 0,7% e 1,2%).
- Q recarrega em 17,5s (antes 21s), E recarrega em 15s (antes 18s).
- O Campo Temporal (E) causa dano leve em pulsos de até 6 por alvo a cada 0,9s; continua reduzindo velocidade dos inimigos.

## Mantido da v3.9

- Japão e Nórdico independentes; mapas, trilhas nórdicas, Jarl do Gelo, Tsukuyomi, animações dos chefes, online cooperativo e X1.
- Warhammer 8-bit continua como trilha nórdica e DragonForce 8-bit como música de chefe nórdico. A OST da onda 15 ainda não havia sido adicionada na v4.0; a v4.1 inclui uma composição original.
- A arte e implementação do Odin ainda **não** fazem parte deste pacote; esta versão foca nas cartas e no equilíbrio de Eve.

## Instalação v4.1 (dois ZIPs menores que 25 MB)

Envie os dois ZIPs da v4.1 para a raiz do projeto e execute no GitHub Codespaces:

```bash
git pull &&
unzip -o Yggdrasil_v41_Parte1_Jogo.zip -d . &&
unzip -o Yggdrasil_v41_Parte2_Musicas.zip -d . &&
npm install &&
npm run test:server &&
npm run test:nordic &&
npm run test:campaign &&
npm run test:bosses &&
npm run test:music &&
npm run test:cards &&
npm run test:nameless &&
npx wrangler deploy &&
git add -A public src tests package.json wrangler.jsonc README.md .gitignore &&
(git diff --cached --quiet || git commit -m "Yggdrasil v4.1 - Cavaleiro Inominavel Nordico") &&
git push
```

Os testes são locais, não substituem o teste visual em dispositivo nem confirmam que o site já foi publicado. Os covers de terceiros continuam sujeitos às respectivas permissões de uso.
