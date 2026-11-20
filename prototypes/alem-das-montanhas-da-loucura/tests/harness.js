// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-20
/* =====================================================================
   Bancada de testes do motor de regras, sem navegador.
   Carrega os mesmos arquivos que o index.html (menos a interface) e deixa
   um teste montar um combate, pôr cartas na mão e jogá-las uma a uma.
   uso: node tests/investigadores.test.js
   ===================================================================== */
'use strict';
const fs = require("fs"), path = require("path"), vm = require("vm");
const RAIZ = path.join(__dirname, "..");
globalThis.window = globalThis;
for (const f of ["config.js", "material/dados.js", "material/comum.js", "material/mapa.js", "js/textos.js", "js/motor.js", "js/combate.js", "js/cartas.js", "js/itens.js", "js/nos.js", "js/mecanicas.js", "js/voltar.js", "js/previa.js"]) {
  const p = path.join(RAIZ, f);
  if (fs.existsSync(p)) vm.runInThisContext(fs.readFileSync(p, "utf8"), { filename: f });
}
const pegar = nome => vm.runInThisContext(nome);
const Motor = pegar("Motor"), INIMIGO = pegar("INIMIGO"), DEF = pegar("DEF"), EFEITOS = pegar("EFEITOS"), JOGO = pegar("JOGO");

// inimigos de teste: um que não faz nada e um que ataca sempre
function bonecos() {
  INIMIGO["Boneco"] = { n: "Boneco", ato: 1, cat: "normal", pv: 40, comp: "fixo", acoes: [["Sempre", "B0"]], txt: "" };
  INIMIGO["Boneco Fraco"] = { n: "Boneco Fraco", ato: 1, cat: "normal", pv: 6, comp: "fixo", acoes: [["Sempre", "B0"]], txt: "" };
  INIMIGO["Agressor"] = { n: "Agressor", ato: 1, cat: "normal", pv: 40, comp: "fixo", acoes: [["Sempre", "A3"]], txt: "" };
}

/* Monta um combate e devolve os comandos do teste.
   op: { inv: [ids], fileiras: [[nomes de inimigo], ...], semente } */
async function combate(op) {
  let esperaAcao = null, avisar = null; const respostas = [], perguntas = [];
  const padrao = spec => {
    if (spec.tipo === "alvo") return spec.opcoes[0];
    if (spec.tipo === "cartas" || spec.tipo === "recompensa") return spec.cartas.slice(0, spec.min || 0).map(c => c.uid);
    if (spec.tipo === "vislumbrar") return { descartar: [], ordem: spec.cartas.map(c => c.uid) };
    return 0;
  };
  const io = {
    escolher(spec) { perguntas.push({ tipo: spec.tipo, titulo: spec.titulo, voltar: !!spec.voltar }); const f = respostas.shift(); return Promise.resolve(f ? f(spec) : padrao(spec)); },
    acao() { return new Promise(res => { esperaAcao = res; if (avisar) { const n = avisar; avisar = null; n(); } }); },
    evento() { }, pausa() { return Promise.resolve(); }, atualizar() { return Promise.resolve(); }, salvar() { }, abertura() { return Promise.resolve(); }
  };
  const m = new Motor(io, pegar("CONFIG"));
  bonecos();
  m.novaPartida({ semente: op.semente || 7, investigadores: op.inv, mapas: { 1: "A", 2: "A", 3: "A" }, loucura: 0, variantes: {} });
  for (const j of m.s.jogadores) { j.artefatos = op.artefatos === false ? [] : j.artefatos; if (op.pv) { j.pvMax = Math.max(j.pvMax, op.pv); j.pv = op.pv; } }
  const fileiras = op.fileiras.map((ini, i) => ({ jog: i, encontro: "teste", inimigos: ini }));
  let acabou = false;
  const fim = m.combate({ tipo: "criatura", fileiras, recompensa: "criatura" }).then(() => { acabou = true; }, e => { acabou = true; if (e !== "parar") throw e; });
  const proxima = () => new Promise(n => { if (esperaAcao) n(); else avisar = n; });
  await Promise.race([proxima(), fim]);
  const t = {
    m, s: m.s, perguntas, get acabou() { return acabou; },
    j: i => m.s.jogadores[i],
    ini: (k = 0) => m.s.combate.inimigos[k],
    // esvazia a mão e põe exatamente estas cartas ("Nome" ou "Nome+" para a Aprimorada)
    mao(i, nomes) { const j = m.s.jogadores[i]; j.c.descarte.push(...j.c.mao); j.c.mao = []; return nomes.map(n => t.dar(i, n)); },
    dar(i, nome) { const j = m.s.jogadores[i]; const apr = nome.endsWith("+"); const x = m.nova(apr ? nome.slice(0, -1) : nome, j.id, apr); j.c.mao.push(x); return x; },
    responder(...fs) { respostas.push(...fs); },
    async agir(a) { if (acabou) return; const r = esperaAcao; esperaAcao = null; r(a); await Promise.race([proxima(), fim]); },
    // joga a carta (pelo nome) da mão do investigador i; alvo = índice do inimigo na lista
    async jogar(i, nome, alvo) {
      const j = m.s.jogadores[i]; const apr = nome.endsWith("+"); const n = apr ? nome.slice(0, -1) : nome;
      let x = j.c.mao.find(y => y.nome === n && !!y.apr === apr); if (!x) x = t.dar(i, nome);
      const erro = m.podeJogar(j, x); if (erro) throw new Error(`${nome}: ${erro}`);
      const e = alvo === undefined ? (m.precisaAlvo(x) ? m.s.combate.inimigos.find(z => z.pv > 0) : null) : m.s.combate.inimigos[alvo];
      await t.agir({ tipo: "jogar", jog: i, uid: x.uid, alvo: e ? e.uid : null });
      return x;
    },
    async encerrar() { await t.agir({ tipo: "encerrarTodos" }); },
    energia(i, n) { m.s.jogadores[i].c.energia = n; }
  };
  return t;
}

