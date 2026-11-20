// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
/* =====================================================================
   MOTOR DE REGRAS — Além das Montanhas da Loucura (versão digital)
   Estado puro + ações. Nada de DOM aqui. Toda aleatoriedade passa por
   this.r() (semente salva no estado), para que uma partida possa ser
   repetida e, no futuro, rodada num servidor.
   A interface entra pelo objeto `io`:
     io.escolher(spec) -> Promise<resposta>   (toda decisão do jogador)
     io.acao(motor, j) -> Promise<ação>       (o que o investigador faz no turno)
     io.evento(e)                              (registro / animação)
     io.pausa(n) -> Promise                    (passos de animação; 0 = nada)
   Conteúdo: lido de JOGO (material/dados.js), nunca redigitado.
   ===================================================================== */
'use strict';

const CONDS_NEG = ["exposto", "debilitado", "tremulo", "necrose"];
const COND_MAX = { exposto: 3, debilitado: 3, tremulo: 3, necrose: 30 };
const COND_NOME = { furia: "Fúria", agilidade: "Agilidade", exposto: "Exposto", debilitado: "Debilitado", tremulo: "Trêmulo", necrose: "Necrose", intangivel: "Intangível", amparo: "Amparo", espinhos: "Espinhos", regenerar: "Regenerar" };
const NOME_COND = Object.fromEntries(Object.entries(COND_NOME).map(([k, v]) => [v, k]));
const condVazia = () => ({ furia: 0, agilidade: 0, exposto: 0, debilitado: 0, tremulo: 0, necrose: 0, intangivel: 0, amparo: 0, espinhos: 0, regenerar: 0 });

/* ---------- catálogo de cartas a partir de JOGO ---------- */
const DEF = {};       // nome -> definição { n, t, k, x, u, uk, rar, dono }
function catalogar() {
  if (Object.keys(DEF).length) return;
  const add = (c, dono, rar) => { if (!DEF[c.n]) DEF[c.n] = Object.assign({}, c, { rar, dono }); };
  for (const p of JOGO.personagens) {
    for (const [, c] of p.inicial) add(c, p.id, "N");
    p.comuns.forEach(c => add(c, p.id, "C"));
    p.incomuns.forEach(c => add(c, p.id, "I"));
    p.raras.forEach(c => add(c, p.id, "R"));
  }
  JOGO.fichas.forEach(f => add(f.carta, "ficha", "F"));
  JOGO.incolores.forEach(c => add(c, "incolor", "X"));
  JOGO.status.forEach(s => add(s.carta, "status", "S"));
  JOGO.traumas.forEach(c => add(c, "trauma", "T"));
}
const ARTEFATOS = {};  // nome -> { nome, texto, classe }
function catalogarArtefatos() {
  if (Object.keys(ARTEFATOS).length) return;
  const cl = { iniciais: "Inicial", comuns: "Comum", incomuns: "Incomum", raros: "Raro", chefe: "Chefe", antiquario: "Depósito" };
  for (const [k, lista] of Object.entries(JOGO.artefatos)) for (const a of lista) ARTEFATOS[a[0]] = { nome: a[0], texto: a[1], classe: cl[k] };
}
const PROVISOES = {};
function catalogarProvisoes() { if (!Object.keys(PROVISOES).length) for (const e of JOGO.elixires) PROVISOES[e[0]] = { nome: e[0], texto: e[1], copias: e[2] }; }
const INIMIGO = {};
function catalogarInimigos() {
  if (Object.keys(INIMIGO).length) return;
  for (const e of JOGO.inimigos) INIMIGO[e.n] = e;
  // criaturas invocadas que não têm carta própria no banco de dados (texto do próprio Ancião)
  INIMIGO["Espécime Menor"] = { n: "Espécime Menor", ato: 1, cat: "normal", pv: 5, pvj: true, comp: "fixo", acoes: [["Sempre", "A1x2"]], txt: "Invocado pela Colônia de Os Espécimes de Lake.", invocado: true };
  INIMIGO["Broto de Shoggoth"] = { n: "Broto de Shoggoth", ato: 3, cat: "normal", pv: 6, comp: "fixo", acoes: [["Sempre", "A2"]], txt: "Brotou da Mãe das Bolhas.", invocado: true };
}

/* ---------- utilidades ---------- */
const clone = o => JSON.parse(JSON.stringify(o));
const pausaPadrao = 8;

