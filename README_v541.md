# Yggdrasil v5.4.1 — Casas e exploração
Atualização cumulativa sobre as versões 5.x (repositório completo necessário; não inclui músicas nem todos os arquivos-base).
- 10 interiores compactos de 180 × 120 unidades (antes 400 × 260), quatro artes originais com variações de cor. Portas e colisões registradas nas coordenadas das artes.
- 59 objetos examináveis, diálogos de texto por páginas (E/Z ou toque), sem travar permanentemente os controles. Não concede itens nem saque automático.
- Minimapa local com posição, NPCs e saídas; M ou botão MAPA amplia e exibe nomes. Não é um mapa global com GPS.
- Seis aldeões e dois NPCs divinos tiveram o recorte reparado a partir da arte original. Fundo transparente, corpo opaco; retratos dos aldeões atualizados.
- Mantém corrida, seleção de Josué, combate e mapas exteriores da versão 5.4.

Instalação: extraia na raiz do repositório, npm install, npm run test:server, npm run test:541, npm run test:josue52, npx wrangler deploy.
Validação: 21 locais, 44 passagens, 59 objetos acessíveis; testes v54, v541, servidor e Josué aprovados sobre base completa. Chromium com conteúdo local incorporado (sem servidor) verificou seleção, renderização de interior, diálogo e ampliação do minimapa. Servidor local bloqueado pelo ambiente; não houve teste em aparelho móvel real.
