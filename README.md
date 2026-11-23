# Yggdrasil v2.8 — nitidez, X1 e Kali

Base: v2.7 (Cloudflare Workers, Durable Objects, cooperativo e X1).

- **Alta Qualidade HD**: canvas com resolução interna ~2x em mobile e 2,35x em PC, preservando os pixels nítidos do sprite. Modo desempenho continua funcionando; o modo Auto ainda diminui qualidade em celulares fracos.
- **Pixels limpos**: nearest-neighbor para os sprites, enquanto a arte de cenário mantém interpolação suave apropriada.
- **X1**: mundo 1920 × 1400, câmera individual acompanha cada lutador/espectador, bonecos 58 × 58 em vez de 84 × 84. Mundo e limites sincronizados no anfitrião; espectadores recebem as mesmas posições, mas com câmera própria.
- **Kali**: ataque básico do cooperativo e do X1 lança espelhos mágicos à distância em lugar de ataque de espada. Dano é aplicado ao atingir o alvo.
- **Eve Lory**: corrigida grafia exibida, mantendo a chave interna eve.
- Efeitos e cartas anteriores preservados.

## Publicar no Codespaces

Coloque o ZIP na raiz do repositório e execute:

```bash
git pull && unzip -o Yggdrasil_Cloudflare_Nitidez_X1_Kali_v28.zip -d . && npm install && npx wrangler deploy
```

Limitações: sintaxe e empacotamento foram conferidos, mas ainda é necessário testar gameplay em celulares reais e Cloudflare com 2+ dispositivos.
