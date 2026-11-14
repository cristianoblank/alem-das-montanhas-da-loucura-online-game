/* =====================================================================
   ALÉM DAS MONTANHAS DA LOUCURA — banco de dados do jogo
   Todo o conteúdo é original, inspirado no gênero "deckbuilder roguelike"
   e na obra de H. P. Lovecraft (domínio público), em especial
   «Nas Montanhas da Loucura». Imagens: ver img/creditos.json.
   Uso pessoal.
   ===================================================================== */

// C(nome, tipo, custo, texto, textoAprimorado, custoAprimorado)
// tipo: A = Ataque, H = Habilidade, P = Poder, S = Status, T = Trauma
function C(n, t, k, x, u, uk) { return { n, t, k, x, u, uk }; }

const JOGO = {};

/* ------------------------------------------------------------------ */
/* INVESTIGADORES                                                      */
/* ------------------------------------------------------------------ */
JOGO.personagens = [
{
  id: "veterano", nome: "O Explorador", pessoa: "Capitão Aksel Brandt",
  cor: "#8e2a1f", cor2: "#e9c9b8", pv: 12,
  artefato: "Cantil de Aquavit",
  artefatoTexto: "No fim de cada combate, recupere 2 PV.",
  imgs: ["polar/treno", "polar/navio_banquisa", "polar/crista_pressao", "polar/naufragio", "polar/navio_gelo", "polar/navio_preso", "polar/geleira_hamberg", "polar/icebergs", "polar/mar_nuvens", "polar/mar_gelo", "polar/penhasco_gelo", "polar/parede_gelo", "polar/terra_nova", "polar/aviao", "polar/sol_meia_noite", "polar/navio_aurora", "polar/geleira_figura", "polar/cabana"],
  bio: "Norueguês, cinquenta e dois anos, esteve no Polo Sul com Amundsen e perdeu dois dedos do pé para o frio sem reclamar. Treinou os cães da Starkweather-Moore — e foi o filho dele, Nils, quem pilotou o primeiro avião sobre o desfiladeiro. Brandt não acredita em monstros. Acredita em neve, em fome e em continuar andando.",
  mecanica: "Fúria, Banir e sacrifício de PV. O Explorador cresce em força a cada rodada e transforma frio, exaustão e dor em teimosia.",
  inicial: [
    [5, C("Golpe", "A", 1, "Cause 1 de dano.", "Cause 2 de dano.")],
    [4, C("Defesa", "H", 1, "Ganhe 1 de Bloqueio.", "Ganhe 2 de Bloqueio.")],
    [1, C("Coronhada", "A", 2, "Cause 2 de dano. Aplique 1 Exposto.", "Cause 3 de dano. Aplique 2 Exposto.")]
  ],
  comuns: [
    C("Golpes de Picareta", "A", 1, "Cause 1 de dano 2 vezes.", "Cause 1 de dano 3 vezes."),
    C("Dinamite", "A", 1, "Cause 1 de dano a TODOS os inimigos.", "Cause 2 de dano a TODOS os inimigos."),
    C("Golpe de Pá", "A", 1, "Cause 2 de dano. Ganhe 1 de Bloqueio.", "Cause 2 de dano. Ganhe 2 de Bloqueio."),
    C("Soco Sujo", "A", 0, "Cause 2 de dano. Coloque 1 Ferida na sua pilha de compra.", "Cause 3 de dano. Coloque 1 Ferida na sua pilha de compra."),
    C("Avanço na Nevasca", "A", 1, "Cause dano igual ao seu Bloqueio atual.", "Cause dano igual ao seu Bloqueio atual.", 0),
    C("Grito de Comando", "H", 0, "Ganhe 1 Fúria. No fim deste turno, perca 1 Fúria.", "Ganhe 2 Fúria. No fim deste turno, perca 2 Fúria."),
    C("Abrigo de Neve", "H", 1, "Ganhe 2 de Bloqueio.", "Ganhe 3 de Bloqueio."),
    C("Ignorar a Dor", "H", 1, "Ganhe 1 de Bloqueio. Compre 1 carta.", "Ganhe 2 de Bloqueio. Compre 1 carta."),
    C("Coronhada de Revólver", "A", 1, "Cause 1 de dano. Compre 1 carta.", "Cause 2 de dano. Compre 1 carta."),
    C("Cabeçada", "A", 1, "Cause 2 de dano. Coloque 1 carta do seu descarte no topo da pilha de compra.", "Cause 3 de dano. Coloque 1 carta do seu descarte no topo da pilha de compra."),
    C("Garrafada", "A", 2, "Cause 3 de dano. Aplique 1 Debilitado.", "Cause 4 de dano. Aplique 2 Debilitado."),
    C("Faca de Esfolar", "A", 1, "Cause 1 de dano. Se você perdeu PV neste turno, cause 3 em vez disso.", "Cause 2 de dano. Se você perdeu PV neste turno, cause 4 em vez disso."),
    C("Tiro de Sinalizador", "A", 1, "Cause 1 de dano e aplique 1 Exposto a TODOS os inimigos.", "Cause 2 de dano e aplique 1 Exposto a TODOS os inimigos."),
    C("Choque Direto", "A", 0, "Só pode ser jogada se todas as outras cartas da sua mão forem Ataques. Cause 3 de dano.", "Só pode ser jogada se todas as outras cartas da sua mão forem Ataques. Cause 4 de dano.")
  ],
  incomuns: [
    C("Teimosia Nórdica", "P", 1, "Sempre que você perder PV durante o seu turno, ganhe 1 Fúria.", "Sempre que você perder PV durante o seu turno, ganhe 1 Fúria.", 0),
    C("Juramento ao Filho", "P", 1, "Ganhe 1 Fúria. Compre 1 carta.", "Premonição. Ganhe 1 Fúria. Compre 1 carta."),
    C("Esforço Extremo", "H", 0, "Perca 1 PV. Ganhe 2 de energia.", "Perca 1 PV. Ganhe 3 de energia."),
    C("Queimar os Suprimentos", "P", 1, "No fim do seu turno, perca 1 PV e cause 1 de dano a TODOS os inimigos.", "No fim do seu turno, perca 1 PV e cause 2 de dano a TODOS os inimigos."),
    C("Iglu", "H", 2, "Dobre o seu Bloqueio.", "Dobre o seu Bloqueio.", 1),
    C("Fúria Berserker", "A", 2, "Efêmero. Cause 4 de dano.", "Efêmero. Cause 6 de dano."),
    C("Gancho", "A", 2, "Cause 2 de dano. Aplique 1 Debilitado e 1 Exposto.", "Cause 2 de dano. Aplique 2 Debilitado e 2 Exposto."),
    C("Golpe Imprudente", "A", 1, "Perca 2 PV. Cause 4 de dano.", "Perca 2 PV. Cause 5 de dano."),
    C("Fôlego Final", "H", 1, "Bana todas as cartas que não sejam Ataques da sua mão. Ganhe 1 de Bloqueio para cada uma.", "Bana todas as cartas que não sejam Ataques da sua mão. Ganhe 2 de Bloqueio para cada uma."),
    C("Aliviar a Carga", "H", 1, "Bana 1 carta da sua mão. Compre 2 cartas.", "Bana 1 carta da sua mão. Compre 3 cartas."),
    C("Fúria Crescente", "A", 1, "Cause 1 de dano. Depois, coloque 1 marcador aqui: +1 de dano por marcador neste combate.", "Cause 2 de dano. Depois, coloque 1 marcador aqui: +1 de dano por marcador neste combate."),
    C("Avalanche", "A", "X", "Cause 1 de dano a TODOS os inimigos X vezes.", "Cause 1 de dano a TODOS os inimigos X+1 vezes."),
    C("Sentinela", "H", 1, "Ganhe 2 de Bloqueio. Se esta carta for Banida, ganhe 2 de energia.", "Ganhe 3 de Bloqueio. Se esta carta for Banida, ganhe 3 de energia."),
    C("Intimidar", "H", 0, "Aplique 1 Debilitado a TODOS os inimigos. Banir.", "Aplique 2 Debilitado a TODOS os inimigos. Banir."),
    C("Pele Curtida", "P", 1, "No fim do seu turno, ganhe 1 de Bloqueio.", "No fim do seu turno, ganhe 2 de Bloqueio."),
    C("Ira do Sobrevivente", "P", 1, "Sempre que uma carta sua for Banida, ganhe 1 de Bloqueio.", "Sempre que uma carta sua for Banida, ganhe 2 de Bloqueio.")
  ],
  raras: [
    C("Muralha de Gelo", "P", 3, "O seu Bloqueio não é removido no início do seu turno.", "O seu Bloqueio não é removido no início do seu turno.", 2),
    C("Sangue Viking", "P", 3, "No início de cada turno seu, ganhe 1 Fúria.", "Premonição. No início de cada turno seu, ganhe 1 Fúria."),
    C("Disciplina Polar", "P", 3, "Suas Habilidades custam 0. Sempre que jogar uma Habilidade, Bana-a.", "Suas Habilidades custam 0. Sempre que jogar uma Habilidade, Bana-a.", 2),
    C("Bastião", "H", 2, "Ganhe 6 de Bloqueio. Banir.", "Ganhe 8 de Bloqueio. Banir."),
    C("Marreta de Perfuração", "A", 3, "Cause 7 de dano.", "Cause 9 de dano."),
    C("Última Reserva", "H", 0, "Perca 2 PV. Ganhe 2 de energia. Compre 3 cartas. Banir.", "Perca 2 PV. Ganhe 2 de energia. Compre 5 cartas. Banir."),
    C("Ódio Ilimitado", "H", 1, "Dobre a sua Fúria. Banir.", "Dobre a sua Fúria."),
    C("Provisão Macabra", "A", 1, "Cause 2 de dano. Se isso derrotar o inimigo, aumente seu PV máximo em 1 permanentemente. Banir.", "Cause 3 de dano. Se isso derrotar o inimigo, aumente seu PV máximo em 2 permanentemente. Banir."),
    C("Ceifar a Vida", "A", 2, "Cause 1 de dano a TODOS os inimigos. Recupere PV igual ao dano não bloqueado causado. Banir.", "Cause 2 de dano a TODOS os inimigos. Recupere PV igual ao dano não bloqueado causado. Banir.")
  ]
},
{
  id: "ocultista", nome: "A Bióloga", pessoa: "Dra. Ruth Calloway",
  cor: "#2f5d3a", cor2: "#cfe0c8", pv: 10,
  artefato: "Maleta de Dissecação",
  imgs: ["haeckel/actiniae", "haeckel/ascidiae", "haeckel/batrachia", "haeckel/bryozoa", "haeckel/ctenophorae", "haeckel/echinidea", "haeckel/filicinae", "haeckel/gamochonia", "haeckel/lacertilia", "haeckel/lichenes", "haeckel/muscinae", "haeckel/mycetozoa", "haeckel/narcomedusae", "haeckel/ophiodea", "haeckel/pennatulida", "haeckel/peromedusae", "haeckel/prosobranchia", "haeckel/sertulariae", "haeckel/siphonophorae", "haeckel/teleostei", "haeckel/trachomedusae", "haeckel/basimycetes"],
  artefatoTexto: "No primeiro turno de cada combate, compre 2 cartas a mais.",
  bio: "Bióloga da Miskatonic, dissecou os fragmentos de tecido que Lake enviou em 1930 e nunca publicou o que encontrou: células que continuavam se dividindo depois de seis semanas em formol. Viaja com uma maleta de bisturis, frascos de toxinas de laboratório e uma pergunta que ninguém mais quer fazer: como se mata uma coisa que nunca envelhece?",
  mecanica: "Necrose (tecido que apodrece de dentro a cada rodada), Bisturis e descarte. Paciente, ela vence pelo acúmulo.",
  inicial: [
    [4, C("Golpe", "A", 1, "Cause 1 de dano.", "Cause 2 de dano.")],
    [4, C("Defesa", "H", 1, "Ganhe 1 de Bloqueio.", "Ganhe 2 de Bloqueio.")],
    [1, C("Injeção Paralisante", "A", 0, "Cause 1 de dano. Aplique 1 Debilitado.", "Cause 1 de dano. Aplique 2 Debilitado.")],
    [1, C("Recuo Cauteloso", "H", 1, "Ganhe 2 de Bloqueio. Descarte 1 carta.", "Ganhe 3 de Bloqueio. Descarte 1 carta.")]
  ],
  comuns: [
    C("Seringa Tóxica", "A", 1, "Cause 1 de dano. Aplique 2 Necrose.", "Cause 1 de dano. Aplique 3 Necrose."),
    C("Frasco de Cultura", "H", 1, "Aplique 3 Necrose.", "Aplique 4 Necrose."),
    C("Abrir a Maleta", "H", 1, "Coloque 2 Bisturis na sua mão.", "Coloque 3 Bisturis na sua mão."),
    C("Incisão Rápida", "A", 1, "Cause 1 de dano. Compre 1 carta.", "Cause 2 de dano. Compre 1 carta."),
    C("Esquivar e Rolar", "H", 1, "Ganhe 2 de Bloqueio. No início do seu próximo turno, ganhe 1 de Bloqueio.", "Ganhe 3 de Bloqueio. No início do seu próximo turno, ganhe 2 de Bloqueio."),
    C("Revisar Anotações", "H", 1, "Compre 3 cartas. Descarte 1 carta.", "Compre 4 cartas. Descarte 1 carta."),
    C("Preparação", "H", 0, "Compre 1 carta. Descarte 1 carta.", "Compre 2 cartas. Descarte 2 cartas."),
    C("Corte", "A", 0, "Cause 1 de dano.", "Cause 2 de dano."),
    C("Aparar", "H", 0, "Ganhe 1 de Bloqueio.", "Ganhe 2 de Bloqueio."),
    C("Spray de Formol", "A", 1, "Cause 1 de dano a TODOS os inimigos 2 vezes.", "Cause 1 de dano a TODOS os inimigos 2 vezes.", 0),
    C("Infecção Secundária", "A", 1, "Cause 2 de dano. Se o alvo tiver Necrose, cause 2 de dano novamente.", "Cause 3 de dano. Se o alvo tiver Necrose, cause 3 de dano novamente."),
    C("Golpe Clínico", "A", 2, "Cause 4 de dano. Se você descartou uma carta neste turno, ganhe 2 de energia.", "Cause 5 de dano. Se você descartou uma carta neste turno, ganhe 2 de energia."),
    C("Gás Clorofórmio", "H", 2, "Aplique 2 Necrose a TODOS os inimigos.", "Aplique 3 Necrose a TODOS os inimigos."),
    C("Passo Atrás", "H", 1, "Ganhe 1 de Bloqueio. Compre 2 cartas.", "Ganhe 2 de Bloqueio. Compre 2 cartas."),
    C("Agulhada", "A", 1, "Cause 1 de dano. Aplique 1 Debilitado.", "Cause 2 de dano. Aplique 2 Debilitado.")
  ],
  incomuns: [
    C("Catalisador", "H", 2, "Dobre a Necrose de um inimigo. Banir.", "Triplique a Necrose de um inimigo. Banir."),
    C("Esporos no Ar", "P", 1, "No início do seu turno, aplique 1 Necrose a TODOS os inimigos.", "No início do seu turno, aplique 2 Necrose a TODOS os inimigos."),
    C("Mão Firme", "P", 1, "Seus Bisturis causam +1 de dano.", "Seus Bisturis causam +2 de dano."),
    C("Instrumentação", "P", 1, "No início do seu turno, coloque 1 Bisturi na sua mão.", "Premonição. No início do seu turno, coloque 1 Bisturi na sua mão."),
    C("Dissecação Completa", "A", 1, "Cause 1 de dano para cada Ataque que você já jogou neste turno.", "Cause 1 de dano para cada Ataque que você já jogou neste turno.", 0),
    C("Reflexo", "H", "—", "Impossível. Quando esta carta for descartada por um efeito, compre 2 cartas.", "Impossível. Quando esta carta for descartada por um efeito, compre 3 cartas."),
    C("Tática", "H", "—", "Impossível. Quando esta carta for descartada por um efeito, ganhe 1 de energia.", "Impossível. Quando esta carta for descartada por um efeito, ganhe 2 de energia."),
    C("Hipótese Arriscada", "H", 0, "Descarte a sua mão e compre a mesma quantidade de cartas. Banir.", "Descarte a sua mão e compre a mesma quantidade de cartas."),
    C("Frasco Ricocheteante", "H", 2, "Aplique 1 Necrose 3 vezes, dividida entre inimigos à sua escolha.", "Aplique 1 Necrose 4 vezes, dividida entre inimigos à sua escolha."),
    C("Neblina Polar", "H", 1, "Ganhe 2 de Bloqueio. Seu Bloqueio não é removido no início do seu próximo turno.", "Ganhe 3 de Bloqueio. Seu Bloqueio não é removido no início do seu próximo turno."),
    C("Rasteira", "H", 2, "Aplique 2 Debilitado. Ganhe 3 de Bloqueio.", "Aplique 2 Debilitado. Ganhe 4 de Bloqueio."),
    C("Diagnóstico", "H", 1, "Aplique 3 Exposto. Banir.", "Aplique 3 Exposto. Banir.", 0),
    C("Perícia", "H", 1, "Compre cartas até ter 5 na mão.", "Compre cartas até ter 6 na mão."),
    C("Botas com Cravos", "P", 1, "Ganhe 1 Agilidade.", "Ganhe 2 Agilidade."),
    C("Observação Paciente", "A", 2, "Cause 3 de dano. No início do seu próximo turno, compre 2 cartas a mais.", "Cause 4 de dano. No início do seu próximo turno, compre 2 cartas a mais."),
    C("Destilar", "H", 1, "Ganhe 1 Provisão do topo do baralho de Provisões. Banir.", "Ganhe 1 Provisão do topo do baralho de Provisões. Banir.", 0)
  ],
  raras: [
    C("Mil Incisões", "P", 2, "Sempre que você jogar uma carta, cause 1 de dano a TODOS os inimigos.", "Sempre que você jogar uma carta, cause 1 de dano a TODOS os inimigos.", 1),
    C("Hipotermia Controlada", "P", 3, "Ganhe 2 Intangível. No início de cada turno seu, perca 1 Agilidade.", "Ganhe 3 Intangível. No início de cada turno seu, perca 1 Agilidade."),
    C("Carcaça Pútrida", "H", 2, "Aplique 3 Necrose. Quando este inimigo morrer, cause dano igual ao PV máximo dele a TODOS os outros inimigos da fileira.", "Aplique 4 Necrose. Quando este inimigo morrer, cause dano igual ao PV máximo dele a TODOS os outros inimigos da fileira."),
    C("Adrenalina", "H", 0, "Ganhe 1 de energia. Compre 2 cartas. Banir.", "Ganhe 2 de energia. Compre 2 cartas. Banir."),
    C("Reflexos Treinados", "P", 1, "Sempre que você jogar uma carta, ganhe 1 de Bloqueio.", "Premonição. Sempre que você jogar uma carta, ganhe 1 de Bloqueio."),
    C("Lâmina de Esteatito", "A", 1, "Cause 2 de dano 2 vezes. Depois, coloque 1 marcador aqui: −1 de dano por golpe por marcador neste combate.", "Cause 3 de dano 2 vezes. Depois, coloque 1 marcador aqui: −1 de dano por golpe por marcador neste combate."),
    C("Septicemia", "P", 2, "Sempre que um Ataque seu causar dano não bloqueado, aplique 1 Necrose ao alvo.", "Sempre que um Ataque seu causar dano não bloqueado, aplique 1 Necrose ao alvo.", 1),
    C("Bandeja Cirúrgica", "H", 1, "Descarte a sua mão. Coloque 1 Bisturi na sua mão para cada carta descartada.", "Descarte a sua mão. Coloque 1 Bisturi na sua mão para cada carta descartada, mais 1."),
    C("Autópsia Final", "A", 0, "Só pode ser jogada se sua pilha de compra estiver vazia. Cause 8 de dano a TODOS os inimigos.", "Só pode ser jogada se sua pilha de compra estiver vazia. Cause 10 de dano a TODOS os inimigos.")
  ]
},
{
  id: "professor", nome: "O Geólogo", pessoa: "Prof. Ambrose Lacey, Univ. Miskatonic",
  cor: "#24496b", cor2: "#c7d6e6", pv: 7,
  artefato: "Caderno de Decalques",
  imgs: ["haeckel/diatomea", "haeckel/discoidea", "haeckel/spyroidea", "haeckel/desmidiea", "haeckel/hexactinellae", "haeckel/tetracoralla", "haeckel/cyrtoidea", "haeckel/acanthophracta", "haeckel/stephoidea", "haeckel/spumellaria", "haeckel/polycyttaria", "haeckel/blastoidea", "haeckel/crinoidea", "haeckel/asteridea", "haeckel/amphoridea", "montanha/rochas", "montanha/penhasco_rosa", "montanha/kangchenjunga", "montanha/tibete"],
  artefatoTexto: "No primeiro turno de cada combate, ganhe 1 de energia.",
  bio: "Colega de departamento de Dyer, foi o único que acreditou no relato — porque foi ele quem recebeu, para análise, os esteatitos verde-escuros com estrelas de cinco pontas. Passou dois anos copiando os hieróglifos gravados neles. Descobriu que não são escrita: são instruções. Desenhados no ar, com a pressão certa, fazem o gelo obedecer.",
  mecanica: "Glifos: hieróglifos das Coisas Antigas que ficam à sua frente e agem sozinhos no fim de cada turno, todos eles. Ativar um glifo gasta-o para um efeito maior. Concentração aumenta a potência de todos.",
  inicial: [
    [4, C("Golpe", "A", 1, "Cause 1 de dano.", "Cause 2 de dano.")],
    [4, C("Defesa", "H", 1, "Ganhe 1 de Bloqueio.", "Ganhe 2 de Bloqueio.")],
    [1, C("Traçar Hieróglifo", "H", 1, "Inscreva 1 Glifo de Relâmpago.", "Inscreva 1 Glifo de Relâmpago.", 0)],
    [1, C("Liberação Dupla", "H", 2, "Ative o seu glifo mais à esquerda 2 vezes.", "Ative o seu glifo mais à esquerda 2 vezes.", 1)]
  ],
  comuns: [
    C("Toque Glacial", "A", 1, "Cause 2 de dano. Inscreva 1 Glifo de Gelo.", "Cause 3 de dano. Inscreva 1 Glifo de Gelo."),
    C("Esfera Elétrica", "A", 1, "Cause 1 de dano. Inscreva 1 Glifo de Relâmpago.", "Cause 2 de dano. Inscreva 1 Glifo de Relâmpago."),
    C("Raio Fotônico", "A", 0, "Cause 1 de dano. Aplique 1 Exposto.", "Cause 2 de dano. Aplique 2 Exposto."),
    C("Acumular Energia", "H", 1, "Ganhe 2 de Bloqueio. No início do seu próximo turno, ganhe 1 de energia.", "Ganhe 3 de Bloqueio. No início do seu próximo turno, ganhe 1 de energia."),
    C("Bombardeio Cerebral", "A", 1, "Cause 1 de dano para cada glifo inscrito.", "Cause 1 de dano para cada glifo inscrito, mais 1."),
    C("Tradução Compilada", "A", 1, "Cause 2 de dano. Compre 1 carta para cada TIPO diferente de glifo inscrito.", "Cause 3 de dano. Compre 1 carta para cada TIPO diferente de glifo inscrito."),
    C("Mente Fria", "H", 1, "Inscreva 1 Glifo de Gelo. Compre 1 carta.", "Inscreva 1 Glifo de Gelo. Compre 2 cartas."),
    C("Mirar nos Olhos", "A", 0, "Cause 1 de dano. Se o inimigo pretende atacar nesta rodada, aplique 1 Debilitado.", "Cause 2 de dano. Se o inimigo pretende atacar nesta rodada, aplique 1 Debilitado."),
    C("Memória Recuperada", "H", 1, "Ganhe 1 de Bloqueio. Coloque 1 carta do seu descarte na sua mão. Banir.", "Ganhe 1 de Bloqueio. Coloque 1 carta do seu descarte na sua mão."),
    C("Barreira Lógica", "H", 1, "Ganhe 3 de Bloqueio.", "Ganhe 4 de Bloqueio."),
    C("Reflexão", "A", 1, "Cause 2 de dano. A próxima carta que você jogar neste turno vai para o topo da pilha de compra em vez do descarte.", "Cause 3 de dano. A próxima carta que você jogar neste turno vai para o topo da pilha de compra em vez do descarte."),
    C("Recursão", "H", 1, "Ative o seu glifo mais à esquerda e Inscreva novamente um glifo do mesmo tipo.", "Ative o seu glifo mais à esquerda e Inscreva novamente um glifo do mesmo tipo.", 0),
    C("Pilha de Anotações", "H", 1, "Ganhe Bloqueio igual à metade das cartas do seu descarte (arredonde para baixo).", "Ganhe Bloqueio igual à metade das cartas do seu descarte (arredonde para baixo), mais 2."),
    C("Otimização", "A", 2, "Cause 3 de dano. Coloque 1 marcador aqui: custa 1 a menos por marcador neste combate.", "Cause 4 de dano. Coloque 1 marcador aqui: custa 1 a menos por marcador neste combate."),
    C("Lascas de Rocha", "A", 1, "Cause 1 de dano a TODOS os inimigos. Compre 1 carta.", "Cause 1 de dano a TODOS os inimigos. Compre 2 cartas.")
  ],
  incomuns: [
    C("Concentração Profunda", "P", 1, "Ganhe 1 Concentração.", "Premonição. Ganhe 1 Concentração."),
    C("Biblioteca Mental", "P", 1, "Ganhe 2 espaços de glifo.", "Ganhe 3 espaços de glifo."),
    C("Ciclo Eterno", "P", 1, "No início do seu turno, acione o efeito passivo do seu glifo mais à esquerda.", "No início do seu turno, acione o efeito passivo do seu glifo mais à esquerda 2 vezes."),
    C("Geleira", "H", 2, "Ganhe 3 de Bloqueio. Inscreva 2 Glifos de Gelo.", "Ganhe 4 de Bloqueio. Inscreva 2 Glifos de Gelo."),
    C("Frio Interestelar", "H", 0, "Inscreva 1 Glifo de Gelo para cada inimigo na sua fileira. Banir.", "Premonição. Inscreva 1 Glifo de Gelo para cada inimigo na sua fileira. Banir."),
    C("Escuridão Primordial", "H", 1, "Inscreva 1 Glifo do Vazio.", "Inscreva 1 Glifo do Vazio. Acione o passivo de todos os seus Glifos do Vazio."),
    C("Fusão Estelar", "H", 2, "Inscreva 1 Glifo Estelar.", "Inscreva 1 Glifo Estelar.", 1),
    C("Absorver", "H", 2, "Ganhe 2 Concentração. Perca 1 espaço de glifo.", "Ganhe 3 Concentração. Perca 1 espaço de glifo."),
    C("Tempestade", "H", "X", "Inscreva X Glifos de Relâmpago. Banir.", "Inscreva X+1 Glifos de Relâmpago. Banir."),
    C("Equilíbrio", "H", 2, "Ganhe 3 de Bloqueio. Guarde a sua mão neste turno.", "Ganhe 4 de Bloqueio. Guarde a sua mão neste turno."),
    C("Sobrecarga Mental", "H", 0, "Compre 2 cartas. Coloque 1 Congelamento no seu descarte.", "Compre 3 cartas. Coloque 1 Congelamento no seu descarte."),
    C("Acúmulo", "H", 1, "Ganhe 1 de energia para cada 4 cartas na sua pilha de compra.", "Ganhe 1 de energia para cada 3 cartas na sua pilha de compra."),
    C("Necrose Iminente", "A", 2, "Cause 2 de dano a TODOS os inimigos. Inscreva 1 Glifo do Vazio.", "Cause 3 de dano a TODOS os inimigos. Inscreva 1 Glifo do Vazio."),
    C("Dissipador", "P", 1, "Sempre que você jogar um Poder, compre 1 carta.", "Sempre que você jogar um Poder, compre 2 cartas."),
    C("Descarga Estática", "P", 1, "Sempre que receber dano de ataque não bloqueado, Inscreva 1 Glifo de Relâmpago.", "Sempre que receber dano de ataque não bloqueado, Inscreva 2 Glifos de Relâmpago."),
    C("Derreter", "A", 1, "Remova todo o Bloqueio de um inimigo. Cause 2 de dano a ele.", "Remova todo o Bloqueio de um inimigo. Cause 3 de dano a ele.")
  ],
  raras: [
    C("Forma Eco", "P", 3, "Efêmero. A primeira carta que você jogar a cada turno é jogada 2 vezes.", "A primeira carta que você jogar a cada turno é jogada 2 vezes."),
    C("Eletrodinâmica", "P", 2, "Seus Glifos de Relâmpago atingem TODOS os inimigos da sua fileira. Inscreva 2 Glifos de Relâmpago.", "Seus Glifos de Relâmpago atingem TODOS os inimigos da sua fileira. Inscreva 3 Glifos de Relâmpago."),
    C("Cognição Distorcida", "P", 1, "Ganhe 3 Concentração. No início de cada turno seu, perca 1 Concentração.", "Ganhe 4 Concentração. No início de cada turno seu, perca 1 Concentração."),
    C("Amortecedor Psíquico", "P", 2, "Ganhe 1 marcador aqui. Quando fosse perder PV, gaste 1 marcador para evitar essa perda.", "Ganhe 2 marcadores aqui. Quando fosse perder PV, gaste 1 marcador para evitar essa perda."),
    C("Surto do Núcleo", "A", 1, "Cause 4 de dano. Ganhe 1 Amparo. Banir.", "Cause 5 de dano. Ganhe 1 Amparo. Banir."),
    C("Raio Hiperdimensional", "A", 2, "Cause 5 de dano a TODOS os inimigos. Perca 3 Concentração.", "Cause 6 de dano a TODOS os inimigos. Perca 3 Concentração."),
    C("Busca no Arquivo", "H", 0, "Escolha 1 carta da sua pilha de compra e coloque-a na sua mão. Embaralhe a pilha. Banir.", "Escolha 2 cartas da sua pilha de compra e coloque-as na sua mão. Embaralhe a pilha. Banir."),
    C("Chuva de Meteoritos", "A", 5, "Cause 8 de dano. Inscreva 3 Glifos Estelares.", "Cause 10 de dano. Inscreva 3 Glifos Estelares."),
    C("Aprendizado Contínuo", "P", 1, "No início de cada turno seu, compre 1 carta a mais.", "Premonição. No início de cada turno seu, compre 1 carta a mais.")
  ]
},
{
  id: "sonhadora", nome: "A Estudante", pessoa: "Margaret Danforth",
  cor: "#5b3a7a", cor2: "#ddcfe9", pv: 13,
  artefato: "As Cartas do Irmão",
  imgs: ["montanha/atlantida", "montanha/castelo_distante", "montanha/cidade_condenada", "montanha/cidade_vale", "montanha/fortaleza_planicie", "montanha/himalaia_noite", "montanha/ilhas", "montanha/kangchenjunga", "montanha/montes_azuis", "montanha/montes_floridos", "montanha/passo", "montanha/penhasco_rosa", "montanha/picos_pastel", "montanha/raio_roxo", "montanha/rochas", "montanha/serpente", "montanha/sombra_vermelha", "montanha/tibete"],
  artefatoTexto: "No início de cada combate, coloque 1 Lampejo na sua mão.",
  bio: "Irmã mais nova do estudante que voltou da expedição de 1931 sem conseguir explicar o que viu ao olhar para trás, por cima das montanhas. Ela leu as cartas dele, os rascunhos, os desenhos. Sabe que o irmão não enlouqueceu: ele entendeu. Margaret veio entender também — e voltar inteira.",
  mecanica: "Estados mentais: Lucidez gera energia, Pânico dobra o dano (o seu e o recebido) e Compreensão triplica. Revelação acumula até explodir em Compreensão. Vislumbrar e Guardar dão controle total da mão.",
  inicial: [
    [4, C("Golpe", "A", 1, "Cause 1 de dano.", "Cause 2 de dano.")],
    [3, C("Defesa", "H", 1, "Ganhe 1 de Bloqueio.", "Ganhe 2 de Bloqueio.")],
    [1, C("Corpo Vazio", "H", 1, "Ganhe 2 de Bloqueio. Saia da sua postura.", "Ganhe 3 de Bloqueio. Saia da sua postura.")],
    [1, C("Grito Contido", "A", 1, "Cause 2 de dano. Entre em Pânico.", "Cause 3 de dano. Entre em Pânico.")],
    [1, C("Respirar Fundo", "H", 1, "Ganhe 3 de Bloqueio. Entre em Lucidez.", "Ganhe 4 de Bloqueio. Entre em Lucidez.")]
  ],
  comuns: [
    C("Punho Vazio", "A", 1, "Cause 2 de dano. Saia da sua postura.", "Cause 3 de dano. Saia da sua postura."),
    C("Corpo Vazio", "H", 1, "Ganhe 2 de Bloqueio. Saia da sua postura.", "Ganhe 3 de Bloqueio. Saia da sua postura."),
    C("Rajada de Golpes", "A", 0, "Cause 1 de dano. Sempre que você mudar de postura, devolva esta carta do descarte para a sua mão.", "Cause 2 de dano. Sempre que você mudar de postura, devolva esta carta do descarte para a sua mão."),
    C("Pânico Crescente", "H", 1, "Guardar. Entre em Pânico. Banir.", "Guardar. Entre em Pânico. Banir.", 0),
    C("Contar até Dez", "H", 1, "Guardar. Entre em Lucidez. Banir.", "Guardar. Entre em Lucidez. Banir.", 0),
    C("Olhar Atento", "H", 1, "Ganhe 2 de Bloqueio. Vislumbrar 3.", "Ganhe 3 de Bloqueio. Vislumbrar 5."),
    C("Cortar o Destino", "A", 1, "Cause 1 de dano. Vislumbrar 2. Compre 1 carta.", "Cause 2 de dano. Vislumbrar 3. Compre 1 carta."),
    C("Ajoelhar-se", "H", 0, "Ganhe 1 Revelação. Ganhe 1 de Bloqueio.", "Ganhe 2 Revelação. Ganhe 1 de Bloqueio."),
    C("Avaliar", "H", 1, "Ganhe 2 de Bloqueio. Coloque 1 Clarividência na sua pilha de compra e embaralhe.", "Ganhe 3 de Bloqueio. Coloque 1 Clarividência na sua pilha de compra e embaralhe."),
    C("Golpe de Faixa", "A", 1, "Cause 2 de dano. Se a última carta jogada foi um Ataque, aplique 1 Debilitado.", "Cause 3 de dano. Se a última carta jogada foi um Ataque, aplique 1 Debilitado."),
    C("Esmagar Articulações", "A", 1, "Cause 2 de dano. Se a última carta jogada foi uma Habilidade, aplique 1 Exposto.", "Cause 3 de dano. Se a última carta jogada foi uma Habilidade, aplique 1 Exposto."),
    C("Golpe Concêntrico", "A", 1, "Cause 1 de dano para cada inimigo na sua fileira.", "Cause 2 de dano para cada inimigo na sua fileira."),
    C("Pausa", "H", 0, "Ganhe 1 de Bloqueio. Se estiver em Pânico, ganhe +2 de Bloqueio.", "Ganhe 2 de Bloqueio. Se estiver em Pânico, ganhe +3 de Bloqueio."),
    C("Continuidade", "A", 1, "Cause 2 de dano. Se a última carta jogada foi um Ataque, ganhe 1 de energia.", "Cause 3 de dano. Se a última carta jogada foi um Ataque, ganhe 1 de energia."),
    C("Proteção Instintiva", "H", 2, "Guardar. Ganhe 3 de Bloqueio.", "Guardar. Ganhe 4 de Bloqueio.")
  ],
  incomuns: [
    C("Fortaleza Mental", "P", 1, "Sempre que você mudar de postura, ganhe 1 de Bloqueio.", "Sempre que você mudar de postura, ganhe 2 de Bloqueio."),
    C("Ímpeto", "P", 1, "Sempre que você entrar em Pânico, compre 2 cartas.", "Sempre que você entrar em Pânico, compre 2 cartas.", 0),
    C("Como a Água", "P", 1, "No fim do seu turno, se estiver em Lucidez, ganhe 1 de Bloqueio.", "No fim do seu turno, se estiver em Lucidez, ganhe 2 de Bloqueio."),
    C("Sem Medo do Escuro", "A", 1, "Cause 2 de dano. Se o inimigo pretende atacar nesta rodada, entre em Lucidez.", "Cause 3 de dano. Se o inimigo pretende atacar nesta rodada, entre em Lucidez."),
    C("Paz Interior", "H", 1, "Se estiver em Lucidez, compre 3 cartas. Caso contrário, entre em Lucidez.", "Se estiver em Lucidez, compre 4 cartas. Caso contrário, entre em Lucidez."),
    C("Indignação", "H", 1, "Se estiver em Pânico, aplique 1 Exposto a TODOS os inimigos. Caso contrário, entre em Pânico.", "Se estiver em Pânico, aplique 2 Exposto a TODOS os inimigos. Caso contrário, entre em Pânico."),
    C("Ataque de Fúria", "A", 1, "Cause 1 de dano 3 vezes. Entre em Pânico. Coloque esta carta na sua pilha de compra e embaralhe.", "Cause 1 de dano 4 vezes. Entre em Pânico. Coloque esta carta na sua pilha de compra e embaralhe."),
    C("Contemplação", "H", 2, "Ganhe 3 Revelação.", "Guardar. Ganhe 3 Revelação."),
    C("Releitura", "H", 1, "Ganhe 2 Revelação. Coloque 1 Clarividência na sua pilha de compra e embaralhe.", "Ganhe 3 Revelação. Coloque 1 Clarividência na sua pilha de compra e embaralhe."),
    C("Pancada Serena", "A", 2, "Cause 3 de dano. Ganhe Bloqueio igual ao dano não bloqueado causado.", "Cause 4 de dano. Ganhe Bloqueio igual ao dano não bloqueado causado."),
    C("Santidade", "H", 1, "Ganhe 3 de Bloqueio. Se a última carta jogada foi uma Habilidade, compre 2 cartas.", "Ganhe 4 de Bloqueio. Se a última carta jogada foi uma Habilidade, compre 2 cartas."),
    C("Previsão", "P", 1, "No início do seu turno, Vislumbrar 2.", "No início do seu turno, Vislumbrar 3."),
    C("Colher Lampejos", "H", "X", "No início do seu próximo turno, coloque X Lampejos na sua mão. Banir.", "No início do seu próximo turno, coloque X+1 Lampejos na sua mão. Banir."),
    C("Tecer Ideias", "A", 0, "Cause 1 de dano. Sempre que você Vislumbrar, devolva esta carta do descarte para a sua mão.", "Cause 2 de dano. Sempre que você Vislumbrar, devolva esta carta do descarte para a sua mão."),
    C("Mão Espalmada", "A", 1, "Cause 2 de dano. Marque o inimigo: sempre que você o atacar neste combate, ganhe 1 de Bloqueio. Banir.", "Cause 3 de dano. Marque o inimigo: sempre que você o atacar neste combate, ganhe 1 de Bloqueio. Banir."),
    C("Meditar", "H", 1, "Pegue 1 carta do descarte; ela ganha Guardar. Entre em Lucidez. Encerre seu turno.", "Pegue 2 cartas do descarte; elas ganham Guardar. Entre em Lucidez. Encerre seu turno.")
  ],
  raras: [
    C("Estudo Obsessivo", "P", 1, "No início do seu turno, ganhe 2 Revelação.", "No início do seu turno, ganhe 3 Revelação."),
    C("Mente Expandida", "P", 3, "Efêmero. No início do seu turno, coloque 1 marcador aqui e ganhe 1 de energia por marcador.", "No início do seu turno, coloque 1 marcador aqui e ganhe 1 de energia por marcador."),
    C("Olhar para Trás", "H", 1, "Guardar. Entre em Compreensão. No início do seu próximo turno, perca 5 PV. Banir.", "Guardar. Entre em Compreensão. No início do seu próximo turno, perca 3 PV. Banir."),
    C("Onisciência", "H", 4, "Escolha 1 carta da sua pilha de compra. Jogue-a 2 vezes (sem custo) e Bana-a. Banir.", "Escolha 1 carta da sua pilha de compra. Jogue-a 2 vezes (sem custo) e Bana-a. Banir.", 3),
    C("Escrita Automática", "H", 1, "Compre cartas até ter 10 na mão. Banir.", "Compre cartas até ter 10 na mão. Banir.", 0),
    C("Conclusão", "H", 1, "Se o inimigo tiver 6 PV ou menos, ele é derrotado.", "Se o inimigo tiver 8 PV ou menos, ele é derrotado."),
    C("Avalanche de Ideias", "A", 3, "Cause 1 de dano 5 vezes, dividido entre inimigos à sua escolha.", "Cause 1 de dano 6 vezes, dividido entre inimigos à sua escolha."),
    C("Desejo", "H", 3, "Escolha uma: ganhe 2 Fúria; OU ganhe 6 de Bloqueio; OU ganhe 5 créditos. Banir.", "Escolha uma: ganhe 3 Fúria; OU ganhe 8 de Bloqueio; OU ganhe 7 créditos. Banir."),
    C("Estabelecimento", "P", 1, "Sempre que uma carta for Guardada, ela custa 1 a menos até o fim do combate (use marcadores).", "Premonição. Sempre que uma carta for Guardada, ela custa 1 a menos até o fim do combate (use marcadores)."),
    C("Lição Aprendida", "A", 2, "Cause 3 de dano. Se isso derrotar o inimigo, Aprimore 1 carta do seu baralho permanentemente. Banir.", "Cause 4 de dano. Se isso derrotar o inimigo, Aprimore 1 carta do seu baralho permanentemente. Banir.")
  ]
}
];

