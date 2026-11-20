/* Copiado sem alterações de acessorios.html do jogo de tabuleiro: as fichas-resumo dos investigadores. */
const RESUMO = {
  veterano: {
    frase: "Bate cada vez mais forte e aguenta muito castigo.",
    como: [
      "<b>Fúria</b>: cada marcador soma +1 de dano em <i>cada golpe</i> dos seus Ataques, até o fim do combate. Ataques de vários golpes (Golpes de Picareta) aproveitam a Fúria várias vezes.",
      "<b>Perder PV de propósito</b>: cartas como Golpe Imprudente e Esforço Extremo trocam PV por dano ou energia. O Cantil de Aquavit devolve 2 PV no fim de cada combate.",
      "<b>Banir</b>: a carta sai deste combate e volta no próximo. É o preço das cartas mais fortes.",
    ],
    turno: "Rodada 1: jogue Juramento ao Filho (1 Fúria). Rodada 2: Golpes de Picareta causa 2 golpes de 1 + 1 = <b>4 de dano</b>, em vez de 2. Cada Fúria a mais vale +2 nessa mesma carta.",
    cuidado: "Fúria não protege. Perca PV de propósito só quando o combate estiver sob controle.",
    boas: "Juramento ao Filho, Sangue Viking, Golpes de Picareta, Garrafada, Tiro de Sinalizador.",
    sts: "o <b>Ironclad</b>. Fúria = Força; Banir = Exaurir.",
  },
  ocultista: {
    frase: "Envenena e espera: o inimigo apodrece sozinho.",
    como: [
      "<b>Necrose</b>: no turno dele, o inimigo perde PV igual à Necrose (ignora Bloqueio) e a Necrose cai 1. Quatro Necrose = 4 + 3 + 2 + 1 = <b>10 PV</b>.",
      "<b>Bisturis</b>: fichas-carta de custo 0 que causam 1 de dano e são Banidas. Abrir a Maleta coloca 2 na mão; Mão Firme dá +1 a cada um.",
      "<b>Descartar</b>: várias cartas pedem para descartar. Use isso para tirar da mão o que não serve neste turno.",
    ],
    turno: "Rodada 1: Frasco de Cultura (3 Necrose) e Seringa Tóxica (1 de dano, 2 Necrose) = 5 Necrose. Sem fazer mais nada, o inimigo perde 5 + 4 + 3 + 2 + 1 = <b>15 PV</b> nas rodadas seguintes. A energia que sobra vai para Defesa.",
    cuidado: "A Necrose é lenta. Contra muitos inimigos pequenos, derrube primeiro os que vão atacar.",
    boas: "Frasco de Cultura, Seringa Tóxica, Catalisador, Esporos no Ar, Gás Clorofórmio.",
    sts: "a <b>Silent</b>. Necrose = Veneno; Bisturis = Shivs.",
  },
  professor: {
    frase: "Põe glifos na mesa, e eles lutam por ele todo turno.",
    como: [
      "<b>Inscrever</b>: coloca um glifo no próximo dos 3 espaços do tabuleiro, da esquerda para a direita.",
      "<b>Fim do seu turno: TODOS os glifos agem.</b> Relâmpago = 1 de dano; Gelo = 1 de Bloqueio; Vazio = +1 carga. O Estelar dá +1 de energia no início do turno.",
      "<b>Ativar</b>: gasta o glifo da esquerda num efeito maior (Relâmpago 2 de dano, Gelo 2 de Bloqueio, Vazio dano = cargas, Estelar +2 de energia). Com os 3 espaços cheios, inscrever outro Ativa o da esquerda.",
      "<b>Concentração</b>: +1 em cada Relâmpago, Gelo e Vazio, por ponto.",
    ],
    turno: "Com [Gelo][Relâmpago][Gelo] e 1 Concentração, no fim do turno você ganha 2 + 2 = <b>4 de Bloqueio</b> e causa <b>2 de dano</b>, sem gastar nenhuma carta.",
    cuidado: "Só 7 PV. Ponha Gelos na mesa antes de pensar em dano.",
    boas: "Concentração Profunda, Toque Glacial, Mente Fria, Geleira, Eletrodinâmica.",
    sts: "o <b>Defect</b>. Glifos = Orbes; Inscrever / Ativar = Canalizar / Evocar; Concentração = Foco.",
  },
  sonhadora: {
    frase: "Troca de estado mental para gerar energia e dano dobrado.",
    como: [
      "<b>Postura</b>: você está sempre em uma: Neutra, Lucidez, Pânico ou Compreensão. Entrar numa tira você da anterior.",
      "<b>Lucidez</b>: ao <i>sair</i> dela, ganhe 2 de energia. <b>Pânico</b>: seus Ataques causam o dobro, e os Ataques que você recebe também.",
      "<b>Revelação</b>: ao juntar 5, entre em <b>Compreensão</b>: +3 de energia e Ataques triplos até o seu próximo turno.",
      "<b>Vislumbrar X</b>: veja X cartas do topo e descarte as que não quiser. <b>Guardar</b>: a carta fica na mão para o próximo turno.",
    ],
    turno: "Rodada 1: Respirar Fundo (3 de Bloqueio, entra em Lucidez). Rodada 2: Grito Contido (entra em Pânico e sai da Lucidez: +2 de energia), dois Golpes de 2 de dano e Corpo Vazio para <b>sair do Pânico</b> antes do inimigo.",
    cuidado: "Nunca termine o turno em Pânico se o inimigo vai atacar.",
    boas: "Estudo Obsessivo, Fortaleza Mental, Paz Interior, Pancada Serena, Ataque de Fúria.",
    sts: "a <b>Watcher</b>. Lucidez / Pânico / Compreensão = Calma / Ira / Divindade; Revelação = Mantra.",
  },
};
