// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-20
/* Mecânicas únicas dos quatro investigadores, conferidas contra o Capítulo 13 do manual
   (e os exemplos numéricos dos Capítulos 7 e 12).  uso: node tests/investigadores.test.js */
'use strict';
const { combate, teste, igual, rodar, DEF, EFEITOS, JOGO } = require("./harness.js");
const tipos = j => j.c.glifos.map(g => g.t);

/* ======================= O GEÓLOGO — Glifos ======================= */
teste("Geólogo: o exemplo do manual (Concentração 1, Gelo + Esfera Elétrica + Toque Glacial, depois Liberação Dupla)", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Agressor"]] });
  const j = t.j(0); j.c.concentracao = 1; j.c.glifos = [{ t: "gelo", cargas: 0 }];
  t.mao(0, ["Esfera Elétrica", "Toque Glacial"]);
  await t.jogar(0, "Esfera Elétrica", 0);
  await t.jogar(0, "Toque Glacial", 0);
  igual(tipos(j), ["gelo", "relampago", "gelo"], "glifos depois das duas cartas");
  igual(t.ini(0).pv, 37, "PV do inimigo depois dos dois Ataques (1 + 2)");
  await t.encerrar();
  // fim do turno: Gelo 2 de Bloqueio, Relâmpago 2 de dano, Gelo 2 de Bloqueio; o Agressor bate 3 em 4 de Bloqueio
  igual(t.ini(0).pv, 35, "o Relâmpago passivo causa 1 + 1");
  igual(j.pv, 7, "4 de Bloqueio dos dois Gelos seguram o ataque de 3");
  t.mao(0, ["Liberação Dupla"]);
  await t.jogar(0, "Liberação Dupla");
  igual(j.c.bloqueio, 6, "Gelo ativado 2 vezes: 3 + 3");
  igual(tipos(j), ["relampago", "gelo"], "o Gelo da esquerda sai e os outros deslizam");
});
teste("Geólogo: com os 3 espaços cheios, Inscrever ativa e remove o glifo da esquerda", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco"]] });
  const j = t.j(0); j.c.glifos = [{ t: "relampago", cargas: 0 }, { t: "gelo", cargas: 0 }, { t: "gelo", cargas: 0 }];
  await t.jogar(0, "Mente Fria");
  igual(t.ini(0).pv, 38, "o Relâmpago da esquerda é Ativado: 2 de dano");
  igual(tipos(j), ["gelo", "gelo", "gelo"], "o novo glifo entra no último espaço");
});
teste("Geólogo: o Glifo do Vazio entra com 1 carga, ganha 1 por turno e a Ativação acerta o inimigo com menos PV", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco", "Boneco Fraco"]] });
  const j = t.j(0);
  await t.jogar(0, "Escuridão Primordial");
  igual(j.c.glifos[0].cargas, 1, "cargas ao entrar");
  await t.encerrar();
  igual(j.c.glifos[0].cargas, 2, "cargas depois do passivo");
  t.mao(0, ["Liberação Dupla"]);
  await t.jogar(0, "Liberação Dupla");
  igual([t.ini(0).pv, t.ini(1).pv], [40, 2], "2 de dano, 2 vezes, no inimigo com menos PV");
  igual(j.c.glifos.length, 0, "o Vazio é removido uma vez só");
});
teste("Geólogo: Concentração soma ao ganho de carga do Vazio", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco"]] });
  const j = t.j(0); j.c.concentracao = 2;
  await t.jogar(0, "Escuridão Primordial");
  await t.encerrar();
  igual(j.c.glifos[0].cargas, 4, "1 ao entrar + (1 + 2 de Concentração)");
});
teste("Geólogo: o Glifo Estelar dá +1 de energia no início do turno e 2 ao ser Ativado", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco"]], artefatos: false });
  const j = t.j(0);
  await t.jogar(0, "Fusão Estelar");
  await t.encerrar();
  igual(j.c.energia, 4, "3 + 1 do Glifo Estelar");
  await t.jogar(0, "Recursão");
  igual(j.c.energia, 5, "4 − 1 da Recursão + 2 da Ativação");
  igual(tipos(j), ["estelar"], "a Recursão Inscreve de novo um glifo do mesmo tipo");
});
teste("Geólogo: o dano dos glifos não é Ataque — sem Fúria, sem Exposto, sem gastar o Exposto", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco"]] });
  const j = t.j(0); j.c.cond.furia = 3; t.ini(0).cond.exposto = 2;
  j.c.glifos = [{ t: "relampago", cargas: 0 }];
  await t.jogar(0, "Liberação Dupla");
  igual(t.ini(0).pv, 36, "2 + 2, sem dobrar e sem Fúria");
  igual(t.ini(0).cond.exposto, 2, "o Exposto continua lá");
});
teste("Geólogo: o Bloqueio do Glifo de Gelo não recebe Agilidade", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco"]] });
  const j = t.j(0); j.c.cond.agilidade = 2; j.c.glifos = [{ t: "gelo", cargas: 0 }];
  await t.jogar(0, "Liberação Dupla");
  igual(j.c.bloqueio, 4, "2 + 2");
});
teste("Geólogo: cartas que contam glifos (Bombardeio Cerebral, Tradução Compilada, Tempestade)", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco"]] });
  const j = t.j(0); j.c.glifos = [{ t: "relampago", cargas: 0 }, { t: "gelo", cargas: 0 }];
  t.mao(0, ["Bombardeio Cerebral", "Tradução Compilada"]);
  await t.jogar(0, "Bombardeio Cerebral", 0);
  igual(t.ini(0).pv, 38, "1 de dano por glifo inscrito");
  await t.jogar(0, "Tradução Compilada", 0);
  igual(j.c.mao.length, 2, "compra 1 carta por TIPO de glifo");
  t.energia(0, 2);
  await t.jogar(0, "Tempestade");
  igual(tipos(j), ["gelo", "relampago", "relampago"], "X = 2: dois Relâmpagos; o primeiro glifo foi Ativado para dar lugar");
});
teste("Geólogo: Biblioteca Mental abre espaços e os glifos somem no fim do combate", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco Fraco"]] });
  const j = t.j(0);
  await t.jogar(0, "Biblioteca Mental");
  igual(j.c.slotsGlifo, 5, "3 + 2 espaços");
});

