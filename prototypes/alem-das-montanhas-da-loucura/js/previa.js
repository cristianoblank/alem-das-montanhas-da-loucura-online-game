// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-20
/* =====================================================================
   PRÉVIA «A SECO» — a conta que a pessoa faria de cabeça na mesa, feita pelo
   próprio motor de regras.
   Em vez de repetir as fórmulas de dano num segundo lugar (e errar numa
   delas), a prévia JOGA a carta de verdade num estado copiado, mede o que
   mudou e devolve tudo ao que era. Assim ela vale para qualquer carta,
   Provisão, Artefato ou habilidade de inimigo, sem regra nova.

   A prévia nunca mostra o que está escondido: no primeiro sorteio, compra de
   carta, carta revelada ou escolha, a simulação é CORTADA ali e avisa que o
   resto depende do que vier (campo `corte`).

   previaCarta(j, uid, alvo)      o que esta carta faz agora
   previaProvisao(j, i, alvo)     o que esta Provisão faz agora
   previsaoRodada()               o que acontece se todos encerrarem o turno agora
                                  (fim do turno dos jogadores + turno dos inimigos)
   ===================================================================== */
'use strict';
(function () {
const M = globalThis;
const { copia, repor } = M.Motor.estado;
class Corte extends Error { constructor(motivo) { super("corte da prévia"); this.corte = motivo; } }

// os números que a tela mostra, antes e depois
function foto(s) {
  const c = s.combate || { inimigos: [] };
  return {
    ini: c.inimigos.map(e => ({ uid: e.uid, nome: e.nome, pv: e.pv, bloqueio: e.bloqueio, cond: Object.assign({}, e.cond) })),
    jog: s.jogadores.map(j => ({ pv: j.pv, fora: !!j.fora, bloqueio: j.c ? j.c.bloqueio : 0, postura: j.c ? j.c.postura : null, cond: j.c ? Object.assign({}, j.c.cond) : {} }))
  };
}
function difCond(a, b) {
  const d = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const n = (b[k] || 0) - (a[k] || 0); if (n) d[k] = n; }
  return d;
}
const golpesDe = (ev, tipo, campo, quem) => ev.filter(e => e.tipo === tipo && e[campo] === quem).map(e => ({ n: e.n, bloq: e.bloq, resto: e.resto }));
function comparar(a, b, ev) {
  const inimigos = [];
  for (const x of a.ini) {
    if (x.pv <= 0) continue;
    const y = b.ini.find(z => z.uid === x.uid);
    const r = {
      uid: x.uid, nome: x.nome, pv0: x.pv, pv1: y ? Math.max(0, y.pv) : 0, bloq0: x.bloqueio, bloq1: y ? y.bloqueio : 0,
      golpes: golpesDe(ev, "dano", "alvo", x.uid), cond: y ? difCond(x.cond, y.cond) : {}, morre: !y || y.pv <= 0
    };
    if (r.golpes.length || r.pv0 !== r.pv1 || r.bloq0 !== r.bloq1 || Object.keys(r.cond).length || r.morre) inimigos.push(r);
  }
  const entram = b.ini.filter(y => y.pv > 0 && !a.ini.some(x => x.uid === y.uid)).map(y => y.nome);
  const jogadores = a.jog.map((x, i) => {
    const y = b.jog[i] || x;
    return {
      jog: i, pv0: x.pv, pv1: Math.max(0, y.pv), bloq0: x.bloqueio, bloq1: y.bloqueio, postura0: x.postura, postura1: y.postura,
      golpes: golpesDe(ev, "danoJog", "jog", i), cond: difCond(x.cond, y.cond), cai: !x.fora && (y.fora || y.pv <= 0)
    };
  });
  return { inimigos, entram, jogadores };
}

Object.assign(M.Motor.prototype, {
  // interrompe a simulação: chamado pelo sorteio (r), pelas revelações (revelou) e pelas perguntas
  cortar(motivo) { throw new Corte(motivo); },

  /* Roda f no estado de verdade e desfaz tudo em seguida. Devolve o que mudou:
       { inimigos: [{uid, nome, pv0, pv1, bloq0, bloq1, golpes: [{n, bloq, resto}], cond: {nome: variação}, morre}],
         entram: [nomes], jogadores: [{jog, pv0, pv1, bloq0, bloq1, postura0, postura1, golpes, cond, cai}],
         corte: null | "sorteio" | "revelacao" | "escolha", aprox: bool, erro }
     op.responder(spec): resposta automática para uma pergunta (undefined = cortar ali). Só funciona em combate. */
  async simular(f, op = {}) {
    const s = this.s;
    if (this.simulando || !s || !s.combate || s.fim) return null;
    const antes = copia(s), guarda = { uid: this.uid, revel: this.revel, io: this.io };
    const a = foto(s), ev = [], r = { corte: null, aprox: false, erro: null };
    this.simulando = true;
    this.io = {
      evento: e => { ev.push(e); }, pausa() { }, atualizar() { }, salvar() { }, abertura() { },
      acao: () => this.cortar("escolha"),
      escolher: spec => { const v = op.responder ? op.responder(spec) : undefined; if (v === undefined) this.cortar("escolha"); r.aprox = true; return Promise.resolve(v); }
    };
    try { await f(); }
    catch (e) { if (e && e.corte) r.corte = e.corte; else r.erro = e; }
    finally {
      try { Object.assign(r, comparar(a, foto(this.s), ev)); } catch (e) { r.erro = r.erro || e; }
      repor(this.s, antes);
      this.uid = guarda.uid; this.revel = guarda.revel; this.io = guarda.io; this.simulando = false;
    }
    return r;
  },

  // o que a carta `uid` da mão de j faz se for jogada agora (em `alvoUid`, se ela pede alvo); null se não dá para jogar
  previaCarta(j, uid, alvoUid) {
    const x = j && j.c && j.c.mao.find(y => y.uid === uid);
    if (!x || this.podeJogar(j, x) || (this.precisaAlvo(x) && !alvoUid)) return Promise.resolve(null);
    return this.simular(() => this.jogarCarta(j, uid, alvoUid));
  },
  previaProvisao(j, i, alvoUid) {
    if (!j || !j.provisoes[i]) return Promise.resolve(null);
    return this.simular(() => this.usarProvisao(j, i, alvoUid));
  },
  /* O que acontece se todos encerrarem o turno agora: fases 3 e 4 da rodada (fim do turno dos jogadores e turno
     dos inimigos), pelo mesmo código da partida. Escolhas de alvo usam o primeiro alvo e marcam `aprox`.
     Cada investigador ganha { vem, segura, perde }: dano que chega, quanto o Bloqueio segura, PV perdidos. */
  async previsaoRodada() {
    const r = await this.simular(() => this.fasesFimEInimigos(), {
      responder: spec => spec.tipo === "alvo" ? spec.opcoes[0] : spec.tipo === "cartas" && !spec.min ? [] : undefined
    });
    if (!r || !r.jogadores) return r;
    for (const q of r.jogadores) {
      q.vem = q.golpes.reduce((n, g) => n + g.n, 0);
      q.segura = q.golpes.reduce((n, g) => n + g.bloq, 0);
      q.perde = q.pv0 - q.pv1;
    }
    return r;
  }
});
})();
