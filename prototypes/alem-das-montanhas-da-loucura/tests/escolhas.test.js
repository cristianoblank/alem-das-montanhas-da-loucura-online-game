// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-20
/* Voltar atrás nas escolhas (js/voltar.js) e Provisões sem espaço (Cap. 10).
   uso: node tests/escolhas.test.js */
'use strict';
const { combate, mesa, VOLTAR, teste, igual, rodar } = require("./harness.js");
const voltar = () => VOLTAR;
const ultima = t => t.perguntas[t.perguntas.length - 1];

/* ======================= voltar no combate ======================= */
teste("Combate: voltar na escolha de uma carta desfaz a jogada inteira (Recuo Cauteloso)", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  t.mao(0, ["Recuo Cauteloso", "Golpe", "Defesa"]);
  t.responder(voltar);
  await t.jogar(0, "Recuo Cauteloso");
  igual(ultima(t).voltar, true, "a escolha de descarte oferece Voltar");
  igual([j.c.mao.map(x => x.nome), j.c.energia, j.c.bloqueio], [["Recuo Cauteloso", "Golpe", "Defesa"], 3, 0], "carta de volta na mão, energia e Bloqueio como antes");
  await t.jogar(0, "Recuo Cauteloso");
  igual([j.c.mao.length, j.c.energia, j.c.bloqueio], [1, 2, 2], "jogada de novo sem voltar: vale normalmente");
});
teste("Combate: depois de comprar carta não há volta (Preparação compra e depois pede o descarte)", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  t.mao(0, ["Preparação", "Golpe"]);
  await t.jogar(0, "Preparação");
  igual([ultima(t).tipo, ultima(t).voltar], ["cartas", false], "a carta comprada foi revelada: sem Voltar");
});
teste("Combate: voltar não desfaz nada que já passou (a carta anterior continua jogada)", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0);
  t.mao(0, ["Golpe", "Recuo Cauteloso", "Defesa"]);
  await t.jogar(0, "Golpe", 0);
  t.responder(voltar);
  await t.jogar(0, "Recuo Cauteloso");
  igual([t.ini(0).pv, j.c.energia, j.c.mao.length], [39, 2, 2], "o Golpe continua valendo; só o Recuo voltou");
});

teste("Combate: voltar devolve os MESMOS objetos de carta e de inimigo (quem guardou uma referência continua valendo)", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco", "Boneco Fraco"]] });
  const j = t.j(0);
  const [recuo, golpe] = t.mao(0, ["Recuo Cauteloso", "Golpe", "Defesa"]);
  const inimigos = [t.ini(0), t.ini(1)];
  t.responder(voltar);
  await t.jogar(0, "Recuo Cauteloso");
  igual([j.c.mao[0] === recuo, j.c.mao[1] === golpe], [true, true], "as cartas da mão são os mesmos objetos");
  igual([t.ini(0) === inimigos[0], t.ini(1) === inimigos[1]], [true, true], "os inimigos são os mesmos objetos");
});

