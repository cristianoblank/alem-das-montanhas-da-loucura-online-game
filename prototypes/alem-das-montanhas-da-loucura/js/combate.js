// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
/* =====================================================================
   COMBATE — cartas, dano, condições, glifos, posturas, inimigos.
   Capítulos 6, 7, 8, 12 e 13 do manual.
   ===================================================================== */
'use strict';
(function () {
const M = globalThis;
const MotorC = M.Motor, DEF_ = M.DEF, ART_ = M.ARTEFATOS, INI_ = M.INIMIGO;
const NOME_POSTURA = { neutra: "Neutra", lucidez: "Lucidez", panico: "Pânico", compreensao: "Compreensão" };
const NOME_GLIFO = { relampago: "de Relâmpago", gelo: "de Gelo", vazio: "do Vazio", estelar: "Estelar" };
Object.assign(M, { NOME_POSTURA, NOME_GLIFO });

Object.assign(MotorC.prototype, {
  /* ================= pilhas ================= */
  async comprar(j, n, op = {}) {
    const c = j.c; let compradas = 0;
    for (let i = 0; i < n; i++) {
      if (!c.compra.length) {
        if (!c.descarte.length) break;
        c.compra = this.embaralhar(c.descarte); c.descarte = [];
        this.log(`${j.nome} embaralha o Descarte para formar a Pilha de Compra.`);
      }
      const x = c.compra.shift(); this.revelou();
      if (c.mao.length >= (this.cfgv("maoMax") || 10)) { c.descarte.push(x); this.log(`Mão cheia: ${x.nome} vai para o Descarte.`); continue; }
      c.mao.push(x); compradas++;
      if (x.nome === "Abismo Interior") { c.energia = Math.max(0, c.energia - 1); this.log(`Abismo Interior: ${j.nome} perde 1 de energia.`); }
      if (x.nome === "Sussurros") { c.descarte.push(this.nova("Atordoado", "status")); this.log(`Sussurros: 1 Atordoado vai para o Descarte de ${j.nome}.`); }
    }
    if (compradas && !op.inicial) await this.pausa(2);
    return compradas;
  },
  colocar(j, nome, onde, n = 1, op = {}) {
    if (!j.c) return;
    for (let i = 0; i < n; i++) {
      const x = this.nova(nome, op.dono, op.apr); x.temp = true;
      if (onde === "mao") { if (j.c.mao.length >= 10) j.c.descarte.push(x); else j.c.mao.push(x); }
      else if (onde === "descarte") j.c.descarte.push(x);
      else if (onde === "compra") { j.c.compra.push(x); this.embaralhar(j.c.compra); }
      else if (onde === "topo") j.c.compra.unshift(x);
    }
  },
  async descartarCarta(j, x, porEfeito = true) {
    const c = j.c; const i = c.mao.findIndex(y => y.uid === x.uid); if (i < 0) return;
    c.mao.splice(i, 1); c.descarte.push(x); c.t.descartou = true;
    if (porEfeito) {
      if (x.nome === "Reflexo") { this.log("Reflexo: compra cartas."); await this.comprar(j, x.apr ? 3 : 2); }
      if (x.nome === "Tática") { const e = x.apr ? 2 : 1; c.energia += e; this.log(`Tática: +${e} de energia.`); }
    }
  },
  async descartarEscolha(j, n, titulo) {
    const c = j.c; n = Math.min(n, c.mao.length); if (n <= 0) return [];
    const r = await this.io.escolher({ tipo: "cartas", jog: this.idx(j), cartas: [...c.mao], min: n, max: n, titulo: titulo || `Descarte ${n} carta(s)` });
    const out = [];
    for (const u of r) { const x = c.mao.find(y => y.uid === u); if (x) { await this.descartarCarta(j, x); out.push(x); } }
    return out;
  },
  async banir(j, x, motivo) {
    const c = j.c;
    for (const p of ["mao", "compra", "descarte"]) { const i = c[p].findIndex(y => y.uid === x.uid); if (i >= 0) c[p].splice(i, 1); }
    if (x.nome === "Maldição do Livro") { c.mao.push(x); this.log("Maldição do Livro volta para a mão."); return; }
    c.banidas.push(x);
    this.log(`${j.nome} Bane ${x.nome}${motivo ? " (" + motivo + ")" : ""}.`);
    if (x.nome === "Sentinela") { const e = x.apr ? 3 : 2; c.energia += e; this.log(`Sentinela Banida: +${e} de energia.`); }
    await this.disparar("banida", j, { carta: x });
  },
  async banirEscolha(j, n, titulo, filtro) {
    const opc = j.c.mao.filter(x => !filtro || filtro(x)); n = Math.min(n, opc.length); if (n <= 0) return [];
    const r = await this.io.escolher({ tipo: "cartas", jog: this.idx(j), cartas: opc, min: n, max: n, titulo: titulo || `Bana ${n} carta(s) da sua mão` });
    const out = []; for (const u of r) { const x = j.c.mao.find(y => y.uid === u); if (x) { await this.banir(j, x); out.push(x); } } return out;
  },
  async vislumbrar(j, n) {
    const c = j.c; if (this.temArt(j, "Binóculo Zeiss")) n += 1;
    if (!c.compra.length && c.descarte.length) { c.compra = this.embaralhar(c.descarte); c.descarte = []; }
    const topo = c.compra.slice(0, n); if (!topo.length) return;
    this.revelou();
    const r = await this.io.escolher({ tipo: "vislumbrar", jog: this.idx(j), cartas: topo, titulo: `Vislumbrar ${n}: descarte quantas quiser e ordene as outras` });
    c.compra.splice(0, topo.length);
    const desc = topo.filter(x => r.descartar.includes(x.uid));
    const resto = r.ordem.map(u => topo.find(x => x.uid === u)).filter(x => x && !r.descartar.includes(x.uid));
    for (const x of topo) if (!desc.includes(x) && !resto.includes(x)) resto.push(x);
    c.compra.unshift(...resto);
    for (const x of desc) { c.descarte.push(x); c.t.descartou = true; if (x.nome === "Reflexo") await this.comprar(j, x.apr ? 3 : 2); if (x.nome === "Tática") c.energia += x.apr ? 2 : 1; }
    this.log(`${j.nome} Vislumbra ${topo.length}${desc.length ? ` e descarta ${desc.map(x => x.nome).join(", ")}` : ""}.`);
    // Tecer Ideias volta do descarte
    for (const x of [...c.descarte]) if (x.nome === "Tecer Ideias" && c.mao.length < 10) { c.descarte.splice(c.descarte.indexOf(x), 1); c.mao.push(x); this.log("Tecer Ideias volta para a mão."); }
  },

  /* ================= custo e jogabilidade ================= */
  custo(j, x) {
    const d = DEF_[x.nome]; let k = this.custoBase(x);
    if (k === "—") return null;
    if (k === "X") return "X";
    if (d.t === "H" && this.temPoder(j, "Disciplina Polar")) k = 0;
    if (x.nome === "Otimização") k -= (x.marc || 0);
    if (x.mod && x.mod.desconto) k -= x.mod.desconto;
    if (x.gratis) k = 0;
    return Math.max(0, k);
  },
  podeJogar(j, x) {
    const c = j.c, d = DEF_[x.nome];
    if (!c || this.s.prontos?.[this.idx(j)]) return "Turno encerrado";
    if (this.impossivel(x)) return "Impossível: não pode ser jogada";
    const k = this.custo(j, x);
    if (k === null) return "Não pode ser jogada";
    if (k !== "X" && k > c.energia) return "Energia insuficiente";
    if (x.nome === "Choque Direto" && c.mao.some(y => y.uid !== x.uid && DEF_[y.nome].t !== "A")) return "Só se todas as outras cartas da mão forem Ataques";
    if (x.nome === "Autópsia Final" && c.compra.length) return "Só com a pilha de compra vazia";
    if (c.mao.some(y => y.nome === "Paralisia") && c.t.cartas >= 3) return "Paralisia: no máximo 3 cartas por turno";
    if (this.temArt(j, "Coroa de Hieróglifos") && c.t.cartas >= 6) return "Coroa de Hieróglifos: no máximo 6 cartas por turno";
    return null;
  },
  precisaAlvo(x) { const e = (typeof EFEITOS !== "undefined" ? EFEITOS : M.EFEITOS)[x.nome]; return !!(e && e.alvo); },
  alvosPossiveis(j) { return this.s.combate.inimigos.filter(e => e.pv > 0); },
  fileiraDe(j) { const ji = this.idx(j); return this.s.combate.inimigos.filter(e => e.pv > 0 && (e.fileira === ji || e.fileira === "c")); },
  todosDe(j) { return this.fileiraDe(j); }, // «TODOS os inimigos» = a sua fileira e a fileira central
  todasFileiras() { return this.s.combate.inimigos.filter(e => e.pv > 0); },

  /* ================= jogar uma carta ================= */
  async jogarCarta(j, uid, alvoUid, op = {}) {
    const c = j.c; const x = c.mao.find(y => y.uid === uid); if (!x) return;
    const erro = op.semCusto ? null : this.podeJogar(j, x); if (erro) { this.log(erro); return; }
    const d = DEF_[x.nome];
    let X = 0; const k = op.semCusto ? 0 : this.custo(j, x);
    if (k === "X") { X = c.energia; c.energia = 0; } else c.energia -= k;
    c.mao.splice(c.mao.indexOf(x), 1);
    const alvo = alvoUid ? this.s.combate.inimigos.find(e => e.uid === alvoUid) : null;
    this.log(`${j.nome} joga ${x.nome}${x.apr ? " ◆" : ""}${alvo ? " em " + alvo.nome : ""}.`, "jogada");
    this.io.evento({ tipo: "jogou", jog: this.idx(j), carta: x, alvo: alvoUid });
    // Agonia: perde 1 PV sempre que jogar outra carta
    for (const y of c.mao) if (y.nome === "Agonia") { this.log("Agonia: perde 1 PV."); await this.perderPV(j, 1, { fonte: "carta" }); if (this.s.fim) return; }
    // Dissecador: primeira Habilidade de cada jogador na rodada
    if (d.t === "H") for (const e of this.s.combate.inimigos) if (e.pv > 0 && e.nome === "O Dissecador") {
      const ji = this.idx(j); if (!this.s.combate.t.habilidadeJogador[ji] && (e.f.curiosidade || 0) < 3) { e.cond.furia++; e.f.curiosidade = (e.f.curiosidade || 0) + 1; this.log("Curiosidade Científica: O Dissecador ganha 1 Fúria."); }
    }
    if (d.t === "H") this.s.combate.t.habilidadeJogador[this.idx(j)] = true;
    // quantas vezes: Forma Eco (1ª carta do turno), Chá de Folha de Coca, Necronomicon (1º Ataque de custo 2+)
    let vezes = 1;
    if (!c.t.ecoUsado && this.temPoder(j, "Forma Eco") && c.t.cartas === 0) { vezes += this.contaPoder(j, "Forma Eco"); c.t.ecoUsado = true; }
    if (c.t.coca) { vezes += 1; c.t.coca = false; }
    if (d.t === "A" && !c.t.necroUsado && this.temArt(j, "O Necronomicon da Miskatonic") && typeof k === "number" && this.custoBase(x) >= 2) { vezes += 1; c.t.necroUsado = true; }
    if (op.vezes) vezes = op.vezes;
    c.t.cartas++; c.cartasJogadas++;
    if (d.t === "A") { c.t.ataques++; c.ataquesJogados++; }
    // Caneta-Tinteiro de Lake: o 10º Ataque causa o dobro
    c.dobro = false;
    if (d.t === "A") { const a = this.art(j, "Caneta-Tinteiro de Lake"); if (a) { a.marc = (a.marc || 0) + 1; if (a.marc >= 10) { a.marc = 0; c.dobro = true; this.log("Caneta-Tinteiro de Lake: este Ataque causa o dobro."); } } }
    // destino da carta antes de resolver (o texto resolve com a carta "em jogo")
    const ultimaAntes = c.t.ultimaTipo;
    for (let v = 0; v < vezes; v++) {
      if (this.s.combate.terminou) break;
      let al = alvo; if (al && al.pv <= 0) { const opc = this.alvosPossiveis(j); al = opc.length ? opc[0] : null; }
      await this.resolver(j, x, al, X, ultimaAntes);
      if (this.s.fim) return;
    }
    c.t.ultimaTipo = d.t;
    // depois de jogada
    if (d.t === "P") {
      const p = c.poderes.find(y => y.nome === x.nome && y.apr === x.apr);
      if (p) p.n++; else c.poderes.push({ nome: x.nome, apr: x.apr, n: 1, marc: 0, uid: x.uid, carta: x });
      await this.disparar("poderJogado", j, { carta: x });
    } else if (x.temp && DEF_[x.nome].rar === "F" && this.banirAoJogar(x)) { c.banidas.push(x); await this.disparar("banida", j, { carta: x }); }
    else if (this.banirAoJogar(x) || (d.t === "H" && this.temPoder(j, "Disciplina Polar")) || x.banirAoResolver) { x.banirAoResolver = false; await this.banir(j, x); }
    else if (x.paraCompra) { x.paraCompra = false; c.compra.push(x); this.embaralhar(c.compra); }
    else if (c.t.reflexao && x.nome !== "Reflexão") { c.t.reflexao = false; c.compra.unshift(x); this.log(`${x.nome} vai para o topo da pilha de compra.`); }
    else c.descarte.push(x);
    if (x.nome === "Reflexão") c.t.reflexao = true;
    c.dobro = false;
    if (d.t === "A") await this.disparar("ataqueJogado", j, { carta: x });
    await this.disparar("cartaJogada", j, { carta: x });
    if (c.t.encerrar) { c.t.encerrar = false; this.s.prontos[this.idx(j)] = true; this.log(`${j.nome} encerra o turno (Meditar).`); }
    await this.pausa(6);
  },
  async resolver(j, x, alvo, X, ultimaAntes) {
    const ef = (typeof EFEITOS !== "undefined" ? EFEITOS : M.EFEITOS)[x.nome];
    if (!ef) { this.log(`(efeito de ${x.nome} não implementado)`); return; }
    const fx = { m: this, j, x, alvo, X, apr: !!x.apr, v: (a, b) => x.apr ? b : a, ultima: ultimaAntes, ataque: DEF_[x.nome].t === "A" };
    await ef.f(fx);
  },

  /* ================= dano ================= */
  // golpe de Ataque de um investigador contra um inimigo (Cap. 7: cálculo por golpe)
  async atacar(j, alvo, base, vezes = 1, op = {}) {
    if (!alvo || alvo.pv <= 0) return { naoBloq: 0, matou: false };
    const c = j.c; let total = 0, matou = false;
    const debil = c.cond.debilitado > 0;
    for (let i = 0; i < vezes; i++) {
      if (alvo.pv <= 0) break;
      let d = base + (op.ataque === false ? 0 : c.cond.furia);
      if (op.ataque !== false && debil && d > 0) d = Math.max(1, d - 1);
      // Cap. 6: só cartas do tipo Ataque são afetadas por Fúria, Debilitado, Exposto e posturas
      if (op.ataque !== false && alvo.cond.exposto > 0) d *= 2;
      if (op.ataque !== false) { if (c.postura === "panico") d *= 2; if (c.postura === "compreensao") d *= 3; }
      if (op.ataque !== false && alvo.cond.exposto > 0 && this.temArt(j, "Lupa de Campo")) d += 1;
      if (op.dobro || (op.ataque !== false && c.dobro)) d *= 2;
      const r = await this.danoInimigo(alvo, d, { ataque: op.ataque !== false, jog: j });
      total += r.naoBloq; if (r.morreu) matou = true;
      if (op.ataque !== false && r.naoBloq > 0) await this.disparar("danoNaoBloqueadoCausado", j, { alvo, n: r.naoBloq });
      if (this.checarFim()) break;
    }
    // Mão Espalmada: sempre que você atacar o inimigo marcado, ganhe 1 de Bloqueio
    if (op.ataque !== false && alvo.marcas.maoEspalmada?.includes(this.idx(j))) await this.ganharBloqueio(j, alvo.marcas.maoEspalmada.filter(x => x === this.idx(j)).length, { carta: false });
    if (op.ataque !== false) {
      if (debil && !op.semConsumir) c.cond.debilitado--;
      if (alvo.cond.exposto > 0 && !op.semConsumir) alvo.cond.exposto--;
    }
    return { naoBloq: total, matou };
  },
  // dano em TODOS (vários alvos): cada golpe calculado por alvo; consumos após o Ataque inteiro
  async atacarTodos(j, base, vezes = 1, op = {}) {
    const alvos = op.alvos || this.todosDe(j); let soma = 0;
    const c = j.c; const debil = c.cond.debilitado > 0;
    const atingidos = new Set();
    for (let v = 0; v < vezes; v++) for (const a of alvos) {
      if (a.pv <= 0) continue;
      const r = await this.atacar(j, a, base, 1, Object.assign({}, op, { semConsumir: true }));
      soma += r.naoBloq; atingidos.add(a);
      if (this.checarFim()) break;
    }
    if (op.ataque !== false) { if (debil) c.cond.debilitado--; for (const a of atingidos) if (a.cond.exposto > 0) a.cond.exposto--; }
    return soma;
  },
  // aplica dano a um inimigo (já calculado), com habilidades do inimigo, Intangível e Bloqueio
  async danoInimigo(e, d, op = {}) {
    const c = this.s.combate;
    if (op.ataque) {
      if (["Coisa Antiga Desperta", "Fungo de Yuggoth", "Peixe Cego Abissal"].includes(e.nome) && e.f.couroRodada !== c.rodada) { e.f.couroRodada = c.rodada; d = Math.max(0, d - 1); }
      if (["Eco do Tekeli-li", "O Guardião do Mar Sem Sol"].includes(e.nome)) d = Math.min(d, 4);
    }
    if (e.nome === "O Mural Que Respira" && c.rodada % 2 === 0) d = Math.min(d, 3);
    if (e.nome === "A Cria Estelar de Cthulhu" && c.inimigos.some(x => x.pv > 0 && x.nome === "Cria Estelar Menor")) d = Math.max(0, d - 1);
    if (e.nome === "O Que Danforth Viu — O Inominável") d = Math.min(d, 8);
    if (e.cond.intangivel > 0) d = Math.min(d, 1);
    const bloq = Math.min(e.bloqueio, d); e.bloqueio -= bloq; const resto = d - bloq;
    this.io.evento({ tipo: "dano", alvo: e.uid, n: d, bloq, resto });
    if (resto > 0) return Object.assign({ naoBloq: resto }, await this.perdaInimigo(e, resto, op, true));
    return { naoBloq: 0, morreu: false };
  },
  // perda de PV de inimigo (Necrose, glifos que perdem PV etc. passam aqui também)
  async perdaInimigo(e, n, op = {}, jaCalc = false) {
    if (!jaCalc && e.cond.intangivel > 0) n = Math.min(n, 1);
    if (n <= 0 || e.pv <= 0) return { morreu: false };
    const antes = e.pv;
    e.pv -= n;
    if (!jaCalc) this.io.evento({ tipo: "dano", alvo: e.uid, n, bloq: 0, resto: n });
    await this.inimigoPerdeu(e, antes, op);
    if (e.pv <= 0) return { morreu: await this.inimigoMorre(e, op) };
    return { morreu: false };
  },
  async danoGlifo(j, e, n) { if (!e || e.pv <= 0) return; await this.danoInimigo(e, n, { ataque: false, jog: j }); },

  /* ----- dano em investigadores ----- */
  // golpe de Ataque de inimigo contra um investigador
  async golpeInimigo(e, j, base, op = {}) {
    const c = j.c; if (!c || j.fora) return 0;
    let d = base + e.cond.furia;
    if (e.cond.debilitado > 0 && e.nome !== "Shoggoth Rebelde" && d > 0) d = Math.max(1, d - 1);
    if (c.cond.exposto > 0) d *= 2;
    if (c.postura === "panico") d *= 2;
    if (c.cond.intangivel > 0) d = Math.min(d, 1);
    const bloq = Math.min(c.bloqueio, d); c.bloqueio -= bloq; const resto = d - bloq;
    this.io.evento({ tipo: "danoJog", jog: this.idx(j), n: d, bloq, resto });
    // Espinhos
    if (c.cond.espinhos > 0) { this.log(`Espinhos: ${e.nome} perde ${c.cond.espinhos} PV.`); await this.perdaInimigo(e, c.cond.espinhos, { fonte: "espinhos" }); }
    if (resto > 0) {
      const perdeu = await this.perderPV(j, resto, { fonte: "ataque", inimigo: e });
      if (perdeu > 0) await this.disparar("danoNaoBloqueadoRecebido", j, { n: perdeu });
    }
    return resto;
  },
  async ataqueInimigo(e, j, base, vezes) {
    let naoBloq = 0;
    for (let i = 0; i < vezes; i++) { if (!j.c || j.fora || e.pv <= 0) break; naoBloq += await this.golpeInimigo(e, j, base); if (this.s.fim) return naoBloq; await this.pausa(4); }
    if (e.cond.debilitado > 0 && e.nome !== "Shoggoth Rebelde") e.cond.debilitado--;
    if (j.c && j.c.cond.exposto > 0) j.c.cond.exposto--;
    return naoBloq;
  },
  // perda de PV de investigador (dano não bloqueado ou perda direta)
  async perderPV(j, n, op = {}) {
    const c = j.c;
    if (c && c.cond.intangivel > 0) n = Math.min(n, 1);
    if (n <= 0) return 0;
    if (c && c.amort > 0) { c.amort--; this.log(`Amortecedor Psíquico evita a perda de ${n} PV.`); return 0; }
    j.pv -= n;
    if (op.fonte !== "ataque") this.io.evento({ tipo: "danoJog", jog: this.idx(j), n, bloq: 0, resto: n });
    if (c) { c.t.perdeuPV = true; }
    if (c && this.s.faseRodada === "jogadores") for (let k = 0; k < this.contaPoder(j, "Teimosia Nórdica"); k++) { c.cond.furia++; this.log("Teimosia Nórdica: +1 Fúria."); }
    if (c && !c.marcosFot && this.temArt(j, "Fotografia da Família") && j.pv <= j.pvMax / 2 && j.pv > 0) { c.marcosFot = true; c.cond.furia += 2; this.log("Fotografia da Família: +2 Fúria."); }
    if (j.pv <= 0) await this.quaseMorte(j);
    return n;
  },
  async quaseMorte(j) {
    if (this.temArt(j, "Talismã de Cinco Pontas") && !j.talismaUsado) { j.talismaUsado = true; j.pv = Math.floor(j.pvMax / 2); this.log(`Talismã de Cinco Pontas: ${j.nome} recupera ${j.pv} PV.`); return; }
    const i = j.provisoes.indexOf("Ampola de Adrenalina");
    if (i >= 0) { j.provisoes.splice(i, 1); this.s.baralhos.provisoes.push("Ampola de Adrenalina"); j.pv = 3; this.log(`Ampola de Adrenalina: ${j.nome} recupera 3 PV.`); return; }
    j.pv = 0;
    if (this.V.heroica) {
      j.fora = true; this.s.caidos = (this.s.caidos || 0) + 1;
      this.log(`${j.nome} cai — Morte Heroica: sai da expedição.`, "titulo");
      if (this.s.combate) { for (const e of this.s.combate.inimigos) if (e.fileira === this.idx(j)) e.fileira = "c"; for (const e of this.s.combate.inimigos) if (INI_[e.nome].cat === "chefe") { e.pv += 10 * this.n; e.pvMax += 10 * this.n; } }
      if (this.s.olhar === this.idx(j) && this.vivos().length) this.s.olhar = this.idx(this.vivos()[0]);
      if (!this.vivos().length) this.s.fim = { vitoria: false, quem: j.nome };
      return;
    }
    this.s.fim = { vitoria: false, quem: j.nome };
    this.log(`${j.nome} chega a 0 PV. A expedição fracassa.`, "titulo");
  },
  async curar(j, n) { const antes = j.pv; j.pv = Math.min(j.pvMax, j.pv + n); if (j.pv > antes) { this.log(`${j.nome} recupera ${j.pv - antes} PV.`); this.io.evento({ tipo: "cura", jog: this.idx(j), n: j.pv - antes }); } return j.pv - antes; },

  /* ================= bloqueio e condições ================= */
  async ganharBloqueio(j, n, op = { carta: true }) {
    const c = j.c; if (!c) return;
    if (op.carta !== false) {
      n += c.cond.agilidade;
      if (c.cond.tremulo > 0) { n = Math.max(0, n - 1); c.cond.tremulo--; }
    }
    c.bloqueio = Math.min(this.cfgv("bloqueioMax") || 20, c.bloqueio + n);
    this.io.evento({ tipo: "bloqueio", jog: this.idx(j), n });
  },
  blqInimigo(e, n) { e.bloqueio = Math.min(this.cfgv("bloqueioMax") || 20, e.bloqueio + n); this.io.evento({ tipo: "bloqueioIni", alvo: e.uid, n }); },
  // condição num inimigo
  aplicar(e, cond, n) {
    if (!e || e.pv <= 0 || n <= 0) return;
    if (M.CONDS_NEG.includes(cond) && e.cond.amparo > 0) { e.cond.amparo--; this.log(`Amparo anula ${M.COND_NOME[cond]} em ${e.nome}.`); return; }
    if (cond === "exposto" && e.nome === "O Guardião do Mar Sem Sol") { this.log("Abissal: não pode receber Exposto."); return; }
    let max = M.COND_MAX ? undefined : undefined; max = { exposto: 3, debilitado: 3, tremulo: 3, necrose: 30 }[cond];
    if (cond === "exposto" && e.nome === "Shoggoth Adulto") max = 1;
    e.cond[cond] = max ? Math.min(max, e.cond[cond] + n) : e.cond[cond] + n;
    this.io.evento({ tipo: "cond", alvo: e.uid, cond, n });
  },
  async aplicarJog(j, cond, n) {
    const c = j.c; if (!c || n <= 0) return;
    if (M.CONDS_NEG.includes(cond)) {
      if (c.cond.amparo > 0) { c.cond.amparo--; this.log(`Amparo anula ${M.COND_NOME[cond]} em ${j.nome}.`); return; }
      if ((cond === "debilitado" || cond === "tremulo") && this.temArt(j, "Pedra Verde Ancestral")) { this.log("Pedra Verde Ancestral: imune."); return; }
    }
    const max = { exposto: 3, debilitado: 3, tremulo: 3, necrose: 30 }[cond];
    c.cond[cond] = max ? Math.min(max, c.cond[cond] + n) : c.cond[cond] + n;
    this.io.evento({ tipo: "condJog", jog: this.idx(j), cond, n });
  },
  removerNegativas(cond) { for (const k of M.CONDS_NEG) cond[k] = 0; },

  /* ================= poderes e gatilhos ================= */
  temPoder(j, nome) { return !!(j.c && j.c.poderes.some(p => p.nome === nome)); },
  contaPoder(j, nome) { return j.c ? j.c.poderes.filter(p => p.nome === nome).reduce((s, p) => s + p.n, 0) : 0; },
  poderesDe(j, nome) { return j.c ? j.c.poderes.filter(p => p.nome === nome) : []; },
  async disparar(ev, j, dados) {
    const AR = (typeof GATILHOS_ART !== "undefined" ? GATILHOS_ART : M.GATILHOS_ART) || {};
    const PO = (typeof GATILHOS_PODER !== "undefined" ? GATILHOS_PODER : M.GATILHOS_PODER) || {};
    for (const a of [...j.artefatos]) { const g = AR[a.nome]; if (g && g[ev]) await g[ev].call(this, j, a, dados); if (this.s.fim) return; }
    if (j.c) for (const p of [...j.c.poderes]) { const g = PO[p.nome]; if (g && g[ev]) for (let k = 0; k < p.n; k++) { await g[ev].call(this, j, p, dados); if (this.s.fim) return; } }
  },

  /* ================= Estudante: posturas ================= */
  async mudarPostura(j, nova, op = {}) {
    const c = j.c; if (!c) return;
    if (c.postura === nova) { this.log(`${j.nome} já está em ${NOME_POSTURA[nova]}: nada acontece.`); return; }
    const antiga = c.postura; c.postura = nova;
    this.log(`${j.nome}: ${NOME_POSTURA[antiga]} → ${NOME_POSTURA[nova]}.`);
    this.io.evento({ tipo: "postura", jog: this.idx(j), antiga, nova });
    if (antiga === "lucidez") { c.energia += 2; this.log("Saiu da Lucidez: +2 de energia."); }
    if (nova === "compreensao") { c.energia += 3; c.sairCompreensao = true; this.log("Compreensão: +3 de energia; Ataques causam o triplo até o início do próximo turno."); }
    if (nova === "panico") this.log("Pânico: os Ataques de " + j.nome + " causam o dobro — e os que recebe também.");
    for (const x of [...c.descarte]) if (x.nome === "Rajada de Golpes" && c.mao.length < 10) { c.descarte.splice(c.descarte.indexOf(x), 1); c.mao.push(x); this.log("Rajada de Golpes volta para a mão."); }
    await this.disparar("mudouPostura", j, { antiga, nova });
    if (nova === "panico") await this.disparar("entrouPanico", j, {});
  },
  async ganharRevelacao(j, n) {
    const c = j.c; c.revelacao += n;
    this.log(`${j.nome} ganha ${n} Revelação (${Math.min(5, c.revelacao)}/5).`);
    this.io.evento({ tipo: "revelacao", jog: this.idx(j), n });
    if (c.revelacao >= 5) { c.revelacao = 0; this.log("Revelação chega a 5: zera a trilha e entra em Compreensão."); await this.mudarPostura(j, "compreensao"); }
  },

  /* ================= Geólogo: glifos ================= */
  async inscrever(j, t, n = 1) {
    const c = j.c;
    for (let i = 0; i < n; i++) {
      if (c.slotsGlifo <= 0) { this.log(`${j.nome} não tem espaços de glifo.`); return; }
      if (c.glifos.length >= c.slotsGlifo) { this.log("Espaços cheios: o glifo mais à esquerda é Ativado para dar lugar."); await this.ativar(j, 1); if (this.checarFim()) return; }
      c.glifos.push({ t, cargas: t === "vazio" ? 1 : 0 });
      this.log(`${j.nome} Inscreve um Glifo ${NOME_GLIFO[t]} no espaço ${c.glifos.length}.`);
      this.io.evento({ tipo: "glifo", jog: this.idx(j), txt: "Inscreve " + NOME_GLIFO[t].replace(/^d[eo] /, "") });
    }
  },
  async ativar(j, vezes = 1) {
    const c = j.c; const g = c.glifos[0];
    if (!g) { this.log(`${j.nome} não tem glifo inscrito para Ativar.`); return null; }
    this.io.evento({ tipo: "glifo", jog: this.idx(j), txt: "Ativa " + NOME_GLIFO[g.t].replace(/^d[eo] /, "") + (vezes > 1 ? " ×" + vezes : "") });
    for (let i = 0; i < vezes; i++) { await this.efeitoGlifo(j, g, "ativ"); if (this.checarFim()) break; }
    const k = c.glifos.indexOf(g); if (k >= 0) c.glifos.splice(k, 1);
    return g;
  },
  async glifoPassivo(j, g) { await this.efeitoGlifo(j, g, "pass"); },
  // valor de um glifo agora (Cap. 13): Concentração soma a Relâmpago, Gelo e ao ganho de carga do Vazio
  valorGlifo(j, g, modo) {
    const conc = j.c.concentracao;
    if (g.t === "relampago" || g.t === "gelo") return (modo === "pass" ? 1 : 2) + conc;
    if (g.t === "vazio") return modo === "pass" ? 1 + conc : g.cargas;
    return modo === "pass" ? 1 : 2;   // Estelar: energia
  },
  async efeitoGlifo(j, g, modo) {
    const c = j.c, n = this.valorGlifo(j, g, modo);
    const como = `Glifo ${NOME_GLIFO[g.t]} (${modo === "pass" ? "passivo" : "Ativação"})`;
    if (g.t === "relampago") {
      if (this.temPoder(j, "Eletrodinâmica")) { this.log(`${como}: ${n} de dano a todos os inimigos da fileira.`); for (const e of this.fileiraDe(j)) await this.danoGlifo(j, e, n); }
      else { const e = await this.escolherInimigo(j, `Glifo de Relâmpago: ${n} de dano a um inimigo`); if (e) this.log(`${como}: ${n} de dano em ${e.nome}.`); await this.danoGlifo(j, e, n); }
    } else if (g.t === "gelo") { this.log(`${como}: ${n} de Bloqueio.`); await this.ganharBloqueio(j, n, { carta: false }); }
    else if (g.t === "vazio") {
      if (modo === "pass") { g.cargas += n; this.log(`${como}: +${n} carga${n > 1 ? "s" : ""} (fica com ${g.cargas}).`); }
      else {
        const vivos = this.alvosPossiveis(j); if (!vivos.length) return;
        const min = Math.min(...vivos.map(e => e.pv)); const emp = vivos.filter(e => e.pv === min);
        const e = emp.length > 1 ? await this.escolherInimigo(j, `Glifo do Vazio: ${g.cargas} de dano (empate)`, emp) : emp[0];
        this.log(`${como}: ${g.cargas} de dano em ${e.nome}, o inimigo com menos PV.`);
        await this.danoGlifo(j, e, g.cargas);
      }
    } else if (g.t === "estelar") { c.energia += n; this.log(`${como}: +${n} de energia.`); }
  },
  async escolherInimigo(j, titulo, opc) {
    opc = opc || this.alvosPossiveis(j); if (!opc.length) return null; if (opc.length === 1) return opc[0];
    const r = await this.io.escolher({ tipo: "alvo", jog: this.idx(j), opcoes: opc.map(e => e.uid), titulo });
    return opc.find(e => e.uid === r) || opc[0];
  },
  aliado(j) { const v = this.vivos().filter(x => x !== j); return v.length ? v : [j]; },
  async escolherAliado(j, titulo) {
    const opc = this.aliado(j); if (opc.length === 1) return opc[0];
    const r = await this.io.escolher({ tipo: "opcoes", titulo, opcoes: opc.map(x => ({ rotulo: x.nome })) }); return opc[r];
  },

  /* ================= inimigos ================= */
  async inimigoInicio(e) {
    if (e.nome === "Arquivista Cego") this.blqInimigo(e, 3);
    if (e.nome === "Os Espécimes de Lake") { const m = this.criarInimigo("Espécime Menor", "c"); this.s.combate.inimigos.push(m); this.log("Colônia: o Espécime Menor acompanha o Líder."); }
  },
  alvoDe(e) {
    const s = this.s;
    if (e.fileira === "c") return s.jogadores[s.olhar];
    const j = s.jogadores[e.fileira]; return j && !j.fora ? j : s.jogadores[s.olhar];
  },
  async executarIntencao(e) {
    const txt = e.intencao.texto; const d = INI_[e.nome];
    this.io.evento({ tipo: "inimigoAge", alvo: e.uid });
    let corpo = txt; const m = txt.match(/^([^:;]{2,40}):\s*(.*)$/); let nomeAcao = "";
    if (m && !/^(A|AT|B)\d/.test(m[1])) { nomeAcao = m[1]; corpo = m[2]; }
    this.log(`${e.nome}: ${nomeAcao ? nomeAcao + " — " : ""}${corpo}.`, "inimigo");
    const alvo = this.alvoDe(e);
    // ações com texto próprio
    const esp = (typeof ACOES_INIMIGO !== "undefined" ? ACOES_INIMIGO : M.ACOES_INIMIGO)[corpo];
    if (esp) { await esp.call(this, e, alvo); return; }
    // ações padrão, separadas por ";"
    const ultimo = { dano: 0 };
    for (const p0 of corpo.split(";").map(p => p.trim()).filter(Boolean)) {
      if (e.pv <= 0 || this.s.fim) return;
      const p = p0;
      let r;
      if ((r = p.match(/^(AT|A)(\d+)(?:x(\d+))?$/))) {
        const alvos = r[1] === "AT" ? this.vivos() : [alvo];
        for (const j of alvos) { ultimo.dano += await this.ataqueInimigo(e, j, +r[2], r[3] ? +r[3] : 1); if (this.s.fim) return; }
      } else if ((r = p.match(/^B(\d+)$/))) this.blqInimigo(e, +r[1]);
      else if ((r = p.match(/^Fúria (\d+)$/))) e.cond.furia += +r[1];
      else if ((r = p.match(/^Intangível (\d+)$/))) e.cond.intangivel += +r[1];
      else if ((r = p.match(/^(Exposto|Debilitado|Trêmulo|Necrose) (\d+)$/))) await this.aplicarJog(alvo, M.NOME_COND[r[1]], +r[2]);
      else if ((r = p.match(/^(\d+ )?(Ferida|Lodo|Atordoado|Abismo Interior|Congelamento) no descarte do (jogador|Alvo)$/))) { this.colocar(alvo, r[2], "descarte", r[1] ? parseInt(r[1]) : 1); this.log(`${r[1] ? r[1] : "1 "}${r[2]} no descarte de ${alvo.nome}.`); }
      else if ((r = p.match(/^cada jogador coloca (\d+) Atordoado (na mão|no descarte)$/))) for (const j of this.vivos()) this.colocar(j, "Atordoado", r[2] === "na mão" ? "mao" : "descarte", +r[1]);
      else if ((r = p.match(/^o (?:jogador )?Alvo coloca (\d+) (Atordoado|Congelamento) (na mão|no descarte)$/))) this.colocar(alvo, r[2], r[3] === "na mão" ? "mao" : "descarte", +r[1]);
      else if ((r = p.match(/^cada jogador recebe (\S+) (\d+) e (\S+) (\d+)$/))) for (const j of this.vivos()) { await this.aplicarJog(j, M.NOME_COND[r[1]], +r[2]); await this.aplicarJog(j, M.NOME_COND[r[3]], +r[4]); }
      else if ((r = p.match(/^cada jogador recebe (\S+) (\d+)$/))) for (const j of this.vivos()) await this.aplicarJog(j, M.NOME_COND[r[1]], +r[2]);
      else if (p === "todos os inimigos ganham 1 Fúria") for (const x of this.s.combate.inimigos) { if (x.pv > 0) x.cond.furia++; }
      else if (p === "recupera PV igual ao dano não bloqueado") { e.pv = Math.min(e.pvMax, e.pv + ultimo.dano); this.log(`${e.nome} recupera ${ultimo.dano} PV.`); }
      else if (p === "ganha o efeito Delírio") { e.f.delirio = true; }
      else { const f = (typeof ACOES_INIMIGO !== "undefined" ? ACOES_INIMIGO : M.ACOES_INIMIGO)[p]; if (f) await f.call(this, e, alvo, ultimo); else this.log(`(ação «${p}» sem regra)`); }
    }
  },
  invocar(nome, fileira, op, depoisDe) {
    const c = this.s.combate; const x = this.criarInimigo(nome, fileira, Object.assign({ novo: true }, op || {}));
    const i = depoisDe ? c.inimigos.indexOf(depoisDe) : -1;
    if (i >= 0) c.inimigos.splice(i + 1, 0, x); else c.inimigos.push(x);
    this.log(`${nome} entra ${fileira === "c" ? "na fileira central" : "na fileira de " + this.s.jogadores[fileira].nome} (${x.pv} PV).`);
    return x;
  },
  async inimigoPerdeu(e, antes, op) {
    const c = this.s.combate;
    // Divisão (Massa Protoplásmica)
    if (e.nome === "Massa Protoplásmica" && e.pv > 0 && e.pv <= 5 && !e.f.dividiu) {
      e.f.dividiu = true; const metade = Math.ceil(e.pv / 2);
      this.log(`Divisão: a Massa Protoplásmica se divide em duas Gosmas do Degelo (${metade} PV cada).`);
      e.pv = 0; e.f.substituida = true; c.inimigos.splice(c.inimigos.indexOf(e), 1);
      this.invocar("Gosma do Degelo", e.fileira, { pv: metade }, null); this.invocar("Gosma do Degelo", e.fileira, { pv: metade }, null);
      return;
    }
    if (e.nome === "Batedor da Cria Estelar" && !e.f.carne && e.pv > 0 && e.pv <= e.pvMax / 2) { e.f.carne = true; this.blqInimigo(e, 6); this.log("Carne Estelar: +6 de Bloqueio."); }
    if (e.nome === "O Arquiteto Ancestral" && !e.f.reconstr && e.pv > 0 && e.pv <= e.pvMax / 2) { e.f.reconstr = true; this.removerNegativas(e.cond); e.cond.furia += 2; this.log("Reconstrução: remove condições negativas e ganha 2 Fúria."); }
  },
  async inimigoMorre(e, op) {
    const c = this.s.combate;
    if (e.f.substituida) return false;
    if (e.nome === "Sombra na Nevasca" && !e.f.reviveu) { e.f.reviveu = true; e.pv = 3; this.log("Desfaz-se na Neve: a Sombra volta com 3 PV."); return false; }
    if (e.nome === "O Shoggoth Primordial" && !e.f.infinita) { e.f.infinita = true; e.pv = 6 * this.n; e.cond.furia += 1; this.log(`Massa Infinita: o Shoggoth Primordial recupera ${e.pv} PV e ganha 1 Fúria.`); return false; }
    if (e.nome === "O Que Danforth Viu — A Miragem") {
      this.log("A Miragem se Rompe: começa a Forma II — O Inominável.", "titulo");
      const i = c.inimigos.indexOf(e); const nova = this.criarInimigo("O Que Danforth Viu — O Inominável", "c", { novo: true });
      if (this.louc(10)) { nova.cond.furia += 2; nova.cond.amparo += 1; }
      c.inimigos.splice(i, 1, nova); return false;
    }
    e.pv = 0;
    this.log(`${e.nome} é derrotado.`, "morte");
    this.io.evento({ tipo: "morte", alvo: e.uid });
    if (e.cond.necrose > 0) for (const j of this.vivos()) if (this.temArt(j, "Cultura de Bactérias")) {
      const outros = this.alvosPossiveis(j).filter(x => x !== e);
      if (outros.length) { const t = await this.escolherInimigo(j, `Cultura de Bactérias: transferir ${e.cond.necrose} Necrose`, outros); this.aplicar(t, "necrose", e.cond.necrose); }
      break;
    }
    if (e.marcas.carcaca) {
      for (const k of e.marcas.carcaca) { const outros = c.inimigos.filter(x => x.pv > 0 && x !== e && x.fileira === e.fileira); this.log(`Carcaça Pútrida: ${e.pvMax} de dano aos outros inimigos da fileira.`); for (const o of outros) await this.danoInimigo(o, e.pvMax, { ataque: false }); }
    }
    for (const x of c.inimigos) if (x.pv > 0) {
      if (e.nome === "Broto de Shoggoth" && x.nome === "A Mãe das Bolhas") { x.pv = Math.min(x.pvMax, x.pv + 3); this.log("Matriz: a Mãe das Bolhas recupera 3 PV."); }
      if (e.nome === "Sentinela Prismática Grave" && x.nome === "Sentinela Prismática Aguda") { x.cond.furia += 3; this.log("Dueto: a Sentinela Aguda ganha 3 Fúria."); }
      if (e.nome === "Sentinela Prismática Aguda" && x.nome === "Sentinela Prismática Grave") { x.cond.furia += 3; this.log("Dueto: a Sentinela Grave ganha 3 Fúria."); }
    }
    for (const j of this.vivos()) await this.disparar("inimigoMorreu", j, { inimigo: e, fileira: e.fileira, por: op.jog });
    return true;
  },
  async inimigoFimRodada(e) {
    const c = this.s.combate;
    if (e.f.delirio) { e.cond.furia++; this.log(`Delírio: ${e.nome} ganha 1 Fúria.`); }
    if (e.nome === "A Nevasca Uivante" && e.bloqueio === 0) { this.blqInimigo(e, 1); this.log("Tempestade Contínua: +1 de Bloqueio."); }
    if (e.nome === "Os Espécimes de Lake" && c.inimigos.some(x => x.pv > 0 && x.nome === "Espécime Menor")) { e.pv = Math.min(e.pvMax, e.pv + 2); this.log("Colônia: o Espécime-Líder recupera 2 PV."); }
    if (e.nome === "O Que Levou Gedney" && e.cond.exposto > 0) { e.cond.exposto = 0; this.log("Nunca Visto Inteiro: o Exposto some."); }
    if (e.nome === "O Que Danforth Viu — O Inominável" && c.rodada % 2 === 0) { e.cond.furia++; this.log("Além do Tempo: +1 Fúria."); }
    if (e.nome === "Shoggoth Menor" && !e.cond.regenerar) e.cond.regenerar = 1;
    if (e.nome === "Shoggoth Adulto" && !e.cond.regenerar) e.cond.regenerar = 2;
  },
  // intenção prevista para a tela: dano por golpe contra o alvo
  previsao(e) {
    if (!e.intencao) return null;
    const alvo = this.alvoDe(e); const out = [];
    for (const p of e.intencao.texto.replace(/^[^:;]{2,40}:\s*/, m => /^(A|AT|B)\d/.test(m) ? m : "").split(";").map(x => x.trim())) {
      const r = p.match(/^(AT|A)(\d+)(?:x(\d+))?$/);
      if (r) {
        const quem = r[1] === "AT" ? this.vivos() : [alvo];
        out.push({ tipo: "ataque", todos: r[1] === "AT", vezes: r[3] ? +r[3] : 1, por: quem.map(j => ({ jog: this.idx(j), d: this.danoPrevisto(e, j, +r[2]) })) });
      } else if (/^B\d+$/.test(p)) out.push({ tipo: "bloqueio", n: +p.slice(1) });
      else out.push({ tipo: "outro", txt: p });
    }
    return { alvo: this.idx(alvo), partes: out, vezes: e.intencao.vezes };
  },
  danoPrevisto(e, j, base) {
    const c = j.c; if (!c) return base;
    let d = base + e.cond.furia;
    if (e.cond.debilitado > 0 && e.nome !== "Shoggoth Rebelde" && d > 0) d = Math.max(1, d - 1);
    if (c.cond.exposto > 0) d *= 2; if (c.postura === "panico") d *= 2; if (c.cond.intangivel > 0) d = Math.min(d, 1);
    return d;
  },

  /* ================= provisões ================= */
  async usarProvisao(j, i, alvoUid) {
    const nome = j.provisoes[i]; if (!nome) return;
    const P = (typeof EFEITOS_PROV !== "undefined" ? EFEITOS_PROV : M.EFEITOS_PROV)[nome];
    const emCombate = !!j.c;
    if (!emCombate && !P.foraCombate) { this.log("Esta Provisão só pode ser usada em combate."); return; }
    if (emCombate && this.s.faseRodada !== "jogadores") return;
    j.provisoes.splice(i, 1); this.s.baralhos.provisoes.push(nome);
    this.log(`${j.nome} usa ${nome}.`, "jogada");
    const alvo = alvoUid && this.s.combate ? this.s.combate.inimigos.find(e => e.uid === alvoUid) : null;
    await P.f.call(this, j, alvo);
    if (this.s.combate) this.checarFim();
  }
});
})();
