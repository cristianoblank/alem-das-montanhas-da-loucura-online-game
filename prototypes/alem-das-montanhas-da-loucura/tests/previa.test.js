// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-20
/* Prévia «a seco» (js/previa.js): a prévia tem de dizer exatamente o que a jogada faz e não pode deixar rastro.
   uso: node tests/previa.test.js */
'use strict';
const { combate, teste, igual, rodar, DEF, EFEITOS, JOGO } = require("./harness.js");
const retrato = t => JSON.stringify([t.s, t.m.uid, t.m.revel, !!t.m.simulando]);
const resumoIni = t => t.s.combate.inimigos.map(e => [e.uid, Math.max(0, e.pv), e.bloqueio]);

/* ======================= uma carta ======================= */
teste("Prévia de Golpe: mostra o dano, o Bloqueio gasto e o PV final, e não muda nada na mesa", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0); const [golpe] = t.mao(0, ["Golpe", "Defesa"]);
  t.ini(0).bloqueio = 2; j.c.cond.furia = 5;       // Golpe da Bióloga: 1 de dano, +5 da Fúria
  const antes = retrato(t);
  const p = await t.m.previaCarta(j, golpe.uid, t.ini(0).uid);
  igual(retrato(t), antes, "a mesa ficou idêntica");
  igual([p.corte, p.erro], [null, null], "prévia completa");
  igual(p.inimigos.map(e => [e.pv0, e.pv1, e.bloq0, e.bloq1, e.golpes, e.morre]), [[40, 36, 2, 0, [{ n: 6, bloq: 2, resto: 4 }], false]], "6 de dano: 2 no Bloqueio, 4 no PV");
  await t.jogar(0, "Golpe", 0);
  igual([t.ini(0).pv, t.ini(0).bloqueio], [36, 0], "a jogada de verdade dá o mesmo");
});
teste("Prévia usa a regra do alvo Exposto: o dano do Ataque dobra", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0); const [golpe] = t.mao(0, ["Golpe"]);
  j.c.cond.furia = 2; t.ini(0).cond.exposto = 1;
  const p = await t.m.previaCarta(j, golpe.uid, t.ini(0).uid);
  igual([p.inimigos[0].golpes, p.inimigos[0].pv1, p.inimigos[0].cond], [[{ n: 6, bloq: 0, resto: 6 }], 34, { exposto: -1 }], "(1 + 2) × 2 = 6, e o Exposto é consumido");
});
teste("Prévia mostra a morte do inimigo e o Bloqueio ganho pelo investigador", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco Fraco", "Boneco"]] });
  const j = t.j(0); const [golpe, defesa] = t.mao(0, ["Golpe", "Defesa"]);
  t.ini(0).pv = 1;
  const p = await t.m.previaCarta(j, golpe.uid, t.ini(0).uid);
  igual([p.inimigos.length, p.inimigos[0].morre, p.inimigos[0].pv1], [1, true, 0], "o Boneco Fraco com 1 PV morre");
  const q = await t.m.previaCarta(j, defesa.uid);
  igual([q.jogadores[0].bloq0, q.jogadores[0].bloq1 > 0, q.inimigos.length], [0, true, 0], "Defesa: ganha Bloqueio, nenhum inimigo afetado");
  igual([t.ini(0).pv, j.c.bloqueio], [1, 0], "nada aconteceu de verdade");
});
teste("Prévia não revela carta escondida: Preparação é cortada na compra, e a pilha de compra fica intacta", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0); const [prep] = t.mao(0, ["Preparação", "Golpe"]);
  const compra = j.c.compra.map(x => x.uid);
  const antes = retrato(t);
  const p = await t.m.previaCarta(j, prep.uid);
  igual(p.corte, "revelacao", "cortada ao comprar");
  igual([retrato(t) === antes, j.c.compra.map(x => x.uid)], [true, compra], "mesa e pilha de compra intactas");
});
teste("Prévia de carta que não dá para jogar: não existe", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco"]] });
  const j = t.j(0); const [golpe] = t.mao(0, ["Golpe"]);
  j.c.energia = 0;
  igual(await t.m.previaCarta(j, golpe.uid, t.ini(0).uid), null, "sem energia: sem prévia");
});
teste("Prévia não troca os objetos da mesa (cartas, inimigos e investigadores continuam os mesmos)", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Boneco", "Boneco Fraco"]] });
  const j = t.j(0); const [golpe, defesa] = t.mao(0, ["Golpe", "Defesa"]);
  const e0 = t.ini(0), e1 = t.ini(1), c = j.c;
  await t.m.previaCarta(j, golpe.uid, e1.uid);
  igual([j.c === c, j.c.mao[0] === golpe, j.c.mao[1] === defesa, t.ini(0) === e0, t.ini(1) === e1], [true, true, true, true, true], "mesmos objetos");
});