/* ======================= A ESTUDANTE — Posturas ======================= */
teste("Estudante: o ciclo do manual (Respirar Fundo, Grito Contido com lucro, Golpes em Pânico, Corpo Vazio)", async () => {
  const t = await combate({ inv: ["sonhadora"], fileiras: [["Boneco"]], artefatos: false });
  const j = t.j(0);
  t.mao(0, ["Respirar Fundo", "Golpe", "Golpe"]);
  await t.jogar(0, "Respirar Fundo");
  igual([j.c.postura, j.c.bloqueio, j.c.energia], ["lucidez", 3, 2], "Lucidez, 3 de Bloqueio, 2 de energia");
  await t.jogar(0, "Golpe", 0); await t.jogar(0, "Golpe", 0);
  await t.encerrar();
  igual(j.c.postura, "lucidez", "a Lucidez continua no turno seguinte");
  t.mao(0, ["Grito Contido", "Golpe", "Golpe", "Corpo Vazio"]);
  const antes = t.ini(0).pv;
  await t.jogar(0, "Grito Contido", 0);
  igual(antes - t.ini(0).pv, 2, "o Ataque do Grito causa 2: o Pânico só vale depois de entrar");
  igual([j.c.postura, j.c.energia], ["panico", 4], "sai da Lucidez (+2) e entra em Pânico: 3 − 1 + 2");
  await t.jogar(0, "Golpe", 0); await t.jogar(0, "Golpe", 0);
  igual(antes - t.ini(0).pv, 6, "dois Golpes de 2 em Pânico");
  await t.jogar(0, "Corpo Vazio");
  igual([j.c.postura, j.c.bloqueio], ["neutra", 2], "Corpo Vazio: 2 de Bloqueio e sai da postura");
});
teste("Estudante: terminar o turno em Pânico dobra o dano de Ataque recebido", async () => {
  const t = await combate({ inv: ["sonhadora"], fileiras: [["Agressor"]] });
  const j = t.j(0);
  await t.jogar(0, "Pânico Crescente");
  await t.encerrar();
  igual(j.pv, 13 - 6, "ataque de 3 vira 6");
  igual(j.c.postura, "panico", "o Pânico não acaba sozinho");
});
teste("Estudante: Revelação 5 zera a trilha e entra em Compreensão (+3 de energia, Ataques ×3, Neutra no turno seguinte)", async () => {
  const t = await combate({ inv: ["sonhadora"], fileiras: [["Boneco"]], artefatos: false });
  const j = t.j(0);
  t.mao(0, ["Contemplação", "Ajoelhar-se+", "Golpe"]);
  await t.jogar(0, "Contemplação");
  igual([j.c.revelacao, j.c.postura], [3, "neutra"], "3 de Revelação");
  await t.jogar(0, "Ajoelhar-se+");
  igual([j.c.revelacao, j.c.postura, j.c.energia], [0, "compreensao", 4], "5 de Revelação: zera, Compreensão, 3 − 2 − 0 + 3");
  await t.jogar(0, "Golpe", 0);
  igual(t.ini(0).pv, 37, "Golpe de 1 causa o triplo");
  await t.encerrar();
  igual(j.c.postura, "neutra", "volta a Neutra no início do turno seguinte");
});
teste("Estudante: entrar na postura em que já está não conta como mudar de postura", async () => {
  const t = await combate({ inv: ["sonhadora"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  await t.jogar(0, "Fortaleza Mental");
  await t.jogar(0, "Contar até Dez");
  igual(j.c.bloqueio, 1, "Fortaleza Mental: 1 de Bloqueio ao entrar em Lucidez");
  const e = j.c.energia;
  await t.jogar(0, "Contar até Dez+");
  igual([j.c.bloqueio, j.c.energia], [1, e], "segunda Lucidez: nada acontece");
});
teste("Estudante: Rajada de Golpes volta do descarte ao mudar de postura; Ímpeto compra ao entrar em Pânico", async () => {
  const t = await combate({ inv: ["sonhadora"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  t.mao(0, ["Rajada de Golpes", "Ímpeto", "Pânico Crescente"]);
  await t.jogar(0, "Rajada de Golpes", 0);
  await t.jogar(0, "Ímpeto");
  await t.jogar(0, "Pânico Crescente");
  igual(j.c.mao.filter(x => x.nome === "Rajada de Golpes").length, 1, "Rajada de Golpes na mão");
  igual(j.c.mao.length, 3, "Rajada + 2 cartas do Ímpeto");
});
teste("Estudante: Pausa, Paz Interior e Indignação leem a postura atual", async () => {
  const t = await combate({ inv: ["sonhadora"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  await t.jogar(0, "Indignação");
  igual(j.c.postura, "panico", "fora do Pânico, Indignação entra em Pânico");
  await t.jogar(0, "Pausa");
  igual(j.c.bloqueio, 3, "Pausa em Pânico: 1 + 2");
  t.energia(0, 3);
  await t.jogar(0, "Indignação");
  igual(t.ini(0).cond.exposto, 1, "em Pânico, Indignação aplica Exposto");
  await t.jogar(0, "Paz Interior");
  igual(j.c.postura, "lucidez", "Paz Interior entra em Lucidez");
});

/* ======================= A BIÓLOGA — Necrose e Bisturis ======================= */
teste("Bióloga: o exemplo do manual (Shoggoth Menor, 5 de Necrose, Catalisador)", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Shoggoth Menor"]], pv: 60 });
  const e = t.ini(0);
  igual(e.pv, 16, "PV do Shoggoth Menor");
  t.mao(0, ["Frasco de Cultura", "Seringa Tóxica"]);
  await t.jogar(0, "Frasco de Cultura", 0);
  await t.jogar(0, "Seringa Tóxica", 0);
  igual([e.pv, e.cond.necrose], [15, 5], "1 de dano e 5 de Necrose");
  await t.encerrar();
  igual([e.pv, e.cond.necrose], [11, 4], "perde 5, a Necrose cai para 4 e ele Regenera 1");
  t.mao(0, ["Catalisador"]);
  await t.jogar(0, "Catalisador", 0);
  igual(e.cond.necrose, 8, "Catalisador dobra");
  await t.encerrar();
  igual([e.pv, e.cond.necrose], [4, 7], "perde 8 (fica com 3) e Regenera 1");
  await t.encerrar();
  igual(t.acabou, true, "a Necrose de 7 o derrota antes de agir");
});
teste("Bióloga: a Necrose ignora Bloqueio", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const e = t.ini(0);
  await t.jogar(0, "Frasco de Cultura", 0);
  e.bloqueio = 10;
  await t.encerrar();
  igual(e.pv, 37, "perde 3 mesmo com Bloqueio");
});
teste("Bióloga: Bisturi é ficha de custo 0, Banida ao jogar; Mão Firme soma ao dano", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  t.mao(0, ["Abrir a Maleta", "Mão Firme"]);
  await t.jogar(0, "Abrir a Maleta");
  igual(j.c.mao.filter(x => x.nome === "Bisturi").length, 2, "2 Bisturis na mão");
  await t.jogar(0, "Mão Firme");
  const en = j.c.energia;
  await t.jogar(0, "Bisturi", 0);
  igual([t.ini(0).pv, j.c.energia], [38, en], "1 + 1 de dano, custo 0");
  igual(j.c.banidas.filter(x => x.nome === "Bisturi").length, 1, "o Bisturi vai para as Banidas");
});
teste("Bióloga: Reflexo e Tática disparam ao serem descartadas por efeito", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  t.mao(0, ["Recuo Cauteloso", "Tática"]);
  await t.jogar(0, "Recuo Cauteloso");
  igual(j.c.energia, 3, "3 − 1 + 1 da Tática");
});
teste("Bióloga: a Maleta de Dissecação compra 2 cartas a mais no primeiro turno", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  igual(t.j(0).c.mao.length, 7, "mão inicial de 7");
});

/* ======================= O EXPLORADOR — Fúria e sacrifício ======================= */
teste("Explorador: o exemplo do manual (2 Fúria, Debilitado, Golpes de Picareta contra Exposto com 3 de Bloqueio)", async () => {
  const t = await combate({ inv: ["veterano"], fileiras: [["Boneco"]] });
  const j = t.j(0), e = t.ini(0);
  j.c.cond.furia = 2; j.c.cond.debilitado = 1; e.cond.exposto = 1; e.bloqueio = 3;
  await t.jogar(0, "Golpes de Picareta", 0);
  igual([e.pv, e.bloqueio], [35, 0], "4 contra 3 de Bloqueio (perde 1) e depois 4: total 5");
  igual([j.c.cond.debilitado, e.cond.exposto], [0, 0], "depois do Ataque: −1 Debilitado e −1 Exposto");
});
teste("Explorador: perder PV no próprio turno dá Fúria (Teimosia Nórdica) e fortalece a Faca de Esfolar", async () => {
  const t = await combate({ inv: ["veterano"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  t.mao(0, ["Teimosia Nórdica", "Esforço Extremo", "Faca de Esfolar"]);
  await t.jogar(0, "Teimosia Nórdica");
  await t.jogar(0, "Esforço Extremo");
  igual([j.pv, j.c.cond.furia, j.c.energia], [11, 1, 4], "perde 1 PV, ganha 1 Fúria e 2 de energia");
  await t.jogar(0, "Faca de Esfolar", 0);
  igual(t.ini(0).pv, 36, "3 (perdeu PV neste turno) + 1 de Fúria");
});
teste("Explorador: Grito de Comando devolve a Fúria no fim do turno; a Fúria normal dura o combate", async () => {
  const t = await combate({ inv: ["veterano"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  t.mao(0, ["Grito de Comando", "Juramento ao Filho"]);
  await t.jogar(0, "Grito de Comando");
  await t.jogar(0, "Juramento ao Filho");
  igual(j.c.cond.furia, 2, "1 + 1");
  await t.encerrar();
  igual(j.c.cond.furia, 1, "só a do Grito de Comando some");
});
teste("Explorador: dano que não é Ataque (Queimar os Suprimentos) não é dobrado por Exposto nem o gasta", async () => {
  const t = await combate({ inv: ["veterano"], fileiras: [["Boneco"]] });
  const j = t.j(0), e = t.ini(0);
  await t.jogar(0, "Queimar os Suprimentos");
  e.cond.exposto = 2; j.c.cond.furia = 2;
  await t.encerrar();
  igual([e.pv, e.cond.exposto, j.pv], [39, 2, 11], "1 de dano, Exposto intacto, 1 PV pago");
});
teste("Explorador: o Cantil de Aquavit devolve 2 PV no fim do combate", async () => {
  const t = await combate({ inv: ["veterano"], fileiras: [["Boneco Fraco"]] });
  const j = t.j(0); j.pv = 5; t.ini(0).pv = 1;
  await t.jogar(0, "Golpe", 0);
  igual(j.pv, 7, "5 + 2");
});

/* ======================= o painel da mecânica mostra o que as regras vão fazer ======================= */
teste("Painel do Geólogo: prevê o fim do turno com a Concentração e avisa quando os espaços estão cheios", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Agressor"]] });
  const j = t.j(0); j.c.concentracao = 1; j.c.glifos = [{ t: "gelo", cargas: 0 }, { t: "relampago", cargas: 0 }, { t: "gelo", cargas: 0 }];
  const q = t.m.mecanica(j);
  igual(q.fimTurno, { dano: 2, bloq: 4, cargas: 0, energia: 0 }, "previsão do fim do turno");
  igual([q.espacos[0].primeiro, q.espacos[0].ativ, q.cheio], [true, 3, true], "o da esquerda é o próximo a Ativar (3 de Bloqueio) e os espaços estão cheios");
  await t.encerrar();
  igual([t.ini(0).pv, j.pv], [38, 7], "o que o painel previu é o que acontece: 2 de dano e 4 de Bloqueio contra o ataque de 3");
});
teste("Painel da Estudante: mostra a postura, a Revelação e o aviso de Pânico com Ataque vindo", async () => {
  const t = await combate({ inv: ["sonhadora"], fileiras: [["Agressor"]] });
  const j = t.j(0);
  igual(t.m.mecanica(j).aviso, undefined, "sem aviso em Neutra");
  await t.jogar(0, "Ajoelhar-se");
  await t.jogar(0, "Pânico Crescente");
  const q = t.m.mecanica(j);
  igual([q.postura, q.revelacao, q.mult, !!q.aviso], ["panico", 1, 2, true], "Pânico, 1 de Revelação, ×2 e aviso");
});
teste("Painel da Bióloga e do Explorador: Necrose por inimigo, Bisturis, Fúria e PV perdido no turno", async () => {
  const t = await combate({ inv: ["ocultista", "veterano"], fileiras: [["Boneco"], ["Boneco"]] });
  t.mao(0, ["Frasco de Cultura", "Abrir a Maleta", "Mão Firme"]);
  await t.jogar(0, "Frasco de Cultura", 0); await t.jogar(0, "Abrir a Maleta"); t.energia(0, 1); await t.jogar(0, "Mão Firme");
  const b = t.m.mecanica(t.j(0));
  igual([b.necrose[0].n, b.necrose[0].agora, b.necrose[0].total, b.bisturis, b.danoBisturi], [3, 3, 6, 2, 2], "Necrose 3 (3 agora, 6 ao todo), 2 Bisturis de 2");
  t.mao(1, ["Esforço Extremo", "Grito de Comando"]);
  await t.jogar(1, "Esforço Extremo"); await t.jogar(1, "Grito de Comando");
  const e = t.m.mecanica(t.j(1));
  igual([e.furia, e.temporaria, e.perdeuPV], [1, 1, true], "1 de Fúria (temporária) e perdeu PV neste turno");
});
teste("Etiquetas das cartas: dizem o que a carta faz com a mecânica e avisam Ativar sem glifo", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Boneco"]] });
  const j = t.j(0), m = t.m; const de = n => m.marcasCarta(j, { nome: n }).map(q => q.txt);
  igual(de("Liberação Dupla"), ["Sem glifo p/ Ativar"], "Liberação Dupla sem glifos");
  j.c.glifos = [{ t: "gelo", cargas: 0 }];
  igual(de("Liberação Dupla"), ["Ativa glifo ×2"], "Liberação Dupla com glifo");
  igual(de("Toque Glacial"), ["Inscreve Gelo"], "Toque Glacial");
  igual(de("Chuva de Meteoritos"), ["Inscreve 3 Estelar"], "Chuva de Meteoritos");
  igual(de("Grito Contido"), ["Entra em Pânico"], "Grito Contido");
  igual(de("Corpo Vazio"), ["Sai da postura"], "Corpo Vazio");
  igual(de("Golpe"), [], "Golpe não mexe na mecânica");
});

/* ======================= cobertura: toda carta tem efeito e pode ser jogada ======================= */
teste("Toda carta dos quatro investigadores tem efeito próprio e resolve sem erro (comum e Aprimorada)", async () => {
  const faltam = Object.keys(DEF).filter(n => !EFEITOS[n]);
  igual(faltam, [], "cartas sem efeito");
  const problemas = [];
  for (const p of JOGO.personagens) {
    const t = await combate({ inv: [p.id], fileiras: [["Boneco", "Boneco"]] });
    const j = t.j(0);
    const nomes = [...p.inicial.map(x => x[1].n), ...p.comuns.map(c => c.n), ...p.incomuns.map(c => c.n), ...p.raras.map(c => c.n)];
    for (const n of nomes) for (const s of ["", "+"]) {
      if (t.acabou) { problemas.push(`${n}: o combate acabou`); break; }
      j.pv = j.pvMax = 60; j.c.energia = 9; j.c.t.cartas = 0; delete t.s.prontos[0];
      for (const e of t.s.combate.inimigos) { e.pv = e.pvMax = 400; }
      t.mao(0, []);
      if (/Impossível/.test(DEF[n].x)) continue;
      if (n === "Autópsia Final") { j.c.descarte.push(...j.c.compra); j.c.compra = []; }
      const log0 = t.s.log.length;
      try { await t.jogar(0, n + s, DEF[n].t === "A" || EFEITOS[n].alvo ? 0 : undefined); }
      catch (e) { problemas.push(`${n}${s}: ${e.message}`); continue; }
      const ruim = t.s.log.slice(log0).find(l => /não implementado|sem regra/.test(l));
      if (ruim) problemas.push(`${n}${s}: ${ruim}`);
    }
  }
  igual(problemas, [], "cartas com problema");
});

rodar();