/* Cartas geradas por efeitos (fichas de carta) */
JOGO.fichas = [
  { carta: C("Bisturi", "A", 0, "Cause 1 de dano. Banir.", "Cause 2 de dano. Banir."), copias: 10, de: "ocultista" },
  { carta: C("Lampejo", "H", 0, "Guardar. Ganhe 1 de energia. Banir.", "Guardar. Ganhe 2 de energia. Banir."), copias: 6, de: "sonhadora" },
  { carta: C("Clarividência", "H", 0, "Guardar. Compre 2 cartas. Banir.", "Guardar. Compre 3 cartas. Banir."), copias: 4, de: "sonhadora" }
];

/* Cartas incolores — Antiquário, eventos e recompensas especiais */
JOGO.incolores = [
  C("Primeiros Socorros", "H", 0, "Recupere 2 PV. Banir.", "Recupere 3 PV. Banir."),
  C("Fôlego Renovado", "H", 0, "Compre 2 cartas. Banir.", "Compre 3 cartas. Banir."),
  C("Golpe de Sorte", "A", 0, "Cause 2 de dano. Banir.", "Cause 3 de dano. Banir."),
  C("Sinal Estrelado", "H", 2, "Ganhe 2 Amparo. Ganhe 2 de Bloqueio. Banir.", "Ganhe 3 Amparo. Ganhe 3 de Bloqueio. Banir."),
  C("Ajuda Mútua", "H", 1, "Um aliado compra 2 cartas.", "Um aliado compra 3 cartas."),
  C("Cobertura", "H", 1, "Um aliado ganha 3 de Bloqueio.", "Um aliado ganha 4 de Bloqueio."),
  C("Plano Arriscado", "H", 0, "Ganhe 2 de energia. Coloque 1 Atordoado na sua mão.", "Ganhe 3 de energia. Coloque 1 Atordoado na sua mão."),
  C("Lampião", "H", 1, "Vislumbrar 3. Compre 1 carta.", "Vislumbrar 3. Compre 1 carta.", 0),
  C("Revólver Calibre .38", "A", 1, "Guardar. Cause 1 de dano 2 vezes.", "Guardar. Cause 1 de dano 3 vezes."),
  C("Fuga Desesperada", "H", 1, "Ganhe 4 de Bloqueio. Banir.", "Ganhe 6 de Bloqueio. Banir."),
  C("Anotações de Campo", "H", 0, "Coloque 1 carta do seu descarte no topo da pilha de compra. Compre 1 carta.", "Guardar. Coloque 1 carta do seu descarte no topo da pilha de compra. Compre 1 carta."),
  C("Carga de Dinamite", "A", 2, "Cause 3 de dano a TODOS os inimigos. Banir.", "Cause 4 de dano a TODOS os inimigos. Banir."),
  C("Grito Primal", "H", 1, "Aplique 1 Debilitado a TODOS os inimigos de TODAS as fileiras. Banir.", "Aplique 2 Debilitado a TODOS os inimigos de TODAS as fileiras. Banir.")
];

