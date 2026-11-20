// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
/* =====================================================================
   INTERFACE — a mesa em DOM. As cartas, inimigos, artefatos e o mapa são
   desenhados com as funções do próprio jogo de tabuleiro (material/comum.js
   e material/mapa.js). Esta camada só lê o estado do motor e devolve as
   decisões da pessoa pelo objeto io.
   ===================================================================== */
'use strict';
const UI = (function () {
const $ = s => document.querySelector(s);
const PX_MM = 3.7795;
const CARTA_W = 63 * PX_MM, CARTA_H = 88 * PX_MM, MINI_W = 44 * PX_MM, MINI_H = 63 * PX_MM;
const POST = { neutra: "Neutra", lucidez: "Lucidez", panico: "Pânico", compreensao: "Compreensão" };
const GLIFO = { relampago: ["Relâmpago", "#d9b25a"], gelo: ["Gelo", "#8fc3e6"], vazio: ["Vazio", "#7a5aa8"], estelar: ["Estelar", "#efd9a0"] };
const COND_DESC = {
  furia: "Fúria: +1 de dano em cada golpe de Ataque.", agilidade: "Agilidade: +1 de Bloqueio em cada carta que concede Bloqueio.",
  exposto: "Exposto: o próximo Ataque recebido causa o dobro em cada golpe. Depois, remova 1.", debilitado: "Debilitado: o próximo Ataque causa 1 a menos por golpe (mín. 1). Depois, remova 1.",
  tremulo: "Trêmulo: a próxima carta que conceder Bloqueio concede 1 a menos. Depois, remova 1.", necrose: "Necrose: no início do turno do dono, perde PV igual à Necrose e remove 1.",
  intangivel: "Intangível: cada golpe de dano ou perda de PV causa no máximo 1. Remova 1 no fim de cada rodada.", amparo: "Amparo: anula a próxima condição negativa.",
  espinhos: "Espinhos: quem atingir o dono com um golpe de Ataque perde 1 PV por Espinhos.", regenerar: "Regenerar: no fim de cada rodada, recupere X PV."
};

// Se o navegador ainda tiver em cache um config.js de antes destes valores existirem, a tela usa os padrões em vez de quebrar.
for (const [k, v] of Object.entries({ previa: 1, animGolpe: 27, animMorte: 30, animTraco: 34, zoomInimigo: 40, faixaFase: 85, animCarta: 16 })) if (!CONFIG[k]) CONFIG[k] = { value: v, min: 0, max: 90, step: 1 };

const ui = {
  motor: null, tela: "titulo", jogAtivo: 0, modoAlvo: null, pend: null, acaoResolve: null, sel: [], visOrdem: null, visDesc: [],
  esperas: [], flut: [], dado: null, rapido: false, sujo: true, painel: null, mapaSel: 0, alvoSel: 0, prep: null, fim: null, figuras: false, abertura: null, aviso: null,
  // efeitos de combate: relógio em passos, golpes recentes, inimigos se desfazendo, traços, último PV desenhado
  tique: 0, fx: {}, morrendo: {}, tracos: [], pvVisto: {}, combRef: null,
  // prévias: versão do estado (sobe a cada evento), o que está sob o mouse, prévia da carta e previsão da rodada
  vooAnt: null, limbo: {}, chegando: {}, jogada: null,     // cartas voando: onde cada carta estava no último desenho, cartas «em jogo», cartas chegando à mão
  hoverT: 0, faixa: null,       // passo em que o mouse parou sobre o inimigo (zoom com atraso); faixa de fase na tela
  ver: 0, hover: null, mouse: null, previa: null, previaChave: "", rodada: null, rodadaVer: -1
};

/* ================= io para o motor ================= */
const io = {
  escolher(spec) { if (ui.autoPrimeiro && spec.tipo === "mapa") { ui.autoPrimeiro = false; return Promise.resolve(spec.opcoes[0]); } return new Promise(r => { ui.pend = { spec, resolve: v => { ui.pend = null; ui.sel = []; ui.visOrdem = null; ui.visDesc = []; ui.sujo = true; r(v); } }; ui.sel = []; ui.mapaSel = 0; ui.alvoSel = 0; if (spec.tipo === "vislumbrar") ui.visOrdem = spec.cartas.map(c => c.uid); ui.sujo = true; som("abrir"); }); },
  acao() { ui.ver++; return new Promise(r => { ui.acaoResolve = a => { ui.acaoResolve = null; ui.modoAlvo = null; ui.sujo = true; r(a); }; ajustarAtivo(); ui.sujo = true; }); },
  evento(e) {
    ui.sujo = true; ui.ver++;
    if (e.tipo === "dano") { ui.flut.push({ id: "ini-" + e.alvo, txt: e.resto > 0 ? "−" + e.resto : (e.bloq ? "bloqueado" : "0"), cor: e.resto > 0 ? "#ff6b4a" : "#9cc4e8", t: 0 }); som("golpe"); ui.fx["ini-" + e.alvo] = { k: e.resto > 0 ? "dano" : "bloq", t: ui.tique }; }
    if (e.tipo === "danoJog") {
      ui.flut.push({ id: "jog-" + e.jog, txt: e.resto > 0 ? "−" + e.resto : "bloqueado", cor: e.resto > 0 ? "#ff6b4a" : "#9cc4e8", t: 0 }); som("dor");
      ui.fx["jog-" + e.jog] = { k: e.resto > 0 ? "dano" : "bloq", t: ui.tique };
      if (ui.agindo) traco("ini-" + ui.agindo, "jog-" + e.jog, "#ff6b4a");     // de onde veio o golpe
    }
    if (e.tipo === "bloqueio") ui.flut.push({ id: "jog-" + e.jog, txt: "+" + e.n + " Bloqueio", cor: "#9cc4e8", t: 0 });
    if (e.tipo === "bloqueioIni") ui.flut.push({ id: "ini-" + e.alvo, txt: "+" + e.n + " Bloqueio", cor: "#9cc4e8", t: 0 });
    if (e.tipo === "cura") { ui.flut.push({ id: "jog-" + e.jog, txt: "+" + e.n + " PV", cor: "#8fe08a", t: 0 }); ui.fx["jog-" + e.jog] = { k: "cura", t: ui.tique }; }
    if (e.tipo === "cond") ui.flut.push({ id: "ini-" + e.alvo, txt: "+" + e.n + " " + COND_NOME[e.cond], cor: "#e3c27a", t: 0 });
    if (e.tipo === "condJog") ui.flut.push({ id: "jog-" + e.jog, txt: "+" + e.n + " " + COND_NOME[e.cond], cor: "#e3c27a", t: 0 });
    if (e.tipo === "glifo") ui.flut.push({ id: "jog-" + e.jog, txt: e.txt, cor: "#f6d77a", t: 0 });
    if (e.tipo === "postura") ui.flut.push({ id: "jog-" + e.jog, txt: POST[e.nova], cor: e.nova === "panico" ? "#ff6b4a" : e.nova === "compreensao" ? "#f6d77a" : "#9cc4e8", t: 0 });
    if (e.tipo === "revelacao") ui.flut.push({ id: "jog-" + e.jog, txt: "+" + e.n + " Revelação", cor: "#d9c2f0", t: 0 });
    if (e.tipo === "morte") { som("morte"); ui.morrendo[e.alvo] = ui.tique; }
    if (e.tipo === "jogou") {
      som("carta"); ui.jogada = { uid: e.carta.uid, t: ui.tique };
      // o nome da carta aparece sobre o alvo (ou sobre quem jogou), com um traço do investigador até o inimigo
      ui.flut.push({ id: e.alvo ? "ini-" + e.alvo : "jog-" + e.jog, txt: esc(e.carta.nome) + (e.carta.apr ? " ◆" : ""), cor: "#f6ecd6", t: 0, cls: "nome" });
      if (e.alvo && ui.motor) traco("jog-" + e.jog, "ini-" + e.alvo, ui.motor.s.jogadores[e.jog].cor2 || "#ffd76a");
    }
    if (e.tipo === "dado") { ui.dado = { valor: e.valor, t: 0 }; som("dado"); ui.agindo = null; }
    if (e.tipo === "fase") ui.faixa = e.fase === "pressagio"
      ? { cls: "pressagio", txt: "Rodada " + e.rodada, sub: "Presságio: o dado mostra " + e.dado, t: ui.tique }
      : { cls: "inimigos", txt: "Turno dos inimigos", sub: "começa pela fileira de quem tem o Olhar do Abismo; a fileira central age por último", t: ui.tique };
    if (e.tipo === "inimigoAge") { ui.agindo = e.alvo; }
    if (window.game) window.game.events.push(e);
  },
  pausa(n) { const k = Math.round(n * tune.pausaAnim / 8); if (ui.rapido || k <= 0) return Promise.resolve(); return new Promise(r => ui.esperas.push({ n: k, r })); },
  atualizar() { ui.sujo = true; return Promise.resolve(); },
  salvar(st) { if (ui.semSalvar) return; try { if (st) localStorage.setItem("amdl-save", JSON.stringify(st)); else localStorage.removeItem("amdl-save"); } catch (e) { } },
  abertura(ato) { return new Promise(r => { ui.abertura = { ato, r: () => { ui.abertura = null; ui.sujo = true; r(); } }; ui.sujo = true; }); }
};

/* ================= utilidades de desenho ================= */
function escala(html, w, h, k, cls = "") { return `<div class="esc ${cls}" style="width:${(w * k).toFixed(1)}px;height:${(h * k).toFixed(1)}px"><div style="transform:scale(${k});transform-origin:0 0;width:${w}px;height:${h}px">${html}</div></div>`; }
function personagem(id) { return JOGO.personagens.find(p => p.id === id); }
function ctxCarta(x) {
  const d = DEF[x.nome]; let dono = x.dono || d.dono;
  if (d.rar === "F") dono = (JOGO.fichas.find(f => f.carta.n === x.nome) || {}).de || dono;
  const p = personagem(dono);
  const cores = { incolor: ["#5d5a55", "#d8d2c6"], status: ["#6f6a60", "#cfc8bb"], trauma: ["#3a2f4f", "#c9a7e8"] };
  const [cor, cor2] = p ? [p.cor, p.cor2] : (cores[dono] || ["#444", "#ddd"]);
  const lotes = p ? [LOTE_PERSONAGEM[p.id], "L1", "L2", "L3", "L4", "L8"] : ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8"];
  const il = ilustracao(lotes, x.nome);
  const rot = p ? p.nome : { incolor: "Incolor", status: "Status", trauma: "Trauma" }[dono] || "";
  return { cor, cor2, rar: d.rar, img: il && il.arquivo, foco: il && il.foco, zoom: il && il.zoom, rotulo: d.rar === "F" ? "Ficha" : rot };
}
function cartaVis(x, k, extra = {}) {
  const d = DEF[x.nome]; let html = cartaHTML(d, ctxCarta(x));
  const selo = x.apr ? `<div class="selo-apr" title="Aprimorada">◆<small>${d.uk !== undefined ? d.uk : d.k}</small></div>` : "";
  const custoAtual = extra.custo !== undefined && extra.custo !== null && (extra.falta || extra.custo !== (x.apr && d.uk !== undefined ? d.uk : d.k)) ? `<div class="custo-atual ${extra.falta ? "falta" : ""}">${extra.custo}</div>` : "";
  const marc = x.marc ? `<div class="marc-carta">${x.marc}</div>` : "";
  const guard = x.mod && x.mod.guardar ? `<div class="tag-carta">Guardar</div>` : "";
  html = html.replace('<div class="moldura">', `<div class="moldura">${selo}${custoAtual}${marc}${guard}`);
  return escala(html, CARTA_W, CARTA_H, k, (x.apr ? "apr " : "") + (extra.cls || ""));
}
function miniArtefato(nome, k, extra = {}) {
  const a = ARTEFATOS[nome]; const il = ilustracao(["L8"], nome);
  const cor = { Inicial: "#7b6a55", Comum: "#5b5b5b", Incomum: "#24496b", Raro: "#8a6514", Chefe: "#4a2d70", "Depósito": "#a8812f" }[a.classe];
  return escala(miniHTML(nome, a.texto, { cor, classe: "Artefato " + a.classe, arte: il ? imgHTML(il.arquivo, nome, il.foco, il.zoom) : null, preco: extra.preco }), MINI_W, MINI_H, k, extra.cls || "");
}
// Provisão no tabuleiro: miniatura da arte da carta + nome; o clique abre a carta inteira, com o texto e o botão de usar
function provIc(nome, ji, k) {
  const il = ilustracao(["L8"], nome);
  return `<span class="prov-ic" data-a="ver-prov" data-j="${ji}" data-i="${k}" title="${esc(nome)}: ${esc(PROVISOES[nome].texto)} (clique para ver a carta)">${il ? `<span class="prov-img" style="background-image:url('${il.arquivo}');background-position:${il.foco || "50% 50%"}"></span>` : SIMBOLO.provisao()}<small>${esc(nome)}</small></span>`;
}
const REGRA_PROVISAO = "Provisões não custam energia e são usadas no seu turno, em combate. Fora de combate só valem Sais Aromáticos e Pemmican Concentrado. Depois de usada, a Provisão volta ao fundo do baralho.";
// pode usar a Provisão agora? devolve "" (sim) ou o motivo
function bloqueioProvisao(m, ji, nome) {
  const s = m.s, P = EFEITOS_PROV[nome];
  if (!s.combate) return P.foraCombate ? (ui.pend && ui.pend.spec.tipo === "mapa" ? "" : "Use no mapa, entre um nó e outro.") : "Esta Provisão só pode ser usada em combate.";
  if (s.faseRodada !== "jogadores" || !ui.acaoResolve) return "Só no turno dos investigadores.";
  if (s.prontos && s.prontos[ji]) return "Este investigador já encerrou o turno.";
  return "";
}
function painelProvisao(m, p) {
  const j = m.s.jogadores[p.j]; const nome = j.provisoes[p.i]; if (!nome) return "<p>Esta Provisão já foi usada.</p>";
  const porque = bloqueioProvisao(m, p.j, nome);
  return `<div class="prov-painel"><div class="grande-carta">${miniProvisao(nome, 1.7)}</div>
    <div class="prov-lado"><div class="m-quem" style="--c:${j.cor}">${j.nome}</div>
      <h3>${esc(nome)}</h3><p class="prov-txt">${fmt(PROVISOES[nome].texto)}</p>
      <p class="nota">${REGRA_PROVISAO}</p>
      <button class="bt grande" data-a="usar-prov" data-j="${p.j}" data-i="${p.i}" ${porque ? "disabled" : ""}>${EFEITOS_PROV[nome].alvo ? "Usar e escolher o alvo" : "Usar agora"}</button>
      ${porque ? `<p class="prov-porque">${esc(porque)}</p>` : ""}</div></div>`;
}
function miniProvisao(nome, k, extra = {}) {
  const p = PROVISOES[nome]; const il = ilustracao(["L8"], nome);
  return escala(miniHTML(nome, p.texto, { cor: "#7a3b1d", classe: "Provisão", arte: il ? imgHTML(il.arquivo, nome, il.foco, il.zoom) : null, preco: extra.preco }), MINI_W, MINI_H, k, extra.cls || "");
}
function retrato(id) { const il = ilustracao("L8", "retrato_" + id); return il ? `<div class="retrato" style="background-image:url('${il.arquivo}');background-position:${il.foco || "50% 30%"}"></div>` : `<div class="retrato">${retratoSVG(id)}</div>`; }
function dadoSVG(v, tam = 64, girando) {
  const pips = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] }[v] || [];
  return `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" class="${girando ? "girando" : ""}"><rect x="2" y="2" width="20" height="20" rx="4" fill="#f3ead6" stroke="#2a1d0a" stroke-width="1.2"/><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="#8e2a1f" stroke-width=".4" stroke-dasharray="1 1"/>${pips.map(([x, y]) => `<circle cx="${2 + x * 5}" cy="${2 + y * 5}" r="1.7" fill="#2a1d0a"/>`).join("")}</svg>`;
}
const iconeOlho = `<span class="olho" title="Olhar do Abismo: rola o dado, decide empates e é o alvo dos golpes A dos Horrores e Anciões">${ICONE.olho}</span>`;
function chips(cond, alvo) {
  return Object.entries(cond).filter(([, v]) => v !== 0).map(([k, v]) => `<span class="chip c-${k}" title="${COND_DESC[k]}">${COND_NOME[k]} ${v}</span>`).join("");
}
function intencaoHTML(m, e) {
  if (e.novo || !e.intencao) return `<div class="intencao vazia">age na próxima rodada</div>`;
  const p = m.previsao(e); const s = m.s;
  const partes = p.partes.map(q => {
    if (q.tipo === "ataque") {
      const alvos = q.por.map(o => `${q.todos ? `<b class="quem">${s.jogadores[o.jog].nome.replace(/^(O|A) /, "")}</b> ` : ""}${o.d}${q.vezes > 1 ? "×" + q.vezes : ""}`).join(" · ");
      return `<span class="int-at${q.todos ? " todos" : ""}">${ICONE.ataque}${alvos}</span>`;
    }
    if (q.tipo === "bloqueio") return `<span class="int-bl">${ICONE.bloqueio}${q.n}</span>`;
    return `<span class="int-out">${fmt(q.txt)}</span>`;
  }).join("");
  const alvo = e.fileira === "c" && p.partes.some(q => q.tipo === "ataque" && !q.todos) ? `<div class="int-alvo">alvo: ${s.jogadores[p.alvo].nome}</div>` : "";
  return `<div class="intencao">${p.vezes > 1 ? "<b>2×</b> " : ""}${partes}${alvo}</div>`;
}