/* ======================= todas as cartas: a prévia bate com a jogada ======================= */
teste("Para toda carta dos quatro investigadores, a prévia completa é igual ao resultado da jogada e não deixa rastro", async () => {
  const problemas = []; let completas = 0, cortadas = 0;
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
      const x = t.dar(0, n + s);
      if (t.m.podeJogar(j, x)) continue;
      const alvo = DEF[n].t === "A" || EFEITOS[n].alvo ? t.ini(0).uid : null;
      const antes = retrato(t);
      let pv;
      try { pv = await t.m.previaCarta(j, x.uid, alvo); } catch (e) { problemas.push(`${n}${s}: a prévia lançou ${e.message}`); continue; }
      if (retrato(t) !== antes) { problemas.push(`${n}${s}: a prévia mudou a mesa`); continue; }
      if (!pv) { if (!t.m.precisaAlvo(x) || alvo) problemas.push(`${n}${s}: sem prévia`); continue; }
      if (pv.erro) { problemas.push(`${n}${s}: erro na prévia: ${pv.erro.message}`); continue; }
      const nPerg = t.perguntas.length, revel = t.m.revel;
      await t.agir({ tipo: "jogar", jog: 0, uid: x.uid, alvo });
      if (pv.corte) { cortadas++; if (t.perguntas.length === nPerg && t.m.revel === revel) problemas.push(`${n}${s}: cortada (${pv.corte}) sem pergunta nem revelação na jogada`); continue; }
      completas++;
      if (t.perguntas.length !== nPerg || t.m.revel !== revel) { problemas.push(`${n}${s}: prévia completa, mas a jogada perguntou ou revelou algo`); continue; }
      const previsto = t.s.combate.inimigos.map(e => { const q = pv.inimigos.find(y => y.uid === e.uid); return q ? [e.uid, q.pv1, q.bloq1] : [e.uid, 400, 0]; });
      if (JSON.stringify(previsto) !== JSON.stringify(resumoIni(t))) problemas.push(`${n}${s}: inimigos previstos ${JSON.stringify(previsto)}, de verdade ${JSON.stringify(resumoIni(t))}`);
      const q = pv.jogadores[0];
      if (q.pv1 !== j.pv || q.bloq1 !== j.c.bloqueio || q.postura1 !== j.c.postura) problemas.push(`${n}${s}: investigador previsto PV ${q.pv1} Bloqueio ${q.bloq1} ${q.postura1}, de verdade PV ${j.pv} Bloqueio ${j.c.bloqueio} ${j.c.postura}`);
    }
  }
  console.log(`         (${completas} prévias completas conferidas com a jogada; ${cortadas} cortadas por compra, sorteio ou escolha)`);
  igual(problemas, [], "cartas com problema");
});

/* ======================= a rodada ======================= */
teste("Previsão da rodada: golpe do inimigo sem Bloqueio, e a rodada de verdade dá o mesmo", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Agressor"]] });
  const j = t.j(0); const pv0 = j.pv;
  const antes = retrato(t);
  const r = await t.m.previsaoRodada();
  igual(retrato(t), antes, "a mesa ficou idêntica");
  igual([r.jogadores[0].vem, r.jogadores[0].segura, r.jogadores[0].perde], [3, 0, 3], "vêm 3, o Bloqueio segura 0, perde 3 PV");
  await t.encerrar();
  igual(pv0 - j.pv, 3, "perdeu 3 PV de verdade");
});
teste("Previsão da rodada conta o Bloqueio que o investigador já tem", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Agressor"]] });
  const j = t.j(0); const pv0 = j.pv;
  j.c.bloqueio = 5;
  const r = await t.m.previsaoRodada();
  igual([r.jogadores[0].vem, r.jogadores[0].segura, r.jogadores[0].perde], [3, 3, 0], "vêm 3, o Bloqueio segura 3, não perde PV");
  await t.encerrar();
  igual(pv0 - j.pv, 0, "não perdeu PV de verdade");
});
teste("Previsão da rodada conta o que acontece no fim do turno (passivo do Glifo de Gelo do Geólogo)", async () => {
  const t = await combate({ inv: ["professor"], fileiras: [["Agressor"]] });
  const j = t.j(0); const pv0 = j.pv;
  await t.m.inscrever(j, "gelo");
  const passivo = t.m.valorGlifo(j, j.c.glifos[0], "pass");
  const r = await t.m.previsaoRodada();
  igual([r.jogadores[0].vem, r.jogadores[0].segura, r.jogadores[0].perde], [3, Math.min(3, passivo), 3 - Math.min(3, passivo)], "o Bloqueio do Gelo entra na conta");
  await t.encerrar();
  igual(pv0 - j.pv, r.jogadores[0].perde, "a rodada de verdade dá o mesmo");
});
teste("Previsão da rodada com dois investigadores: cada um recebe a conta da sua fileira", async () => {
  const t = await combate({ inv: ["veterano", "ocultista"], fileiras: [["Agressor"], ["Boneco"]] });
  const r = await t.m.previsaoRodada();
  igual(r.jogadores.map(q => [q.vem, q.perde]), [[3, 3], [0, 0]], "só o Explorador apanha");
});

/* ======================= fases da rodada (a faixa que a tela mostra) ======================= */
teste("O motor avisa a tela das fases: turno dos inimigos e Presságio da rodada seguinte (com o dado), nesta ordem", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Agressor"]] });
  const ev = []; t.m.io.evento = e => { if (e.tipo === "fase") ev.push(e); };
  igual(t.s.faseRodada, "jogadores", "parado no turno dos investigadores");
  await t.encerrar();
  igual(ev.map(e => [e.fase, e.rodada]), [["inimigos", 1], ["pressagio", 2]], "fases avisadas");
  igual([ev[1].dado === t.s.combate.dado, t.s.faseRodada], [true, "jogadores"], "o aviso leva o dado; a fase volta a ser a dos investigadores");
});
teste("A previsão da rodada não avisa fase nenhuma à tela nem muda a fase da partida", async () => {
  const t = await combate({ inv: ["ocultista"], fileiras: [["Agressor"]] });
  const ev = []; t.m.io.evento = e => { if (e.tipo === "fase") ev.push(e); };
  await t.m.previsaoRodada();
  igual([ev.length, t.s.faseRodada], [0, "jogadores"], "nenhum aviso; fase intacta");
});

rodar();