/* Status — entram no baralho durante o combate e saem ao fim dele */
JOGO.status = [
  { carta: C("Ferida", "S", "—", "Impossível.", ""), copias: 10 },
  { carta: C("Atordoado", "S", "—", "Impossível. Efêmero.", ""), copias: 8 },
  { carta: C("Lodo", "S", 1, "Banir.", ""), copias: 8 },
  { carta: C("Congelamento", "S", "—", "Impossível. No fim do seu turno, se esta carta estiver na sua mão, perca 1 PV.", ""), copias: 6 },
  { carta: C("Abismo Interior", "S", "—", "Impossível. Efêmero. Quando você comprar esta carta, perca 1 de energia.", ""), copias: 4 }
];

/* Traumas — permanecem no baralho até serem removidos */
JOGO.traumas = [
  C("Paranoia", "T", "—", "Impossível. No fim do seu turno, se esta carta estiver na sua mão, perca 1 PV.", ""),
  C("Dúvida", "T", "—", "Impossível. No fim do seu turno, se esta carta estiver na sua mão, ganhe 1 Debilitado.", ""),
  C("Vergonha", "T", "—", "Impossível. No fim do seu turno, se esta carta estiver na sua mão, ganhe 1 Trêmulo.", ""),
  C("Paralisia", "T", "—", "Impossível. Enquanto esta carta estiver na sua mão, você não pode jogar mais de 3 cartas por turno.", ""),
  C("Lembrança Proibida", "T", "—", "Impossível. Premonição.", ""),
  C("Ferida Psíquica", "T", "—", "Impossível.", ""),
  C("Agonia", "T", "—", "Impossível. Enquanto esta carta estiver na sua mão, perca 1 PV sempre que jogar outra carta.", ""),
  C("Sussurros", "T", "—", "Impossível. Quando você comprar esta carta, coloque 1 Atordoado no seu descarte.", ""),
  C("Maldição do Livro", "T", "—", "Impossível. Não pode ser removida. Se for Banida, volta para a sua mão.", "")
];

