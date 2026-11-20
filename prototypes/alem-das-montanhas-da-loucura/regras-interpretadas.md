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
| 17 | Dano que não vem de carta de Ataque (Queimar os Suprimentos, Mil Incisões, Nitroglicerina, glifos) contra um inimigo Exposto | Não é dobrado e não gasta o Exposto: o Cap. 6 diz que só cartas do tipo Ataque são afetadas por Fúria, Debilitado, Exposto e posturas. (Até 20/11/2026 a versão digital dobrava esse dano por engano.) | `atacar` |
| 18 | Glifo Estelar no fim do turno | Não age no fim do turno: o passivo dele é só o +1 de energia do início do turno (Cap. 13). Ciclo Eterno ainda aciona esse passivo. | `fimTurno`, `efeitoGlifo` |
| 19 | Glifos e posturas sem carta | Não existe ação livre: um glifo só é Inscrito ou Ativado por carta, e a postura só muda por carta ou pela Revelação (Cap. 13). O painel de cada investigador mostra o estado e a previsão, mas não tem botão que mude o jogo. | `js/mecanicas.js` |
| 20 | Voltar atrás numa escolha | Na mesa, quem abre uma opção e desiste simplesmente não a faz. Na versão digital, o botão «Voltar» desfaz a escolha e retorna ao passo anterior **enquanto nada foi revelado**: nenhum dado rolado, baralho embaralhado, carta comprada ou carta, Artefato, Provisão ou Evento revelado. Depois disso não há volta. Vale no Acampamento (inclusive voltar ao mapa na primeira escolha), no Achado, nas opções de Evento, em «Remover 1 carta» e na troca de Provisão do Depósito, e nas cartas de combate que abrem uma escolha antes de comprar. | `js/voltar.js` |
| 21 | Comprar Provisão no Depósito sem espaço livre | Permitido: vale a regra geral do Cap. 10 (descarte uma das suas ou a nova). Antes a compra era recusada. «Voltar» na troca desfaz a compra. | `acaoLoja`, `ganharProvisao` |
| 22 | Provisão recebida do baralho | A carta é mostrada (arte e texto) ao ser recebida; sem espaço, a tela mostra a nova e as que o investigador já tem para escolher qual descartar. A descartada vai para o fundo do baralho de Provisões. | `ganharProvisao` |
| 23 | Prévia do dano e previsão da rodada | Não são regra nova: são a conta que a pessoa faria de cabeça na mesa. O motor joga a carta (ou as fases 3 e 4 da rodada) num estado copiado, mede o que mudou e desfaz. A prévia **para no primeiro sorteio, compra, carta revelada ou escolha** e avisa, para nunca mostrar o que está escondido. A previsão da rodada conta o fim do turno (glifos, Poderes, cartas na mão) e a ordem em que os inimigos agem; escolhas de alvo do fim do turno usam o primeiro alvo e a conta é marcada com «≈». | `js/previa.js` (`simular`, `previaCarta`, `previsaoRodada`), `tests/previa.test.js` |

As fontes Cinzel e EB Garamond vêm do Google Fonts, como no material impresso (`material/estilo.css`); sem internet, o navegador usa Georgia.

## Conferência das mecânicas dos investigadores

`node tests/investigadores.test.js`, `node tests/escolhas.test.js` e `node tests/previa.test.js` rodam sem navegador. O terceiro confere a prévia: para cada carta dos quatro investigadores, o que a prévia anuncia tem de ser igual ao resultado da jogada de verdade, e a mesa tem de ficar idêntica depois da prévia. O primeiro joga, sem navegador, os exemplos numéricos do manual (Cap. 7, 12 e 13) para o Geólogo, a Estudante, a Bióloga e o Explorador, e joga cada carta dos quatro (comum e Aprimorada) para garantir que todas têm efeito. Se um número do manual mudar, o teste correspondente acusa.