/* ================= telas ================= */
function render() {
  const m = ui.motor; let html = "";
  if (ui.figuras) html = telaFiguras();
  else if (ui.tela === "titulo") html = telaTitulo();
  else if (ui.tela === "prep") html = telaPrep();
  else if (ui.fim) html = telaFim();
  else if (m && m.s) {
    const t = ui.pend && ui.pend.spec.tipo;
    if (t === "loja") html = telaLoja();
    else if (m.s.combate && m.s.fase === "combate") html = telaCombate();
    else html = telaMapa();
    if (ui.pend && !["mapa", "alvo", "loja"].includes(t)) html += modal(ui.pend.spec);
    if (ui.abertura) html += modalAbertura();
  }
  if (ui.painel) html += painel();
  if (ui.aviso) html += `<div class="aviso">${ui.aviso.txt}</div>`;
  $("#palco").innerHTML = html + `<div id="previa"></div><svg id="fx" viewBox="0 0 1600 900"></svg><div id="flut"></div>`;
  pos_render();
}
function pos_render() {
  // marca a linha da ação atual na tabela impressa de cada inimigo
  document.querySelectorAll(".ini[data-acao]").forEach(el => { const i = +el.dataset.acao; const tr = el.querySelectorAll("table.acoes tr")[i]; if (tr) tr.classList.add("atual"); });
}