/* ------------------------------------------------------------------ */
/* ARTEFATOS (relíquias)                                               */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* ARTEFATOS (equipamento e relíquias)                                 */
/* ------------------------------------------------------------------ */
JOGO.artefatos = {
  iniciais: [
    ["Cantil de Aquavit", "No fim de cada combate, recupere 2 PV.", "veterano"],
    ["Maleta de Dissecação", "No primeiro turno de cada combate, compre 2 cartas a mais.", "ocultista"],
    ["Caderno de Decalques", "No primeiro turno de cada combate, ganhe 1 de energia.", "professor"],
    ["As Cartas do Irmão", "No início de cada combate, coloque 1 Lampejo na sua mão.", "sonhadora"]
  ],
  comuns: [
    ["Lanterna de Querosene", "No primeiro turno de cada combate, ganhe 1 de energia."],
    ["Medalha Polar Norueguesa", "No início de cada combate, ganhe 1 Fúria."],
    ["Bússola Desregulada", "Ao entrar em um nó de Mistério, revele 2 Eventos e escolha 1."],
    ["Fogareiro Primus", "Sempre que entrar em um Acampamento, recupere 2 PV."],
    ["Casaco de Pele de Rena", "No início de cada combate, ganhe 3 de Bloqueio."],
    ["Caderno de Campo", "No primeiro turno de cada combate, compre 2 cartas a mais."],
    ["Bolsa de Créditos Pickman", "Ao obter este artefato, ganhe 6 créditos."],
    ["Crucifixo de Prata", "No início de cada combate, ganhe 1 Amparo."],
    ["Crampons Afiados", "No início de cada combate, ganhe 1 Espinhos."],
    ["Relógio de Bolso", "Sempre que jogar o 3º Ataque de um turno, ganhe 2 de Bloqueio."],
    ["Pena de Petrel", "Ao vencer um combate com 5 PV ou menos, recupere 2 PV."],
    ["Mochila de Lona", "Ganhe 1 espaço de Provisão adicional."]
  ],
  incomuns: [
    ["Lupa de Campo", "Seus Ataques contra inimigos com Exposto causam +1 de dano."],
    ["Cronômetro de Navegação", "No início do seu turno, coloque 1 marcador aqui. Com 3 marcadores, remova-os e ganhe 1 de energia."],
    ["Garrafa Térmica de Café", "Sempre que jogar um Poder, recupere 1 PV."],
    ["Fotografia da Família", "Na primeira vez em cada combate que seu PV ficar na metade ou menos, ganhe 2 Fúria."],
    ["Cultura de Bactérias", "Quando um inimigo com Necrose morrer, transfira a Necrose dele para outro inimigo."],
    ["Mapa de Dyer", "No início de cada combate, aplique 1 Exposto a TODOS os inimigos da sua fileira."],
    ["Bastão de Esqui", "Se terminar seu turno sem Bloqueio, ganhe 2 de Bloqueio."],
    ["Cachecol de Lã", "No fim do seu turno, você pode Guardar 1 carta."],
    ["Diário de Caça", "Sempre que um inimigo da sua fileira morrer, ganhe 1 de energia e compre 1 carta."],
    ["Binóculo Zeiss", "Sempre que Vislumbrar, Vislumbre 1 carta a mais."]
  ],
  raros: [
    ["Fragmento de Meteorito", "No início de cada combate, ganhe 1 Agilidade."],
    ["Caneta-Tinteiro de Lake", "Coloque 1 marcador aqui a cada Ataque jogado. O 10º Ataque causa o dobro de dano; depois, zere os marcadores."],
    ["Talismã de Cinco Pontas", "Uma vez por partida: quando seu PV chegaria a 0, recupere metade do seu PV máximo em vez disso."],
    ["Sinalizador de Magnésio", "No início de cada combate, aplique 1 Debilitado a TODOS os inimigos da sua fileira."],
    ["Contrato com a Fundação", "Sempre que ganhar créditos, ganhe 1 a mais."],
    ["Pedra Verde Ancestral", "Você não pode ficar Debilitado nem Trêmulo."],
    ["Cachimbo do Capitão", "Na primeira vez em cada turno que Banir uma carta, compre 1 carta."],
    ["O Necronomicon da Miskatonic", "O primeiro Ataque de custo 2 ou mais jogado a cada turno é jogado 2 vezes. Ao obter, adicione Maldição do Livro ao seu baralho."]
  ],
  chefe: [
    ["Cristal Prismático", "+1 de energia no início de cada turno. Compre 1 carta a menos por turno."],
    ["Ídolo da Cria Estelar", "+1 de energia no início de cada turno. Em cada Achado Arqueológico, adicione 1 Trauma ao seu baralho."],
    ["Lâmpada Ancestral", "+1 de energia no início de cada turno. Você não pode Descansar em Acampamentos."],
    ["Sangue de Shoggoth Cristalizado", "+1 de energia no início de cada turno. Você não pode mais ganhar créditos."],
    ["Coroa de Hieróglifos", "+1 de energia no início de cada turno. Você não pode jogar mais de 6 cartas por turno."],
    ["Cápsula do Tempo Ancestral", "No fim do seu turno, Guarde toda a sua mão."],
    ["Fonte Termal Subterrânea", "Ao obter, aumente seu PV máximo em 3 e recupere todo o PV."],
    ["Reforma do Equipamento", "Ao obter, remova até 2 cartas Golpe ou Defesa do baralho e Aprimore 2 cartas."]
  ],
  antiquario: [
    ["Kit de Manutenção", "Cartas compradas no Depósito já vêm Aprimoradas."],
    ["Carteira de Sócio da Miskatonic", "Tudo no Depósito custa 1 crédito a menos."],
    ["Gramofone Portátil", "No início de cada combate, Vislumbrar 2."],
    ["Caixa Térmica", "Ganhe 1 espaço de Provisão adicional. Ao obter, ganhe 1 Provisão."]
  ]
};