/* ======================= voltar nos nós do mapa ======================= */
async function noAcampamento(t) {
  const m = t.m;
  return m.comVolta(async () => { await m.io.escolher({ tipo: "mapa", opcoes: ["x"], titulo: "mapa" }); await m.acampamento(); });
}
teste("Acampamento: Voltar na primeira escolha retorna ao mapa; Voltar no Aprimorar retorna às opções", async () => {
  const t = mesa({ inv: ["veterano", "ocultista"] });
  t.j(0).pv = 5; t.j(1).pv = 5;
  t.responder(
    () => "x",                 // mapa
    voltar,                    // menu do Explorador: volta ao mapa
    () => "x",                 // mapa de novo
    () => 1,                   // Explorador: Aprimorar
    voltar,                    // escolha da carta: volta às opções
    () => 0,                   // Explorador: Descansar
    voltar,                    // menu da Bióloga: volta ao menu do Explorador
    () => 0,                   // Explorador: Descansar de novo
    () => 0,                   // Bióloga: Descansar
    () => 0                    // trocas: seguir viagem
  );
  await noAcampamento(t);
  igual(t.perguntas.map(p => p.tipo), ["mapa", "acampamento", "mapa", "acampamento", "cartas", "acampamento", "acampamento", "acampamento", "acampamento", "opcoes"], "ordem das perguntas");
  igual(t.perguntas.map(p => p.voltar), [false, true, false, true, true, true, true, true, true, true], "onde o Voltar aparece");
  igual([t.j(0).pv, t.j(1).pv], [8, 8], "cada um descansou uma vez só: 5 + 3");
  igual(t.j(0).baralho.filter(x => x.apr).length, 0, "nenhuma carta ficou Aprimorada");
});
teste("Recompensa: cartas reveladas não deixam voltar", async () => {
  const t = mesa({ inv: ["veterano"] });
  await t.m.comVolta(async () => { await t.m.io.escolher({ tipo: "mapa", opcoes: ["x"] }); await t.m.escolherCartaRecompensa(t.j(0), t.m.revelar(t.j(0).recompensas, 3), "Recompensa"); });
  igual([ultima(t).tipo, ultima(t).voltar], ["recompensa", false], "recompensa sem Voltar");
});
teste("Depósito: Voltar em «Remover 1 carta» cancela sem cobrar; a loja revelada não deixa voltar ao mapa", async () => {
  const t = mesa({ inv: ["veterano"] });
  t.j(0).creditos = 5;
  t.responder(() => "x", () => ({ acao: "remover", jog: 0 }), voltar, () => ({ acao: "sair" }));
  await t.m.comVolta(async () => { await t.m.io.escolher({ tipo: "mapa", opcoes: ["x"] }); await t.m.deposito(); });
  igual(t.perguntas.map(p => [p.tipo, p.voltar]), [["mapa", false], ["loja", false], ["cartas", true], ["loja", false]], "perguntas e Voltar");
  igual([t.j(0).creditos, t.j(0).baralho.length], [5, 10], "nada cobrado, nada removido");
});
teste("Evento: Voltar numa escolha da opção retorna às opções do Evento, com os créditos de volta", async () => {
  const t = mesa({ inv: ["veterano"] });
  t.j(0).creditos = 4;
  t.s.baralhos.eventos = ["O Velho Contramestre"];
  t.responder(() => 0, voltar, () => 0);     // pagar 2 e remover → volta → pagar 2 e remover de verdade
  await t.m.misterio();
  igual(t.perguntas.map(p => [p.tipo, p.voltar]), [["evento", false], ["cartas", true], ["evento", false], ["cartas", true]], "perguntas e Voltar");
  igual([t.j(0).creditos, t.j(0).baralho.length], [2, 9], "pagou 2 créditos uma vez e removeu 1 carta");
});

/* ======================= Provisões ======================= */
teste("Provisão do baralho com espaço livre: a carta é mostrada e guardada", async () => {
  const t = mesa({ inv: ["veterano"] });
  t.s.baralhos.provisoes.unshift("Conhaque");
  await t.m.ganharProvisao(t.j(0));
  const p = ultima(t);
  igual([p.tipo, p.voltar, p.spec.descartar, p.spec.itens], ["provisoes", false, false, [{ nome: "Conhaque", nova: true }]], "mostra a Provisão nova");
  igual(t.j(0).provisoes, ["Conhaque"], "guardada");
});
teste("Provisão sem espaço: mostra a nova e as duas atuais; a descartada volta ao fundo do baralho", async () => {
  const t = mesa({ inv: ["veterano"] });
  const j = t.j(0); j.provisoes = ["Conhaque", "Café Forte"];
  t.s.baralhos.provisoes.unshift("Estricnina");
  t.responder(() => 1);                       // descarta o Café Forte
  await t.m.ganharProvisao(j);
  const p = ultima(t);
  igual([p.spec.descartar, p.spec.itens.map(x => x.nome), p.spec.itens.map(x => !!x.nova)], [true, ["Conhaque", "Café Forte", "Estricnina"], [false, false, true]], "as três cartas na escolha");
  igual(j.provisoes, ["Conhaque", "Estricnina"], "ficou com Conhaque e a nova");
  igual(t.s.baralhos.provisoes[t.s.baralhos.provisoes.length - 1], "Café Forte", "a descartada foi para o fundo");
});
teste("Provisão sem espaço: pode descartar a nova e ficar com as que tinha", async () => {
  const t = mesa({ inv: ["veterano"] });
  const j = t.j(0); j.provisoes = ["Conhaque", "Café Forte"];
  t.s.baralhos.provisoes.unshift("Estricnina");
  t.responder(() => 2);
  await t.m.ganharProvisao(j);
  igual(j.provisoes, ["Conhaque", "Café Forte"], "nada muda");
});
teste("Depósito: comprar Provisão sem espaço abre a troca, e Voltar desfaz a compra", async () => {
  const t = mesa({ inv: ["veterano"] });
  const j = t.j(0); j.provisoes = ["Conhaque", "Café Forte"]; j.creditos = 5;
  t.responder(() => "x", () => ({ acao: "provisao", jog: 0, i: 0 }), voltar, () => ({ acao: "sair" }));
  await t.m.comVolta(async () => { await t.m.io.escolher({ tipo: "mapa", opcoes: ["x"] }); await t.m.deposito(); });
  igual(t.perguntas.map(p => [p.tipo, p.voltar]), [["mapa", false], ["loja", false], ["provisoes", true], ["loja", false]], "perguntas e Voltar");
  igual([j.creditos, j.provisoes], [5, ["Conhaque", "Café Forte"]], "créditos e Provisões como antes");
});

rodar();
