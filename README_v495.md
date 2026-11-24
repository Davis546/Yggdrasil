# v4.9.5 — FPS livre

Patch cumulativo sobre v4.9. Inclui v4.9.4 e anteriores. Remove a espera de 22/32 ms entre desenhos em todos os modos do cooperativo e solo. Renderização usa cada callback requestAnimationFrame; frequência real depende da tela, navegador e aparelho. X1 já renderizava a cada callback. Não altera frequência de rede, habilidades, sprites, músicas ou orçamento adaptativo dos efeitos. Teste simulado de callbacks, não benchmark em celulares. Mantém o limite de delta de simulação já existente para evitar mudanças de gameplay.