/* ------------------------------------------------------------------ */
/* PROVISÕES (consumíveis)                                             */
/* ------------------------------------------------------------------ */
JOGO.elixires = [
  ["Conhaque", "Ganhe 2 Fúria.", 2],
  ["Café Forte", "Ganhe 2 Agilidade.", 2],
  ["Sais Aromáticos", "Recupere 3 PV.", 2],
  ["Vitaminas de Bordo", "Remova todas as condições negativas de você.", 1],
  ["Banana de Dinamite", "Cause 4 de dano a um inimigo.", 2],
  ["Nitroglicerina", "Cause 2 de dano a TODOS os inimigos da sua fileira.", 2],
  ["Cobertor de Lã", "Ganhe 4 de Bloqueio.", 2],
  ["Benzedrina", "Ganhe 2 de energia.", 2],
  ["Pó de Magnésio", "Aplique 3 Exposto a um inimigo.", 1],
  ["Estricnina", "Aplique 5 Necrose a um inimigo.", 1],
  ["Diário de Bordo", "Compre 3 cartas.", 2],
  ["Gás Lacrimogêneo", "Aplique 3 Debilitado a um inimigo.", 1],
  ["Ampola de Adrenalina", "Quando seu PV chegaria a 0, descarte esta provisão e recupere 3 PV. (Também pode ser usada para recuperar 1 PV.)", 1],
  ["Sinalizador de Fumaça", "Combate normal: todos os inimigos da sua fileira fogem. Você não recebe recompensas deste combate.", 1],
  ["Chá de Folha de Coca", "A próxima carta que você jogar neste turno é jogada 2 vezes.", 1],
  ["Camuflagem Branca", "Ganhe 1 Intangível.", 1],
  ["Pemmican Concentrado", "Aumente seu PV máximo em 2 permanentemente.", 1],
  ["Sopa Quente", "Você e cada aliado recuperam 1 PV e ganham 1 de Bloqueio.", 2]
];

