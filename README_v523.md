# V5.2.3 — Josué e Nórdico Pecador

Atualização cumulativa sobre V5.1 (inclui arquivos V5.2, V5.2.1 e V5.2.2). Sprite de Josué normalizado em 12 quadros 112x112, corpo de 84 px por quadro, pés alinhados, alfa binário. Frente/lados da nova arte; costas preservadas do sprite anterior e normalizadas. Ataque com duas correntes animadas por extensão, arco e retorno, separado do sprite. Mantidos alcance e poderes. Cache atualizado.

Apenas no Nórdico Pecador: HP de mobs = base * (1.55 + (onda local-1)*.045) * 1.20 * (elite?1.30:1) * (invocado?0.55:1) * (1+.40*(jogadores-1)), arredondado. Ecos de Pecado com 8% da vida base do chefe imitado, mais escala cooperativa de 40% por jogador adicional. Limite de dez não-chefes no summon e redução de frequência/quantidade das invocações de Pecado; eco pode acrescentar um inimigo. Chefes principais, dano e velocidade dos mobs, Japão e Normal inalterados. Não altera FPS.

Testes: npm run test:523; npm run test:josue52; npm run test:server. Testes automatizados não substituem validação em Android ou sessão online real.
