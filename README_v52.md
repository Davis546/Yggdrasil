# Yggdrasil V5.2 — Fúria Além do Tempo

Patch sobre V5.1 (inclui os arquivos do hotfix V5.1.1). Josué: 155 HP, dano 58, intervalo 0,48s, alcance 92, dash 2,2s. Q: 7s, +45% dano, +20% velocidade de ataque, golpe em área, CD14s. E: campo temporal por 6s, CD18s. R: 90% esquiva durante 8s. F: carta exclusiva, 10s, +35% dano, +25% velocidade de ataque, Q/E recuperam 40% mais rápido, um uso por partida. R e F independentes. Japão e Nórdico, incluindo carta rúnica Futhark e seleção cooperativa. Seleção com nove personagens e quinta página. Sprite separado em quatro direções e quatro quadros de ataque. Campanha mantém ataque básico e esquiva, com Josué e alcance médio. X1 permanece com o elenco anterior.

31 arquivos de testes aprovados em Node, incluindo simulação de dois clientes com o Worker, seleção, esquiva, alcance, Q/E/R/F e regressões. Não houve validação visual em navegador/Android nem deploy real. Arte da seleção animada com pulso de luminosidade; sem redesenhar o personagem.

Instalação: extraia o ZIP na raiz da V5.1 ou V5.1.1, execute npm install, npm run test:server, npm run test:josue52, npm run test:selection50, npm run test:story51 e npx wrangler deploy.