/* ---------- título ---------- */
function telaTitulo() {
  let salvo = null; try { salvo = localStorage.getItem("amdl-save"); } catch (e) { }
  return `<div class="tela titulo-tela">
    <div class="capa" style="background-image:url('img_ia/caixa/tampa_deitada.jpg')"></div>
    <div class="titulo-box">
      <h1>Além das Montanhas da Loucura</h1>
      <div class="sub">MESA DIGITAL · o jogo de tabuleiro, regra por regra</div>
      <div class="botoes">
        <button class="bt grande" data-a="novo">Nova expedição <small>Enter</small></button>
        ${salvo ? `<button class="bt" data-a="continuar">Continuar a expedição salva</button>` : ""}
      </div>
      <div class="controles">Mouse: clique numa carta e depois no alvo · 1–9 jogam cartas · Tab troca de investigador · E encerra o turno do investigador · R encerra a rodada · Espaço segurado acelera · M som</div>
      <div class="credito">jogo criado e desenvolvido por Cristiano Piaia Blank · inspirado em <i>Nas Montanhas da Loucura</i>, de H. P. Lovecraft</div>
    </div></div>`;
}
/* ---------- preparação ---------- */
function telaPrep() {
  const p = ui.prep;
  const invs = JOGO.personagens.map(x => `<div class="esc-inv ${p.inv.includes(x.id) ? "on" : ""}" data-a="inv" data-id="${x.id}" style="--c:${x.cor}">
      ${retrato(x.id)}<div class="n">${x.nome}</div><div class="pp">${x.pessoa} · ${x.pv} PV</div><div class="mec">${esc(x.mecanica)}</div>${p.inv.includes(x.id) ? `<div class="ordem">${p.inv.indexOf(x.id) + 1}</div>` : ""}</div>`).join("");
  const mapas = [1, 2, 3].map(a => `<div class="lin">Ato ${ROMANO[a]} — ${NOME_ATO[a]}: ${["A", "B"].map(v => `<button class="bt mini ${p.mapas[a] === v ? "on" : ""}" data-a="mapa" data-ato="${a}" data-v="${v}">Mapa ${v}</button>`).join("")}</div>`).join("");
  const louc = `<div class="lin">Nível de Loucura: <button class="bt mini" data-a="louc" data-d="-1">−</button> <b>${p.loucura}</b> <button class="bt mini" data-a="louc" data-d="1">+</button></div><div class="louc-lista">${JOGO.loucura.map((t, i) => `<div class="${i < p.loucura ? "on" : ""}">${i + 1}. ${esc(t)}</div>`).join("")}</div>`;
  const VAR = [["curta", "Partida Curta", "Só o Ato I; derrotar o Ancião é a vitória."], ["narrativo", "Modo Narrativo", "+3 PV máximo e 6 créditos; Anciões −5 PV por jogador."], ["heroica", "Morte Heroica", "Quem chega a 0 PV sai; Anciões restantes +10 PV por jogador original."], ["misterios", "Mistérios Imprevisíveis", "No Mistério, role: 1 = Criatura; 6 = Depósito; 2–5 = Evento."], ["sanidade", "Sanidade", "3 pontos para recusar Traumas."], ["draft", "Draft de Investigador", "Troque até 2 cartas iniciais por Comuns reveladas."]];
  const vars = VAR.map(([k, n, t]) => `<label class="var ${p.variantes[k] ? "on" : ""}" data-a="var" data-k="${k}"><b>${n}</b> — ${t}</label>`).join("");
  return `<div class="tela prep">
    <h2>Preparação da expedição</h2>
    <div class="dica">O manual recomenda jogar sozinho com dois investigadores para aprender. Escolha dois (a ordem define quem começa com o Olhar do Abismo).</div>
    <div class="invs">${invs}</div>
    <div class="cols"><div class="col"><h3>Mapas</h3>${mapas}<h3>Semente</h3><div class="lin">${p.semente} <button class="bt mini" data-a="semente">Sortear</button></div></div>
    <div class="col"><h3>Dificuldade</h3>${louc}</div><div class="col"><h3>Variantes opcionais (Cap. 14)</h3>${vars}</div></div>
    <div class="rodape-prep"><button class="bt" data-a="voltar">Voltar</button><button class="bt grande" data-a="comecar" ${p.inv.length < 1 ? "disabled" : ""}>Partir para a Antártida <small>Enter</small></button></div>
  </div>`;
}
/* ---------- mapa ---------- */
function svgMapa(s, opc) {
  if (s.mapa.linear) {
    const W = 210, H = 297; const ys = [262, 222, 182, 142, 70]; const nomes = ["ACAMPAMENTO", "DEPÓSITO", "AS SENTINELAS PRISMÁTICAS", "ÚLTIMO ACAMPAMENTO", "O QUE DANFORTH VIU"]; const tipos = ["refugio", "antiquario", "elite", "refugio", "elite"];
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="mapa-svg"><rect width="${W}" height="${H}" fill="${COR_ATO[4]}"/><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="4" fill="#191220" stroke="#d4a72c" stroke-width=".6"/>`;
    svg += `<text x="${W / 2}" y="26" text-anchor="middle" font-family="Cinzel Decorative" font-weight="700" font-size="9" fill="#efd9a0">Ato IV</text><text x="${W / 2}" y="34" text-anchor="middle" font-family="Cinzel" font-size="4.4" fill="#d4a72c">AS MONTANHAS MAIS ALTAS</text>`;
    svg += `<line x1="${W / 2}" y1="${ys[0]}" x2="${W / 2}" y2="${ys[4]}" stroke="#d4a72c" stroke-width=".6" stroke-dasharray="2 1.5"/>`;
    ys.forEach((y, i) => { const ok = opc.includes(String(i)); svg += `<g class="no ${ok ? "pode" : ""} ${i <= s.linhaAtual ? "feito" : ""}" data-no="${i}">${iconeNo(tipos[i], W / 2, y, 7, false)}<text x="${W / 2 + 13}" y="${y + 1.5}" font-family="Cinzel" font-weight="700" font-size="4.4" fill="#efd9a0">${nomes[i]}</text></g>`; });
    return svg + "</svg>";
  }
  const m = gerarMapa(`ato${s.ato}${s.mapas[s.ato]}`); const R = m.R;
  const W = 210, H = 297, x0 = 30, x1 = 180, yTop = 62, yBot = 262; const jit = {};
  for (const k of m.nos) jit[k] = [(R() - .5) * 6, (R() - .5) * 4];
  const pos = k => { const [r, c] = k.split(",").map(Number); return [x0 + c * (x1 - x0) / (m.COL - 1) + jit[k][0], yBot - r * (yBot - yTop) / (m.LIN - 1) + jit[k][1]]; };
  const cor = COR_ATO[s.ato];
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="mapa-svg"><defs><radialGradient id="pm" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#f6eedb"/><stop offset=".8" stop-color="#e6d6b4"/><stop offset="1" stop-color="#cdb68a"/></radialGradient></defs>`;
  svg += `<rect width="${W}" height="${H}" fill="${cor}"/><rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="4" fill="url(#pm)" stroke="#2a1d0a" stroke-width=".6"/><rect x="8.5" y="8.5" width="${W - 17}" height="${H - 17}" rx="3" fill="none" stroke="${cor}" stroke-width=".35" stroke-dasharray="3 1.5"/>`;
  for (let i = 0; i < 14; i++) { const cx = 15 + R() * 180, cy = 50 + R() * 230, rr = 8 + R() * 22; svg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}" fill="none" stroke="${cor}" stroke-width=".25" opacity=".18"/>`; }
  svg += `<g opacity=".22">${cordilheira(W - 17, 40, cor, "fundo" + s.ato + s.mapas[s.ato], 18).replace("<path", '<path transform="translate(8.5 22)"')}</g>`;
  svg += `<text x="${W / 2}" y="20" text-anchor="middle" font-family="Cinzel Decorative" font-weight="700" font-size="8" fill="#2a1d0a">Ato ${ROMANO[s.ato]}</text>`;
  svg += `<text x="${W / 2}" y="27" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="4" letter-spacing="1.2" fill="${cor}">${NOME_ATO[s.ato].toUpperCase()} · MAPA ${s.mapas[s.ato]}</text>`;
  const chefeOk = opc.includes("chefe");
  svg += `<g class="no ${chefeOk ? "pode" : ""}" data-no="chefe"><g transform="translate(${W / 2} 44)"><circle r="10" fill="#1a1020" stroke="#d4a72c" stroke-width="1"/><path d="M-6 3 Q -3 -6 0 -2 Q 3 -6 6 3 Q 0 0 -6 3z" fill="#d4a72c"/><circle cx="0" cy="-1" r="1.5" fill="#1a1020"/></g>`;
  svg += `<text x="${W / 2 + 14}" y="42" font-family="Cinzel" font-weight="700" font-size="3.6" fill="#2a1d0a">ANCIÃO</text><text x="${W / 2 + 14}" y="46.5" font-family="EB Garamond" font-style="italic" font-size="3.4" fill="#3b3024">${esc(s.anciao)}</text></g>`;
  for (const k of m.nos) if (+k.split(",")[0] === m.LIN - 1) { const [x, y] = pos(k); svg += `<line x1="${x}" y1="${y}" x2="${W / 2}" y2="54" stroke="#3b3024" stroke-width=".55" stroke-dasharray="1.6 1.2"/>`; }
  const vis = new Set(s.visitados);
  for (const a of m.arestas) { const [r, c, c2] = a.split(",").map(Number); const ka = `${r},${c}`, kb = `${r + 1},${c2}`; const [xa, ya] = pos(ka), [xb, yb] = pos(kb); const feito = vis.has(ka) && vis.has(kb) && s.visitados.indexOf(kb) === s.visitados.indexOf(ka) + 1; svg += `<line x1="${xa.toFixed(1)}" y1="${ya.toFixed(1)}" x2="${xb.toFixed(1)}" y2="${yb.toFixed(1)}" stroke="${feito ? "#8e2a1f" : "#3b3024"}" stroke-width="${feito ? 1.2 : .55}" stroke-dasharray="${feito ? "" : "1.6 1.2"}"/>`; }
  for (let r = 0; r < m.LIN; r++) { const y = yBot - r * (yBot - yTop) / (m.LIN - 1); svg += `<text x="14" y="${y + 1.2}" text-anchor="middle" font-family="Cinzel" font-size="3" fill="${cor}" opacity=".8">${r + 1}</text>`; }
  const sel = opc[ui.mapaSel % Math.max(1, opc.length)];
  for (const k of m.nos) {
    const [x, y] = pos(k); const ok = opc.includes(k);
    svg += `<g class="no ${ok ? "pode" : ""} ${vis.has(k) ? "feito" : ""} ${k === sel ? "sel" : ""}" data-no="${k}">${ok ? `<circle cx="${x}" cy="${y}" r="7.6" class="halo"/>` : ""}${iconeNo(m.tipo[k], x, y, 4.6, k === m.desperto)}${s.pos === k ? `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#8e2a1f" stroke-width="1.1"/>` : ""}</g>`;
  }
  svg += `<text x="${W / 2}" y="277" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="4" fill="#2a1d0a">${s.pos === null ? "▲ INÍCIO — ESCOLHA UM NÓ DA LINHA 1 ▲" : "▲ SEMPRE PARA CIMA ▲"}</text>`;
  const leg = Object.keys(NO); leg.forEach((t, i) => { svg += iconeNo(t, 22 + i * 28, 286, 2.8, false); svg += `<text x="${26.5 + i * 28}" y="287.1" font-family="Cinzel" font-size="2.9" fill="#2a1d0a">${NO[t].nome}</text>`; });
  return svg + "</svg>";
}
function painelInvestigadores(m, compacto) {
  return m.s.jogadores.map((j, i) => `<div class="inv-res ${j.fora ? "fora" : ""}" style="--c:${j.cor}">
    <div class="topo">${retrato(j.id)}<div><div class="n">${j.nome}${m.s.olhar === i ? iconeOlho : ""}</div><div class="pvinfo">PV <b>${j.pv}</b>/${j.pvMax} · ${SIMBOLO.credito()} <b>${j.creditos}</b>${m.V.sanidade ? ` · Sanidade ${j.sanidade}` : ""}</div></div></div>
    <div class="arts">${j.artefatos.map(a => `<span class="art-ic" data-a="ver-art" data-n="${esc(a.nome)}" title="${esc(a.nome)}: ${esc(ARTEFATOS[a.nome].texto)}${a.marc ? " (" + a.marc + " marcadores)" : ""}">${SIMBOLO.artefato(ARTEFATOS[a.nome].classe === "Chefe")}</span>`).join("")}</div>
    <div class="provs">${Array.from({ length: j.slotsProv }, (_, k) => j.provisoes[k] ? provIc(j.provisoes[k], i, k) : `<span class="prov-ic vazio" title="Espaço de Provisão vazio">espaço vazio</span>`).join("")}</div>
    <button class="bt mini" data-a="baralho" data-j="${i}">Baralho (${j.baralho.length})</button> <button class="bt mini" data-a="mecanica" data-j="${i}">Como funciona</button>
  </div>`).join("");
}
function telaMapa() {
  const m = ui.motor, s = m.s; const opc = ui.pend && ui.pend.spec.tipo === "mapa" ? ui.pend.spec.opcoes : [];
  const chefe = INIMIGO[s.anciao];
  const est = [["acampamento", "Acampamento"], ["guardiao", "Guardião"], ["achado", "Achado"]].map(([k, n]) => `<div class="est ${s.esteatitos[k] ? "on" : ""}">${SIMBOLO.artefato(false)}<small>${n}</small></div>`).join("");
  return `<div class="tela mapa-tela">
    <div class="lado esq"><h3>Investigadores</h3>${painelInvestigadores(m)}</div>
    <div class="centro">${svgMapa(s, opc)}${ui.pend && ui.pend.spec.tipo === "mapa" ? `<div class="instr">${ui.pend.spec.titulo} · clique num nó brilhante (setas + Enter)</div>` : ""}</div>
    <div class="lado dir"><h3>Ancião do Ato</h3><div class="chefe-mini" data-a="ver-ini" data-n="${esc(s.anciao)}">${escala(inimigoHTML(chefe), CARTA_W, CARTA_H, .78)}</div>
      <h3>Esteatitos</h3><div class="ests">${est}</div>
      <div class="info">Loucura ${s.opcoes.loucura} · combates no Ato: ${s.combatesNoAto}${s.combatesNoAto >= 3 ? " (Encontros Difíceis)" : ""}</div>
      <button class="bt mini" data-a="menu">Menu <small>Esc</small></button> <button class="bt mini" data-a="registro">Registro da partida</button> <button class="bt mini" data-a="regras">Regras rápidas</button>
    </div></div>`;
}
/* ---------- combate ---------- */
function telaCombate() {
  const m = ui.motor, s = m.s, c = s.combate;
  if (ui.combRef !== c) Object.assign(ui, { combRef: c, pvVisto: {}, fx: {}, morrendo: {}, tracos: [], rodada: null, rodadaVer: -1, previa: null, previaChave: "" });
  const vivosInv = m.vivos();
  const ja = s.jogadores[ui.jogAtivo] && !s.jogadores[ui.jogAtivo].fora ? ui.jogAtivo : m.idx(vivosInv[0]);
  ui.jogAtivo = ja;
  const tabs = s.jogadores.map((j, i) => j.c ? tabuleiro(m, j, i, i === ja) : `<div class="tab-inv fora">${j.nome} saiu da expedição</div>`).join("");
  const alvoModo = !!ui.modoAlvo || (ui.pend && ui.pend.spec.tipo === "alvo");
  const alvosOk = ui.pend && ui.pend.spec.tipo === "alvo" ? ui.pend.spec.opcoes : (ui.modoAlvo ? m.alvosPossiveis().map(e => e.uid) : []);
  const fileira = f => c.inimigos.filter(e => e.fileira === f && (e.pv > 0 || desfazendo(e.uid))).map(e => inimigoVis(m, e, alvosOk.includes(e.uid), kIni)).join("");
  let campo = "";
  const temCentro = c.inimigos.some(e => e.fileira === "c" && e.pv > 0);
  // tamanho das cartas de inimigo: fileiras lado a lado num combate normal; uma fileira grande num Horror ou Ancião
  const filas = [...(temCentro ? ["c"] : []), ...s.jogadores.map((_, i) => i)].filter(f => c.inimigos.some(e => e.fileira === f && e.pv > 0));
  const maxFila = Math.max(1, ...filas.map(f => c.inimigos.filter(e => e.fileira === f && e.pv > 0).length));
  const largura = 1060, passoCarta = CARTA_W + 16;
  const ladoALado = !temCentro;
  const kIni = ladoALado ? Math.min(tune.escalaInimigo, (largura / s.jogadores.length - 10) / (maxFila * passoCarta))
    : filas.length <= 1 ? Math.min(tune.escalaInimigo * 1.12, largura / (maxFila * passoCarta)) : Math.min(.55, largura / (maxFila * passoCarta));
  campo += s.jogadores.map((j, i) => { const f = fileira(i); return `<div class="fileira f${i} ${f ? "" : "vazia"} ${i === ja ? "da-vez" : ""}" style="--c:${j.cor}"><div class="rot-f" data-a="ativar" data-j="${i}" title="Estes inimigos atacam ${esc(j.nome)}. Clique para passar a jogar com ${esc(j.nome)}.">${retrato(j.id)}<span><span class="l1">Fileira de <b>${j.nome}</b>${s.olhar === i ? iconeOlho : ""}</span>${c.encontros[i] ? `<small>«${c.encontros[i]}»</small>` : ""}</span></div>${f || (temCentro ? "" : `<div class="limpa">fileira limpa</div>`)}</div>`; }).join("");
  if (temCentro) campo = `<div class="fileira central" style="--c:${s.jogadores[s.olhar].cor}"><div class="rot-f" title="Os golpes «A» da fileira central miram quem está com o Olhar do Abismo; os golpes «AT» acertam todos.">${retrato(s.jogadores[s.olhar].id)}<span><span class="l1">Fileira central</span><small>golpes «A» miram <b>${s.jogadores[s.olhar].nome}</b>, que tem o Olhar do Abismo</small></span></div>${fileira("c")}</div>` + campo;
  const dado = ui.dado ? dadoSVG(ui.dado.t < 36 ? 1 + ((ui.dado.t >> 2) % 6) : ui.dado.valor, 70, ui.dado.t < 36) : "";
  const j = s.jogadores[ja];
  const jc = j.c;
  const pronto = s.prontos && s.prontos[ja];
  const margemMao = Math.min(-14, (980 - jc.mao.length * CARTA_W * tune.escalaMao) / (2 * Math.max(1, jc.mao.length)));
  const mao = jc.mao.map((x, i) => {
    const erro = m.podeJogar(j, x); const k = m.custo(j, x);
    const sel = ui.modoAlvo && ui.modoAlvo.uid === x.uid;
    const mira = !erro && m.precisaAlvo(x);
    const motivo = erro && erro !== "Turno encerrado" ? (MOTIVO_CURTO[erro] || erro) : "";
    return `<div class="cmao ${erro ? "nao" : "ok"} ${mira ? "mira" : ""} ${sel ? "sel" : ""} ${ui.chegando[x.uid] !== undefined ? "chegando" : ""}" data-a="carta" data-uid="${x.uid}" title="${erro ? esc(erro) : mira ? "Clique e depois escolha o alvo" : "Clique para jogar"}" style="--i:${i};--n:${jc.mao.length};margin:0 ${margemMao}px"><span class="tecla">${(i + 1) % 10}</span>${motivo ? `<span class="motivo">${esc(motivo)}</span>` : ""}${(q => q.length ? `<span class="tag-mec k-${q[0].k}" title="${esc(q.map(y => y.txt).join(" · "))}">${esc(q.map(y => y.txt).join(" · "))}</span>` : "")(m.marcasCarta(j, x))}${cartaVis(x, tune.escalaMao, { custo: k, falta: erro === "Energia insuficiente" })}</div>`;
  }).join("");
  // sem carta jogável: o botão de encerrar chama a atenção (Provisões ainda podem ser usadas)
  const semCarta = x => !x.c || !x.c.mao.some(y => !m.podeJogar(x, y));
  const chamaTurno = !!ui.acaoResolve && !pronto && semCarta(j);
  const chamaRodada = !!ui.acaoResolve && vivosInv.every(x => (s.prontos && s.prontos[m.idx(x)]) || semCarta(x));
  const banner = ui.pend && ui.pend.spec.tipo === "alvo" ? ui.pend.spec.titulo : ui.modoAlvo ? "Escolha o alvo (clique num inimigo · Esc cancela)" : "";
  const ultimas = s.log.slice(-2).map(l => `<div>${esc(l)}</div>`).join("");
  return `<div class="tela combate ${alvoModo ? "modo-alvo" : ""}">
    <div class="barra"><span>Ato ${ROMANO[s.ato]} · ${c.tipo === "chefe" ? "Ancião" : c.tipo === "elite" ? "Horror" : "Criatura"} · Rodada ${c.rodada}${NOME_FASE[s.faseRodada] ? ` · <b class="fase f-${s.faseRodada}">${NOME_FASE[s.faseRodada]}</b>` : ""}</span>
      <span class="b-dir"><button class="bt mini" data-a="menu">Menu <small>Esc</small></button><button class="bt mini" data-a="registro">Registro</button><button class="bt mini" data-a="regras">Regras</button><button class="bt mini ${ui.rapido ? "on" : ""}" data-a="rapido">Rápido</button></span></div>
    <div class="esq-tabs">${tabs}</div>
    <div class="campo ${ladoALado ? "lado" : ""}">${campo}<div class="dado-mesa">${dado}<small>Dado do Presságio</small></div><div class="ticker">${ultimas}</div></div>
    ${faixaHTML()}
    ${banner ? `<div class="banner-alvo">${esc(banner)}${ui.pend && ui.pend.spec.tipo === "alvo" && ui.pend.spec.voltar ? ` <button class="bt mini volt" data-a="voltar-escolha">← Voltar <small>Esc</small></button>` : ""}</div>` : ""}
    <div class="mesa-mao" style="--c:${j.cor}">
      <div class="pilha compra" data-a="pilha" data-p="compra" title="Pilha de Compra">${pilhaSVG()}<b>${jc.compra.length}</b><small>Compra</small></div>
      <div class="energia ${jc.energia ? "" : "zero"}"><b>${jc.energia}</b><small>energia</small></div>
      <div class="leg-mao" title="O contorno da carta diz o que acontece ao clicar nela."><span><i class="l-ok"></i>joga direto</span><span><i class="l-mira"></i>pede alvo</span><span><i class="l-nao"></i>não dá agora</span></div>
      <div class="mao ${pronto ? "pronta" : ""}">${mao || `<div class="mao-vazia">mão vazia</div>`}</div>
      <div class="pilha desc" data-a="pilha" data-p="descarte" title="Descarte">${pilhaSVG(true)}<b>${jc.descarte.length}</b><small>Descarte</small></div>
      <div class="pilha ban" data-a="pilha" data-p="banidas" title="Banidas">${pilhaSVG(true, true)}<b>${jc.banidas.length}</b><small>Banidas</small></div>
      <div class="fim-turno">
        ${chamaTurno ? `<div class="sem-carta">${j.nome.replace(/^(O|A) /, "")}: nenhuma carta jogável</div>` : ""}
        <button class="bt ${chamaTurno && !chamaRodada ? "chama" : ""}" data-a="encerrar" ${pronto || !ui.acaoResolve ? "disabled" : ""}>Encerrar turno de ${j.nome.replace(/^(O|A) /, "")} <small>E</small></button>
        <button class="bt verm ${chamaRodada ? "chama" : ""}" data-a="encerrarTodos" ${!ui.acaoResolve ? "disabled" : ""} title="${chamaRodada ? "Nenhum investigador tem carta jogável." : ""}">Encerrar a rodada <small>R</small></button>
      </div>
    </div></div>`;
}
function pilhaSVG(desc, ban) { return `<svg viewBox="0 0 30 40" width="46" height="60"><rect x="5" y="2" width="22" height="32" rx="2.5" fill="${ban ? "#3a2f4f" : desc ? "#5a4a33" : "#1d2733"}" stroke="#c9a24a" stroke-width=".8" transform="rotate(6 16 18)"/><rect x="3" y="5" width="22" height="32" rx="2.5" fill="${ban ? "#2a2430" : desc ? "#6b5536" : "#24323f"}" stroke="#c9a24a" stroke-width=".8"/><polygon points="${ESTRELA5(14, 21, 6, 2.6)}" fill="none" stroke="#c9a24a" stroke-width=".7"/></svg>`; }
function tabuleiro(m, j, i, ativo) {
  const c = j.c, s = m.s; const pronto = s.prontos && s.prontos[i];
  const pvPct = Math.max(0, j.pv / j.pvMax * 100);
  const [fxCls, fxEst] = fxDe("jog-" + i);
  const pr = previsaoDe(m, j, i, pvPct);
  const poderes = c.poderes.map(p => `<span class="poder" data-a="ver-carta" data-n="${esc(p.nome)}" data-apr="${p.apr ? 1 : 0}" title="${esc(m.texto({ nome: p.nome, apr: p.apr }))}">${esc(p.nome)}${p.apr ? " ◆" : ""}${p.n > 1 ? " ×" + p.n : ""}${p.marc ? ` (${p.marc})` : ""}</span>`).join("");
  const provs = Array.from({ length: Math.max(j.slotsProv, j.provisoes.length) }, (_, k) => j.provisoes[k] ? provIc(j.provisoes[k], i, k) : `<span class="prov-ic vazio" title="Espaço de Provisão vazio">vazio</span>`).join("");
  return `<div class="tab-inv ${ativo ? "ativo" : ""} ${pronto ? "pronto" : ""}${fxCls}" id="jog-${i}" data-a="ativar" data-j="${i}" style="--c:${j.cor};--c2:${j.cor2};${fxEst}">
    <div class="cab">${retrato(j.id)}<div class="nome">${j.nome}${s.olhar === i ? iconeOlho : ""}<small>${j.pessoa}</small></div><div class="rod"><span class="arts">${j.artefatos.map(a => `<span class="art-ic" data-a="ver-art" data-n="${esc(a.nome)}" title="${esc(a.nome)}: ${esc(ARTEFATOS[a.nome].texto)}${a.marc ? " (" + a.marc + ")" : ""}">${SIMBOLO.artefato(ARTEFATOS[a.nome].classe === "Chefe")}</span>`).join("")}</span><span class="cred">${SIMBOLO.credito()}${j.creditos}</span></div>${pronto ? `<span class="pronto-tag">turno encerrado</span>` : ""}</div>
    <div class="vida">${barraPV("jog-" + i, j.pv, j.pvMax, `${j.pv} / ${j.pvMax} PV${pr.rotulo}`, "", pr.faixa, pr.dica)}${c.bloqueio ? `<span class="bloq">${ICONE.bloqueio}<b>${c.bloqueio}</b></span>` : ""}<span class="en">${c.energia} <small>energia</small></span></div>
    <div class="provs-lin" title="${esc(REGRA_PROVISAO)}"><span class="rot">Provisões</span>${provs}</div>
    <div class="conds">${chips(c.cond)}${c.amort ? `<span class="chip">Amortecedor ${c.amort}</span>` : ""}</div>
    ${mecanicaHTML(m, j, i)}
    <div class="poderes">${poderes}</div>
  </div>`;
}
/* ---------- a mecânica única de cada investigador (Cap. 13), sempre à vista ---------- */
function mecanicaHTML(m, j, i) {
  const q = m.mecanica(j); if (!q) return "";
  const simNao = v => `<b class="${v ? "sim" : "nao"}">${v ? "sim" : "não"}</b>`;
  let extra = "", corpo = "";
  if (q.id === "professor") {
    const curto = g => g.t === "relampago" ? [`${g.pass} de dano`, `${g.ativ} de dano`] : g.t === "gelo" ? [`${g.pass} Bloq.`, `${g.ativ} Bloq.`] : g.t === "vazio" ? [`+${g.pass} carga`, `${g.ativ} de dano`] : ["+1 energia", "+2 energia"];
    extra = `<span class="conc" title="Concentração: soma +1 por ponto aos valores (passivo e Ativação) dos glifos de Relâmpago e Gelo e ao ganho de carga do Vazio.">Concentração <b>${q.concentracao}</b></span>${q.cheio ? `<span class="cheio" title="Espaços cheios: Inscrever outro glifo Ativa (e remove) o da esquerda para dar lugar.">cheio</span>` : ""}`;
    corpo = `<div class="glifos ${q.espacos.length > 4 ? "compacto" : ""} ${q.espacos.some(Boolean) ? "" : "sem"}">${q.espacos.map((g, k) => g
      ? `<div class="glifo ${g.t} ${g.primeiro ? "prim" : ""}" title="Glifo ${NOME_GLIFO[g.t]}. ${g.t === "estelar" ? "Passivo" : "Passivo, no fim do seu turno"}: ${g.passTxt}. Ativação: ${g.ativTxt}.${g.primeiro ? " É o glifo mais à esquerda: o próximo a ser Ativado." : ""}">${glifoSVG(g.t)}${g.t === "vazio" ? `<b class="cargas">${g.cargas}</b>` : ""}<span class="g-txt"><b>${GLIFO[g.t][0]}</b><small>${g.t === "estelar" ? "início" : "fim"}: ${curto(g)[0]}</small><small>Ativar: ${curto(g)[1]}</small></span>${g.primeiro ? `<i>1º a Ativar</i>` : ""}</div>`
      : `<div class="glifo vazio-slot" title="Espaço de glifo vazio: cartas que dizem «Inscreva» colocam um glifo aqui."><span class="g-txt"><small>espaço ${k + 1}</small><small>vazio</small></span></div>`).join("")}</div>`;
  } else if (q.id === "sonhadora") {
    const pips = Array.from({ length: 5 }, (_, k) => `<i class="${k < q.revelacao ? "on" : ""}"></i>`).join("");
    corpo = `<div class="posturas">${["neutra", "lucidez", "panico", "compreensao"].map(p => `<span class="pst p-${p} ${q.postura === p ? "on" : ""}" title="${NOME_POSTURA[p]}: ${EFEITO_POSTURA[p]}">${POST[p]}${p === "panico" ? " ×2" : p === "compreensao" ? " ×3" : ""}</span>`).join("")}</div>
      <div class="revel" title="Revelação: ao chegar a 5, zere-a e entre em Compreensão (+3 de energia, Ataques ×3 até o seu próximo turno).">Revelação <span class="pips">${pips}</span> <b>${q.revelacao}/5</b> <small>com 5: Compreensão</small></div>`;
  } else if (q.id === "ocultista") {
    corpo = `${q.necrose.length ? `<div class="mec-linha">${q.necrose.map(x => `<span class="chip c-necrose" title="${esc(x.nome)}: Necrose ${x.n}. Perde ${x.agora} PV no início do próximo turno dos inimigos (ignora Bloqueio) e ${x.total} PV ao todo se nada mudar.">${esc(x.nome)}: ${x.n} <small>(−${x.agora} PV agora, −${x.total} ao todo)</small></span>`).join("")}</div>` : ""}
      <div class="mec-linha">Bisturis na mão: <b>${q.bisturis}</b> · dano de cada: <b>${q.danoBisturi}</b>${q.maoFirme ? ` <small>(Mão Firme +${q.maoFirme})</small>` : ""}</div>
      <div class="mec-linha" title="Golpe Clínico confere se você descartou uma carta neste turno.">Descartou carta neste turno: ${simNao(q.descartou)}</div>`;
    if (q.necrose.length) q.resumo = "";
  } else if (q.id === "veterano") {
    corpo = `<div class="mec-linha"><span class="furia-n" title="Fúria: +1 de dano em cada golpe de Ataque, até o fim do combate.">${q.furia}</span> Fúria: <b>+${q.furia}</b> de dano em cada golpe${q.temporaria ? ` <small>(${q.temporaria} some no fim do turno)</small>` : ""}</div>
      <div class="mec-linha" title="Faca de Esfolar e Teimosia Nórdica conferem se você perdeu PV no seu turno.">Perdeu PV neste turno: ${simNao(q.perdeuPV)}${q.teimosia ? ` <small>· cada perda: +${q.teimosia} Fúria</small>` : ""}</div>`;
    q.resumo = "";
  }
  return `<div class="mec mec-${q.id}">
    <div class="mec-tit"><span>${q.titulo}</span>${extra}<button class="bt mini mec-bt" data-a="mecanica" data-j="${i}" title="Regras da mecânica de ${esc(j.nome)} e as cartas do baralho que a usam">Como funciona</button></div>
    ${corpo}
    ${q.resumo ? `<div class="mec-resumo">${esc(q.resumo)}</div>` : ""}
    ${q.aviso && q.id !== "professor" ? `<div class="mec-aviso">${esc(q.aviso)}</div>` : ""}
  </div>`;
}
const NOTA_MECANICA = {
  professor: "Pelo manual, um glifo só é Inscrito ou Ativado por uma carta: não existe ação livre de glifo. O passivo de todos acontece sozinho quando você encerra o turno (o Relâmpago pede o alvo nessa hora) e o Estelar age no início do turno.",
  sonhadora: "Pelo manual, a postura só muda por cartas e pela Revelação ao chegar a 5: não existe ação livre de trocar de postura. O multiplicador do Pânico e da Compreensão já entra sozinho no dano mostrado nas intenções dos inimigos.",
  ocultista: "A Necrose age sozinha no início do turno dos inimigos, antes de eles atacarem. Bisturis são fichas: entram na mão por cartas, custam 0 e são Banidos ao serem jogados.",
  veterano: "A Fúria soma sozinha em cada golpe dos seus Ataques. «Perdeu PV neste turno» é o que a Faca de Esfolar e a Teimosia Nórdica conferem."
};
function painelMecanica(m, j) {
  const r = RESUMO[j.id]; const cartas = m.cartasDaMecanica(j);
  let tabela = "";
  if (j.id === "professor") {
    const conc = j.c ? j.c.concentracao : 0; const mais = conc ? ` <small>(com ${conc} de Concentração)</small>` : "";
    tabela = `<h4>Os quatro glifos${mais}</h4><table class="tab-glifos"><tr><th></th><th>Glifo</th><th>Passivo</th><th>Ativação</th></tr>
      <tr><td>${glifoSVG("relampago")}</td><td>Relâmpago</td><td>fim do turno: ${1 + conc} de dano a um inimigo à sua escolha</td><td>${2 + conc} de dano a um inimigo à sua escolha</td></tr>
      <tr><td>${glifoSVG("gelo")}</td><td>Gelo</td><td>fim do turno: ganhe ${1 + conc} de Bloqueio</td><td>ganhe ${2 + conc} de Bloqueio</td></tr>
      <tr><td>${glifoSVG("vazio")}</td><td>Vazio</td><td>entra com 1 carga; fim do turno: +${1 + conc} carga</td><td>dano igual às cargas ao inimigo com menos PV</td></tr>
      <tr><td>${glifoSVG("estelar")}</td><td>Estelar</td><td>início do seu turno: +1 de energia</td><td>ganhe 2 de energia</td></tr></table>
      <p class="nota">O dano dos glifos não é Ataque: não recebe Fúria nem é dobrado por Exposto. «Ative 2 vezes» resolve a Ativação duas vezes e remove o glifo uma vez só.</p>`;
  }
  if (j.id === "sonhadora") tabela = `<h4>As quatro posturas</h4><ul>${["neutra", "lucidez", "panico", "compreensao"].map(p => `<li><b>${NOME_POSTURA[p]}</b>: ${EFEITO_POSTURA[p]}${p === "compreensao" ? " Ao entrar, ganhe 3 de energia." : ""}</li>`).join("")}</ul><p class="nota">Entrar na postura em que você já está não tem efeito e não conta como mudar de postura. Revelação: ao chegar a 5, zere-a e entre em Compreensão.</p>`;
  return `<div class="regras mec-painel"><p class="frase">${r.frase}</p>
    <h4>Como funciona</h4><ul>${r.como.map(t => `<li>${t}</li>`).join("")}</ul>${tabela}
    <h4>Um turno de exemplo</h4><p>${r.turno}</p>
    <h4>Cuidado</h4><p>${r.cuidado}</p>
    <h4>Boas cartas para procurar nas Recompensas</h4><p>${r.boas}</p>
    <h4>Na mesa digital</h4><p>${NOTA_MECANICA[j.id]}</p>
    <h4>No seu baralho agora: ${cartas.length} de ${j.baralho.length} cartas usam esta mecânica</h4>
    ${cartas.length ? `<div class="grade-cartas">${[...cartas].sort((a, b) => a.nome.localeCompare(b.nome)).map(x => cartaVis(x, .55)).join("")}</div>` : `<p>Nenhuma ainda. Elas chegam pelas Recompensas dos combates, pelo Depósito e pelos eventos.</p>`}</div>`;
}
function glifoSVG(t) {
  const cor = GLIFO[t][1];
  const forma = { relampago: `<path d="M13 2 L6 13 H11 L9 22 L18 9 H13 Z" fill="${cor}" stroke="#2a1d0a" stroke-width=".8"/>`, gelo: `<g stroke="${cor}" stroke-width="2"><path d="M12 2v20M3 7l18 10M3 17l18-10"/></g>`, vazio: `<circle cx="12" cy="12" r="8" fill="#1a1020" stroke="${cor}" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="${cor}"/>`, estelar: `<polygon points="${ESTRELA5(12, 12.5, 9, 3.8)}" fill="${cor}" stroke="#2a1d0a" stroke-width=".8"/>` }[t];
  return `<svg viewBox="0 0 24 24" width="28" height="28">${forma}</svg>`;
}
function inimigoVis(m, e, alvo, k) {
  const d = INIMIGO[e.nome]; k = k || tune.escalaInimigo;
  const morto = e.pv <= 0;       // derrotado: fica na mesa só enquanto se desfaz
  let [fxCls, fxEst] = fxDe("ini-" + e.uid);
  if (morto) { fxCls = " morrendo"; fxEst = `--fx-d:-${ms(ui.tique - ui.morrendo[e.uid])}ms;--fx-t:${ms(tune.animMorte)}ms;`; }
  return `<div class="ini ${alvo ? "alvo" : ""} ${ui.agindo === e.uid ? "agindo" : ""}${fxCls}${zoomEm(e.uid) ? " zoom" : ""}" id="ini-${e.uid}" ${alvo || morto ? "" : `title="Clique para ver a carta inteira"`} ${morto ? "" : `data-a="inimigo" data-uid="${e.uid}"`} ${e.intencao && !morto ? `data-acao="${e.intencao.idx}"` : ""} style="${fxEst}">
    ${morto ? `<div class="intencao vazia">derrotado</div>` : intencaoHTML(m, e)}
    ${escala(inimigoHTML(d), CARTA_W, CARTA_H, k)}
    <div class="ini-base">${barraPV("ini-" + e.uid, Math.max(0, e.pv), e.pvMax, `${Math.max(0, e.pv)} / ${e.pvMax}`, "ini")}${e.bloqueio ? `<span class="bloq">${ICONE.bloqueio}<b>${e.bloqueio}</b></span>` : ""}</div>
    <div class="conds">${chips(e.cond)}${e.f.delirio ? `<span class="chip c-furia" title="Ganha 1 Fúria no fim de cada rodada">Delírio</span>` : ""}${e.marcas.carcaca ? `<span class="chip">Carcaça</span>` : ""}${e.marcas.maoEspalmada ? `<span class="chip">Marcado</span>` : ""}</div>
  </div>`;
}
/* ---------- golpes na tela ----------
   A tela inteira é redesenhada a cada mudança, então uma animação recomeçaria do zero a cada redesenho. Cada efeito
   guarda o passo em que começou (ui.tique) e a animação CSS entra com atraso negativo: continua de onde estava. */
const ms = passos => Math.round(passos * 1000 / 60);
const MOTIVO_CURTO = { "Energia insuficiente": "sem energia", "Impossível: não pode ser jogada": "não se joga", "Não pode ser jogada": "não se joga" };
// classe e estilo do efeito de golpe em andamento sobre o elemento `id` ("ini-<uid>" ou "jog-<i>")
function fxDe(id) {
  const f = ui.fx[id]; const T = tune.animGolpe;
  if (!f || !T || ui.tique - f.t >= T) return ["", ""];
  return [` fx-${f.k}`, `--fx-d:-${ms(ui.tique - f.t)}ms;--fx-t:${ms(T)}ms;`];
}
// a carta do inimigo só aumenta depois de o mouse ficar parado sobre ela (tune.zoomInimigo passos), e nunca durante a mira
const zoomEm = uid => !!(tune.zoomInimigo && ui.hover && ui.hover.tipo === "ini" && ui.hover.uid === uid && !mirando() && ui.tique - ui.hoverT >= tune.zoomInimigo);
const NOME_FASE = { pressagio: "Presságio", jogadores: "Turno dos investigadores", fimJogadores: "Fim do turno", inimigos: "Turno dos inimigos", fimRodada: "Fim da rodada" };
// faixa que anuncia a rodada e o turno dos inimigos; some sozinha
function faixaHTML() {
  const f = ui.faixa, T = tune.faixaFase;
  if (!f || !T || ui.tique - f.t >= T) return "";
  return `<div class="faixa-fase ${f.cls}" style="animation-duration:${ms(T)}ms;animation-delay:-${ms(ui.tique - f.t)}ms"><b>${esc(f.txt)}</b>${f.sub ? `<small>${esc(f.sub)}</small>` : ""}</div>`;
}
const desfazendo = uid => ui.morrendo[uid] !== undefined && ui.tique - ui.morrendo[uid] < tune.animMorte;
function traco(de, para, cor) { if (tune.animTraco) ui.tracos.push({ de, para, cor, t: ui.tique }); }
/* Barra de PV. Quando o PV cai, um rastro claro fica onde o PV estava e escorre até o valor novo.
   faixa: HTML extra dentro da barra (a previsão da rodada); dica: texto ao parar o mouse. */
const RASTRO_PV = 45;
function barraPV(id, pv, max, rotulo, cls = "", faixa = "", dica = "") {
  const pct = Math.max(0, Math.min(100, pv / max * 100)); let v = ui.pvVisto[id]; let rastro = "";
  if (!v) v = ui.pvVisto[id] = { pv };
  if (pv < v.pv) { v.de = v.de !== undefined && ui.tique - v.t < RASTRO_PV ? v.de : v.pv; v.t = ui.tique; }
  else if (pv > v.pv) v.de = undefined;
  v.pv = pv;
  if (v.de !== undefined && tune.animGolpe && ui.tique - v.t < RASTRO_PV) {
    const de = Math.max(0, Math.min(100, v.de / max * 100));
    rastro = `<i class="rastro" style="left:${pct}%;width:${Math.max(0, de - pct)}%;animation-delay:-${ms(ui.tique - v.t)}ms"></i>`;
  }
  return `<div class="barra-pv ${cls}" ${dica ? `title="${esc(dica)}"` : ""}><div style="width:${pct}%"></div>${rastro}${faixa}<span>${rotulo}</span></div>`;
}
/* Previsão da rodada no tabuleiro do investigador (js/previa.js): o trecho do PV que ele perde se todos encerrarem
   o turno agora, mais o texto da conta. Só aparece enquanto a pessoa pode jogar. */
function previsaoDe(m, j, i, pvPct) {
  const nada = { rotulo: "", faixa: "", dica: "" };
  const r = ui.acaoResolve && tune.previa ? ui.rodada : null; const q = r && r.jogadores ? r.jogadores[i] : null;
  if (!q || (!q.vem && q.perde <= 0)) return nada;
  const perde = Math.max(0, q.perde); const sinal = r.corte ? "≥ " : r.aprox ? "≈ " : "";
  const fica = Math.max(0, (j.pv - perde) / j.pvMax * 100);
  const obs = r.corte ? " A conta para no primeiro sorteio, compra ou escolha: pode vir mais do que isso." : r.aprox ? " Escolhas de alvo do fim do turno foram contadas no primeiro alvo." : "";
  return {
    rotulo: q.cai ? ` <em class="perda">cai nesta rodada</em>` : perde ? ` <em class="perda">${sinal}−${perde} na rodada</em>` : ` <em class="seguro">Bloqueio segura</em>`,
    faixa: perde ? `<i class="vai" style="left:${fica}%;width:${Math.max(0, pvPct - fica)}%"></i>` : "",
    dica: `Se todos encerrarem o turno agora: chegam ${q.vem} de dano em ${j.nome}, o Bloqueio segura ${q.segura} e ${j.nome} ${perde ? "perde " + perde + " PV" : "não perde PV"}. A conta já inclui o que acontece no fim do turno (glifos, Poderes, cartas na mão) e a ordem em que os inimigos agem.${obs}`
  };
}
/* ---------- prévia: o que a carta sob o mouse faz, calculado pelo motor (js/previa.js) ---------- */
const mirando = () => !!ui.modoAlvo || !!(ui.pend && ui.pend.spec.tipo === "alvo");
function alvosDaMira() {
  const m = ui.motor; if (!m || !m.s.combate) return [];
  return ui.pend && ui.pend.spec.tipo === "alvo" ? ui.pend.spec.opcoes : ui.modoAlvo ? m.alvosPossiveis().map(e => e.uid) : [];
}
// a pessoa pode jogar agora (o motor está parado esperando uma ação): só nesse momento se simula alguma coisa
const podeSimular = m => !!(m && m === ui.motor && typeof m.simular === "function" && m.s && m.s.combate && !m.s.fim && m.s.fase === "combate" && ui.acaoResolve && !ui.pend && tune.previa);
function pedidoPrevia(m) {
  if (ui.painel) return null;
  const h = ui.hover, ma = ui.modoAlvo;
  if (ma) {
    if (!h || h.tipo !== "ini" || !m.alvosPossiveis().some(e => e.uid === h.uid)) return null;
    return ma.tipo === "prov" ? { tipo: "prov", jog: ma.jog, i: ma.i, alvo: h.uid } : { tipo: "carta", jog: ma.jog, uid: ma.uid, alvo: h.uid };
  }
  if (!h || h.tipo !== "carta") return null;
  const j = m.s.jogadores[ui.jogAtivo]; const x = j && j.c && j.c.mao.find(y => y.uid === h.uid);
  if (!x || m.podeJogar(j, x)) return null;
  let alvo = null;
  if (m.precisaAlvo(x)) { const a = m.alvosPossiveis(j); if (a.length !== 1) return null; alvo = a[0].uid; }
  return { tipo: "carta", jog: ui.jogAtivo, uid: x.uid, alvo };
}
let prevendo = false;
async function prever() {
  const m = ui.motor;
  if (prevendo) return;
  if (!podeSimular(m)) { if (ui.previa || ui.previaChave) { ui.previa = null; ui.previaChave = ""; desenharPrevia(); } return; }
  prevendo = true;
  try {
    if (ui.rodadaVer !== ui.ver) {
      const ver = ui.ver; const r = await m.previsaoRodada();
      if (r && r.erro) console.warn("previsão da rodada:", r.erro);
      ui.rodadaVer = ver; ui.rodada = r && !r.erro ? r : null; ui.sujo = true;
    }
    const p = pedidoPrevia(m); const chave = p ? [ui.ver, p.tipo, p.jog, p.uid, p.i, p.alvo].join("|") : "";
    if (chave !== ui.previaChave) {
      ui.previaChave = chave; let r = null;
      if (p) {
        const j = m.s.jogadores[p.jog];
        r = p.tipo === "prov" ? await m.previaProvisao(j, p.i, p.alvo) : await m.previaCarta(j, p.uid, p.alvo);
        if (r && r.erro) { console.warn("prévia:", r.erro); r = null; }
      }
      ui.previa = r; desenharPrevia();
    }
  } finally { prevendo = false; }
}
// posição, no palco de 1600×900, de um ponto dentro de um elemento
function ponto(el, fx = .5, fy = .5) {
  if (typeof el === "string") el = document.getElementById(el);
  if (!el) return null;
  const palco = document.getElementById("palco").getBoundingClientRect(), k = palco.width / 1600, r = el.getBoundingClientRect();
  return { x: (r.left - palco.left + r.width * fx) / k, y: (r.top - palco.top + r.height * fy) / k };
}
const CORTE_TXT = { sorteio: "sorteia algo", revelacao: "compra ou revela cartas", escolha: "pede uma escolha" };
function desenharPrevia() {
  const cam = document.getElementById("previa"); if (!cam) return;
  const p = ui.previa; const m = ui.motor;
  if (!p || !podeSimular(m) || ui.painel) { cam.innerHTML = ""; return; }
  let h = "";
  for (const e of p.inimigos) {
    const pos = ponto("ini-" + e.uid, .5, .8); if (!pos) continue;     // sobre a barra de PV, fora do caminho do cursor
    const perde = e.pv0 - e.pv1, bloq = e.golpes.reduce((n, g) => n + g.bloq, 0), total = e.golpes.reduce((n, g) => n + g.n, 0);
    const [tit, cls] = e.morre ? ["derrotado", "morte"] : perde > 0 ? [`−${perde} PV`, "dano"] : perde < 0 ? [`+${-perde} PV`, "cura"] : e.golpes.length ? ["bloqueado", "bloq"] : ["", "efeito"];
    const li = [];
    if (e.golpes.length > 1) li.push(`${e.golpes.length} golpes: ${e.golpes.map(g => g.n).join(" + ")} = ${total}`);
    else if (e.golpes.length === 1 && (bloq || e.morre)) li.push(`${total} de dano`);
    if (bloq) li.push(`${bloq} no Bloqueio`); else if (e.bloq1 !== e.bloq0) li.push(`Bloqueio ${e.bloq0} → ${e.bloq1}`);
    if (perde) li.push(`PV ${e.pv0} → ${e.pv1}`);
    for (const [k, n] of Object.entries(e.cond)) li.push(`${n > 0 ? "+" : "−"}${Math.abs(n)} ${COND_NOME[k] || k}`);
    if (!tit && !li.length) continue;
    h += `<div class="pv-caixa ${cls}" style="left:${pos.x}px;top:${pos.y}px">${tit ? `<b>${tit}</b>` : ""}${li.map(t => `<small>${esc(t)}</small>`).join("")}</div>`;
  }
  for (const q of p.jogadores) {
    const pos = ponto("jog-" + q.jog, 1, 0); if (!pos) continue;
    const li = [];
    if (q.pv1 !== q.pv0) li.push([q.pv1 < q.pv0 ? "dano" : "cura", `${q.pv1 < q.pv0 ? "−" : "+"}${Math.abs(q.pv1 - q.pv0)} PV`]);
    if (q.bloq1 !== q.bloq0) li.push(["bloq", `${q.bloq1 > q.bloq0 ? "+" : "−"}${Math.abs(q.bloq1 - q.bloq0)} Bloqueio`]);
    if (q.postura1 !== q.postura0 && q.postura1) li.push(["efeito", `entra em ${POST[q.postura1]}`]);
    for (const [k, n] of Object.entries(q.cond)) li.push(["efeito", `${n > 0 ? "+" : "−"}${Math.abs(n)} ${COND_NOME[k] || k}`]);
    if (!li.length) continue;
    h += `<div class="pv-caixa jog" style="left:${pos.x - 8}px;top:${pos.y + 8}px">${li.map(([c, t]) => `<small class="${c}">${esc(t)}</small>`).join("")}</div>`;
  }
  const notas = [];
  if (p.corte) notas.push(`Prévia só até aqui: a carta ${CORTE_TXT[p.corte] || "depende de algo escondido"}, e o resto depende do que vier.`);
  if (p.entram && p.entram.length) notas.push(`Entra em cena: ${p.entram.join(", ")}.`);
  if (notas.length) h += `<div class="pv-nota">${esc(notas.join(" "))}</div>`;
  cam.innerHTML = h;
}
/* traços de quem bate até quem apanha e a seta da mira (carta escolhida → cursor) */
function desenharFx() {
  const cam = document.getElementById("fx"); if (!cam) return;
  let h = ""; const T = tune.animTraco;
  for (const t of ui.tracos) {
    const idade = ui.tique - t.t; if (idade >= T) continue;
    const doTab = t.de.startsWith("jog-");
    const a = ponto(t.de, doTab ? 1 : 0, doTab ? .3 : .5), b = ponto(t.para, doTab ? .5 : 1, doTab ? .5 : .3); if (!a || !b) continue;
    const cresce = Math.min(1, idade / (T * .3)), op = Math.min(1, (T - idade) / (T * .45)).toFixed(2);
    const cx = (a.x + b.x) / 2, cy = Math.min(a.y, b.y) - 50;
    h += `<path d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}" pathLength="1" stroke-dasharray="${cresce.toFixed(3)} 1" stroke="${t.cor}" stroke-width="6" stroke-linecap="round" fill="none" opacity="${op}"/>`;
    if (cresce >= 1) h += `<circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${(8 + (idade - T * .3) * .8).toFixed(1)}" fill="none" stroke="${t.cor}" stroke-width="4" opacity="${op}"/>`;
  }
  if (mirando() && ui.mouse && !ui.painel) {
    const sp = ui.pend && ui.pend.spec; const ma = ui.modoAlvo;
    const o = ma && ma.tipo === "carta" ? ponto(document.querySelector(".cmao.sel > .esc"), .5, .05) : ponto("jog-" + (ma ? ma.jog : sp.jog), 1, .3);
    if (o) {
      const c = ui.mouse; const quente = ui.hover && ui.hover.tipo === "ini" && alvosDaMira().includes(ui.hover.uid);
      const cx = (o.x + c.x) / 2, cy = Math.min(o.y, c.y) - 110; const ang = Math.atan2(c.y - cy, c.x - cx) * 180 / Math.PI;
      const cor = quente ? "#ff8a3a" : "#ffd76a";
      h += `<path d="M${o.x.toFixed(1)} ${o.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}" stroke="#000" stroke-width="12" stroke-linecap="round" fill="none" opacity=".45"/>`
        + `<path d="M${o.x.toFixed(1)} ${o.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}" stroke="${cor}" stroke-width="7" stroke-dasharray="16 10" stroke-linecap="round" fill="none"/>`
        + `<polygon points="6,0 -24,-14 -24,14" fill="${cor}" stroke="#000" stroke-width="2" transform="translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${ang.toFixed(1)})"/>`;
    }
  }
  cam.innerHTML = h;
}
/* ---------- cartas voando ----------
   O motor muda as cartas de lugar de uma vez; a tela compara onde cada carta do investigador da vez estava no último
   desenho (mão, compra, descarte, banidas, Poder em jogo) com onde está agora e faz um «fantasma» da carta voar de
   um lugar ao outro. Os fantasmas moram numa camada fora do palco (#voo), que não é apagada a cada redesenho.
   É só enfeite: nada aqui toca no estado da partida, e com tune.animCarta = 0 ou no modo Rápido nada voa. */
const PILHA_SEL = { compra: ".pilha.compra", descarte: ".pilha.desc", banidas: ".pilha.ban" };
const K_PILHA = .22, K_JOGO = .8, PONTO_JOGO = { x: 1005, y: 470 };     // tamanho da carta na pilha; carta «em jogo» sobre a mesa
function camadaVoo() {
  let el = document.getElementById("voo");
  if (!el) { el = document.createElement("div"); el.id = "voo"; document.body.appendChild(el); }
  const p = document.getElementById("palco").style;
  el.style.transform = p.transform; el.style.left = p.left; el.style.top = p.top;
  el.style.visibility = ui.painel || ui.abertura || ui.fim || (ui.pend && !["alvo", "mapa"].includes(ui.pend.spec.tipo)) ? "hidden" : "";
  return el;
}
function limparVoos() { const el = document.getElementById("voo"); if (el) el.innerHTML = ""; ui.limbo = {}; ui.chegando = {}; }
// cria o fantasma parado em e = { x, y, rot, k, op } (centro no palco, giro em graus, escala)
function fantasma(html, e) {
  const w = CARTA_W * tune.escalaMao, h = CARTA_H * tune.escalaMao;
  const el = document.createElement("div"); el.className = "voo-carta";
  el.style.cssText = `left:${(e.x - w / 2).toFixed(1)}px;top:${(e.y - h / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
  el.innerHTML = html; el._base = { x: e.x, y: e.y }; el._em = e;
  camadaVoo().appendChild(el); return el;
}
// leva o fantasma de onde ele está pelas paradas [{ x, y, rot, k, op, offset }]; op: { atraso (passos), vezes, fica, fim }
function voar(el, paradas, op = {}) {
  const quadro = q => { const f = { transform: `translate(${(q.x - el._base.x).toFixed(1)}px,${(q.y - el._base.y).toFixed(1)}px) rotate(${(q.rot || 0).toFixed(1)}deg) scale(${q.k === undefined ? 1 : q.k})`, opacity: q.op === undefined ? 1 : q.op }; if (q.offset !== undefined) f.offset = q.offset; return f; };
  const kf = [quadro(Object.assign({}, el._em, { offset: undefined })), ...paradas.map(quadro)];
  el._em = Object.assign({}, paradas[paradas.length - 1], { offset: undefined });
  const a = el.animate(kf, { duration: Math.max(1, ms(tune.animCarta) * (op.vezes || 1)), delay: ms(op.atraso || 0), easing: "cubic-bezier(.3,.7,.3,1)", fill: "both" });
  a.onfinish = () => { if (!op.fica) el.remove(); if (op.fim) op.fim(); };
  return a;
}
// onde cada carta da mão está desenhada agora (a carta sob o mouse ou escolhida está levantada e maior)
function posicoesDaMao() {
  const pos = {}; const els = document.querySelectorAll(".mao .cmao[data-uid]"); const n = els.length;
  els.forEach((el, i) => { const alta = el.classList.contains("sel") || el.matches(":hover"); const p = ponto(el, .5, .5); pos[el.dataset.uid] = { x: p.x, y: p.y, rot: alta ? 0 : (i - (n - 1) / 2) * 2.2, k: alta ? 1.5 : 1 }; });
  return pos;
}
function capturarMao() { if (ui.vooAnt && document.querySelector(".mesa-mao")) Object.assign(ui.vooAnt.pos, posicoesDaMao()); }
function voosDaMao() {
  const m = ui.motor, s = m && m.s, c = s && s.combate;
  if (!c || s.fase !== "combate" || ui.fim || !document.querySelector(".mesa-mao")) { if (ui.vooAnt) { ui.vooAnt = null; limparVoos(); } return; }
  const ji = ui.jogAtivo, j = s.jogadores[ji]; if (!j || !j.c) return;
  const zona = {}, carta = {};
  for (const [z, lista] of [["mao", j.c.mao], ["compra", j.c.compra], ["descarte", j.c.descarte], ["banidas", j.c.banidas]]) for (const x of lista) { zona[x.uid] = z; carta[x.uid] = x; }
  for (const p of j.c.poderes) if (p.uid !== undefined) { zona[p.uid] = "poder"; if (p.carta) carta[p.uid] = p.carta; }
  const pos = posicoesDaMao(); const ant = ui.vooAnt; const mesmo = !!ant && ant.ref === c && ant.ji === ji;
  ui.vooAnt = { ref: c, ji, zona, pos, carta: Object.assign({}, mesmo ? ant.carta : {}, carta) };
  camadaVoo();
  if (!mesmo || !tune.animCarta || ui.rapido || ui.segurandoEspaco) { limparVoos(); return; }     // outro combate, outro investigador ou voo desligado: nada voa
  const frente = x => cartaVis(x, tune.escalaMao), verso = `<div class="voo-verso"></div>`;
  const lugar = z => PILHA_SEL[z] ? ponto(document.querySelector(PILHA_SEL[z]), .5, .32) : z === "poder" ? ponto(document.querySelector(`#jog-${ji} .poderes`) || document.getElementById("jog-" + ji), .5, .5) : null;
  const naPilha = (z, op) => { const p = lugar(z); return p ? { x: p.x, y: p.y, rot: 0, k: K_PILHA, op: op !== undefined ? op : z === "poder" ? 0 : .5 } : null; };
  // pilha → pilha (reembaralhar o descarte, cartas que vão da compra direto ao descarte…): até 5 versos de carta
  const troca = {};
  for (const uid in zona) { const a = ant.zona[uid], b = zona[uid]; if (a && a !== b && PILHA_SEL[a] && PILHA_SEL[b]) troca[a + ">" + b] = (troca[a + ">" + b] || 0) + 1; }
  for (const [k, n] of Object.entries(troca)) {
    const [a, b] = k.split(">"); const pa = naPilha(a, 1), pb = naPilha(b, 1); if (!pa || !pb) continue;
    for (let i = 0; i < Math.min(n, 5); i++) voar(fantasma(verso, pa), [pb], { atraso: i * 3, vezes: 1.3 });
  }
  const reembaralhou = !!troca["descarte>compra"];
  // cartas que chegam à mão: saem da pilha de onde vieram (ou voltam da mesa) e a carta de verdade só aparece na chegada
  let ordem = 0;
  for (const x of j.c.mao) {
    const uid = x.uid; if (ant.zona[uid] === "mao" || !pos[uid]) continue;
    const dest = pos[uid], lim = ui.limbo[uid]; let de;
    if (lim) { de = lim.el._em; lim.el.remove(); delete ui.limbo[uid]; }
    else { let z = ant.zona[uid]; if (z === "descarte" && reembaralhou) z = "compra"; de = naPilha(z, .85) || { x: dest.x, y: dest.y + 40, rot: 0, k: .5, op: 0 }; }
    ui.chegando[uid] = ui.tique + tune.animCarta + ordem * 3 + 30;
    const real = document.querySelector(`.cmao[data-uid="${uid}"]`); if (real) real.classList.add("chegando");
    voar(fantasma(frente(x), de), [{ x: dest.x, y: dest.y, rot: dest.rot, k: 1 }], { atraso: ordem * 3, fim: () => { delete ui.chegando[uid]; const el = document.querySelector(`.cmao[data-uid="${uid}"]`); if (el) el.classList.remove("chegando"); } });
    ordem++;
  }
  // cartas que saem da mão: a carta jogada passa pela mesa antes de ir para a sua pilha; as outras vão direto
  ordem = 0; const jogada = ui.jogada && ui.tique - ui.jogada.t < 240 ? ui.jogada.uid : null;
  const mesa = extra => Object.assign({ x: PONTO_JOGO.x, y: PONTO_JOGO.y, rot: 0, k: K_JOGO }, extra || {});
  for (const uid in ant.zona) {
    if (ant.zona[uid] !== "mao" || zona[uid] === "mao") continue;
    const de = ant.pos[uid], x = ui.vooAnt.carta[uid]; if (!de || !x) continue;
    const dest = naPilha(zona[uid]); const el = fantasma(frente(x), de);
    if (String(jogada) === uid) {
      if (dest) voar(el, [mesa({ offset: .4 }), mesa({ offset: .62 }), dest], { vezes: 2.6 });
      else { voar(el, [mesa()], { fica: true }); ui.limbo[uid] = { el, t: ui.tique }; }     // ainda resolvendo: espera na mesa
    } else if (dest) { voar(el, [dest], { atraso: ordem * 2 }); ordem++; }
    else voar(el, [{ x: de.x, y: de.y - 20, rot: 0, k: de.k * .7, op: 0 }]);
  }
  // cartas que esperavam na mesa e agora têm destino
  for (const uid of Object.keys(ui.limbo)) { const dest = naPilha(zona[uid]); if (dest) { voar(ui.limbo[uid].el, [dest]); delete ui.limbo[uid]; } }
}
/* ---------- modais ---------- */
function modal(sp) {
  const m = ui.motor; let corpo = "", rodape = "";
  const titulo = sp.titulo || "";
  if (sp.tipo === "cartas" || sp.tipo === "recompensa") {
    const k = sp.cartas.length > 8 ? .6 : .85;
    corpo = `<div class="grade-cartas">${sp.cartas.map(x => `<div class="opc-carta ${ui.sel.includes(x.uid) ? "on" : ""}" data-a="sel-carta" data-uid="${x.uid}">${cartaVis(x, k)}</div>`).join("")}</div>`;
    const ok = ui.sel.length >= sp.min && ui.sel.length <= sp.max;
    rodape = sp.tipo === "recompensa" ? `<button class="bt" data-a="confirmar" ${ui.sel.length ? "" : "disabled"}>Ficar com a carta escolhida</button><button class="bt verm" data-a="recusar">Recusar (volta ao fundo)</button>` : `<span class="cont">${ui.sel.length} de ${sp.min === sp.max ? sp.max : sp.min + "–" + sp.max}</span><button class="bt" data-a="confirmar" ${ok ? "" : "disabled"}>Confirmar <small>Enter</small></button>`;
  } else if (sp.tipo === "vislumbrar") {
    corpo = `<div class="grade-cartas">${ui.visOrdem.map((u, i) => { const x = sp.cartas.find(y => y.uid === u); const d = ui.visDesc.includes(u); return `<div class="opc-carta vis ${d ? "desc" : ""}"><div class="ord">${d ? "descartar" : (i + 1) + "º do topo"}</div>${cartaVis(x, .8)}<div class="vis-bts"><button class="bt mini" data-a="vis-esq" data-uid="${u}">Antes</button><button class="bt mini" data-a="vis-desc" data-uid="${u}">${d ? "Manter" : "Descartar"}</button><button class="bt mini" data-a="vis-dir" data-uid="${u}">Depois</button></div></div>`; }).join("")}</div>`;
    rodape = `<button class="bt" data-a="vis-ok">Confirmar <small>Enter</small></button>`;
  } else if (sp.tipo === "provisoes") {
    const k = sp.itens.length > 4 ? 1 : 1.3;
    corpo = `${sp.texto ? `<p class="ev-txt">${esc(sp.texto)}</p>` : ""}<div class="grade-cartas provs-escolha">${sp.itens.map((x, i) => `<div class="opc-carta prov ${x.nova ? "nova" : ""} ${sp.descartar && ui.sel.includes(i) ? "fora" : ""}" ${sp.descartar ? `data-a="sel-prov" data-i="${i}"` : ""}><div class="rot-prov">${x.nova ? "nova" : "você já tem"}</div>${miniProvisao(x.nome, k)}<div class="marca-fora">${sp.descartar && ui.sel.includes(i) ? "será descartada" : (sp.descartar ? "clique para descartar esta" : "")}</div></div>`).join("")}</div><p class="nota prov-regra">${REGRA_PROVISAO}</p>`;
    rodape = sp.descartar ? `<span class="cont">${ui.sel.length ? "Você fica com as outras." : "Escolha a Provisão que vai embora."}</span><button class="bt" data-a="confirmar-prov" ${ui.sel.length ? "" : "disabled"}>Descartar a marcada <small>Enter</small></button>` : `<button class="bt grande" data-a="confirmar-prov">Guardar <small>Enter</small></button>`;
  } else if (sp.tipo === "artefatos") {
    corpo = `<div class="grade-cartas">${sp.artefatos.map(n => `<div class="opc-carta ${ui.sel.includes(n) ? "on" : ""}" data-a="sel-art" data-n="${esc(n)}">${miniArtefato(n, .95)}</div>`).join("")}</div>`;
    rodape = `${sp.min === 0 ? `<button class="bt verm" data-a="passar">Passar</button>` : ""}<button class="bt" data-a="confirmar-art" ${ui.sel.length ? "" : "disabled"}>Confirmar</button>`;
  } else {
    const ev = sp.tipo === "evento" ? JOGO.eventos.find(e => e.n === sp.evento) : null;
    const il = ev ? ilustracao("L7", ev.n) : null;
    corpo = `${il ? `<div class="ev-arte" style="background-image:url('${il.arquivo}')"></div>` : ""}${sp.texto ? `<p class="ev-txt">${esc(sp.texto)}</p>` : ""}${sp.quem ? `<p class="ev-quem">${esc(sp.quem)}</p>` : ""}
      <div class="opcoes">${sp.opcoes.map((o, i) => `<button class="bt opc ${o.grupo ? "grupo" : ""}" data-a="opcao" data-i="${i}" ${o.desabilitada ? "disabled" : ""}><span class="num">${i + 1}</span> ${fmt(o.rotulo)}${o.grupo ? ` <small class="g">decisão do grupo</small>` : ""}</button>`).join("")}</div>`;
  }
  const quem = sp.jog !== undefined && m.s.jogadores[sp.jog] ? `<div class="m-quem" style="--c:${m.s.jogadores[sp.jog].cor}">${m.s.jogadores[sp.jog].nome}</div>` : "";
  const volta = sp.voltar ? `<button class="bt volt" data-a="voltar-escolha" title="Desfaz esta escolha e volta ao passo anterior. Só aparece enquanto nada foi revelado (dado, carta, Artefato, Provisão ou Evento).">← Voltar <small>Esc</small></button>` : "";
  return `<div class="modal-fundo"><div class="modal ${sp.tipo}">${quem}<h2>${esc(titulo)}</h2>${corpo}<div class="m-rod">${volta}${rodape}</div></div></div>`;
}
function modalAbertura() {
  const a = ui.abertura.ato; const t = TEXTOS.atos[ROMANO[a]];
  const pro = a === 1 && ui.motor.s.combatesNoAto === 0 && !ui.motor.s.visitados.length ? TEXTOS.abertura.map(p => `<p>${esc(p)}</p>`).join("") : "";
  return `<div class="modal-fundo"><div class="modal abertura"><h2>Ato ${ROMANO[a]} — ${esc(NOME_ATO[a])}</h2>${pro ? `<div class="prologo">${pro}</div>` : ""}<p class="ato-txt">${esc(t.texto)}</p><div class="m-rod"><button class="bt grande" data-a="abertura-ok">Seguir <small>Enter</small></button></div></div></div>`;
}
function telaLoja() {
  const m = ui.motor, s = m.s, L = ui.pend.spec.loja;
  const precoC = (j, nome) => m.precoDeposito(j, { C: 3, I: 4, R: 6, X: 4 }[DEF[nome].rar]);
  const porJog = Object.entries(L.porJog).map(([ji, pj]) => { const j = s.jogadores[ji]; return `<div class="loja-j" style="--c:${j.cor}"><h3>${j.nome} · ${SIMBOLO.credito()} ${j.creditos}</h3><div class="linha-loja">
      ${pj.cartas.map((n, i) => `<div class="item" data-a="comprar" data-acao="carta" data-jog="${ji}" data-i="${i}">${cartaVis({ nome: n, dono: j.id }, .58)}<div class="preco">${SIMBOLO.credito(precoC(j, n))}</div></div>`).join("")}
      ${pj.rara.map((n, i) => `<div class="item" data-a="comprar" data-acao="carta" data-rara="1" data-jog="${ji}" data-i="${i}">${cartaVis({ nome: n, dono: j.id }, .58)}<div class="preco">${SIMBOLO.credito(precoC(j, n))}</div></div>`).join("")}
      <div class="item remover ${L.removeu[ji] ? "usado" : ""}" data-a="comprar" data-acao="remover" data-jog="${ji}"><div class="rem">Remover 1 carta<br><small>máx. 1 por visita</small></div><div class="preco">${SIMBOLO.credito(m.precoDeposito(j, 3))}</div></div>
    </div></div>`; }).join("");
  const comprador = ui.compradorLoja ?? m.idx(m.vivos()[0]);
  const jc = s.jogadores[comprador];
  const grupo = `<div class="loja-g"><h3>Para o grupo — compra: ${m.vivos().map(j => `<button class="bt mini ${m.idx(j) === comprador ? "on" : ""}" data-a="comprador" data-j="${m.idx(j)}">${j.nome} (${j.creditos})</button>`).join("")}</h3><div class="linha-loja">
    ${L.incolores.map((n, i) => `<div class="item" data-a="comprar" data-acao="incolor" data-jog="${comprador}" data-i="${i}">${cartaVis({ nome: n, dono: "incolor" }, .58)}<div class="preco">${SIMBOLO.credito(m.precoDeposito(jc, 4))}</div></div>`).join("")}
    ${L.artefatos.map((n, i) => `<div class="item" data-a="comprar" data-acao="artefato" data-jog="${comprador}" data-i="${i}">${miniArtefato(n, .72)}<div class="preco">${SIMBOLO.credito(m.precoDeposito(jc, { Comum: 5, Incomum: 6, Raro: 8 }[ARTEFATOS[n].classe]))}</div></div>`).join("")}
    ${L.dep.map((n, i) => `<div class="item" data-a="comprar" data-acao="artefato" data-dep="1" data-jog="${comprador}" data-i="${i}">${miniArtefato(n, .72)}<div class="preco">${SIMBOLO.credito(m.precoDeposito(jc, 6))}</div></div>`).join("")}
    ${L.provisoes.map((n, i) => `<div class="item" data-a="comprar" data-acao="provisao" data-jog="${comprador}" data-i="${i}">${miniProvisao(n, .72)}<div class="preco">${SIMBOLO.credito(m.precoDeposito(jc, 2))}</div></div>`).join("")}
  </div></div>`;
  const transf = m.vivos().length > 1 ? `<div class="transf">${m.vivos().map(j => m.vivos().filter(o => o !== j).map(o => `<button class="bt mini" data-a="comprar" data-acao="credito" data-jog="${m.idx(j)}" data-para="${m.idx(o)}">${j.nome} dá 1 crédito a ${o.nome}</button>`).join("")).join("")}</div>` : "";
  return `<div class="tela loja"><h2>Depósito — lançamento aéreo de suprimentos</h2>${porJog}${grupo}<div class="loja-rod">${transf}<button class="bt grande" data-a="sair-loja">Sair do Depósito</button></div></div>`;
}
function telaFim() {
  const f = ui.fim; const ep = f.vitoria ? (f.verdadeira ? TEXTOS.epilogos.verdadeira : f.curta ? null : TEXTOS.epilogos.vitoria) : TEXTOS.epilogos.derrota;
  return `<div class="tela fim ${f.vitoria ? "vit" : "der"}"><h1>${f.vitoria ? (f.verdadeira ? "Vitória Verdadeira" : "Vitória") : "Derrota"}</h1>
    ${f.vitoria ? "" : `<div class="quem">${esc(f.quem || "")} chegou a 0 PV.</div>`}
    ${ep ? `<p class="epilogo">${esc(ep)}</p>` : `<p class="epilogo">O Ancião do Ato I caiu. A Partida Curta termina aqui.</p>`}
    <div class="resumo">${(f.jogadores || []).map(j => `<div><b>${j.nome}</b> — PV ${j.pv}/${j.pvMax}, ${j.baralho.length} cartas, ${j.artefatos.length} artefatos</div>`).join("")}<div>Chegaram ao Ato ${f.ato}${f.linha >= 0 ? ", linha " + (f.linha + 1) : ""}.</div></div>
    <button class="bt grande" data-a="titulo">Nova expedição <small>Enter</small></button></div>`;
}
function telaFiguras() {
  if (!INIMIGO["Espécime Menor"]) new Motor({}, CONFIG);
  const lista = [...JOGO.inimigos, INIMIGO["Espécime Menor"], INIMIGO["Broto de Shoggoth"]];
  return `<div class="tela figuras"><h2>Todos os inimigos (${lista.length})</h2><div class="fig-grade">${lista.map(e => `<div class="fig">${escala(inimigoHTML(e), CARTA_W, CARTA_H, .42)}<div class="fig-n">${esc(e.n)}</div></div>`).join("")}</div></div>`;
}
function painel() {
  const m = ui.motor; const p = ui.painel; let corpo = "";
  if (p.tipo === "registro") corpo = `<div class="registro">${m.s.log.slice(-160).map(l => `<div>${esc(l)}</div>`).join("")}</div>`;
  if (p.tipo === "baralho") { const j = m.s.jogadores[p.j]; corpo = `<div class="grade-cartas">${[...j.baralho].sort((a, b) => a.nome.localeCompare(b.nome)).map(x => cartaVis(x, .62)).join("")}</div>`; }
  if (p.tipo === "pilha") { const j = m.s.jogadores[ui.jogAtivo]; let lista = j.c ? [...j.c[p.p]] : []; if (p.p === "compra") lista.sort((a, b) => a.nome.localeCompare(b.nome)); corpo = `${p.p === "compra" ? "<p class='nota'>Em ordem alfabética — a ordem real fica escondida.</p>" : ""}<div class="grade-cartas">${lista.map(x => cartaVis(x, .62)).join("") || "<p>vazia</p>"}</div>`; }
  if (p.tipo === "carta") corpo = `<div class="grande-carta">${cartaVis({ nome: p.n, apr: p.apr }, 1.3)}</div>`;
  if (p.tipo === "art") corpo = `<div class="grande-carta">${miniArtefato(p.n, 1.6)}</div>`;
  if (p.tipo === "ini") corpo = `<div class="grande-carta">${escala(inimigoHTML(INIMIGO[p.n]), CARTA_W, CARTA_H, 1.5)}</div>`;
  if (p.tipo === "regras") corpo = regrasRapidas();
  if (p.tipo === "mecanica") corpo = painelMecanica(m, m.s.jogadores[p.j]);
  if (p.tipo === "prov") corpo = painelProvisao(m, p);
  if (p.tipo === "menu") corpo = p.confirmar
    ? `<p class="menu-txt">Abandonar a expedição apaga o salvamento: a campanha volta ao zero e não dá para desfazer.</p><div class="opcoes"><button class="bt opc" data-a="abandonar-sim"><span class="num">1</span> Sim, abandonar e voltar ao menu inicial</button><button class="bt opc" data-a="menu"><span class="num">2</span> Não, voltar</button></div>`
    : `<div class="opcoes"><button class="bt opc" data-a="fechar-painel"><span class="num">1</span> Continuar jogando</button><button class="bt opc" data-a="sair-menu"><span class="num">2</span> Voltar ao menu inicial <small class="g">a expedição fica salva no último nó do mapa: «Continuar» retoma dali</small></button><button class="bt opc" data-a="abandonar"><span class="num">3</span> Abandonar a expedição <small class="g">apaga o salvamento e zera a campanha</small></button></div>`;
  const tit = { registro: "Registro da partida", baralho: "Baralho", pilha: { compra: "Pilha de Compra", descarte: "Descarte", banidas: "Banidas" }[p.p], carta: p.n, art: "Artefato", prov: "Provisão", ini: p.n, regras: "Regras rápidas (do manual)", mecanica: p.tipo === "mecanica" ? m.s.jogadores[p.j].nome + " — " + ({ professor: "Glifos", sonhadora: "Estados mentais", ocultista: "Necrose e Bisturis", veterano: "Fúria e sacrifício" })[m.s.jogadores[p.j].id] : "", menu: p && p.confirmar ? "Abandonar a expedição?" : "Menu" }[p.tipo];
  return `<div class="modal-fundo painel-f" data-a="fechar-painel"><div class="modal painel" data-a="nada"><h2>${esc(tit || "")}</h2>${corpo}<div class="m-rod"><button class="bt" data-a="fechar-painel">Fechar <small>Esc</small></button></div></div></div>`;
}
function regrasRapidas() {
  return `<div class="regras"><h4>A rodada</h4><ol><li><b>Presságio:</b> rola-se o dado; cada inimigo revela a intenção (Dado, Sequência ou Fixo).</li><li><b>Turno dos jogadores</b> (simultâneo): remove o Bloqueio, efeitos de início, energia 3, compra 5 (não na 1ª rodada). Jogue cartas e Provisões.</li><li><b>Fim do turno:</b> efeitos de fim de turno, glifos passivos, Banir Efêmeras, descartar a mão (exceto Guardar).</li><li><b>Turno dos inimigos:</b> removem o Bloqueio, perdem PV pela Necrose e agem: fileira de quem tem o Olhar, depois as outras, central por último.</li><li><b>Fim da rodada:</b> Regenerar, −1 Intangível, o Olhar passa adiante.</li></ol>
    <h4>Dano de Ataque, por golpe</h4><p>base + Fúria − 1 se Debilitado (mín. 1) → ×2 se o alvo está Exposto → ×Pânico 2 / Compreensão 3 → Bloqueio → PV. Depois do Ataque: −1 Debilitado do atacante, −1 Exposto de cada alvo.</p>
    <h4>Condições</h4><ul>${Object.values(COND_DESC).map(t => `<li>${fmt(t)}</li>`).join("")}</ul>
    <h4>Regra de Ouro</h4><p>A carta vence o manual; na dúvida, a interpretação pior para os investigadores.</p>
    <p class="nota">Interpretações tomadas pela versão digital: veja <i>regras-interpretadas.md</i> na pasta do jogo.</p></div>`;
}

/* ================= entrada ================= */
function ajustarAtivo() {
  const m = ui.motor; if (!m || !m.s.combate) return;
  const s = m.s; const ok = i => s.jogadores[i] && !s.jogadores[i].fora && !(s.prontos && s.prontos[i]);
  if (!ok(ui.jogAtivo)) { const k = s.jogadores.findIndex((_, i) => ok(i)); if (k >= 0) ui.jogAtivo = k; }
}
function aviso(txt) { ui.aviso = { txt, t: 0 }; ui.sujo = true; }
function clicar(el) {
  const a = el.dataset.a; const m = ui.motor; const sp = ui.pend && ui.pend.spec;
  if (el.closest && el.closest(".no") && sp && sp.tipo === "mapa") { const k = el.closest(".no").dataset.no; if (sp.opcoes.includes(k)) ui.pend.resolve(k); return; }
  if (!a) return;
  ui.sujo = true;
  if (a === "novo") { ui.tela = "prep"; ui.prep = { inv: ["veterano", "ocultista"], mapas: { 1: "A", 2: "A", 3: "A" }, loucura: 0, variantes: {}, semente: (Number(params.get("seed")) || CONFIG.seed) >>> 0 }; return; }
  if (a === "continuar") { try { const st = JSON.parse(localStorage.getItem("amdl-save")); iniciar(null, st); } catch (e) { aviso("Não foi possível carregar o salvamento."); } return; }
  if (a === "voltar" || a === "titulo") { ui.tela = "titulo"; ui.fim = null; return; }
  if (a === "inv") { const p = ui.prep; const id = el.dataset.id; if (p.inv.includes(id)) p.inv = p.inv.filter(x => x !== id); else { p.inv.push(id); if (p.inv.length > 2) p.inv.shift(); } return; }
  if (a === "mapa" && ui.tela === "prep") { ui.prep.mapas[el.dataset.ato] = el.dataset.v; return; }
  if (a === "louc") { ui.prep.loucura = Math.max(0, Math.min(10, ui.prep.loucura + +el.dataset.d)); return; }
  if (a === "var") { ui.prep.variantes[el.dataset.k] = !ui.prep.variantes[el.dataset.k]; return; }
  if (a === "semente") { ui.prep.semente = (Date.now() * 2654435761) >>> 0; return; }
  if (a === "comecar") { if (ui.prep.inv.length) iniciar(ui.prep); return; }
  if (a === "registro") { ui.painel = { tipo: "registro" }; return; }
  if (a === "menu") { ui.painel = { tipo: "menu" }; return; }
  if (a === "abandonar") { ui.painel = { tipo: "menu", confirmar: true }; return; }
  if (a === "sair-menu") { voltarAoTitulo(false); return; }
  if (a === "abandonar-sim") { voltarAoTitulo(true); return; }
  if (a === "regras") { ui.painel = { tipo: "regras" }; return; }
  if (a === "mecanica") { ui.painel = { tipo: "mecanica", j: +el.dataset.j }; return; }
  if (a === "rapido") { ui.rapido = !ui.rapido; return; }
  if (a === "fechar-painel") { ui.painel = null; return; }
  if (a === "nada") return;
  if (a === "baralho") { ui.painel = { tipo: "baralho", j: +el.dataset.j }; return; }
  if (a === "pilha") { ui.painel = { tipo: "pilha", p: el.dataset.p }; return; }
  if (a === "ver-carta") { ui.painel = { tipo: "carta", n: el.dataset.n, apr: el.dataset.apr === "1" }; return; }
  if (a === "ver-art") { ui.painel = { tipo: "art", n: el.dataset.n }; return; }
  if (a === "ver-ini") { ui.painel = { tipo: "ini", n: el.dataset.n }; return; }
  if (a === "abertura-ok" && ui.abertura) { ui.abertura.r(); return; }
  if (a === "ver-prov") { ui.painel = { tipo: "prov", j: +el.dataset.j, i: +el.dataset.i }; return; }
  if (a === "usar-prov") {
    const ji = +el.dataset.j, i = +el.dataset.i; const j = m.s.jogadores[ji]; const nome = j.provisoes[i];
    if (!nome || bloqueioProvisao(m, ji, nome)) return;
    ui.painel = null;
    if (!m.s.combate) { m.usarProvisao(j, i).then(() => ui.sujo = true); return; }
    if (EFEITOS_PROV[nome].alvo) { ui.jogAtivo = ji; ui.modoAlvo = { tipo: "prov", jog: ji, i }; ui.alvoSel = 0; } else ui.acaoResolve({ tipo: "provisao", jog: ji, i });
    return;
  }
  // ----- mapa -----
  if (el.closest && el.closest(".no") && sp && sp.tipo === "mapa") { const k = el.closest(".no").dataset.no; if (sp.opcoes.includes(k)) ui.pend.resolve(k); return; }
  // ----- escolhas -----
  if (a === "opcao" && sp) { ui.pend.resolve(+el.dataset.i); return; }
  if (a === "sel-carta" && sp) { const u = isNaN(+el.dataset.uid) ? el.dataset.uid : +el.dataset.uid; if (ui.sel.includes(u)) ui.sel = ui.sel.filter(x => x !== u); else { ui.sel.push(u); if (ui.sel.length > sp.max) ui.sel.shift(); } return; }
  if (a === "confirmar" && sp) { if (ui.sel.length >= sp.min && ui.sel.length <= sp.max) ui.pend.resolve([...ui.sel]); return; }
  if (a === "recusar" && sp) { ui.pend.resolve([]); return; }
  if (a === "sel-art" && sp) { ui.sel = [el.dataset.n]; return; }
  if (a === "sel-prov" && sp) { ui.sel = [+el.dataset.i]; return; }
  if (a === "confirmar-prov" && sp) { if (!sp.descartar) ui.pend.resolve(0); else if (ui.sel.length) ui.pend.resolve(ui.sel[0]); return; }
  if (a === "voltar-escolha" && sp && sp.voltar) { ui.modoAlvo = null; ui.pend.resolve(VOLTAR); return; }
  if (a === "confirmar-art" && sp) { ui.pend.resolve([...ui.sel]); return; }
  if (a === "passar" && sp) { ui.pend.resolve([]); return; }
  if (a === "vis-desc") { const u = +el.dataset.uid; ui.visDesc = ui.visDesc.includes(u) ? ui.visDesc.filter(x => x !== u) : [...ui.visDesc, u]; return; }
  if (a === "vis-esq" || a === "vis-dir") { const u = +el.dataset.uid; const i = ui.visOrdem.indexOf(u); const k = a === "vis-esq" ? i - 1 : i + 1; if (k >= 0 && k < ui.visOrdem.length) { [ui.visOrdem[i], ui.visOrdem[k]] = [ui.visOrdem[k], ui.visOrdem[i]]; } return; }
  if (a === "vis-ok" && sp) { ui.pend.resolve({ descartar: [...ui.visDesc], ordem: [...ui.visOrdem] }); return; }
  // ----- loja -----
  if (a === "comprador") { ui.compradorLoja = +el.dataset.j; return; }
  if (a === "comprar" && sp && sp.tipo === "loja") { ui.pend.resolve({ acao: el.dataset.acao, jog: +el.dataset.jog, i: +el.dataset.i, rara: !!el.dataset.rara, dep: !!el.dataset.dep, para: +el.dataset.para }); return; }
  if (a === "sair-loja" && sp) { ui.compradorLoja = null; ui.pend.resolve({ acao: "sair" }); return; }
  // ----- combate -----
  if (a === "inimigo") {
    const uid = +el.dataset.uid;
    if (sp && sp.tipo === "alvo") { if (sp.opcoes.includes(uid)) ui.pend.resolve(uid); return; }
    if (ui.modoAlvo && ui.acaoResolve) { const ma = ui.modoAlvo; ui.acaoResolve(ma.tipo === "prov" ? { tipo: "provisao", jog: ma.jog, i: ma.i, alvo: uid } : { tipo: "jogar", jog: ma.jog, uid: ma.uid, alvo: uid }); return; }
    ui.painel = { tipo: "ini", n: m.s.combate.inimigos.find(e => e.uid === uid).nome }; return;
  }
  if (a === "ativar") { const i = +el.dataset.j; if (!m.s.jogadores[i].fora) { ui.jogAtivo = i; ui.modoAlvo = null; } return; }
  if (a === "carta") jogarCartaUI(+el.dataset.uid);
  if (a === "encerrar" && ui.acaoResolve) { ui.acaoResolve({ tipo: "encerrar", jog: ui.jogAtivo }); return; }
  if (a === "encerrarTodos" && ui.acaoResolve) { ui.acaoResolve({ tipo: "encerrarTodos" }); return; }
}
function jogarCartaUI(uid) {
  const m = ui.motor; if (!ui.acaoResolve || !m.s.combate) return;
  const j = m.s.jogadores[ui.jogAtivo]; const x = j.c.mao.find(y => y.uid === uid); if (!x) return;
  const erro = m.podeJogar(j, x); if (erro) { aviso(erro); return; }
  if (ui.modoAlvo && ui.modoAlvo.uid === uid) { ui.modoAlvo = null; return; }
  if (m.precisaAlvo(x)) { const alvos = m.alvosPossiveis(j); if (alvos.length === 1) { ui.acaoResolve({ tipo: "jogar", jog: ui.jogAtivo, uid, alvo: alvos[0].uid }); return; } ui.modoAlvo = { tipo: "carta", jog: ui.jogAtivo, uid }; ui.alvoSel = 0; return; }
  ui.acaoResolve({ tipo: "jogar", jog: ui.jogAtivo, uid });
}
function tecla(code) {
  const m = ui.motor; const sp = ui.pend && ui.pend.spec; ui.sujo = true;
  if (code === "KeyM") return;
  if (code === "Escape") { if (ui.painel) ui.painel = null; else if (ui.modoAlvo) ui.modoAlvo = null; else if (sp && sp.voltar) ui.pend.resolve(VOLTAR); else if (m && !ui.fim) ui.painel = { tipo: "menu" }; return; }
  if (ui.painel && ui.painel.tipo === "menu") { const dg = code.match(/^(?:Digit|Numpad)(\d)$/); const k = dg ? +dg[1] : 0; if (ui.painel.confirmar) { if (k === 1) voltarAoTitulo(true); if (k === 2) ui.painel = { tipo: "menu" }; } else { if (k === 1) ui.painel = null; if (k === 2) voltarAoTitulo(false); if (k === 3) ui.painel = { tipo: "menu", confirmar: true }; } return; }
  if (ui.painel) return;
  const dig = code.match(/^(?:Digit|Numpad)(\d)$/); const n = dig ? (+dig[1] === 0 ? 10 : +dig[1]) : 0;
  if (ui.tela === "titulo" && !m) { if (code === "Enter" || code === "Space") clicar({ dataset: { a: "novo" } }); return; }
  if (ui.tela === "prep") { if (code === "Enter") clicar({ dataset: { a: "comecar" } }); return; }
  if (ui.fim) { if (code === "Enter") { ui.fim = null; ui.tela = "titulo"; ui.motor = null; } return; }
  if (ui.abertura) { if (code === "Enter" || code === "Space") ui.abertura.r(); return; }
  if (sp) {
    if (sp.tipo === "mapa") { const o = sp.opcoes; if (code === "ArrowRight" || code === "ArrowUp") ui.mapaSel = (ui.mapaSel + 1) % o.length; if (code === "ArrowLeft" || code === "ArrowDown") ui.mapaSel = (ui.mapaSel + o.length - 1) % o.length; if (code === "Enter") ui.pend.resolve(o[ui.mapaSel % o.length]); return; }
    if (["opcoes", "evento", "acampamento"].includes(sp.tipo)) { if (n && sp.opcoes[n - 1] && !sp.opcoes[n - 1].desabilitada) ui.pend.resolve(n - 1); else if (code === "Enter") { const k = sp.opcoes.findIndex(o => !o.desabilitada); if (k >= 0) ui.pend.resolve(k); } return; }
    if (sp.tipo === "cartas" || sp.tipo === "recompensa") { if (n && sp.cartas[n - 1]) clicar({ dataset: { a: "sel-carta", uid: String(sp.cartas[n - 1].uid) } }); if (code === "Enter") { if (sp.tipo === "recompensa" && !ui.sel.length) ui.pend.resolve([]); else clicar({ dataset: { a: "confirmar" } }); } return; }
    if (sp.tipo === "vislumbrar") { if (code === "Enter") clicar({ dataset: { a: "vis-ok" } }); return; }
    if (sp.tipo === "artefatos") { if (n && sp.artefatos[n - 1]) ui.sel = [sp.artefatos[n - 1]]; if (code === "Enter") ui.pend.resolve([...ui.sel]); return; }
    if (sp.tipo === "provisoes") { if (sp.descartar && n && sp.itens[n - 1]) ui.sel = [n - 1]; if (code === "Enter") clicar({ dataset: { a: "confirmar-prov" } }); return; }
    if (sp.tipo === "alvo") { const o = sp.opcoes; if (code === "ArrowRight") ui.alvoSel = (ui.alvoSel + 1) % o.length; if (code === "ArrowLeft") ui.alvoSel = (ui.alvoSel + o.length - 1) % o.length; if (code === "Enter") ui.pend.resolve(o[ui.alvoSel % o.length]); if (n && o[n - 1]) ui.pend.resolve(o[n - 1]); return; }
    if (sp.tipo === "loja") { if (code === "Enter" || code === "Escape") clicar({ dataset: { a: "sair-loja" } }); return; }
  }
  if (m && m.s.combate && ui.acaoResolve) {
    const j = m.s.jogadores[ui.jogAtivo];
    if (ui.modoAlvo) { const alvos = m.alvosPossiveis(j); if (code === "ArrowRight") ui.alvoSel = (ui.alvoSel + 1) % alvos.length; if (code === "ArrowLeft") ui.alvoSel = (ui.alvoSel + alvos.length - 1) % alvos.length; if (code === "Enter" && alvos.length) clicar({ dataset: { a: "inimigo", uid: String(alvos[ui.alvoSel % alvos.length].uid) } }); if (n && alvos[n - 1]) clicar({ dataset: { a: "inimigo", uid: String(alvos[n - 1].uid) } }); return; }
    if (n && j.c.mao[n - 1]) { jogarCartaUI(j.c.mao[n - 1].uid); return; }
    if (code === "Tab") { const v = m.vivos().map(x => m.idx(x)); ui.jogAtivo = v[(v.indexOf(ui.jogAtivo) + 1) % v.length]; return; }
    if (code === "KeyE") { clicar({ dataset: { a: "encerrar" } }); return; }
    if (code === "KeyR") { clicar({ dataset: { a: "encerrarTodos" } }); return; }
  }
}

/* ================= partida ================= */
// Volta ao título. A partida em andamento fica parada (suas promessas nunca se resolvem) e é descartada.
function voltarAoTitulo(apagar) {
  if (apagar) { try { localStorage.removeItem("amdl-save"); } catch (e) { } }
  Object.assign(ui, { motor: null, semSalvar: false, tela: "titulo", pend: null, acaoResolve: null, abertura: null, modoAlvo: null, painel: null, fim: null, esperas: [], flut: [], dado: null, agindo: null, sel: [], faixa: null, vooAnt: null, jogada: null, combRef: null, fx: {}, morrendo: {}, tracos: [], pvVisto: {}, previa: null, previaChave: "", rodada: null, rodadaVer: -1 });
  limparVoos();
  ui.sujo = true;
}
async function iniciar(prep, salvo) {
  const m = new Motor(io, CONFIG); ui.motor = m; ui.tela = "jogo"; ui.fim = null; ui.sujo = true;
  if (salvo) m.carregar(salvo);
  else {
    m.novaPartida({ semente: prep.semente, investigadores: prep.inv, mapas: prep.mapas, loucura: prep.loucura, variantes: prep.variantes });
    if (m.V.draft) await draft(m);
    if (!ui.autoPrimeiro) await io.abertura(1);
  }
  try {
    const fim = await m.jogar();
    ui.fim = Object.assign({}, fim, { jogadores: m.s.jogadores, ato: m.s.ato, linha: m.s.linhaAtual });
    if (window.game) window.game.events.push({ tipo: "fim", fim });
  } catch (e) { console.error(e); aviso("Erro no motor: " + e.message); }
  ui.sujo = true;
}
async function draft(m) {
  for (const j of m.s.jogadores) {
    const p = JOGO.personagens.find(x => x.id === j.id);
    const comuns = m.embaralhar(p.comuns.map(c => c.n)).slice(0, 6);
    const pega = await io.escolher({ tipo: "recompensa", jog: m.idx(j), cartas: comuns.map((n, i) => ({ uid: "d" + i, nome: n, dono: j.id })), min: 0, max: 2, titulo: `Draft — ${j.nome}: escolha até 2 Comuns` });
    if (!pega.length) continue;
    const sai = await io.escolher({ tipo: "cartas", jog: m.idx(j), cartas: j.baralho, min: pega.length, max: pega.length, titulo: `Draft — troque ${pega.length} carta(s) inicial(is)` });
    for (const u of sai) j.baralho.splice(j.baralho.findIndex(x => x.uid === u), 1);
    for (const u of pega) { const nome = comuns[+u.slice(1)]; j.baralho.push(m.nova(nome, j.id)); const k = j.recompensas.indexOf(nome); if (k >= 0) j.recompensas.splice(k, 1); }
  }
}

/* ================= som (Web Audio, sintetizado) ================= */
function som(t) {
  if (typeof tone !== "function") return;
  if (t === "carta") tone(420, .08, "triangle", .12);
  if (t === "golpe") { tone(110, .12, "sawtooth", .18); tone(70, .2, "sine", .2); }
  if (t === "dor") tone(150, .18, "square", .14);
  if (t === "morte") { tone(220, .3, "sine", .18); tone(147, .5, "sine", .14); }
  if (t === "dado") { for (let i = 0; i < 4; i++) setTimeout(() => tone(900 + i * 70, .03, "square", .06), i * 50); }
  if (t === "abrir") tone(660, .06, "sine", .06);
}

/* ================= laço (chamado a cada passo fixo) ================= */
function passo() {
  ui.tique++;
  if (ui.faixa && ui.tique - ui.faixa.t >= tune.faixaFase) { ui.faixa = null; ui.sujo = true; }
  // voo das cartas: rede de segurança se uma animação não terminar (aba em segundo plano), e carta esquecida na mesa
  for (const uid of Object.keys(ui.chegando)) if (ui.tique > ui.chegando[uid]) { delete ui.chegando[uid]; ui.sujo = true; }
  for (const uid of Object.keys(ui.limbo)) if (ui.tique - ui.limbo[uid].t > 180) { const el = ui.limbo[uid].el; delete ui.limbo[uid]; voar(el, [Object.assign({}, el._em, { op: 0 })]); }
  // zoom com atraso: liga a classe direto no elemento, para a carta crescer suave sem redesenhar a tela
  if (ui.hover && ui.hover.tipo === "ini" && zoomEm(ui.hover.uid)) { const el = document.getElementById("ini-" + ui.hover.uid); if (el && !el.classList.contains("zoom")) el.classList.add("zoom"); }
  for (const uid of Object.keys(ui.morrendo)) if (ui.tique - ui.morrendo[uid] >= tune.animMorte) { delete ui.morrendo[uid]; ui.sujo = true; }
  if (ui.tracos.length) { ui.tracos = ui.tracos.filter(t => ui.tique - t.t < tune.animTraco); if (!ui.sujo) desenharFx(); }
  for (const w of [...ui.esperas]) { w.n--; if (w.n <= 0) { ui.esperas.splice(ui.esperas.indexOf(w), 1); w.r(); } }
  if (ui.dado && ui.dado.t < 60) { ui.dado.t++; if (ui.dado.t <= 37) ui.sujo = true; }
  for (const f of ui.flut) f.t++;
  if (ui.flut.length) { ui.flut = ui.flut.filter(f => f.t < 70); desenharFlut(); }
  if (ui.aviso) { ui.aviso.t++; if (ui.aviso.t > 150) { ui.aviso = null; ui.sujo = true; } }
  if (ui.agindo && !ui.esperas.length) { ui.agindoT = (ui.agindoT || 0) + 1; if (ui.agindoT > 20) { ui.agindo = null; ui.agindoT = 0; ui.sujo = true; } }
}
function desenharFlut() {
  const camada = document.getElementById("flut"); if (!camada) return; const palco = document.getElementById("palco").getBoundingClientRect(); const k = palco.width / 1600;
  camada.innerHTML = ui.flut.map((f, i) => { const el = document.getElementById(f.id); if (!el) return ""; const r = el.getBoundingClientRect(); const x = (r.left - palco.left + r.width / 2) / k, y = (r.top - palco.top + r.height * .45) / k - f.t * 1.1 - (i % 3) * 18 - (f.cls === "nome" ? 46 : 0); return `<div class="flut ${f.cls || ""}" style="left:${x}px;top:${y}px;color:${f.cor};opacity:${Math.min(1, (70 - f.t) / 25)}">${f.txt}</div>`; }).join("");
}
function desenhar() { if (ui.sujo) { ui.sujo = false; render(); desenharFlut(); desenharPrevia(); desenharFx(); voosDaMao(); prever(); } }

// o que está sob o mouse (inimigo ou carta da mão) e onde o cursor está no palco: alimentam a prévia e a seta da mira
document.addEventListener("mouseover", ev => {
  const el = ev.target.closest ? ev.target.closest(".ini[data-uid], .cmao[data-uid]") : null;
  const h = el ? { tipo: el.classList.contains("ini") ? "ini" : "carta", uid: +el.dataset.uid } : null;
  if ((h && h.tipo + h.uid) === (ui.hover && ui.hover.tipo + ui.hover.uid)) return;
  ui.hover = h; ui.hoverT = ui.tique;
  document.querySelectorAll(".ini.zoom").forEach(x => x.classList.remove("zoom"));
  prever(); if (mirando()) desenharFx();
});
document.addEventListener("mousemove", ev => {
  const palco = document.getElementById("palco").getBoundingClientRect(), k = palco.width / 1600;
  ui.mouse = { x: (ev.clientX - palco.left) / k, y: (ev.clientY - palco.top) / k };
  if (mirando()) desenharFx();
});
document.documentElement.addEventListener("mouseleave", () => { ui.hover = null; ui.mouse = null; prever(); desenharFx(); });

document.addEventListener("click", ev => { const el = ev.target.closest("[data-a], .no"); if (el && document.getElementById("palco").contains(el)) { startAudio && startAudio(); capturarMao(); clicar(el); desenhar(); } });

return { ui, io, passo, desenhar, tecla, iniciar, render };
})();
globalThis.UI = UI;