/* Uma partida fora de combate, para testar nós do mapa e escolhas.
   Devolve o motor, a lista das perguntas feitas e responder(f, f, ...): cada f recebe a pergunta e devolve a resposta. */
function mesa(op) {
  const respostas = [], perguntas = [];
  const padrao = spec => {
    if (spec.tipo === "mapa" || spec.tipo === "alvo") return spec.opcoes[0];
    if (spec.tipo === "cartas" || spec.tipo === "recompensa") return spec.cartas.slice(0, spec.min || 0).map(c => c.uid);
    if (spec.tipo === "vislumbrar") return { descartar: [], ordem: spec.cartas.map(c => c.uid) };
    if (spec.tipo === "artefatos") return [];
    return 0;
  };
  const io = {
    escolher(spec) { perguntas.push({ tipo: spec.tipo, titulo: spec.titulo, voltar: !!spec.voltar, spec }); const f = respostas.shift(); return Promise.resolve(f ? f(spec) : padrao(spec)); },
    acao() { return new Promise(() => { }); }, evento() { }, pausa() { return Promise.resolve(); }, atualizar() { return Promise.resolve(); }, salvar() { }, abertura() { return Promise.resolve(); }
  };
  const m = new Motor(io, pegar("CONFIG"));
  bonecos();
  m.novaPartida({ semente: op.semente || 7, investigadores: op.inv, mapas: { 1: "A", 2: "A", 3: "A" }, loucura: 0, variantes: {} });
  return { m, s: m.s, perguntas, responder(...fs) { respostas.push(...fs); }, j: i => m.s.jogadores[i] };
}

/* ---------- mini-framework ---------- */
const testes = [];
function teste(nome, f) { testes.push([nome, f]); }
function igual(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || "valor"}: esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); }
async function rodar() {
  let ok = 0; const falhas = [];
  for (const [nome, f] of testes) {
    try { await f(); ok++; console.log("  ok   " + nome); }
    catch (e) { falhas.push([nome, e]); console.log("  FALHA " + nome + "\n         " + (e && e.message || e)); }
  }
  console.log(`\n${ok} de ${testes.length} passaram.`);
  if (falhas.length) process.exitCode = 1;
}
module.exports = { combate, mesa, VOLTAR: pegar("VOLTAR"), teste, igual, rodar, Motor, INIMIGO, DEF, EFEITOS, JOGO, pegar };
