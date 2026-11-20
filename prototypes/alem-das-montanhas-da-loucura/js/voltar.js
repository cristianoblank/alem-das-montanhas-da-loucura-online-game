// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-20
/* =====================================================================
   VOLTAR — desfazer uma escolha enquanto nada foi revelado.
   Na mesa, quem abre um menu e desiste simplesmente não faz a ação. Aqui,
   o motor guarda um «ponto de retorno» (cópia do estado) antes de cada
   decisão e deixa a pessoa voltar a ele pelas perguntas seguintes — mas só
   enquanto nenhuma informação escondida apareceu: nada de dado rolado,
   baralho embaralhado ou carta, Artefato, Provisão ou Evento revelado.
   Depois disso não há volta, para ninguém desfazer o que não gostou de ver.

   this.revel  conta as revelações (sobe em r(), compras e saques de pilhas)
   this.pontos pilha de pontos de retorno { estado, uid, revel, n, desdeInicio }
               n = quantas perguntas foram feitas desde o ponto
   ===================================================================== */
'use strict';
(function () {
const M = globalThis;
const VOLTAR = "__voltar__";
class Voltar extends Error { constructor() { super("voltar"); this.voltar = true; } }

// cópia do estado que mantém funções (efeitos adiados de cartas) por referência.
// Cada pedaço da cópia lembra de qual objeto vivo saiu (ORIGEM), para a volta devolver o conteúdo ao MESMO objeto:
// quem guardou uma carta, um inimigo ou um investigador numa variável continua com o objeto certo na mão.
const ORIGEM = new WeakMap();
function copia(o) {
  if (o === null || typeof o !== "object") return o;
  let r;
  if (Array.isArray(o)) r = o.map(copia);
  else { r = {}; for (const k of Object.keys(o)) r[k] = copia(o[k]); }
  ORIGEM.set(r, o); return r;
}
// devolve o objeto vivo de onde `f` foi copiado, com o conteúdo que tinha na hora da cópia
function restaurar(f) {
  if (f === null || typeof f !== "object") return f;
  const a = ORIGEM.get(f);
  if (!a || Array.isArray(a) !== Array.isArray(f)) return copia(f);
  if (Array.isArray(f)) { a.length = f.length; for (let i = 0; i < f.length; i++) a[i] = restaurar(f[i]); return a; }
  for (const k of Object.keys(a)) if (!(k in f)) delete a[k];
  for (const k of Object.keys(f)) a[k] = restaurar(f[k]);
  return a;
}
// deixa `a` igual a `f` sem trocar os objetos de `a` (para um estado que não é a origem da cópia: partida carregada no meio)
function sincronizar(a, f) {
  if (Array.isArray(f)) { a.length = f.length; for (let i = 0; i < f.length; i++) a[i] = casar(a[i], f[i]); return a; }
  for (const k of Object.keys(a)) if (!(k in f)) delete a[k];
  for (const k of Object.keys(f)) a[k] = casar(a[k], f[k]);
  return a;
}
function casar(x, y) {
  if (y === null || typeof y !== "object") return y;
  if (x !== null && typeof x === "object" && Array.isArray(x) === Array.isArray(y)) return sincronizar(x, y);
  return copia(y);
}
// põe o estado `vivo` de volta como estava quando `foto` foi tirada
function repor(vivo, foto) { if (ORIGEM.get(foto) === vivo) restaurar(foto); else sincronizar(vivo, foto); }
M.Motor.estado = { copia, repor };

Object.assign(M.Motor.prototype, {
  // envolve o io da interface: toda pergunta passa por aqui
  ioComVolta(io) {
    this.pontos = []; this.revel = 0;
    const p = Object.create(io); p.escolher = spec => this.perguntar(io, spec); return p;
  },
  revelou() { if (this.simulando) this.cortar("revelacao"); this.revel = (this.revel || 0) + 1; },
  podeVoltar() { return (this.pontos || []).some(p => p.revel === this.revel && (p.n > 0 || p.desdeInicio)); },
  async perguntar(io, spec) {
    const pode = !["mapa", "loja"].includes(spec.tipo) && !spec.semVoltar && this.podeVoltar();
    for (const p of this.pontos) p.n++;
    if (pode) spec.voltar = true; else delete spec.voltar;
    while (true) {
      const r = await io.escolher(spec);
      if (r !== VOLTAR) return r;
      if (pode) throw new Voltar();
    }
  },
  marcarPonto(op = {}) {
    const p = { estado: copia(this.s), uid: this.uid, revel: this.revel, n: 0, desdeInicio: !!op.desdeInicio };
    this.pontos.push(p); return p;
  },
  restaurarPonto(p) { repor(this.s, p.estado); this.uid = p.uid; this.log("(voltou atrás)"); },
  soltarPonto(p) { const i = this.pontos.indexOf(p); if (i >= 0) this.pontos.length = i; },
  /* Roda f; se a pessoa voltar numa pergunta feita lá dentro, desfaz e roda f de novo.
     Sem desdeInicio, voltar na PRIMEIRA pergunta de f sobe para quem chamou (não há o que desfazer aqui). */
  async comVolta(f, op = {}) {
    while (true) {
      const p = this.marcarPonto(op);
      try { const r = await f(); this.soltarPonto(p); return r; }
      catch (e) {
        const aqui = e && e.voltar && p.revel === this.revel && (p.n > 1 || op.desdeInicio);
        if (aqui) this.restaurarPonto(p);
        this.soltarPonto(p);
        if (!aqui) throw e;
        if (op.desdeInicio) return undefined;   // a ação inteira foi desfeita: quem chamou pergunta de novo
      }
    }
  },
  /* Uma fila de decisões (uma por investigador, por exemplo). Voltar na primeira pergunta de um
     passo retorna ao passo anterior, se nada foi revelado desde lá. Um passo que devolve "parar"
     encerra a fila. */
  async emPassos(passos) {
    const ps = []; let i = 0;
    try {
      while (i < passos.length) {
        ps[i] = this.marcarPonto();
        try { const r = await passos[i](); if (r === "parar") break; i++; }
        catch (e) {
          if (!(e && e.voltar)) throw e;
          const p = ps[i];
          if (p.revel === this.revel && p.n > 1) { this.restaurarPonto(p); this.soltarPonto(p); continue; }
          if (i > 0 && ps[i - 1].revel === this.revel) { this.restaurarPonto(ps[i - 1]); this.soltarPonto(ps[i - 1]); i--; continue; }
          throw e;
        }
      }
    } finally { if (ps[0]) this.soltarPonto(ps[0]); }
  }
});
Object.assign(M, { VOLTAR, Voltar });
})();
