// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
/* =====================================================================
   NÓS DO MAPA (Capítulo 10) E EVENTOS (Apêndice E)
   ===================================================================== */
'use strict';
(function () {
const M = globalThis;
const PRECO_CARTA = { C: 3, I: 4, R: 6, X: 4 };
const PRECO_ART = { Comum: 5, Incomum: 6, Raro: 8, "Depósito": 6 };

Object.assign(M.Motor.prototype, {
  /* ---------------- MISTÉRIO ---------------- */
  async misterio() {
    const s = this.s, B = s.baralhos;
    s.fase = "evento";
    for (const j of this.vivos()) await this.disparar("entrarMisterio", j, {});
    if (this.V.misterios) {
      const d = this.d6(); this.log(`Mistérios Imprevisíveis: o dado mostra ${d}.`);
      if (d === 1) return this.combateCriatura({ contaPrimeiros: true });
      if (d === 6) return this.deposito();
    }
    const valido = n => { const ev = JOGO.eventos.find(e => e.n === n); return ev.atos.split("-").includes(ROMANO[s.ato]); };
    const puxar = () => { for (let i = 0; i < B.eventos.length; i++) { const n = B.eventos.shift(); if (valido(n)) return n; B.eventos.push(n); } return null; };
    let nome = puxar();
    if (this.vivos().some(j => this.temArt(j, "Bússola Desregulada"))) {
      const outro = puxar();
      if (outro) {
        const r = await this.io.escolher({ tipo: "opcoes", titulo: "Bússola Desregulada: escolha 1 Evento", opcoes: [{ rotulo: nome }, { rotulo: outro }] });
        const fica = r === 0 ? nome : outro, volta = r === 0 ? outro : nome; B.eventos.push(volta); nome = fica;
      }
    }
    if (!nome) { this.log("Nenhum evento disponível."); return; }
    const ev = JOGO.eventos.find(e => e.n === nome);
    this.log(`Mistério: «${nome}».`, "titulo");
    const impl = M.EVENTOS[nome];
    const grupo = i => /cada jogador|um jogador|combate|o grupo avança/.test(ev.op[i]);
    const ordem = []; for (let i = 0; i < s.jogadores.length; i++) { const j = s.jogadores[(s.olhar + i) % s.jogadores.length]; if (!j.fora) ordem.push(j); }
    let decidiuGrupo = false;
    for (let k = 0; k < ordem.length && !decidiuGrupo; k++) {
      const j = ordem[k];
      const opcoes = ev.op.map((t, i) => ({ rotulo: t, desabilitada: (k > 0 && grupo(i)) || (impl.pode && impl.pode[i] && !impl.pode[i].call(this, j)), grupo: grupo(i) }));
      const r = await this.io.escolher({ tipo: "evento", evento: nome, jog: this.idx(j), titulo: nome, texto: ev.txt, opcoes, img: ev.img, quem: k === 0 ? `${j.nome} tem o Olhar do Abismo: escolhe primeiro (opções do grupo valem para todos)` : `${j.nome} escolhe a própria opção` });
      this.log(`${grupo(r) ? "O grupo" : j.nome} escolhe: ${ev.op[r]}`);
      if (grupo(r)) { decidiuGrupo = true; await impl.op[r].call(this, null, ordem); }
      else await impl.op[r].call(this, j, ordem);
      if (s.fim) return;
    }
    B.eventos.push(nome);
  },
  async combateDeEvento(dificil, extra) { return this.combateCriatura({ dificil, contaPrimeiros: false, recompensa: "criatura", extraVitoria: extra }); },
  async revelarEscolherIncolor(j, n) {
    const B = this.s.baralhos; const rev = B.incolores.splice(0, n);
    const r = await this.io.escolher({ tipo: "recompensa", jog: this.idx(j), cartas: rev.map((nome, i) => ({ uid: "i" + i, nome, dono: "incolor" })), min: 0, max: 1, titulo: "Escolha 1 carta Incolor" });
    rev.forEach((nome, i) => { if (r.includes("i" + i)) { j.baralho.push(this.nova(nome, "incolor")); this.log(`${j.nome} adiciona ${nome}.`); } else B.incolores.push(nome); });
  },

  /* ---------------- ACAMPAMENTO ---------------- */
  async acampamento() {
    const s = this.s; s.fase = "acampamento";
    for (const j of this.vivos()) await this.disparar("entrarAcampamento", j, {});
    for (const j of this.vivos()) {
      const desc = this.louc(6) ? 2 : (this.cfgv("descanso") ?? 3);
      const opc = [
        { rotulo: `Descansar: recupere ${desc} PV`, desabilitada: this.temArt(j, "Lâmpada Ancestral") || j.pv >= j.pvMax && false },
        { rotulo: "Aprimorar: Aprimore 1 carta do seu baralho" },
        { rotulo: "Buscar o Esteatito do Acampamento (abre mão da sua ação)", desabilitada: s.esteatitos.acampamento || s.ato === 4 }
      ];
      const r = await this.io.escolher({ tipo: "acampamento", jog: this.idx(j), titulo: `Acampamento — ${j.nome}`, texto: `PV ${j.pv}/${j.pvMax}`, opcoes: opc });
      if (r === 0) await this.curar(j, desc);
      if (r === 1) await this.aprimorarEscolha(j, `${j.nome}: Aprimore 1 carta`);
      if (r === 2) { s.esteatitos.acampamento = true; this.log("O grupo ganha o Esteatito do Acampamento."); }
    }
    await this.trocasForaDeCombate("No Acampamento, os investigadores podem trocar Provisões e créditos.");
  },
  async trocasForaDeCombate(texto) {
    if (this.vivos().length < 2) return;
    while (true) {
      const [a, b] = this.vivos();
      const opc = [{ rotulo: "Seguir viagem" }];
      if (a.creditos > 0) opc.push({ rotulo: `${a.nome} dá 1 crédito a ${b.nome}`, k: "ca" });
      if (b.creditos > 0) opc.push({ rotulo: `${b.nome} dá 1 crédito a ${a.nome}`, k: "cb" });
      if (this.s.fase === "acampamento") {
        a.provisoes.forEach((p, i) => { if (b.provisoes.length < b.slotsProv) opc.push({ rotulo: `${a.nome} passa ${p} para ${b.nome}`, k: "pa" + i }); });
        b.provisoes.forEach((p, i) => { if (a.provisoes.length < a.slotsProv) opc.push({ rotulo: `${b.nome} passa ${p} para ${a.nome}`, k: "pb" + i }); });
      }
      if (opc.length === 1) return;
      const r = await this.io.escolher({ tipo: "opcoes", titulo: "Trocas", texto, opcoes: opc, opcional: true });
      const k = opc[r].k; if (!k) return;
      if (k === "ca") { a.creditos--; b.creditos++; } if (k === "cb") { b.creditos--; a.creditos++; }
      if (k.startsWith("pa")) b.provisoes.push(a.provisoes.splice(+k.slice(2), 1)[0]);
      if (k.startsWith("pb")) a.provisoes.push(b.provisoes.splice(+k.slice(2), 1)[0]);
    }
  },

  /* ---------------- DEPÓSITO ---------------- */
  precoDeposito(j, base) { let p = base; if (this.temArt(j, "Carteira de Sócio da Miskatonic")) p -= 1; if (this.louc(8)) p += 1; return Math.max(0, p); },
  async deposito() {
    const s = this.s, B = s.baralhos; s.fase = "deposito";
    const loja = { porJog: {}, incolores: B.incolores.splice(0, 2), artefatos: B.artefatos.splice(0, 3), dep: B.deposito.splice(0, 1), provisoes: B.provisoes.splice(0, 3), removeu: {} };
    for (const j of this.vivos()) loja.porJog[this.idx(j)] = { cartas: j.recompensas.splice(0, 3), rara: j.raras.splice(0, 1) };
    this.s.loja = loja;
    while (true) {
      const r = await this.io.escolher({ tipo: "loja", titulo: "Depósito — lançamento aéreo de suprimentos", loja });
      if (!r || r.acao === "sair") break;
      const j = s.jogadores[r.jog];
      const pagar = p => { if (j.creditos < p) { this.log(`${j.nome} não tem créditos suficientes.`); return false; } j.creditos -= p; return true; };
      const kit = this.temArt(j, "Kit de Manutenção");
      if (r.acao === "carta") {
        const pj = loja.porJog[r.jog]; const lista = r.rara ? pj.rara : pj.cartas; const nome = lista[r.i]; if (!nome) continue;
        if (!pagar(this.precoDeposito(j, PRECO_CARTA[M.DEF[nome].rar]))) continue;
        lista.splice(r.i, 1); j.baralho.push(this.nova(nome, j.id, kit)); this.log(`${j.nome} compra ${nome}${kit ? " (Aprimorada)" : ""}.`);
      }
      if (r.acao === "incolor") { const nome = loja.incolores[r.i]; if (!nome || !pagar(this.precoDeposito(j, 4))) continue; loja.incolores.splice(r.i, 1); j.baralho.push(this.nova(nome, "incolor", kit)); this.log(`${j.nome} compra ${nome}.`); }
      if (r.acao === "artefato") { const lista = r.dep ? loja.dep : loja.artefatos; const nome = lista[r.i]; if (!nome) continue; if (!pagar(this.precoDeposito(j, PRECO_ART[M.ARTEFATOS[nome].classe]))) continue; lista.splice(r.i, 1); await this.obterArtefato(j, nome); }
      if (r.acao === "provisao") { const nome = loja.provisoes[r.i]; if (!nome) continue; if (j.provisoes.length >= j.slotsProv) { this.log("Sem espaço de Provisão."); continue; } if (!pagar(this.precoDeposito(j, 2))) continue; loja.provisoes.splice(r.i, 1); await this.ganharProvisao(j, nome); }
      if (r.acao === "remover") { if (loja.removeu[r.jog]) continue; if (j.creditos < this.precoDeposito(j, 3)) { this.log("Créditos insuficientes."); continue; } const x = await this.removerCartaEscolha(j, `${j.nome}: remova 1 carta (${this.precoDeposito(j, 3)} créditos)`); if (x) { j.creditos -= this.precoDeposito(j, 3); loja.removeu[r.jog] = true; } }
      if (r.acao === "credito") { const outro = s.jogadores[r.para]; if (j.creditos > 0) { j.creditos--; outro.creditos++; } }
    }
    // itens não comprados voltam para o fundo
    for (const [ji, pj] of Object.entries(loja.porJog)) { const j = s.jogadores[ji]; j.recompensas.push(...pj.cartas); j.raras.push(...pj.rara); }
    B.incolores.push(...loja.incolores); B.artefatos.push(...loja.artefatos); B.deposito.push(...loja.dep); B.provisoes.push(...loja.provisoes);
    this.s.loja = null;
  },

  /* ---------------- ACHADO ARQUEOLÓGICO ---------------- */
  async achado() {
    const s = this.s; s.fase = "achado";
    let pegouEsteatito = false;
    for (const j of this.vivos()) {
      if (this.temArt(j, "Ídolo da Cria Estelar")) await this.adicionarTrauma(j);
      if (j.achadoVazio) { j.achadoVazio = false; this.log(`${j.nome} não ganha nada neste Achado (Pedra que Canta).`); continue; }
      const opc = [{ rotulo: "Obter 1 Artefato do topo do baralho" }, { rotulo: "Abrir mão do Artefato: o grupo pega o Esteatito do Achado", desabilitada: s.esteatitos.achado || pegouEsteatito }];
      const r = await this.io.escolher({ tipo: "opcoes", jog: this.idx(j), titulo: `Achado Arqueológico — ${j.nome}`, texto: "Fósseis e relíquias da cidade.", opcoes: opc });
      if (r === 0) await this.ganharArtefato(j); else { pegouEsteatito = true; s.esteatitos.achado = true; this.log("O grupo ganha o Esteatito do Achado."); }
    }
  }
});

/* =====================================================================
   EVENTOS — op[i](j, ordem): j = investigador (opção individual) ou null (opção do grupo)
   ===================================================================== */
const cada = async (m, ordem, f) => { for (const j of ordem) { if (j.fora) continue; await f(j); if (m.s.fim) return; } };
const nada = async function () { };
// rolagem por jogador; quem tira o número ruim leva o grupo ao combate
async function rolarCombateOuPremio(m, ordem, ruim, premio, dificilAtoAtual) {
  let combate = false;
  await cada(m, ordem, async j => { const d = m.d6(); m.log(`${j.nome} rola ${d}.`); if (ruim(d)) combate = true; else await premio(j); });
  if (combate) { m.log("O grupo enfrenta um combate difícil."); await m.combateDeEvento(true); }
}
const EVENTOS = {
  "Os Seis Montes Estrelados": { op: [
    async function (j, o) { await rolarCombateOuPremio(this, j ? [j] : o, d => d <= 2, x => this.ganharArtefato(x)); },
    async function (j) { await this.revelarEscolherIncolor(j, 3); }, nada] },
  "O Necronomicon de Danforth": { op: [
    async function (j) { const rev = this.revelar(j.raras, 3).map(n => ({ rara: n })); await this.escolherCartaRecompensa(j, rev, "Ler: adicione 1 Rara ao seu baralho", { max: 1 }); await this.adicionarTrauma(j, "Lembrança Proibida"); },
    async function (j) { await this.curar(j, 3); }, nada] },
  "O Velho Contramestre": { pode: [function (j) { return j.creditos >= 2; }], op: [
    async function (j) { j.creditos -= 2; await this.removerCartaEscolha(j, "Remova 1 carta do seu baralho"); await this.perderPV(j, 2, { fonte: "evento" }); },
    async function () { await this.combateDeEvento(false); }] },
  "A Última Transmissão": { op: [
    async function (j, o) { const quem = await this.escolherAliadoGrupo(o, "Qual jogador ganha a Provisão?"); await this.ganharProvisao(quem); await cada(this, o, x => this.adicionarTrauma(x, "Sussurros")); },
    async function (j) { this.ganharCreditos(j, 3); }, nada] },
  "O Avião de Nils Brandt": { op: [
    async function (j) { await this.ganharProvisao(j); this.ganharCreditos(j, 2); },
    async function () { this.s.saltoLivre = true; this.log("O grupo pode avançar para qualquer nó da próxima linha."); }, nada] },
  "Pinguins Que Não Têm Medo": { op: [
    async function (j) { await this.curar(j, 3); },
    async function (j, o) {
      const fileiras = o.map(x => ({ jog: this.idx(x), encontro: "Pinguins Que Não Têm Medo", inimigos: ["Escravo Protoplásmico"] }));
      await this.combate({ tipo: "criatura", fileiras, recompensa: "criatura", extraVitoria: async function () { for (const x of this.vivos()) await this.ganharArtefato(x); } });
    }] },
  "Miragem Polar": { op: [async function (j) { await this.transformarEscolha(j, "Transforme 1 carta", 2); }, async function (j) { await this.curar(j, 2); }] },
  "O Diário de Lake": { op: [
    async function (j) { const rev = this.revelar(j.recompensas, 5); await this.escolherCartaRecompensa(j, rev, "Estudar: adicione 1 carta ao seu baralho"); },
    async function (j) { await this.curar(j, 4); }] },
  "A Gruta Azul": { op: [
    async function (j) { j.pvMax += 2; this.log(`PV máximo de ${j.nome}: ${j.pvMax}.`); await this.adicionarTrauma(j, "Agonia"); },
    async function (j) { await this.ganharProvisao(j); await this.perderPV(j, 2, { fonte: "evento" }); }, nada] },
  "O Cemitério dos Cães": { op: [
    async function (j, o) { await rolarCombateOuPremio(this, j ? [j] : o, d => d <= 2, x => this.ganharArtefato(x)); },
    async function (j) { this.ganharCreditos(j, 4); await this.adicionarTrauma(j, "Vergonha"); }, nada] },
  "Fóssil na Ardósia": { op: [
    async function (j, o) { await cada(this, o, async x => { await this.aprimorarEscolha(x, `${x.nome}: Aprimore 1 carta`); await this.adicionarTrauma(x, "Sussurros"); }); },
    async function (j, o) { await cada(this, o, x => this.perderPV(x, 1, { fonte: "evento" })); }] },
  "O Altar de Esteatito": { pode: [function (j) { return j.creditos >= 5 && j.baralho.some(x => M.DEF[x.nome].t === "T" && x.nome !== "Maldição do Livro"); }], op: [
    async function (j) { j.creditos -= 5; await this.removerCartaEscolha(j, "Remova 1 Trauma", x => M.DEF[x.nome].t === "T"); },
    async function (j) { await this.ganharArtefato(j); await this.adicionarTrauma(j, "Paranoia"); }, nada] },
  "O Reflexo no Gelo Polido": { op: [
    async function (j) { await this.transformarEscolha(j, "Transforme 1 carta"); },
    async function (j) { await this.perderPV(j, 2, { fonte: "evento" }); if (!this.s.fim) this.aprimorarAleatoria(j); }, nada] },
  "O Depósito Abandonado": { pode: [null, function (j) { return j.artefatos.some(a => M.ARTEFATOS[a.nome].classe !== "Inicial"); }, function (j) { return j.creditos >= 1; }], op: [
    async function (j) { await this.perderPV(j, 3, { fonte: "evento" }); if (!this.s.fim) this.ganharCreditos(j, 6); },
    async function (j) {
      const opc = j.artefatos.filter(a => M.ARTEFATOS[a.nome].classe !== "Inicial");
      const r = await this.io.escolher({ tipo: "artefatos", jog: this.idx(j), artefatos: opc.map(a => a.nome), min: 1, max: 1, titulo: "Descarte 1 Artefato (não inicial)" });
      const i = j.artefatos.findIndex(a => a.nome === r[0]); const fora = j.artefatos.splice(i, 1)[0]; this.s.baralhos.artefatos.push(fora.nome);
      await this.ganharArtefato(j);
    },
    async function (j) { for (let k = 0; k < 2 && j.creditos >= 1; k++) { const r = await this.io.escolher({ tipo: "opcoes", titulo: `Pegar provisões (${k + 1}/2)`, opcoes: [{ rotulo: "Pegar 1 Provisão por 1 crédito" }, { rotulo: "Parar" }] }); if (r === 1) break; j.creditos--; await this.ganharProvisao(j); } }] },
  "Os Setecentos Degraus": { op: [
    async function (j) { await this.perderPV(j, 1, { fonte: "evento" }); if (!this.s.fim) await this.removerCartaEscolha(j, "Remova 1 carta"); },
    async function (j) { const d = this.d6(); this.log(`${j.nome} rola ${d}.`); if (d >= 4) await this.aprimorarEscolha(j, "Aprimore", 2); else await this.perderPV(j, 4, { fonte: "evento" }); }] },
  "O Mural da Revolta": { op: [
    async function (j) { await this.aprimorarEscolha(j, "Aprimore", 2); await this.adicionarTrauma(j, "Lembrança Proibida"); },
    async function (j) { this.ganharCreditos(j, 4); }, nada] },
  "Câmaras Aquecidas": { op: [
    async function (j) { await this.curar(j, j.pvMax); await this.adicionarTrauma(j, "Paralisia"); },
    async function (j) { await this.ganharProvisao(j); }, nada] },
  "A Pedra que Canta": { op: [
    async function (j) { await this.transformarEscolha(j, "Transforme", 2); },
    async function (j) { await this.ganharArtefato(j); j.achadoVazio = true; }, nada] },
  "Sacrifício Compartilhado": { op: [
    async function (j, o) { const quem = await this.escolherAliadoGrupo(o, "Qual jogador perde 3 PV?"); await this.perderPV(quem, 3, { fonte: "evento" }); if (this.s.fim) return; await cada(this, o, x => this.ganharProvisao(x)); },
    async function (j, o) { await cada(this, o, async x => { if (x.creditos > 0) x.creditos--; }); }] },
  "O Monte Erebus Fumegante": { op: [
    async function (j) { if (!this.s.esteatitos.achado) { this.s.esteatitos.achado = true; this.log("O grupo ganha o Esteatito do Achado."); } await this.perderPV(j, 2, { fonte: "evento" }); },
    async function (j) { await this.aprimorarEscolha(j, "Aprimore", 2); await this.adicionarTrauma(j, "Lembrança Proibida"); }, nada] },
  "Restos da Expedição": { op: [
    async function (j, o) { await rolarCombateOuPremio(this, j ? [j] : o, d => d <= 3, x => this.ganharCreditos(x, 5)); },
    async function (j) { await this.perderPV(j, 3, { fonte: "evento" }); }] },
  "Mensagem de Danforth": { op: [
    async function (j, o) { await cada(this, o, x => this.curar(x, 3)); },
    async function (j, o) { await cada(this, o, x => this.aprimorarEscolha(x, `${x.nome}: Aprimore 1 carta`)); }] }
};
M.Motor.prototype.escolherAliadoGrupo = async function (ordem, titulo) {
  const v = ordem.filter(x => !x.fora); if (v.length === 1) return v[0];
  const r = await this.io.escolher({ tipo: "opcoes", titulo, opcoes: v.map(x => ({ rotulo: x.nome })) }); return v[r];
};
M.EVENTOS = EVENTOS;
})();