/* ------------------------------------------------------------------ */
/* INIMIGOS                                                            */
/* comp: "dado" (reage ao Dado do Presságio), "seq" (sequência), "fixo" */
/* Ações: "A3" = ataque de 3; "A1x3" = 1 de dano 3 vezes; "B2" = Bloqueio */
/*        "AT2" = ataca CADA jogador (combates em grupo)                 */
/* img: ilustração em domínio público (pasta img/)                     */
/* ------------------------------------------------------------------ */
JOGO.inimigos = [
/* ---------- ATO I — A TRAVESSIA ---------- */
{ n: "Marinheiro Delirante", ato: 1, cat: "normal", pv: 6, comp: "seq", img: "polar/navio_banquisa",
  acoes: [["1ª", "Febre Polar: ganha o efeito Delírio"], ["2ª →", "A1"]],
  hab: "Delírio: no fim de cada rodada, ganha 1 Fúria.",
  txt: "Desceu do Arkham cantando a mesma canção em cinco notas." },
{ n: "Foca-Leopardo", ato: 1, cat: "normal", pv: 7, comp: "dado", img: "polar/mar_gelo",
  acoes: [["1-3", "A2"], ["4-6", "A1; B1"]],
  txt: "Espera sob a borda do gelo com uma paciência que não é animal." },
{ n: "Espécime Descongelado", ato: 1, cat: "normal", pv: 8, comp: "seq", img: "haeckel/asteridea",
  acoes: [["1ª", "A1; Exposto 1"], ["2ª", "A2"], ["3ª ↺1ª", "B2; Fúria 1"]],
  txt: "Lake o catalogou como «radiado, possivelmente vegetal». Ele discorda." },
{ n: "Petrel Carniceiro", ato: 1, cat: "normal", pv: 3, comp: "dado", img: "haeckel/chiroptera",
  acoes: [["1-3", "A1x2"], ["4-6", "Debilitado 1"]],
  txt: "Ave de rapina. Aprendeu que os homens daqui morrem fácil." },
{ n: "Cão de Trenó Enlouquecido", ato: 1, cat: "normal", pv: 6, comp: "dado", img: "polar/treno",
  acoes: [["1-4", "A2"], ["5-6", "A1; Ferida no descarte do jogador"]],
  txt: "Sentiu o cheiro das coisas no acampamento de Lake. Nunca mais foi o mesmo." },
{ n: "Sombra na Nevasca", ato: 1, cat: "normal", pv: 9, comp: "seq", img: "polar/geleira_figura",
  acoes: [["1ª", "B2"], ["2ª", "A3"], ["3ª ↺2ª", "A1; B2"]],
  hab: "Desfaz-se na Neve: na primeira vez que chegar a 0 PV, volta com 3 PV.",
  txt: "Uma silhueta na brancura. Sempre do tamanho errado." },
{ n: "Gosma do Degelo", ato: 1, cat: "normal", pv: 4, comp: "dado", img: "haeckel/mycetozoa",
  acoes: [["1-3", "A1x2"], ["4-6", "A1; Lodo no descarte do jogador"]],
  txt: "Um fragmento negro e brilhante, ainda aprendendo a ter forma." },
{ n: "Massa Protoplásmica", ato: 1, cat: "normal", pv: 10, comp: "dado", img: "haeckel/ciliata",
  acoes: [["1-3", "A2"], ["4-6", "A1; Lodo no descarte do jogador"]],
  hab: "Divisão: quando ficar com 5 PV ou menos, é substituída por 2 Gosmas do Degelo, cada uma com metade do PV restante dela (arredonde para cima). As Gosmas agem a partir da rodada seguinte.",
  txt: "Borbulha. Imita. Divide-se." },

{ n: "O Dissecador", ato: 1, cat: "elite", pv: 14, pvj: true, comp: "dado", img: "haeckel/crinoidea",
  acoes: [["1-3", "A2x2"], ["4-5", "A2; Exposto 1"], ["6", "AT1x2"]],
  hab: "Curiosidade Científica: na primeira vez em cada rodada que cada jogador jogar uma Habilidade, ganha 1 Fúria (no máximo 3 Fúria por esta habilidade).",
  txt: "Estudou Gedney com muito cuidado. Agora quer estudar vocês." },
{ n: "Alfa da Matilha de Lake", ato: 1, cat: "elite", pv: 15, pvj: true, comp: "seq", img: "polar/crista_pressao",
  acoes: [["1ª", "B3; Fúria 1"], ["2ª", "A3"], ["3ª ↺1ª", "AT2"]],
  hab: "Pelagem Congelada: perde no máximo 1 PV por rodada pela Necrose.",
  txt: "O último cão do acampamento de 1930. Sobreviveu comendo o que não devia." },
{ n: "Coisa Antiga Desperta", ato: 1, cat: "elite", pv: 15, pvj: true, comp: "dado", img: "haeckel/blastoidea",
  acoes: [["1-2", "A1x3"], ["3-4", "A3; Debilitado 1"], ["5-6", "B4"]],
  hab: "Couro de Barril: o primeiro golpe de Ataque que recebe a cada rodada causa 1 de dano a menos.",
  txt: "Dois metros de barril estriado, asas dobradas, uma estrela no lugar da cabeça." },

{ n: "A Nevasca Uivante", ato: 1, cat: "chefe", pv: 26, pvj: true, comp: "seq", img: "polar/parede_gelo",
  acoes: [["1ª", "Muralha Branca: B3; Fúria 1"], ["2ª", "Vento Cortante: AT2x2"], ["3ª", "Cegueira Branca: A4; Debilitado 1"], ["4ª ↺2ª", "Assobio em Cinco Notas: cada jogador coloca 1 Atordoado no descarte; B4"]],
  hab: "Tempestade Contínua: no fim de cada rodada, se não tiver Bloqueio, ganha 1 de Bloqueio.",
  txt: "O vento que desce das montanhas não sopra. Ele procura." },
{ n: "Os Espécimes de Lake", ato: 1, cat: "chefe", pv: 28, pvj: true, comp: "dado", img: "haeckel/ophiodea",
  acoes: [["1-2", "Linguagem Assobiada: cada jogador coloca 1 Atordoado na mão"], ["3-4", "A3"], ["5-6", "AT2; Debilitado 1"]],
  hab: "Colônia: o Espécime-Líder começa acompanhado de um Espécime Menor (PV 5 por jogador; ação fixa: A1x2). Enquanto o Menor viver, o Líder recupera 2 PV no fim de cada rodada.",
  txt: "Os seis montes estrelados estavam abertos por dentro." },
{ n: "O Que Levou Gedney", ato: 1, cat: "chefe", pv: 30, pvj: true, comp: "seq", img: "polar/caverna",
  acoes: [["1ª", "Frio Profano: cada jogador recebe Debilitado 1 e Trêmulo 1"], ["2ª", "AT2x2"], ["3ª", "Arrastar: A3; recupera PV igual ao dano não bloqueado"], ["4ª ↺1ª", "Recolher-se: B3; Fúria 1"]],
  hab: "Nunca Visto Inteiro: Exposto nele dura apenas até o fim da rodada.",
  txt: "Gedney sumiu com um trenó e um cão. Encontraram só o trenó." },

/* ---------- ATO II — A CIDADE MORTA ---------- */
{ n: "Pinguim Albino Cego", ato: 2, cat: "normal", pv: 7, comp: "dado", img: "polar/pinguins",
  acoes: [["1-3", "A1x2"], ["4-6", "Bicar a Bagagem: A1; o jogador perde 1 crédito e o pinguim ganha 2 de Bloqueio"]],
  txt: "Branco, cego, enorme, e absolutamente indiferente a vocês." },
{ n: "Sentinela Ancestral", ato: 2, cat: "normal", pv: 14, comp: "seq", img: "haeckel/amphoridea",
  acoes: [["1ª", "A3"], ["2ª", "A1; Ferida no descarte do jogador"], ["3ª ↺1ª", "A2; Fúria 1"]],
  txt: "Guarda uma porta que ninguém usa há trinta milhões de anos." },
{ n: "Escravo Protoplásmico", ato: 2, cat: "normal", pv: 13, comp: "dado", img: "haeckel/thuroidea",
  acoes: [["1-2", "A2; Debilitado 1"], ["3-4", "B3"], ["5-6", "A1x3"]],
  txt: "Um shoggoth pequeno, ainda obediente. Ainda." },
{ n: "Arquivista Cego", ato: 2, cat: "normal", pv: 11, comp: "fixo", img: "haeckel/peridinea",
  acoes: [["Sempre", "A2; Trêmulo 1"]],
  hab: "Asas Recolhidas: começa o combate com 3 de Bloqueio.",
  txt: "Velho demais para voar. Novo demais para morrer." },
{ n: "Cria Estelar Menor", ato: 2, cat: "normal", pv: 17, comp: "seq", img: "haeckel/gamochonia",
  acoes: [["1ª", "Chamado: todos os inimigos da fileira ganham 1 Fúria"], ["2ª", "A3"], ["3ª ↺2ª", "A2; Exposto 1"]],
  txt: "Os murais mostram uma guerra contra coisas assim. Os murais mentiram sobre quem venceu." },
{ n: "Guardião de Basalto", ato: 2, cat: "normal", pv: 10, comp: "dado", img: "haeckel/tetracoralla",
  acoes: [["1-2", "A2"], ["3-4", "A1x2"], ["5-6", "Fúria 1; B2"]],
  txt: "Pedra entalhada que se move quando ninguém olha." },
{ n: "Fungo de Yuggoth", ato: 2, cat: "normal", pv: 13, comp: "dado", img: "haeckel/basimycetes",
  acoes: [["1-3", "A2"], ["4-6", "A1; Abismo Interior no descarte do jogador"]],
  hab: "Carapaça Fúngica: o primeiro golpe de Ataque que recebe a cada rodada causa 1 de dano a menos.",
  txt: "Um dos antigos inimigos da cidade, ainda brotando nas frestas." },

{ n: "Shoggoth Rebelde", ato: 2, cat: "elite", pv: 31, pvj: true, comp: "seq", img: "haeckel/cyrtoidea",
  acoes: [["1ª", "Inchar: B4"], ["2ª", "Esmagar: A5"], ["3ª ↺1ª", "Transbordar: AT2x2"]],
  hab: "Massa Bruta: os ataques do Shoggoth ignoram Debilitado.",
  txt: "Lembra da revolta. Lembra de quem venceu." },
{ n: "O Escultor", ato: 2, cat: "elite", pv: 24, pvj: true, comp: "dado", img: "haeckel/stephoidea",
  acoes: [["1-2", "Moldar: um Escravo Protoplásmico com 5 PV entra na fileira do Alvo"], ["3-4", "AT2; Debilitado 1"], ["5-6", "B4; Fúria 1"]],
  txt: "Ainda grava os murais. As cenas novas mostram vocês." },
{ n: "Batedor da Cria Estelar", ato: 2, cat: "elite", pv: 26, pvj: true, comp: "seq", img: "haeckel/narcomedusae",
  acoes: [["1ª", "Garras: A2; Exposto 2"], ["2ª", "A4"], ["3ª ↺1ª", "AT1x3"]],
  hab: "Carne Estelar: na primeira vez que ficar com metade do PV ou menos, ganha 6 de Bloqueio.",
  txt: "Veio das estrelas, como as Coisas Antigas. Ao contrário delas, nunca foi embora." },

{ n: "O Mural Que Respira", ato: 2, cat: "chefe", pv: 34, pvj: true, comp: "seq", img: "montanha/cidade_condenada",
  acoes: [["1ª", "História Viva: cada jogador coloca 1 Atordoado na mão"], ["2ª", "A3x2"], ["3ª", "Pedra: B6"], ["4ª ↺1ª", "O Último Entalhe: AT5"]],
  hab: "Pedra e Carne: nas rodadas PARES, cada golpe que recebe causa no máximo 3 de dano.",
  txt: "Cinquenta milhões de anos de história em relevo. E a história ainda não acabou." },
{ n: "O Arquiteto Ancestral", ato: 2, cat: "chefe", pv: 32, pvj: true, comp: "dado", img: "montanha/castelo_distante",
  acoes: [["1-2", "AT3"], ["3-4", "A2x2; Exposto 1"], ["5-6", "Redesenhar: B5; o jogador Alvo coloca 1 Atordoado na mão"]],
  hab: "Reconstrução: na primeira vez que ficar com metade do PV ou menos, remove todas as suas condições negativas e ganha 2 Fúria.",
  txt: "Último hierarca da cidade. Ergueu estas torres e não vai deixar ninguém derrubá-las." },
{ n: "A Cria Estelar de Cthulhu", ato: 2, cat: "chefe", pv: 30, pvj: true, comp: "seq", img: "montanha/atlantida",
  acoes: [["1ª", "Prole: duas Crias Estelares Menores (PV 6 cada) entram na fileira central"], ["2ª", "A4"], ["3ª", "Tentáculo: AT2; Debilitado 1"], ["4ª ↺2ª", "B4; todos os inimigos ganham 1 Fúria"]],
  hab: "Escudo de Carne: enquanto houver Crias Estelares Menores em jogo, recebe 1 de dano a menos de cada golpe.",
  txt: "Saiu de um mural, ou de um sonho. Em R'lyeh, alguém sente a falta dela." },

/* ---------- ATO III — OS TÚNEIS DO ABISMO ---------- */
{ n: "Coisa Antiga Decapitada", ato: 3, cat: "normal", pv: 21, comp: "seq", img: "haeckel/echinidea",
  acoes: [["1ª", "B4"], ["2ª", "A3x2"], ["3ª ↺1ª", "A2; Debilitado 1"]],
  txt: "Coberta de uma película negra. Ainda anda. Não deveria." },
{ n: "Shoggoth Menor", ato: 3, cat: "normal", pv: 16, comp: "dado", img: "haeckel/spumellaria",
  acoes: [["1-2", "A4"], ["3-4", "A2x2"], ["5-6", "Engolfar: A2; 2 Lodo no descarte do jogador"]],
  hab: "Regenerar 1 (recupera 1 PV no fim de cada rodada).",
  txt: "Tekeli-li! Tekeli-li!" },
{ n: "Pinguim-Imperador Cego", ato: 3, cat: "normal", pv: 10, comp: "fixo", img: "polar/crozier",
  acoes: [["Sempre", "A2"]],
  hab: "Bando: sempre aparece com pelo menos mais um.",
  txt: "Desce as rampas em fila, calmo, como quem conhece o caminho." },
{ n: "Eco do Tekeli-li", ato: 3, cat: "normal", pv: 21, comp: "dado", img: "haeckel/acanthophracta",
  acoes: [["1-2", "A3"], ["3-4", "Ressonância: o jogador descarta 2 cartas à escolha dele no início do próximo turno"], ["5-6", "A2; Exposto 1"]],
  hab: "Semimaterial: cada golpe de Ataque que recebe causa no máximo 4 de dano.",
  txt: "Um som que ganhou corpo de tanto ser repetido." },
{ n: "Sobrevivente da Starkweather", ato: 3, cat: "normal", pv: 18, comp: "seq", img: "montanha/sombra_vermelha",
  acoes: [["1ª", "Imitação: 2 Atordoado na pilha de compra do jogador"], ["2ª", "A3"], ["3ª ↺2ª", "A1x4"]],
  txt: "Usa o casaco da expedição. Fala com a voz de um homem. Pisca para os lados." },
{ n: "Peixe Cego Abissal", ato: 3, cat: "normal", pv: 16, comp: "dado", img: "haeckel/teleostei",
  acoes: [["1-3", "A3"], ["4-6", "B3; Fúria 1"]],
  hab: "Escamas Pálidas: o primeiro golpe de Ataque que recebe a cada rodada causa 1 de dano a menos.",
  txt: "Do mar sem sol. Os dentes são a única parte que brilha." },
{ n: "Lodo Iridescente", ato: 3, cat: "normal", pv: 15, comp: "dado", img: "haeckel/cubomedusae",
  acoes: [["1-2", "A2; Necrose 2"], ["3-4", "A3"], ["5-6", "Debilitado 1; Trêmulo 1"]],
  txt: "Bolhas de todas as cores, e nenhuma delas é natural." },

{ n: "Shoggoth Adulto", ato: 3, cat: "elite", pv: 41, pvj: true, comp: "dado", img: "haeckel/siphonophorae",
  acoes: [["1-2", "AT3"], ["3-4", "Engolfar: A4; 2 Lodo no descarte do Alvo"], ["5-6", "Mil Olhos: A1x5"]],
  hab: "Regenerar 2. Amorfo: Exposto nele nunca passa de 1.",
  txt: "Uma massa de bolhas iridescentes que preenche o túnel de parede a parede." },
{ n: "O Coro dos Decapitados", ato: 3, cat: "elite", pv: 34, pvj: true, comp: "seq", img: "haeckel/stauromedusae",
  acoes: [["1ª", "B6; Fúria 1"], ["2ª", "AT2x2"], ["3ª", "A5; Debilitado 1"], ["4ª ↺1ª", "Lamento: remove suas condições negativas; B4"]],
  txt: "Cantam sem cabeça. Cantam o nome de quem os matou." },
{ n: "O Guardião do Mar Sem Sol", ato: 3, cat: "elite", pv: 37, pvj: true, comp: "dado", img: "haeckel/actiniae",
  acoes: [["1-2", "Correnteza: cada jogador descarta 1 carta à escolha"], ["3-4", "AT3"], ["5-6", "A2x3"]],
  hab: "Semimaterial: cada golpe de Ataque que recebe causa no máximo 4 de dano. Abissal: não pode receber Exposto.",
  txt: "Floresce no escuro, como uma anêmona do tamanho de uma igreja." },

{ n: "O Shoggoth Primordial", ato: 3, cat: "chefe", pv: 45, pvj: true, comp: "seq", img: "haeckel/hexacoralla",
  acoes: [["1ª", "Aproximação: B5; cada jogador coloca 1 Atordoado na mão"], ["2ª", "Pressão no Túnel: B4; Fúria 1"], ["3ª", "Atropelar: AT5"], ["4ª", "Mil Pseudópodes: A1x4"], ["5ª ↺3ª", "Tekeli-li: cada jogador recebe Debilitado 2 e Exposto 1"]],
  hab: "Massa Infinita: na primeira vez que chegar a 0 PV, recupera 6 PV por jogador e ganha 1 Fúria.",
  txt: "Vem pelo túnel como um trem de metrô feito de olhos." },
{ n: "O Abismo Que Responde", ato: 3, cat: "chefe", pv: 46, pvj: true, comp: "dado", img: "polar/gruta",
  acoes: [["1-2", "Onda: AT2x2"], ["3-4", "Profundeza: B6; Intangível 1"], ["5-6", "Engolir: A6; o Alvo coloca 2 Atordoado no descarte"]],
  hab: "Maré Repetida: no início de cada rodada, se o Dado do Presságio mostrar o mesmo número da rodada anterior, o Abismo age duas vezes.",
  txt: "O mar subterrâneo não tem fundo. Tem vontade." },
{ n: "A Mãe das Bolhas", ato: 3, cat: "chefe", pv: 46, pvj: true, comp: "seq", img: "haeckel/polycyttaria",
  acoes: [["1ª", "Brotar: um Broto de Shoggoth (PV 6, fixo: A2) entra em cada fileira"], ["2ª", "AT3"], ["3ª", "Mil Filhos: B6; todos os inimigos ganham 1 Fúria"], ["4ª ↺1ª", "A3x2; Necrose 2"]],
  hab: "Matriz: sempre que um Broto de Shoggoth morrer, a Mãe recupera 3 PV.",
  txt: "A primeira de todas. A que ensinou os outros a desobedecer." },

/* ---------- ATO IV — AS MONTANHAS MAIS ALTAS ---------- */
{ n: "Sentinela Prismática Aguda", ato: 4, cat: "elite", pv: 25, pvj: true, comp: "dado", img: "haeckel/trachomedusae",
  acoes: [["1-3", "Nota Aguda: cada jogador recebe Debilitado 1; B3"], ["4-6", "AT3"]],
  hab: "Dueto: se a Sentinela Grave morrer, ganha 3 Fúria.",
  txt: "Luz que canta. A nota é alta demais para ouvidos humanos." },
{ n: "Sentinela Prismática Grave", ato: 4, cat: "elite", pv: 25, pvj: true, comp: "seq", img: "haeckel/peromedusae",
  acoes: [["1ª", "A2x3"], ["2ª", "B5; Fúria 1"], ["3ª ↺1ª", "AT4"]],
  hab: "Dueto: se a Sentinela Aguda morrer, ganha 3 Fúria.",
  txt: "A nota grave. Vocês a sentem nos dentes." },
{ n: "O Que Danforth Viu — A Miragem", ato: 4, cat: "chefe", pv: 32, pvj: true, comp: "seq", img: "montanha/raio_roxo",
  acoes: [["1ª", "Reflexo Impossível: B6; cada jogador coloca 1 Dúvida temporária (use Atordoado) na mão"], ["2ª", "Raio Violeta: AT4"], ["3ª", "Espelho: A3x2; Exposto 1"], ["4ª ↺2ª", "Vislumbre: cada jogador perde 2 PV (ignora Bloqueio)"]],
  hab: "A Miragem se Rompe: ao chegar a 0 PV, vire a ficha: começa a Forma II (O Inominável). Todas as condições dela são removidas.",
  txt: "As montanhas refletidas no céu, de cabeça para baixo. E algo se movendo entre elas." },
{ n: "O Que Danforth Viu — O Inominável", ato: 4, cat: "chefe", pv: 38, pvj: true, comp: "dado", img: "montanha/himalaia_noite",
  acoes: [["1-2", "AT2x2"], ["3-4", "Apagar a Luz: A6; o Alvo coloca 1 Congelamento na mão"], ["5", "Fúria 2; B6"], ["6", "Revelação Total: AT1x6"]],
  hab: "Além do Tempo: no fim de cada rodada PAR, ganha 1 Fúria. Cada golpe que recebe causa no máximo 8 de dano.",
  txt: "Danforth gritou um nome. Ninguém conseguiu repeti-lo." }
];

