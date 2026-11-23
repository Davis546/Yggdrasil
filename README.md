# YGGDRASIL v3.3 — 5 jogadores online + novos sprites

**Base:** v3.2. Não altera os poderes, as cartas, os chefes, a trilha, o X1 ou o motor de combate.

## Melhorias
- Cooperativo Cloudflare: salas para **2 até 5 jogadores**. Todos podem participar simultaneamente, cada um com um protagonista diferente: Loid, Kris, Xans, Eve Lorey ou Kali.
- O servidor rejeita um sexto participante e não permite dois jogadores selecionarem o mesmo personagem.
- A verificação de movimento e os pacotes de posição agora admitem 5 personagens, não apenas 3.
- Tela da sala, contador durante o combate e espera pelas cartas suportam o novo tamanho de equipe.
- Posições de surgimento são distribuídas ao redor do anfitrião, evitando sobreposição dos quatro aliados.
- Novos sprites de **Eve Lorey e Kali** convertidos diretamente das folhas 4×4 fornecidas para o atlas 3×4 usado pelo jogo. Cada quadro é individual, alinhado e transparente.
- Versão da tela principal e do duelo atualizada para **v3.3**, com atualização do parâmetro de cache.
- O X1 continua sendo um modo de dois lutadores, com espectadores; não foi transformado em luta de cinco.

## Publicar no Cloudflare com GitHub Codespaces

Envie `Yggdrasil_Cloudflare_5_Jogadores_v33.zip` para a raiz do repositório. No terminal:

```bash
git pull && unzip -o Yggdrasil_Cloudflare_5_Jogadores_v33.zip -d . && npm install && npx wrangler deploy
```

Para também salvar no GitHub, após extração:

```bash
git add public src package.json wrangler.jsonc README.md && (git diff --cached --quiet || git commit -m "Yggdrasil v3.3 - Coop 5 e sprites") && git push
```

## Testes prioritários
1. Abrir uma sala com 5 abas/navegadores; o sexto deve ser rejeitado.
2. Selecionar 5 personagens diferentes, iniciar e verificar o movimento e golpes de cada um.
3. Terminar uma onda e confirmar que o jogo espera **todos os cinco** escolherem cartas.
4. Verificar animações de Eve e Kali em quatro direções e desempenho dos convidados.

**Limite do teste local:** o servidor e o código podem ser testados com clientes simulados, mas a latência com cinco dispositivos reais no Cloudflare depende do navegador, rede e capacidade do anfitrião.
