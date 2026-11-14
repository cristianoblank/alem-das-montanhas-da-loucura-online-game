# Game Brief: Além das Montanhas da Loucura — Mesa Digital

## In your words
um jogo no navegador inicialmente para 1 player inspirado em slay the spire, com as regras do jogo de tabuleiro e cartas que criei nas montanhas da loucura que vc tem acesso

Respostas: quero tudo copia fiel e identica do manual e das cartas e tudo que tem na versao de tabuleiro, porque o jogo será justamente para testar a versao de tabuleiro se funciona. como será apenas 1 jogador a primeira versão, seguindo o manual terá o controle de dois investigadores. siga o jogo que existe slay de spire para adaptar o conceito do jogo de cartas a um jogo de computador

**Pitch:** O jogo de tabuleiro *Além das Montanhas da Loucura* inteiro, regra por regra e carta por carta, jogado no navegador por uma pessoa que comanda dois investigadores, com a tela organizada como um roguelike deckbuilder de computador.

**Genre:** roguelike deckbuilder cooperativo (versão digital fiel de um jogo de tabuleiro)

**Controls:** mouse: clicar numa carta e depois no alvo (ou arrastar até ele), botão "Encerrar turno", clicar nos nós do mapa; teclas 1–9 para cartas, E para encerrar turno, Tab para trocar de investigador *(guessed)*

**Question:** As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?

**Hooks:** o material original (textos de `dados.js`, as 344 ilustrações, mapas gerados pela mesma semente do `acessorios.html`) · o Dado do Presságio compartilhado · duas fileiras e o Olhar do Abismo controlados pela mesma pessoa

**Intent:** needs 2 investigators (you said)

## Look and references
- Look: mesa escura de madeira e feltro; cartas desenhadas como as impressas (moldura por tipo, gema de raridade, custo, selo dourado ◆ de Aprimorada, arte de `img_ia`), fontes Cinzel e EB Garamond do `estilo.css`; mapa do Ato em pergaminho com os ícones de nó do `acessorios.html`; tabuleiro de cada investigador com trilha de PV, energia, condições e Poderes; inimigos como as cartas de criatura impressas, com a intenção por cima. Detalhe característico: o Dado do Presságio rolando no centro da mesa no início de cada rodada. Toda figura desenhada, sem emoji, sem círculos simples.
- References: o jogo de tabuleiro (fonte de todas as regras, textos e artes); Slay the Spire (só as convenções de tela: mão em leque embaixo, inimigos à direita com intenção visível, pilhas de compra e descarte com contagem, recompensa depois do combate, mapa subindo).
- View: 2D · Camera: fixa, a mesa vista de cima para a fileira.

## First minute
Tela de título → escolher 2 dos 4 investigadores (sugestão do manual destacada: O Explorador + A Bióloga) e o mapa A ou B → o texto de abertura do Ato I → mapa em pergaminho, clicar num nó de Criatura da linha 1 → dois Encontros Fáceis, um por fileira; o dado rola e as intenções aparecem → jogar cartas do primeiro investigador, trocar para o segundo e encerrar → os inimigos agem em ordem, a partir da fileira do Olhar → vitória, Cantil de Aquavit, 2 créditos e 3 cartas de Recompensa para escolher ou recusar.

## Challenge
Exatamente o do tabuleiro: Encontros Difíceis a partir do 4º combate do Ato, Horrores a partir da linha 5 (um Desperto), Ancião no topo. Derrota se qualquer investigador chegar a 0 PV. Nível de Loucura 0–10 e as variantes opcionais do Cap. 14 escolhidos no início *(inferred (strong))*.

## Core loop
- Escolher o próximo nó conectado no mapa
- Resolver o nó: combate em rodadas de 5 fases, Mistério, Acampamento, Depósito ou Achado
- Recompensas por investigador: créditos, carta (ou recusar), Provisão no dado, Artefato
- Subir até o Ancião; vencer, curar e passar para o próximo Ato; perder encerra a expedição

## Goal & fail state
- Vitória: derrotar o Ancião do Ato III; Vitória Verdadeira: os Três Esteatitos e O Que Danforth Viu no Ato IV.
- Derrota: qualquer investigador com 0 PV (ou a regra da Morte Heroica, se ligada).

## Features
- [x] Combate completo: Presságio, turnos, intenções, Bloqueio, condições, cálculo de dano por golpe, Status e Fichas
- [x] Os 4 investigadores com todas as cartas (iniciais, comuns, incomuns, raras, versões aprimoradas) e as mecânicas de Glifos, Posturas, Necrose e Bisturis
- [x] Os 44 inimigos com habilidades, comportamentos Dado, Sequência e Fixo, os 37 Encontros, Horrores, Desperto e Anciões
- [x] Mapas dos Atos I–III (A/B) gerados pela mesma semente do tabuleiro, e o Ato IV linear
- [x] Mistério (22 eventos), Acampamento, Depósito, Achado Arqueológico, Esteatitos
- [x] Artefatos (todos os baralhos), 18 Provisões, Incolores, Traumas
- [x] Níveis de Loucura e variantes opcionais; salvamento automático entre nós
- [x] Registro de partida (log de ações) para conferir as regras

## Keep
-

## Avoid
- Regras novas, simplificadas ou "mais divertidas no PC" (do briefing)
- O nome, a arte, os personagens e o visual de Slay the Spire

## Out of scope
- 3 ou 4 investigadores ao mesmo tempo: change it after play
- Multiplayer pela internet: needs a server: not built yet (o motor fica separado da tela e determinístico com semente, para isso depois)

## Build order
1. A campanha completa (Atos I–IV) com 2 investigadores, cada carta, inimigo, evento, artefato e provisão com efeito próprio; a derrota em qualquer 0 PV.
2. Ajustes depois de você jogar.

---
**Kill condition:** se uma partida no navegador não reproduzir uma partida de mesa (as mesmas decisões dando os mesmos números do manual).

**Who it's for / what they feel:** o autor do jogo, testando o próprio projeto: "minhas regras funcionam".

**Games you love / don't:** Slay the Spire (o modelo de tela)