/* ------------------------------------------------------------------ */
/* ENCONTROS                                                           */
/* ------------------------------------------------------------------ */
JOGO.encontros = [
  [1, "facil", "Motim a Bordo", ["Marinheiro Delirante"]],
  [1, "facil", "Revoada de Petréis", ["Petrel Carniceiro", "Petrel Carniceiro"]],
  [1, "facil", "Na Borda do Gelo", ["Foca-Leopardo"]],
  [1, "facil", "Degelo no Porão", ["Gosma do Degelo", "Gosma do Degelo"]],
  [1, "facil", "Cão Desgarrado", ["Cão de Trenó Enlouquecido"]],
  [1, "facil", "Carniça", ["Petrel Carniceiro", "Gosma do Degelo"]],
  [1, "dificil", "Febre a Bordo", ["Marinheiro Delirante", "Marinheiro Delirante"]],
  [1, "dificil", "O Primeiro Espécime", ["Espécime Descongelado", "Petrel Carniceiro"]],
  [1, "dificil", "Vulto na Tempestade", ["Sombra na Nevasca"]],
  [1, "dificil", "O Que Vazou do Caixote", ["Massa Protoplásmica"]],
  [1, "dificil", "Matilha Solta", ["Cão de Trenó Enlouquecido", "Cão de Trenó Enlouquecido"]],
  [1, "dificil", "Caçada na Banquisa", ["Foca-Leopardo", "Marinheiro Delirante"]],
  [1, "dificil", "Céu Escuro de Asas", ["Petrel Carniceiro", "Petrel Carniceiro", "Petrel Carniceiro"]],
  [1, "dificil", "O Acampamento de Lake", ["Espécime Descongelado", "Foca-Leopardo"]],
  [2, "facil", "Pinguins no Pátio", ["Pinguim Albino Cego", "Pinguim Albino Cego"]],
  [2, "facil", "A Porta Vigiada", ["Sentinela Ancestral"]],
  [2, "facil", "Servo Esquecido", ["Escravo Protoplásmico"]],
  [2, "facil", "Ruínas Inquietas", ["Guardião de Basalto", "Pinguim Albino Cego"]],
  [2, "dificil", "A Biblioteca de Pedra", ["Arquivista Cego", "Arquivista Cego"]],
  [2, "dificil", "Vanguarda Estelar", ["Cria Estelar Menor", "Escravo Protoplásmico"]],
  [2, "dificil", "O Portão Duplo", ["Sentinela Ancestral", "Pinguim Albino Cego"]],
  [2, "dificil", "Estátuas que Andam", ["Guardião de Basalto", "Guardião de Basalto"]],
  [2, "dificil", "Esporos nas Frestas", ["Fungo de Yuggoth", "Arquivista Cego"]],
  [2, "dificil", "O Chamado da Cria", ["Cria Estelar Menor", "Pinguim Albino Cego", "Pinguim Albino Cego"]],
  [2, "dificil", "Turno de Trabalho", ["Escravo Protoplásmico", "Escravo Protoplásmico"]],
  [2, "dificil", "Jardim Fúngico", ["Fungo de Yuggoth", "Fungo de Yuggoth"]],
  [3, "facil", "Fila nas Rampas", ["Pinguim-Imperador Cego", "Pinguim-Imperador Cego"]],
  [3, "facil", "O Corpo no Corredor", ["Coisa Antiga Decapitada"]],
  [3, "facil", "Voz Conhecida", ["Sobrevivente da Starkweather"]],
  [3, "dificil", "Túnel Vivo", ["Shoggoth Menor"]],
  [3, "dificil", "O Som que Tem Corpo", ["Eco do Tekeli-li"]],
  [3, "dificil", "Praia Subterrânea", ["Peixe Cego Abissal", "Lodo Iridescente"]],
  [3, "dificil", "Poças Brilhantes", ["Lodo Iridescente", "Lodo Iridescente"]],
  [3, "dificil", "Os Que Caíram", ["Coisa Antiga Decapitada", "Pinguim-Imperador Cego"]],
  [3, "dificil", "Expedição Perdida", ["Sobrevivente da Starkweather", "Lodo Iridescente"]],
  [3, "dificil", "O Fosso", ["Shoggoth Menor", "Pinguim-Imperador Cego"]],
  [3, "dificil", "Cardume Faminto", ["Peixe Cego Abissal", "Peixe Cego Abissal"]]
];

