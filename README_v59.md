# Yggdrasil V5.9 — Boss Rush

Atualização sobre V5.8.1. O ZIP inclui a correção visual V5.8.1 e os arquivos novos. Não substitui o jogo inteiro.

- Iniciar jornada: Sobrevivência Japão, Sobrevivência Nórdico ou Boss Rush. Teste de chefes e dificuldade ficam no seletor de jornada. Online: escolha antes de criar a sala ou altere no lobby (anfitrião).
- Boss Rush: oito tipos originais, um chefe inicial por rodada. Cavaleiro mantém a invocação do dragão na fase de pacto; nas duplas Cavaleiro e Dragão são escalados juntos e a invocação extra é suprimida. Após a oitava rodada, duplas em ciclo com HP crescente. Arena base japonesa e trilha por chefe ativo. Sem conclusão automática na onda 20/40 e sem desbloqueios de campanhas.
- Cartas preferencialmente raras/lendárias; cada escolha concede adicional cumulativo de 12% do multiplicador de dano base e 10% da vida base. Os bônus pertencem à partida Boss Rush e sobrevivem à transformação do Mímico.
- Xans (Cross) no combate principal: velocidade 145, ataque .25 s, alcance 34; dash é teleporte instantâneo de 54 unidades e recarga base 1.05 s. Q salta automaticamente entre até seis inimigos visíveis e retorna à posição original. O primeiro golpe mantém 2.9x, demais 1.15x, sem duplicar alvos. A cadeia usa a autoridade do anfitrião e movimento replicado no servidor.
- História e Duelo mantêm seus próprios motores; não foram alterados nesta atualização. A versão da História foi atualizada apenas no rótulo.

Instalação: extrair na raiz do repositório; npm run test:590; commit, push e npm run deploy. Atualizar o Worker é indispensável para a nova opção online.

Validação local: testes VM do cliente, 32 rodadas, atributos/cartas, cadeia Q, dash, transformação Mímico; sala simulada de 5 pessoas com relay de blink; testes de escala cooperativa e progressão da História. Sem teste visual em navegador/celular ou sala real publicada.