class Motor {
  constructor(io, cfg) {
    catalogar(); catalogarArtefatos(); catalogarProvisoes(); catalogarInimigos();
    this.io = this.ioComVolta ? this.ioComVolta(io) : io; this.cfg = cfg || {};
    this.s = null;
    this.uid = 1;
  }
  /* ===== aleatoriedade (mulberry32 com estado salvo) ===== */
  r() {
    if (this.simulando) this.cortar("sorteio");   // prévia «a seco» (js/previa.js): nunca sorteia de verdade
    this.revel = (this.revel || 0) + 1;   // sorteio: daqui não se volta atrás (js/voltar.js)
    let a = (this.s.rng = (this.s.rng + 0x6D2B79F5) | 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  d6() { return 1 + Math.floor(this.r() * 6); }
  embaralhar(a) { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(this.r() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; }
  log(txt, tipo) { this.s.log.push(txt); if (this.s.log.length > 400) this.s.log.shift(); this.io.evento({ tipo: tipo || "log", txt }); }
  async pausa(n = pausaPadrao) { if (this.io.pausa) await this.io.pausa(n); }
  get n() { return this.s.jogadores.length; }               // número de jogadores (investigadores) originais
  vivos() { return this.s.jogadores.filter(j => !j.fora); }
  temArt(j, nome) { return j.artefatos.some(a => a.nome === nome); }
  art(j, nome) { return j.artefatos.find(a => a.nome === nome); }
  louc(n) { return this.s.opcoes.loucura >= n; }
  get V() { return this.s.opcoes.variantes; }
  cfgv(k) { return this.cfg[k] !== undefined ? (this.cfg[k].value !== undefined ? this.cfg[k].value : this.cfg[k]) : undefined; }

  /* ===== cartas ===== */
  nova(nome, dono, apr) { const d = DEF[nome]; if (!d) throw new Error("Carta desconhecida: " + nome); return { uid: this.uid++, nome, dono: dono || d.dono, apr: !!apr }; }
  def(c) { return DEF[c.nome]; }
  tipo(c) { return DEF[c.nome].t; }
  texto(c) { const d = DEF[c.nome]; return c.apr && d.u ? d.u : d.x; }
  tem(c, palavra) { return new RegExp("(^|\\. )" + palavra + "\\.").test(this.texto(c)); }  // palavra-chave no início de frase
  impossivel(c) { return /Impossível/.test(this.texto(c)); }
  efemero(c) { return /Efêmero\./.test(this.texto(c)); }
  guardar(c) { return /(^|\. )Guardar\./.test(this.texto(c)) || (c.mod && c.mod.guardar); }
  premonicao(c) { return /(^|\. )Premonição\./.test(this.texto(c)); }
  banirAoJogar(c) { return /(^|\. )Banir\.$|(^|\. )Banir\. /.test(this.texto(c)) || / Banir\.$/.test(this.texto(c)); }
  custoBase(c) { const d = DEF[c.nome]; return c.apr && d.uk !== undefined ? d.uk : d.k; }

  /* =====================================================================
     NOVA PARTIDA (Capítulo 4)
     ===================================================================== */
  novaPartida(op) {
    // op: { semente, investigadores: [id,id], mapas: {1:'A',2:'B',3:'A'}, loucura, variantes: {...} }
    this.s = {
      versao: 1, semente: op.semente >>> 0, rng: op.semente >>> 0,
      opcoes: { loucura: op.loucura || 0, variantes: Object.assign({ curta: false, narrativo: false, heroica: false, misterios: false, sanidade: false, draft: false }, op.variantes || {}) },
      mapas: Object.assign({ 1: "A", 2: "A", 3: "A" }, op.mapas || {}),
      ato: 1, mapa: null, pos: null, linhaAtual: -1,
      anciao: null, combatesNoAto: 0, esteatitos: { acampamento: false, guardiao: false, achado: false },
      olhar: 0, fase: "mapa", combate: null, log: [], baralhos: {}, nsAchadoBloqueado: [], fim: null, uid: 1,
      jogadores: [], visitados: []
    };
    const B = this.s.baralhos;
    const arts = [...JOGO.artefatos.comuns, ...JOGO.artefatos.incomuns, ...JOGO.artefatos.raros].map(a => a[0]);
    B.artefatos = this.embaralhar(arts);
    B.chefeArt = this.embaralhar(JOGO.artefatos.chefe.map(a => a[0]));
    B.deposito = this.embaralhar(JOGO.artefatos.antiquario.map(a => a[0]));
    B.provisoes = this.embaralhar(JOGO.elixires.flatMap(e => Array(e[2]).fill(e[0])));
    B.eventos = this.embaralhar(JOGO.eventos.map(e => e.n));
    B.incolores = this.embaralhar(JOGO.incolores.map(c => c.n));
    B.traumas = this.embaralhar(JOGO.traumas.map(c => c.n));
    for (const id of op.investigadores) {
      const p = JOGO.personagens.find(x => x.id === id);
      const j = {
        id, nome: p.nome, pessoa: p.pessoa, cor: p.cor, cor2: p.cor2,
        pvMax: p.pv, pv: p.pv, creditos: 3, provisoes: [], slotsProv: 2,
        artefatos: [{ nome: p.artefato, marc: 0 }], baralho: [], recompensas: [], raras: [],
        sanidade: 3, talismaUsado: false, fora: false, achadoVazio: false
      };
      for (const [q, c] of p.inicial) for (let i = 0; i < q; i++) j.baralho.push(this.nova(c.n, id));
      // baralho de Recompensas: Comuns (2 cópias) + Incomuns; Raras à parte
      j.recompensas = this.embaralhar([...p.comuns.flatMap(c => [c.n, c.n]), ...p.incomuns.map(c => c.n)]);
      j.raras = this.embaralhar(p.raras.map(c => c.n));
      if (this.V.narrativo) { j.pvMax += 3; j.pv += 3; j.creditos = 6; }
      if (this.louc(9)) { j.pvMax -= 1; j.pv = j.pvMax; }
      if (this.louc(5)) j.baralho.push(this.nova("Dúvida", "trauma"));
      this.s.jogadores.push(j);
    }
    this.s.uid = this.uid;
    this.prepararAto(1);
    return this.s;
  }
  carregar(estado) { this.s = estado; this.uid = estado.uid || 1000; }
  salvar() { this.s.uid = this.uid; return clone(this.s); }

  prepararAto(ato) {
    const s = this.s; s.ato = ato; s.combatesNoAto = 0; s.pos = null; s.linhaAtual = -1; s.visitados = [];
    if (ato === 4) { s.mapa = { linear: true, etapas: ["refugio", "antiquario", "sentinelas", "refugio", "danforth"] }; s.anciao = "O Que Danforth Viu — A Miragem"; return; }
    const m = gerarMapa(`ato${ato}${s.mapas[ato]}`);
    s.mapa = { LIN: m.LIN, COL: m.COL, nos: [...m.nos], arestas: [...m.arestas], tipo: m.tipo, desperto: m.desperto };
    const chefes = this.embaralhar(JOGO.inimigos.filter(e => e.ato === ato && e.cat === "chefe").map(e => e.n));
    s.anciao = chefes[0];
    const enc = JOGO.encontros.filter(e => e[0] === ato);
    s.baralhos.encFacil = this.embaralhar(enc.filter(e => e[1] === "facil").map(e => e[2]));
    s.baralhos.encDificil = this.embaralhar(enc.filter(e => e[1] === "dificil").map(e => e[2]));
    s.baralhos.horrores = this.embaralhar(JOGO.inimigos.filter(e => e.ato === ato && e.cat === "elite").map(e => e.n));
  }
  /* ---------- mapa ---------- */
  opcoesMapa() {
    const s = this.s, m = s.mapa;
    if (m.linear) return s.linhaAtual + 1 < m.etapas.length ? [String(s.linhaAtual + 1)] : [];
    if (s.pos === "chefe") return [];
    if (s.pos === null) return m.nos.filter(k => k.startsWith("0,"));
    const [r, c] = s.pos.split(",").map(Number);
    if (r === m.LIN - 1) return ["chefe"];
    if (s.saltoLivre) { s.saltoLivre = false; return m.nos.filter(k => +k.split(",")[0] === r + 1); }
    return m.arestas.map(a => a.split(",").map(Number)).filter(([ar, ac]) => ar === r && ac === c).map(([ar, , c2]) => `${ar + 1},${c2}`);
  }

  /* =====================================================================
     LAÇO PRINCIPAL DA EXPEDIÇÃO
     ===================================================================== */
  async jogar() {
    const s = this.s;
    while (!s.fim) {
      s.fase = "mapa";
      if (this.io.salvar) this.io.salvar(this.salvar());
      // um nó que não revela nada ao entrar (Acampamento, Achado) deixa voltar ao mapa na primeira escolha
      await this.comVolta(async () => {
        const opc = this.opcoesMapa();
        const destino = await this.io.escolher({ tipo: "mapa", opcoes: opc, titulo: s.pos === null ? "Escolham um nó da linha 1" : "Escolham o próximo nó" });
        await this.entrarNo(destino);
      });
    }
    s.fase = "fim";
    if (this.io.salvar) this.io.salvar(null);
    return s.fim;
  }
  async entrarNo(k) {
    const s = this.s;
    if (s.mapa.linear) {
      s.linhaAtual = +k; const t = s.mapa.etapas[s.linhaAtual];
      if (t === "refugio") return this.acampamento();
      if (t === "antiquario") return this.deposito();
      if (t === "sentinelas") return this.combateGrupo(["Sentinela Prismática Aguda", "Sentinela Prismática Grave"], "elite", { ato4: true });
      if (t === "danforth") return this.combateChefe("O Que Danforth Viu — A Miragem");
    }
    if (k === "chefe") { s.pos = "chefe"; return this.combateChefe(s.anciao); }
    s.pos = k; s.linhaAtual = +k.split(",")[0]; s.visitados.push(k);
    const t = s.mapa.tipo[k];
    this.log(`— Linha ${s.linhaAtual + 1}: ${NO[t].nome}${k === s.mapa.desperto ? " (DESPERTO)" : ""}`, "titulo");
    if (t === "combate") return this.combateCriatura({ contaPrimeiros: true });
    if (t === "elite") return this.combateHorror(k === s.mapa.desperto);
    if (t === "misterio") return this.misterio();
    if (t === "refugio") return this.acampamento();
    if (t === "antiquario") return this.deposito();
    if (t === "relicario") return this.achado();
  }

  /* ---------- montar combates (Cap. 7) ---------- */
  async combateCriatura(op = {}) {
    const s = this.s, B = s.baralhos;
    const dificil = op.dificil !== undefined ? op.dificil : (op.contaPrimeiros ? s.combatesNoAto >= 3 : false);
    if (op.contaPrimeiros) s.combatesNoAto++;
    const fileiras = [];
    for (const j of this.vivos()) {
      const pilha = dificil ? B.encDificil : B.encFacil;
      const nome = pilha.shift(); pilha.push(nome);
      const enc = JOGO.encontros.find(e => e[2] === nome && e[0] === s.ato) || JOGO.encontros.find(e => e[2] === nome);
      fileiras.push({ jog: s.jogadores.indexOf(j), encontro: nome, inimigos: enc[3] });
      this.log(`${j.nome} revela o Encontro ${dificil ? "Difícil" : "Fácil"} «${nome}».`);
    }
    return this.combate({ tipo: "criatura", fileiras, recompensa: op.recompensa || "criatura", extraVitoria: op.extraVitoria });
  }
  async combateHorror(desperto) {
    const B = this.s.baralhos; const nome = B.horrores.shift(); B.horrores.push(nome);
    return this.combate({ tipo: "elite", central: [nome], recompensa: "elite", desperto });
  }
  async combateGrupo(nomes, rec, extra = {}) { return this.combate(Object.assign({ tipo: "elite", central: nomes, recompensa: rec }, extra)); }
  async combateChefe(nome) { return this.combate({ tipo: "chefe", central: [nome], recompensa: "chefe" }); }

  criarInimigo(nome, fileira, op = {}) {
    const d = INIMIGO[nome]; const s = this.s;
    let pv = op.pv !== undefined ? op.pv : d.pv * (d.pvj ? this.n : 1);
    if (op.pv === undefined) {
      if (d.cat === "elite" && this.louc(1)) pv += 2 * this.n;
      if (d.cat === "chefe" && this.louc(3)) pv += 5 * this.n;
      if (d.cat === "chefe" && this.V.narrativo) pv -= 5 * this.n;
      if (d.cat === "chefe" && this.V.heroica && s.caidos) pv += 10 * this.n * s.caidos;
    }
    const e = { uid: this.uid++, nome, fileira, pv, pvMax: pv, bloqueio: 0, cond: condVazia(), seq: 0, intencao: null, novo: !!op.novo, f: {}, marcas: {} };
    return e;
  }

  async combate(cfg) {
    const s = this.s;
    const c = s.combate = { tipo: cfg.tipo, recompensa: cfg.recompensa, inimigos: [], rodada: 0, dado: null, dadoAnterior: null, desperto: !!cfg.desperto, extraVitoria: cfg.extraVitoria, fugiu: [], encontros: [], terminou: false, ordem: 0 };
    s.fase = "combate";
    if (cfg.fileiras) for (const f of cfg.fileiras) { c.encontros[f.jog] = f.encontro; for (const n of f.inimigos) c.inimigos.push(this.criarInimigo(n, f.jog)); }
    if (cfg.central) for (const n of cfg.central) c.inimigos.push(this.criarInimigo(n, "c"));
    this.log(`Combate: ${c.inimigos.map(e => e.nome).join(", ")}.`, "titulo");
    // preparação de cada investigador
    for (const j of this.vivos()) {
      j.c = { compra: this.embaralhar(j.baralho.map(x => Object.assign({}, x))), mao: [], descarte: [], banidas: [], poderes: [], bloqueio: 0, energia: 0, cond: condVazia(), postura: "neutra", revelacao: 0, concentracao: 0, glifos: [], slotsGlifo: 3, t: {}, proxTurno: [], cartasJogadas: 0, ataquesJogados: 0, fichas: [], marcasMao: {}, marcosFot: false, muralha: false };
    }
    // efeitos de início de combate: inimigos
    for (const e of [...c.inimigos]) await this.inimigoInicio(e);
    if (c.desperto) for (const e of c.inimigos) if (INIMIGO[e.nome].cat === "elite") { e.cond.furia += 1; e.pv += 3 * this.n; e.pvMax += 3 * this.n; this.log(`${e.nome} está DESPERTO: 1 Fúria e +${3 * this.n} PV.`); }
    for (const e of c.inimigos) {
      const cat = INIMIGO[e.nome].cat;
      if (cat === "elite" && this.louc(7)) e.cond.furia += 1;
      if (cat === "normal" && s.ato === 3 && this.louc(2)) e.cond.furia += 1;
      if (cat === "chefe" && this.louc(10) && (s.ato === 3 || s.ato === 4)) { e.cond.furia += 2; e.cond.amparo += 1; }
    }
    // artefatos de início de combate (antes de comprar a mão)
    for (const j of this.vivos()) await this.disparar("inicioCombate", j, {});
    // mão inicial: Premonição + completar 5 (artefatos de "primeiro turno" somam aqui)
    for (const j of this.vivos()) {
      const pre = j.c.compra.filter(x => this.premonicao(x));
      j.c.compra = j.c.compra.filter(x => !this.premonicao(x));
      for (const x of pre) j.c.mao.push(x);
      const extra = this.extraPrimeiraMao(j);
      const alvo = Math.max(5 + extra, pre.length);
      await this.comprar(j, Math.max(0, alvo - j.c.mao.length), { inicial: true });
    }
    await this.io.atualizar?.();
    // rodadas
    while (!c.terminou) {
      await this.rodada();
      if (s.fim) return;
    }
    if (s.fim) return;
    await this.fimCombate();
  }
  extraPrimeiraMao(j) { let n = 0; if (this.temArt(j, "Maleta de Dissecação")) n += 2; if (this.temArt(j, "Caderno de Campo")) n += 2; return n; }

  /* ===== a rodada: 5 fases (Cap. 7) ===== */
  async rodada() {
    const s = this.s, c = s.combate;
    c.rodada++;
    for (const e of c.inimigos) e.novo = false;
    c.t = { habilidadeJogador: {} };
    // FASE 1 — PRESSÁGIO
    s.faseRodada = "pressagio";
    c.dadoAnterior = c.dado; c.dado = this.d6();
    this.log(`Rodada ${c.rodada} — Presságio: o dado mostra ${c.dado}.`, "dado");
    this.io.evento({ tipo: "dado", valor: c.dado });
    this.io.evento({ tipo: "fase", fase: "pressagio", rodada: c.rodada, dado: c.dado });   // a tela anuncia a rodada
    for (const e of c.inimigos) this.revelarIntencao(e);
    await this.pausa(20);
    // FASE 2 — TURNO DOS JOGADORES (simultâneo)
    s.faseRodada = "jogadores";
    for (const j of this.vivos()) await this.inicioTurno(j);
    if (this.checarFim()) return;
    await this.turnoJogadores();
    if (this.checarFim()) return;
    if (await this.fasesFimEInimigos()) return;
    // FASE 5 — FIM DA RODADA
    s.faseRodada = "fimRodada";
    await this.fimRodada();
    this.checarFim();
  }
  // Fases 3 e 4. Separadas da rodada porque a previsão do dano da rodada (js/previa.js) roda exatamente este trecho «a seco».
  async fasesFimEInimigos() {
    const s = this.s;
    // FASE 3 — FIM DO TURNO DOS JOGADORES
    s.faseRodada = "fimJogadores";
    for (const j of this.vivos()) { await this.fimTurno(j); if (this.checarFim()) return true; }
    // FASE 4 — TURNO DOS INIMIGOS
    s.faseRodada = "inimigos";
    this.io.evento({ tipo: "fase", fase: "inimigos", rodada: s.combate.rodada });
    await this.pausa(14);     // tempo de a tela anunciar o turno dos inimigos (não muda regra nenhuma)
    await this.turnoInimigos();
    return this.checarFim();
  }
  checarFim() {
    const s = this.s, c = s.combate;
    if (s.fim) return true;
    if (c && !c.inimigos.some(e => e.pv > 0)) { c.terminou = true; return true; }
    return false;
  }
  revelarIntencao(e) {
    const d = INIMIGO[e.nome], c = this.s.combate;
    if (e.novo) { e.intencao = null; return; }
    if (e.f.formaNova) { e.intencao = null; return; }
    let idx = 0;
    if (d.comp === "dado") idx = d.acoes.findIndex(([r]) => { const m = r.match(/^(\d)(?:-(\d))?$/); const a = +m[1], b = m[2] ? +m[2] : a; return c.dado >= a && c.dado <= b; });
    else if (d.comp === "seq") {
      if (e.seqIniciado) {
        const atual = d.acoes[e.seq][0];
        const volta = atual.match(/↺(\d)ª/);
        if (volta) e.seq = +volta[1] - 1;
        else if (/→/.test(atual)) { /* repete para sempre */ }
        else e.seq = Math.min(e.seq + 1, d.acoes.length - 1);
      }
      e.seqIniciado = true; idx = e.seq;
    }
    e.intencao = { idx, texto: d.acoes[idx][1], vezes: 1 };
    if (e.nome === "O Abismo Que Responde" && c.dadoAnterior === c.dado) { e.intencao.vezes = 2; this.log("Maré Repetida: o dado repetiu — o Abismo agirá duas vezes."); }
  }

  /* ---------- fase 2 ---------- */
  async inicioTurno(j) {
    const c = j.c, s = this.s;
    c.t = { perdeuPV: false, descartou: false, ataques: 0, cartas: 0, ultimaTipo: null, primeiraBanida: false, ecoUsado: false, reflexao: false, coca: false, necroUsado: false, guardarMao: false, habilidades: 0 };
    // (a) remove o Bloqueio — salvo Muralha de Gelo / Neblina Polar
    if (!this.temPoder(j, "Muralha de Gelo") && !c.manterBloqueio) c.bloqueio = 0;
    c.manterBloqueio = false;
    // Compreensão termina no início do próximo turno
    if (c.postura === "compreensao" && c.sairCompreensao) { c.sairCompreensao = false; await this.mudarPostura(j, "neutra", { automatico: true }); }
    // (c) energia = 3 (+ artefatos de chefe)
    c.energia = this.cfgv("energia") || 3;
    for (const a of j.artefatos) if (/^\+1 de energia no início de cada turno/.test(ARTEFATOS[a.nome]?.texto || "")) c.energia += 1;
    if (s.combate.rodada === 1) { if (this.temArt(j, "Caderno de Decalques")) c.energia += 1; if (this.temArt(j, "Lanterna de Querosene")) c.energia += 1; }
    // (b) efeitos de início de turno: Necrose, Glifo Estelar, Poderes, efeitos adiados
    if (c.cond.necrose > 0) { const n = c.cond.necrose; c.cond.necrose--; this.log(`${j.nome} perde ${n} PV pela Necrose.`); await this.perderPV(j, n, { fonte: "necrose" }); if (this.s.fim) return; }
    for (const g of c.glifos) if (g.t === "estelar") { c.energia += 1; this.log(`Glifo Estelar de ${j.nome}: +1 de energia.`); }
    const adiados = c.proxTurno; c.proxTurno = [];
    for (const f of adiados) await f.call(this, j);
    await this.disparar("inicioTurno", j, {});
    // (d) compra 5 (exceto na 1ª rodada: a mão inicial já é a do 1º turno)
    if (s.combate.rodada > 1) {
      let n = (this.cfgv("compraTurno") || 5) + (c.compraExtra || 0); c.compraExtra = 0;
      if (this.temArt(j, "Cristal Prismático")) n -= 1;
      n += this.contaPoder(j, "Aprendizado Contínuo");
      await this.comprar(j, n);
    } else c.compraExtra = 0;
    if (c.descartarInicio) { const k = c.descartarInicio; c.descartarInicio = 0; await this.descartarEscolha(j, k, "Ressonância: descarte " + k + " carta(s)"); }
  }
  async turnoJogadores() {
    // Os investigadores agem "ao mesmo tempo": a pessoa alterna entre eles até encerrar.
    const s = this.s;
    s.prontos = {};
    while (true) {
      await this.io.atualizar?.();
      const pend = this.vivos().filter(j => !s.prontos[s.jogadores.indexOf(j)]);
      if (!pend.length) return;
      const a = await this.io.acao(this);
      if (!a) continue;
      const j = s.jogadores[a.jog];
      if (a.tipo === "encerrarTodos") { for (const x of this.vivos()) s.prontos[s.jogadores.indexOf(x)] = true; continue; }
      if (a.tipo === "encerrar") { s.prontos[a.jog] = true; continue; }
      if (a.tipo === "reabrir") { delete s.prontos[a.jog]; continue; }
      if (s.prontos[a.jog]) continue;
      // uma carta ou Provisão que abre uma escolha pode ser desfeita enquanto nada foi revelado
      if (a.tipo === "jogar") await this.comVolta(() => this.jogarCarta(s.jogadores[a.jog], a.uid, a.alvo), { desdeInicio: true });
      if (a.tipo === "provisao") await this.comVolta(() => this.usarProvisao(s.jogadores[a.jog], a.i, a.alvo), { desdeInicio: true });
      if (a.tipo === "encerrarTurno") { s.prontos[a.jog] = true; await this.encerrarTurnoCedo(j); }
      if (this.checarFim()) return;
    }
  }
  async encerrarTurnoCedo() { /* Meditar: marcado como pronto */ }

  /* ---------- fase 3 ---------- */
  async fimTurno(j) {
    const c = j.c;
    await this.disparar("fimTurno", j, {});
    for (const [k, n] of (c.fimTurnoFx || [])) if (k === "furia") c.cond.furia = Math.max(0, c.cond.furia - n);   // Grito de Comando
    c.fimTurnoFx = [];
    // cartas na mão com efeito de fim de turno (Congelamento, Paranoia, Dúvida, Vergonha)
    for (const x of [...c.mao]) {
      if (x.nome === "Congelamento" || x.nome === "Paranoia") { this.log(`${x.nome}: ${j.nome} perde 1 PV.`); await this.perderPV(j, 1, { fonte: "carta" }); if (this.s.fim) return; }
      if (x.nome === "Dúvida") await this.aplicarJog(j, "debilitado", 1);
      if (x.nome === "Vergonha") await this.aplicarJog(j, "tremulo", 1);
    }
    // glifos passivos, da esquerda para a direita (Estelar age no início do turno)
    for (const g of [...c.glifos]) { if (!c.glifos.includes(g) || g.t === "estelar") continue; await this.glifoPassivo(j, g); if (this.checarFim()) return; }
    if (this.temArt(j, "Bastão de Esqui") && c.bloqueio === 0) { c.bloqueio = Math.min(20, 2); this.log(`Bastão de Esqui: ${j.nome} ganha 2 de Bloqueio.`); }
    // Efêmeras da mão são Banidas
    for (const x of [...c.mao]) if (this.efemero(x)) { await this.banir(j, x, "Efêmero"); }
    // guardar
    let guardadas = new Set(c.mao.filter(x => this.guardar(x)).map(x => x.uid));
    if (this.temArt(j, "Cápsula do Tempo Ancestral") || c.t.guardarMao) c.mao.forEach(x => guardadas.add(x.uid));
    else if (this.temArt(j, "Cachecol de Lã")) {
      const opc = c.mao.filter(x => !guardadas.has(x.uid));
      if (opc.length) { const r = await this.io.escolher({ tipo: "cartas", jog: this.idx(j), cartas: opc, min: 0, max: 1, titulo: "Cachecol de Lã: você pode Guardar 1 carta" }); for (const u of r) guardadas.add(u); }
    }
    for (const x of c.mao) if (guardadas.has(x.uid)) await this.disparar("guardada", j, { carta: x });
    // descartar o resto (descarte de fim de turno não conta como "descartada por efeito")
    const fica = [], vai = [];
    for (const x of c.mao) (guardadas.has(x.uid) ? fica : vai).push(x);
    c.mao = fica; for (const x of vai) c.descarte.push(x);
  }

  /* ---------- fase 4 ---------- */
  ordemInimigos() {
    const s = this.s, c = s.combate, n = s.jogadores.length;
    const ordemJ = []; for (let i = 0; i < n; i++) ordemJ.push((s.olhar + i) % n);
    const out = [];
    for (const ji of ordemJ) for (const e of c.inimigos) if (e.fileira === ji) out.push(e);
    for (const e of c.inimigos) if (e.fileira === "c") out.push(e);
    return out;
  }
  async turnoInimigos() {
    const c = this.s.combate;
    for (const e of c.inimigos) if (e.pv > 0) e.bloqueio = 0;
    for (const e of [...c.inimigos]) {
      if (e.pv <= 0 || e.cond.necrose <= 0) continue;
      let n = e.cond.necrose; e.cond.necrose--;
      if (e.nome === "Alfa da Matilha de Lake") n = Math.min(n, 1);
      this.log(`${e.nome} perde ${n} PV pela Necrose.`);
      await this.perdaInimigo(e, n, { fonte: "necrose" });
      if (this.checarFim()) return;
    }
    for (const e of this.ordemInimigos()) {
      if (e.pv <= 0 || e.novo || !e.intencao) continue;
      for (let v = 0; v < e.intencao.vezes; v++) {
        await this.executarIntencao(e);
        if (this.checarFim()) return;
        if (e.pv <= 0) break;
      }
      await this.pausa(10);
    }
  }
  /* ---------- fase 5 ---------- */
  async fimRodada() {
    const s = this.s, c = s.combate;
    for (const j of this.vivos()) if (j.c.cond.regenerar > 0) await this.curar(j, j.c.cond.regenerar);
    for (const e of c.inimigos) if (e.pv > 0) await this.inimigoFimRodada(e);
    for (const e of c.inimigos) if (e.pv > 0 && e.cond.regenerar > 0) { e.pv = Math.min(e.pvMax, e.pv + e.cond.regenerar); this.log(`${e.nome} regenera ${e.cond.regenerar} PV.`); }
    for (const j of this.vivos()) if (j.c.cond.intangivel > 0) j.c.cond.intangivel--;
    for (const e of c.inimigos) if (e.cond.intangivel > 0) e.cond.intangivel--;
    if (this.vivos().length > 1) { do { s.olhar = (s.olhar + 1) % s.jogadores.length; } while (s.jogadores[s.olhar].fora); this.log(`O Olhar do Abismo passa para ${s.jogadores[s.olhar].nome}.`); }
  }

  /* ===== fim do combate e recompensas (Cap. 7 e 9) ===== */
  async fimCombate() {
    const s = this.s, c = s.combate;
    this.log("Vitória no combate.", "titulo");
    for (const j of this.vivos()) {
      // limpa o combate: status e fichas saem; o resto volta ao baralho
      j.pvVitoria = j.pv;
      j.c = null;
      await this.disparar("fimCombate", j, {});
    }
    s.combate = null;
    const tipoRec = c.recompensa;
    if (tipoRec === "chefe" && s.ato === 4) { s.fim = { vitoria: true, verdadeira: true }; return; }
    if (tipoRec === "elite" && c.desperto && !s.esteatitos.guardiao) { s.esteatitos.guardiao = true; this.log("O grupo ganha o Esteatito do Guardião."); }
    await this.recompensas(tipoRec, c);
    if (c.extraVitoria) await c.extraVitoria.call(this);
    if (tipoRec === "chefe") await this.fimAto();
  }
  async recompensas(tipo, c) {
    const s = this.s;
    s.fase = "recompensa";
    for (const j of this.vivos()) {
      const ji = this.idx(j);
      if (c && c.fugiu.includes(ji)) { this.log(`${j.nome} não recebe recompensas (Sinalizador de Fumaça).`); continue; }
      const credito = { criatura: 2, elite: 4, chefe: 6 }[tipo];
      this.ganharCreditos(j, credito);
      // cartas
      let rev = [];
      if (tipo === "criatura") rev = this.revelar(j.recompensas, 3);
      if (tipo === "elite") rev = [...this.revelar(j.recompensas, 3), ...this.revelar(j.raras, 1).map(n => ({ rara: n }))];
      if (tipo === "chefe") rev = this.revelar(j.raras, 3).map(n => ({ rara: n }));
      await this.escolherCartaRecompensa(j, rev, `Recompensa de ${j.nome}: fique com 1 carta ou nenhuma`);
      // provisão no dado
      if (tipo !== "chefe") {
        const d = this.d6(); const ok = tipo === "criatura" ? d >= 5 : d >= 4;
        this.log(`${j.nome} rola ${d} para Provisão: ${ok ? "ganha 1 Provisão" : "nada"}.`);
        if (ok) await this.ganharProvisao(j);
      }
      if (tipo === "elite") await this.ganharArtefato(j);
    }
    if (tipo === "chefe") await this.artefatosDeChefe();
  }
  revelar(pilha, n) { this.revelou(); return pilha.splice(0, Math.min(n, pilha.length)); }
  async escolherCartaRecompensa(j, rev, titulo, op = {}) {
    if (!rev.length) return null;
    const ji = this.idx(j);
    const cartas = rev.map(x => typeof x === "string" ? { nome: x } : { nome: x.rara, rara: true });
    const r = await this.io.escolher({ tipo: "recompensa", jog: ji, cartas: cartas.map((x, i) => ({ uid: "r" + i, nome: x.nome, dono: j.id, apr: !!op.apr })), min: 0, max: op.max || 1, titulo });
    const escolhidas = new Set(r);
    let pegou = [];
    cartas.forEach((x, i) => {
      if (escolhidas.has("r" + i)) { j.baralho.push(this.nova(x.nome, j.id, !!op.apr)); pegou.push(x.nome); }
      else (x.rara ? j.raras : j.recompensas).push(x.nome);   // recusadas voltam ao fundo
    });
    this.log(pegou.length ? `${j.nome} adiciona ${pegou.join(", ")} ao baralho.` : `${j.nome} recusa as cartas.`);
    return pegou;
  }
  async artefatosDeChefe() {
    const s = this.s, B = s.baralhos, k = this.vivos().length + 1;
    const rev = B.chefeArt.splice(0, k);
    const ordem = []; for (let i = 0; i < s.jogadores.length; i++) { const j = s.jogadores[(s.olhar + i) % s.jogadores.length]; if (!j.fora) ordem.push(j); }
    for (const j of ordem) {
      if (!rev.length) break;
      const r = await this.io.escolher({ tipo: "artefatos", jog: this.idx(j), artefatos: rev, min: 0, max: 1, titulo: `Artefato de Chefe — ${j.nome} escolhe um ou passa` });
      if (r.length) { const nome = rev.splice(rev.indexOf(r[0]), 1)[0]; await this.obterArtefato(j, nome); }
    }
    // os não escolhidos voltam para a caixa
  }
  async fimAto() {
    const s = this.s;
    if (this.V.curta && s.ato === 1) { s.fim = { vitoria: true, curta: true }; return; }
    if (s.ato === 3) {
      const e = s.esteatitos;
      if (e.acampamento && e.guardiao && e.achado) {
        const r = await this.io.escolher({ tipo: "opcoes", titulo: "Os Três Esteatitos", texto: "Vocês reúnem os Três Esteatitos. Podem subir ao Ato IV — As Montanhas Mais Altas — ou voltar para casa com a vitória.", opcoes: [{ rotulo: "Subir ao Ato IV" }, { rotulo: "Encerrar com a Vitória" }] });
        if (r === 1) { s.fim = { vitoria: true }; return; }
      } else { s.fim = { vitoria: true }; return; }
    }
    // recupera todo o PV (Loucura 4: metade do perdido, arredondado para cima)
    for (const j of this.vivos()) {
      if (this.louc(4)) j.pv = Math.min(j.pvMax, j.pv + Math.ceil((j.pvMax - j.pv) / 2)); else j.pv = j.pvMax;
    }
    this.prepararAto(s.ato + 1);
    this.log(`Começa o Ato ${ROMANO[s.ato]} — ${NOME_ATO[s.ato]}.`, "titulo");
    this.io.evento({ tipo: "ato", ato: s.ato });
    if (this.io.abertura) await this.io.abertura(s.ato);
  }

  /* ===== itens ===== */
  ganharCreditos(j, n) {
    if (n <= 0) return;
    if (this.temArt(j, "Sangue de Shoggoth Cristalizado")) { this.log(`${j.nome} não pode ganhar créditos.`); return; }
    if (this.temArt(j, "Contrato com a Fundação")) n += 1;
    j.creditos += n; this.log(`${j.nome} ganha ${n} crédito(s) (${j.creditos}).`);
  }
  /* Cap. 10: 2 espaços de Provisão; sem espaço livre, descarte uma das suas (ou a nova).
     A tela mostra as cartas (imagem e texto) da nova e das que o investigador já tem. */
  async ganharProvisao(j, nome) {
    const B = this.s.baralhos; const doBaralho = !nome;
    if (!nome) { this.revelou(); nome = B.provisoes.shift(); if (!nome) return; }
    const itens = [...j.provisoes.map(n => ({ nome: n })), { nome, nova: true }];
    if (j.provisoes.length >= j.slotsProv) {
      const r = await this.io.escolher({ tipo: "provisoes", jog: this.idx(j), descartar: true, itens, titulo: `${j.nome}: sem espaço de Provisão`, texto: `${j.nome} tem ${j.slotsProv} espaços de Provisão, todos ocupados. Descarte uma das suas — ou a nova.` });
      const k = Math.max(0, Math.min(itens.length - 1, +r || 0));
      const fica = itens.map(x => x.nome); const fora = fica.splice(k, 1)[0]; B.provisoes.push(fora); j.provisoes = fica;
      this.log(k === itens.length - 1 ? `${j.nome} descarta a Provisão nova, ${nome}.` : `${j.nome} recebe a Provisão ${nome} e descarta ${fora}.`);
      return;
    }
    j.provisoes.push(nome);
    this.log(`${j.nome} recebe a Provisão ${nome}.`);
    // veio do baralho: mostra a carta para a pessoa saber o que ganhou
    if (doBaralho) await this.io.escolher({ tipo: "provisoes", jog: this.idx(j), descartar: false, itens, titulo: `${j.nome} recebe uma Provisão`, texto: "" });
  }
  async ganharArtefato(j) {
    this.revelou();
    const B = this.s.baralhos; const nome = B.artefatos.shift();
    if (!nome) { this.log("O baralho de Artefatos acabou."); return; }
    await this.obterArtefato(j, nome);
  }
  async obterArtefato(j, nome) {
    j.artefatos.push({ nome, marc: 0 });
    this.log(`${j.nome} obtém o Artefato ${nome}.`);
    await this.disparar("obter", j, { artefato: nome });
  }
  async adicionarTrauma(j, nome) {
    if (!nome) { this.revelou(); const B = this.s.baralhos; nome = B.traumas.shift(); B.traumas.push(nome); }
    let copias = 1;
    if (this.V.sanidade) {
      if (j.sanidade > 0) {
        const r = await this.io.escolher({ tipo: "opcoes", titulo: `Sanidade — ${j.nome}`, texto: `${j.nome} receberia o Trauma ${nome}. Recusar custa 1 ponto de Sanidade (restam ${j.sanidade}).`, opcoes: [{ rotulo: "Aceitar o Trauma" }, { rotulo: "Recusar (−1 Sanidade)" }] });
        if (r === 1) { j.sanidade--; this.log(`${j.nome} recusa ${nome} e perde 1 Sanidade.`); return; }
      } else copias = 2;
    }
    for (let i = 0; i < copias; i++) j.baralho.push(this.nova(nome, "trauma"));
    this.log(`${j.nome} adiciona o Trauma ${nome}${copias > 1 ? " (2 cópias)" : ""}.`);
  }
  async removerCartaEscolha(j, titulo, filtro) {
    const opc = j.baralho.filter(x => !(x.nome === "Maldição do Livro") && (!filtro || filtro(x)));
    if (!opc.length) return null;
    const r = await this.io.escolher({ tipo: "cartas", jog: this.idx(j), cartas: opc, min: 1, max: 1, titulo });
    return this.removerDoBaralho(j, r[0]);
  }
  removerDoBaralho(j, uid) {
    const i = j.baralho.findIndex(x => x.uid === uid); if (i < 0) return null;
    const x = j.baralho.splice(i, 1)[0];
    if (DEF[x.nome].dono === j.id && "CI".includes(DEF[x.nome].rar)) j.recompensas.push(x.nome);
    else if (DEF[x.nome].dono === j.id && DEF[x.nome].rar === "R") j.raras.push(x.nome);
    this.log(`${j.nome} remove ${x.nome} do baralho.`);
    return x;
  }
  async aprimorarEscolha(j, titulo, n = 1) {
    for (let k = 0; k < n; k++) {
      const opc = j.baralho.filter(x => !x.apr && !"ST".includes(DEF[x.nome].t) && DEF[x.nome].u);
      if (!opc.length) return;
      const r = await this.io.escolher({ tipo: "cartas", jog: this.idx(j), cartas: opc, min: 1, max: 1, titulo: titulo + (n > 1 ? ` (${k + 1}/${n})` : ""), mostrarApr: true });
      const x = j.baralho.find(y => y.uid === r[0]); x.apr = true; this.log(`${j.nome} Aprimora ${x.nome}.`);
    }
  }
  aprimorarAleatoria(j) {
    const opc = j.baralho.filter(x => !x.apr && !"ST".includes(DEF[x.nome].t) && DEF[x.nome].u);
    if (!opc.length) return; const x = opc[Math.floor(this.r() * opc.length)]; x.apr = true; this.log(`${j.nome} Aprimora ${x.nome} (aleatória).`);
  }
  async transformarEscolha(j, titulo, n = 1) {
    for (let k = 0; k < n; k++) {
      const opc = j.baralho.filter(x => x.nome !== "Maldição do Livro");
      if (!opc.length) return;
      const r = await this.io.escolher({ tipo: "cartas", jog: this.idx(j), cartas: opc, min: 1, max: 1, titulo: titulo + (n > 1 ? ` (${k + 1}/${n})` : "") });
      const x = this.removerDoBaralho(j, r[0]);
      this.revelou(); const nova = j.recompensas.shift();
      if (nova) { j.baralho.push(this.nova(nova, j.id)); this.log(`${x.nome} se Transforma em ${nova}.`); }
    }
  }
  idx(j) { return this.s.jogadores.indexOf(j); }
}

Object.assign(globalThis, { Motor, DEF, ARTEFATOS, PROVISOES, INIMIGO, COND_NOME, NOME_COND, CONDS_NEG, condVazia });
