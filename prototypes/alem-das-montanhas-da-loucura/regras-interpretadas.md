<!-- PROTOTYPE - NOT FOR PRODUCTION -->
<!-- Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa? -->
<!-- Date: 2026-11-14 -->
# Regras interpretadas pela versão digital

Tudo o mais segue o manual e o texto das cartas (`material/dados.js`, copiado do jogo de tabuleiro).
Abaixo, os pontos em que o manual ou a carta deixam margem e a escolha que a versão digital fez.
Cada um é um bom candidato a esclarecer no manual impresso.

| # | Ponto | Escolha | Onde |
|---|---|---|---|
| 1 | Fase 2 lista (a) remover Bloqueio, (b) efeitos de início, (c) energia = 3, (d) comprar 5. Se (c) vier depois de (b), o Glifo Estelar e o Cronômetro de Navegação perderiam a energia. | Energia é ajustada para 3 **antes** dos efeitos de início do turno; os bônus somam por cima. | `js/motor.js` inicioTurno |
| 2 | «TODOS os inimigos» | A sua fileira e a fileira central (o manual diz isso). | `todosDe` |
| 3 | «da sua fileira» (Mapa de Dyer, Sinalizador de Magnésio, Nitroglicerina, Eletrodinâmica, Frio Interestelar, Golpe Concêntrico, Diário de Caça) | Igual a «TODOS os inimigos»: a sua fileira **e** a central. Senão, em Horrores e Anciões esses efeitos não fariam nada. | `todosDe` |
| 4 | Lupa de Campo: «+1 de dano contra Exposto» | Somado **depois** de dobrar pelo Exposto (a leitura pior para os investigadores). | `atacar` |
| 5 | Encontros usados | Voltam para o **fundo** do baralho de Encontros (o manual não diz). | `combateCriatura` |
| 6 | Artefato «coloque 1 Lampejo na sua mão» no início do combate | Conta como uma das 5 cartas da mão inicial (a mão é «completada até 5»). | `combate` |
| 7 | Iglu «Dobre o seu Bloqueio» | Tratado como carta que concede Bloqueio: Agilidade soma e Trêmulo reduz. | `cartas.js` |
| 8 | Cobertura (Bloqueio para um aliado) | Agilidade e Trêmulo de **quem joga** a carta. | `cartas.js` |
| 9 | Dissipador | Não se dispara com ele mesmo. | `GATILHOS_PODER` |
| 10 | Eventos: opções de grupo | Quem tem o Olhar escolhe primeiro; se escolher uma opção de grupo, ela vale para todos e ninguém escolhe outra. Os demais só podem escolher opções individuais. | `misterio` |
| 11 | «Role o dado: 1–2 combate, 3–6 Artefato» como decisão de grupo | Cada jogador rola; quem tira o bom ganha o prêmio; se alguém tirar o ruim, o grupo enfrenta **um** combate. | `rolarCombateOuPremio` |
| 12 | Gruta Azul «aumente seu PV máximo em 2» | Só o máximo sobe; o PV atual não. | `EVENTOS` |
| 13 | Mente Expandida com duas cópias | Cada cópia conta o seu marcador. | `GATILHOS_PODER` |
| 14 | Hipotermia Controlada | A Agilidade pode ficar negativa (o Bloqueio de carta nunca fica abaixo de 0). | `GATILHOS_PODER` |
| 15 | Ídolo da Cria Estelar «adicione 1 Trauma» | O Trauma do topo do baralho de Traumas (embaralhado no início). | `adicionarTrauma` |
| 16 | Morte Heroica com inimigos na fileira de quem caiu | Esses inimigos passam para a fileira central. | `quaseMorte` |

As fontes Cinzel e EB Garamond vêm do Google Fonts, como no material impresso (`material/estilo.css`); sem internet, o navegador usa Georgia.