/* ------------------------------------------------------------------ */
/* EVENTOS (nós de Mistério "?")                                       */
/* ------------------------------------------------------------------ */
JOGO.eventos = [
  { n: "Os Seis Montes Estrelados", atos: "I", img: "polar/cabana", txt: "No acampamento abandonado de Lake, seis túmulos em forma de estrela. Todos abertos por dentro.",
    op: ["Cavar o sétimo monte: role o dado. 1–2: combate difícil do Ato I. 3–6: obtenha 1 Artefato.", "Recolher as anotações de Lake: ganhe 1 carta incolor à sua escolha entre 3 reveladas.", "Seguir em frente."] },
  { n: "O Necronomicon de Danforth", atos: "I-II-III", img: "montanha/rochas", txt: "Entre os pertences da Starkweather, a cópia que Danforth leu escondido em 1930. As margens estão cheias de estrelas desenhadas.",
    op: ["Ler: revele 3 cartas do seu baralho de Raras e adicione 1 ao seu baralho. Adicione Lembrança Proibida.", "Queimar para se aquecer: recupere 3 PV.", "Deixar onde está."] },
  { n: "O Velho Contramestre", atos: "I", img: "polar/navio_aurora", txt: "No Arkham, um marinheiro de setenta anos segura seu braço: «Eu estive no Miskatonic em 1930. Pague uma dose e eu conto o que trouxemos de volta.»",
    op: ["Pagar 2 créditos e ouvir: remova 1 carta do seu baralho e perca 2 PV (a verdade dói).", "Ignorá-lo: ele grita para o convés inteiro. Encare um combate fácil do Ato I."] },
  { n: "A Última Transmissão", atos: "I-II", img: "polar/aviao_navio", txt: "Um rádio da Starkweather-Moore ainda funciona dentro de um caixote. Alguém está chamando, com a voz do operador de rádio.",
    op: ["Responder: um jogador ganha 1 Provisão; cada jogador adiciona Sussurros.", "Desmontar o rádio: ganhe 3 créditos.", "Desligar e enterrar o caixote."] },
  { n: "O Avião de Nils Brandt", atos: "I-II", img: "polar/aviao", txt: "Um monoplano tombado na neve, com o número da expedição na fuselagem. A cabine está vazia e trancada por dentro.",
    op: ["Saquear: ganhe 1 Provisão e 2 créditos.", "Consertar o rádio de bordo: o grupo avança diretamente para qualquer nó da próxima linha do mapa, conectado ou não.", "Seguir em frente."] },
  { n: "Pinguins Que Não Têm Medo", atos: "II-III", img: "polar/pinguins", txt: "Eles passam por vocês, cegos e calmos, em fila. Estão fugindo de alguma coisa.",
    op: ["Seguir os pinguins: recupere 3 PV.", "Esperar o que vem atrás: combate contra 1 Escravo Protoplásmico por jogador. Vitória: obtenha 1 Artefato."] },
  { n: "Miragem Polar", atos: "I-II", img: "montanha/fortaleza_planicie", txt: "Uma cidade de cabeça para baixo flutua no céu. As torres são idênticas às que vocês ainda não viram.",
    op: ["Olhar com atenção: Transforme 2 cartas.", "Fechar os olhos e contar até cem: recupere 2 PV."] },
  { n: "O Diário de Lake", atos: "I", img: "polar/navio_preso", txt: "Encadernado em couro, endurecido pelo frio. As últimas páginas falam de «perfeição orgânica» e de algo que Lake não teve tempo de descrever.",
    op: ["Estudar: revele 5 cartas do seu baralho de Recompensas e adicione 1 ao seu baralho.", "Dormir na barraca de Lake: recupere 4 PV."] },
  { n: "A Gruta Azul", atos: "I-II", img: "polar/caverna", txt: "Uma caverna no gelo, iluminada por dentro com uma cor que não vem do sol.",
    op: ["Beber a água de degelo: aumente seu PV máximo em 2. Adicione Agonia ao seu baralho.", "Encher um cantil: ganhe 1 Provisão. Perca 2 PV.", "Sair da gruta."] },
  { n: "O Cemitério dos Cães", atos: "I", img: "polar/treno", txt: "Covas rasas, enfileiradas com cuidado. Uma delas tem marcas de que algo foi retirado com instrumentos cirúrgicos.",
    op: ["Investigar: role o dado. 1–2: combate difícil do Ato atual. 3–6: obtenha 1 Artefato.", "Levar uma coleira de lembrança: ganhe 4 créditos. Adicione Vergonha.", "Prestar homenagem e partir."] },
  { n: "Fóssil na Ardósia", atos: "I-II-III", img: "haeckel/crinoidea", txt: "Uma laje de ardósia pré-cambriana com a impressão de algo que tem cinco braços e não deveria existir há tanto tempo.",
    op: ["Estudar o fóssil: cada jogador Aprimora 1 carta e adiciona Sussurros.", "Deixar a laje: cada jogador perde 1 PV de frio enquanto o grupo discute."] },
  { n: "O Altar de Esteatito", atos: "II-III", img: "haeckel/asteridea", txt: "Uma pedra verde-escura polida, com uma estrela de cinco pontas no centro. Há créditos e moedas da expedição espalhados em volta, como oferendas.",
    op: ["Ofertar 5 créditos: remova 1 Trauma do seu baralho.", "Profanar: obtenha 1 Artefato. Adicione Paranoia ao seu baralho.", "Partir."] },
  { n: "O Reflexo no Gelo Polido", atos: "II-III", img: "polar/geleira_azul", txt: "A parede de gelo reflete vocês. O seu reflexo se move meio segundo depois.",
    op: ["Encarar: Transforme 1 carta.", "Quebrar o gelo: perca 2 PV; Aprimore 1 carta aleatória do seu baralho.", "Desviar o olhar."] },
  { n: "O Depósito Abandonado", atos: "II", img: "polar/terra_nova", txt: "Caixotes da Starkweather-Moore, ainda lacrados, empilhados numa praça da cidade morta.",
    op: ["Vender sangue para a enfermaria: perca 3 PV e ganhe 6 créditos.", "Trocar equipamento: descarte 1 Artefato (não inicial) e obtenha outro do topo do baralho.", "Pegar provisões: até 2 Provisões por 1 crédito cada."] },
  { n: "Os Setecentos Degraus", atos: "II", img: "montanha/passo", txt: "Uma rampa em espiral desce do centro da cidade. Não há corrimão. Lá embaixo, o ar é morno.",
    op: ["Descer com cuidado: perca 1 PV; remova 1 carta.", "Escorregar pela rampa: role o dado. 4–6: Aprimore 2 cartas. 1–3: perca 4 PV."] },
  { n: "O Mural da Revolta", atos: "II-III", img: "montanha/cidade_vale", txt: "Entalhes mostram shoggoths aprendendo a imitar seus mestres. Os traços dos últimos painéis são toscos, como se feitos por quem estava aprendendo.",
    op: ["Estudar: Aprimore 2 cartas. Adicione Lembrança Proibida.", "Fotografar: ganhe 4 créditos.", "Desviar o olhar."] },
  { n: "Câmaras Aquecidas", atos: "II-III", img: "haeckel/hexactinellae", txt: "Salas onde o calor ainda vem do chão. Camas de pedra do tamanho de barris.",
    op: ["Descansar uma noite: recupere todo o PV. Adicione Paralisia.", "Revistar as câmaras: ganhe 1 Provisão.", "Seguir viagem."] },
  { n: "A Pedra que Canta", atos: "II-III", img: "montanha/picos_pastel", txt: "Um monólito vibra com o vento nas cinco notas que vocês já conhecem.",
    op: ["Tocar: Transforme 2 cartas.", "Levar uma lasca: obtenha 1 Artefato. No próximo Achado Arqueológico, não ganhe nada.", "Partir."] },
  { n: "Sacrifício Compartilhado", atos: "I-II-III", img: "polar/crista_pressao", txt: "Uma fenda na geleira separa o grupo. Alguém precisa se arriscar primeiro.",
    op: ["Um jogador perde 3 PV: cada jogador ganha 1 Provisão.", "Dar a volta: cada jogador perde 1 crédito."] },
  { n: "O Monte Erebus Fumegante", atos: "I-III", img: "polar/sol_meia_noite", txt: "O vulcão solta fumaça no horizonte. Na encosta, uma caixa de metal com um esteatito dentro, e marcas de que algo tentou abri-la.",
    op: ["Fechar a caixa e levá-la: ganhe o Esteatito do Achado (se o grupo ainda não o tiver). Perca 2 PV.", "Estudar o esteatito: Aprimore 2 cartas. Adicione Lembrança Proibida.", "Fugir."] },
  { n: "Restos da Expedição", atos: "III", img: "polar/naufragio", txt: "Equipamento quebrado ao longo do túnel. Uma lanterna ainda acesa aponta para baixo.",
    op: ["Atravessar no escuro: role o dado. 1–3: combate difícil. 4–6: ganhe 5 créditos.", "Contornar pelos túneis laterais: perca 3 PV."] },
  { n: "Mensagem de Danforth", atos: "III", img: "montanha/montes_azuis", txt: "Num bolso, uma carta de Danforth para a irmã: «Não olhe para trás. Mas, se olhar, olhe junto com alguém.»",
    op: ["Ler em voz alta: cada jogador recupera 3 PV.", "Guardar e seguir: cada jogador Aprimora 1 carta."] }
];

/* ------------------------------------------------------------------ */
/* NÍVEIS DE LOUCURA (dificuldade progressiva — cumulativos)           */
/* ------------------------------------------------------------------ */
JOGO.loucura = [
  "Elites têm +2 PV por jogador.",
  "Criaturas começam o combate com 1 Fúria no Ato III.",
  "Chefes têm +5 PV por jogador.",
  "Ao iniciar um novo Ato, recupere apenas metade do PV perdido (arredonde para cima), em vez de tudo.",
  "Cada investigador começa com o Trauma Dúvida no baralho.",
  "Descansar recupera 2 PV em vez de 3.",
  "Elites começam o combate com 1 Fúria.",
  "Todos os preços do Depósito +1.",
  "Cada investigador começa com 1 PV máximo a menos.",
  "Chefes do Ato III e O Que Danforth Viu começam com 2 Fúria e 1 Amparo."
];
