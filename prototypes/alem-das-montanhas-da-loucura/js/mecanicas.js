// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-20
/* =====================================================================
   MECÂNICAS ÚNICAS DOS INVESTIGADORES — leitura para a tela (Cap. 13).
   Nada aqui muda o estado: só descreve, em números, o que as regras vão
   fazer com o que está na mesa agora. A tela desenha o que sair daqui.
   ===================================================================== */
'use strict';
(function () {
const M = globalThis;
const EFEITO_POSTURA = {
  neutra: "Sem efeito.",
  lucidez: "Ao sair dela (por qualquer motivo), ganhe 2 de energia.",
  panico: "Seus Ataques causam o dobro — e o dano de Ataque que você recebe também.",
  compreensao: "Seus Ataques causam o triplo. No início do seu próximo turno, você volta a Neutra."
};
// versão de uma linha para o tabuleiro (o texto completo fica na dica e no painel)
const POSTURA_CURTO = {
  neutra: "Neutra: sem efeito.", lucidez: "Lucidez: ao sair dela, ganhe 2 de energia.",
  panico: "Pânico: Ataques ×2 — os seus e os que você recebe.", compreensao: "Compreensão: Ataques ×3. Volta a Neutra no próximo turno."
};
const semDe = t => t.replace(/^d[eo] /, "").replace("Estelares", "Estelar");
// o que cada carta faz com a mecânica do dono, lido do próprio texto da carta
function marcasDaCarta(texto) {
  const out = []; let r;
  if (/Inscreva 1 Glifo de Gelo para cada/.test(texto)) out.push({ k: "inscreve", txt: "Inscreve Gelo por inimigo" });
  else {
    const re = /Inscreva (\d+|X\+1|X) Glifos? (de Relâmpago|de Gelo|do Vazio|Estelar(?:es)?)/g;
    while ((r = re.exec(texto))) out.push({ k: "inscreve", txt: `Inscreve ${r[1] === "1" ? "" : r[1] + " "}${semDe(r[2])}` });
  }
  if (/Inscreva novamente/.test(texto)) out.push({ k: "ativa", txt: "Ativa e reinscreve" });
  else if ((r = texto.match(/Ative o seu glifo mais à esquerda(?: (\d+) vezes)?/))) out.push({ k: "ativa", txt: "Ativa glifo" + (r[1] ? " ×" + r[1] : "") });
  if (/acione o (?:efeito )?passivo/i.test(texto)) out.push({ k: "inscreve", txt: "Aciona passivo" });
  if ((r = texto.match(/Ganhe (\d+) Concentração/))) out.push({ k: "inscreve", txt: `+${r[1]} Concentração` });
  if ((r = texto.match(/(?:^|\. )Entre em (Lucidez|Pânico|Compreensão)/))) out.push({ k: "postura", txt: "Entra em " + r[1] });
  if ((r = texto.match(/Caso contrário, entre em (Lucidez|Pânico)/))) out.push({ k: "postura", txt: "Entra em " + r[1] });
  if (/pretende atacar nesta rodada, entre em Lucidez/.test(texto)) out.push({ k: "postura", txt: "Lucidez, se o inimigo ataca" });
  if (/Saia da sua postura/.test(texto)) out.push({ k: "postura", txt: "Sai da postura" });
  if ((r = texto.match(/Ganhe (\d+) Revelação/))) out.push({ k: "postura", txt: `+${r[1]} Revelação` });
  return out;
}
const USA = {
  professor: /Glifo|glifo|Concentração/, sonhadora: /Lucidez|Pânico|Compreensão|postura|Revelação/,
  ocultista: /Necrose|Bisturi/, veterano: /Fúria|[Pp]erca \d+ PV|perder PV|perdeu PV/
};
const ataca = (e, re) => !!(e.pv > 0 && e.intencao && re.test(e.intencao.texto));

Object.assign(M.Motor.prototype, {
  /* O estado da mecânica única do investigador j, pronto para a tela. */
  mecanica(j) {
    const c = j.c, s = this.s; if (!c) return null;
    const out = { id: j.id };
    if (j.id === "professor") {
      const n = Math.max(c.slotsGlifo, c.glifos.length);
      out.titulo = "Glifos"; out.concentracao = c.concentracao;
      out.espacos = Array.from({ length: n }, (_, k) => {
        const g = c.glifos[k]; if (!g) return null;
        return { t: g.t, cargas: g.cargas, primeiro: k === 0, pass: this.valorGlifo(j, g, "pass"), ativ: this.valorGlifo(j, g, "ativ"), passTxt: this.textoGlifo(j, g, "pass"), ativTxt: this.textoGlifo(j, g, "ativ") };
      });
      let dano = 0, bloq = 0, cargas = 0, energia = 0;
      for (const g of c.glifos) {
        if (g.t === "relampago") dano += this.valorGlifo(j, g, "pass");
        if (g.t === "gelo") bloq += this.valorGlifo(j, g, "pass");
        if (g.t === "vazio") cargas += this.valorGlifo(j, g, "pass");
        if (g.t === "estelar") energia += 1;
      }
      const partes = [];
      if (bloq) partes.push(`${bloq} de Bloqueio`);
      if (dano) partes.push(this.temPoder(j, "Eletrodinâmica") ? `${dano} de dano em cada inimigo da fileira` : `${dano} de dano`);
      if (cargas) partes.push(`+${cargas} carga${cargas > 1 ? "s" : ""} no Vazio`);
      out.fimTurno = { dano, bloq, cargas, energia };
      out.resumo = c.glifos.length
        ? [partes.length ? `No fim deste turno: ${partes.join(" · ")}.` : "", energia ? `No início do próximo turno: +${energia} de energia.` : ""].filter(Boolean).join(" ")
        : "Nenhum glifo: jogue uma carta que diga «Inscreva».";
      out.cheio = c.slotsGlifo > 0 && c.glifos.length >= c.slotsGlifo;
      if (out.cheio) out.aviso = "Espaços cheios: Inscrever outro glifo Ativa o da esquerda.";
    } else if (j.id === "sonhadora") {
      out.titulo = "Estado mental"; out.postura = c.postura; out.revelacao = c.revelacao;
      out.resumo = POSTURA_CURTO[c.postura];
      out.mult = c.postura === "panico" ? 2 : c.postura === "compreensao" ? 3 : 1;
      if (c.postura === "panico") {
        const vem = s.combate.inimigos.some(e => (this.alvoDe(e) === j && ataca(e, /(^|;\s*|:\s*)A\d/)) || ataca(e, /(^|;\s*|:\s*)AT\d/));
        if (vem) out.aviso = "Há Ataque vindo: terminar em Pânico dobra o dano recebido.";
      }
    } else if (j.id === "ocultista") {
      out.titulo = "Necrose e Bisturis";
      out.necrose = s.combate.inimigos.filter(e => e.pv > 0 && e.cond.necrose > 0).map(e => {
        const n = e.cond.necrose, limite = e.nome === "Alfa da Matilha de Lake";
        return { uid: e.uid, nome: e.nome, n, agora: limite ? Math.min(n, 1) : n, total: limite ? n : n * (n + 1) / 2 };
      });
      const firme = this.poderesDe(j, "Mão Firme").reduce((t, p) => t + p.n * (p.apr ? 2 : 1), 0);
      const bist = c.mao.filter(x => x.nome === "Bisturi");
      out.bisturis = bist.length; out.maoFirme = firme;
      out.danoBisturi = bist.length ? (bist[0].apr ? 2 : 1) + firme + c.cond.furia : 1 + firme + c.cond.furia;
      out.descartou = !!c.t.descartou;
      out.resumo = out.necrose.length ? `No turno dos inimigos: ${out.necrose.map(x => `${x.nome} perde ${x.agora} PV`).join(" · ")}.` : "Nenhum inimigo com Necrose.";
    } else if (j.id === "veterano") {
      out.titulo = "Fúria e sacrifício"; out.furia = c.cond.furia; out.perdeuPV = !!c.t.perdeuPV;
      out.teimosia = this.contaPoder(j, "Teimosia Nórdica");
      out.temporaria = (c.fimTurnoFx || []).filter(x => x[0] === "furia").reduce((t, x) => t + x[1], 0);
      out.resumo = c.cond.furia > 0 ? `+${c.cond.furia} de dano em cada golpe dos seus Ataques.` : "Sem Fúria: seus Ataques causam o valor impresso.";
    }
    return out;
  },
  textoGlifo(j, g, modo) {
    const n = this.valorGlifo(j, g, modo);
    if (g.t === "relampago") return this.temPoder(j, "Eletrodinâmica") ? `${n} de dano em cada inimigo da sua fileira` : `${n} de dano a um inimigo à sua escolha`;
    if (g.t === "gelo") return `${n} de Bloqueio`;
    if (g.t === "vazio") return modo === "pass" ? `+${n} carga${n > 1 ? "s" : ""} (tem ${g.cargas})` : `${n} de dano ao inimigo com menos PV`;
    return modo === "pass" ? "+1 de energia no início do seu turno" : `+${n} de energia`;
  },
  // etiquetas de uma carta da mão: o que ela faz com a mecânica do investigador agora
  marcasCarta(j, x) {
    const marcas = marcasDaCarta(this.texto(x));
    if (j.c && marcas.some(q => q.k === "ativa") && !j.c.glifos.length) return [{ k: "aviso", txt: "Sem glifo p/ Ativar" }];
    return marcas;
  },
  // cartas do baralho que usam a mecânica única do investigador
  cartasDaMecanica(j) { const re = USA[j.id]; return re ? j.baralho.filter(x => re.test(M.DEF[x.nome].x)) : []; }
});
M.EFEITO_POSTURA = EFEITO_POSTURA;
})();
