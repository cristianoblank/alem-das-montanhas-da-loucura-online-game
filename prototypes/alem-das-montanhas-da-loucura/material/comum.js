/* ALÉM DAS MONTANHAS DA LOUCURA — funções de desenho compartilhadas */

const TIPOS = { A: "Ataque", H: "Habilidade", P: "Poder", S: "Status", T: "Trauma" };
const RARIDADES = { N: "Inicial", C: "Comum", I: "Incomum", R: "Rara", F: "Ficha", X: "Incolor", S: "Status", T: "Trauma" };

/* ---------- aleatoriedade determinística ---------- */
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- formatação de texto de regras ---------- */
const PALAVRAS = [
  "Glifos de Relâmpago", "Glifo de Relâmpago", "Glifos de Gelo", "Glifo de Gelo", "Glifos do Vazio", "Glifo do Vazio",
  "Glifos Estelares", "Glifo Estelar", "Bisturis", "Bisturi", "Congelamento", "Abismo Interior",
  "Bloqueio", "Fúria", "Agilidade", "Exposto", "Debilitado", "Trêmulo", "Necrose", "Banir", "Banida", "Banidas", "Bana-a", "Bana",
  "Efêmero", "Premonição", "Guardar", "Guardada", "Guarde", "Impossível", "Vislumbrar", "Vislumbre", "Inscreva", "Ative",
  "Concentração", "Lucidez", "Pânico", "Compreensão", "Revelação", "Lampejos", "Lampejo", "Clarividência",
  "Intangível", "Amparo", "Espinhos", "Regenerar", "Ferida", "Atordoado", "Lodo", "Aprimore", "Transforme", "TODOS", "TODAS",
  "Paranoia", "Dúvida", "Vergonha", "Paralisia", "Lembrança Proibida", "Agonia", "Sussurros", "Maldição do Livro", "Delírio"
];
const RE_PALAVRAS = new RegExp("(?<![\\p{L}])(" + PALAVRAS.sort((a, b) => b.length - a.length).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?![\\p{L}-])", "gu");
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function fmt(s) {
  return esc(s)
    .replace(RE_PALAVRAS, '<b class="kw">$1</b>')
    .replace(/(\b\d+|X(?:\+1)?)(?= (?:de (?:dano|<b class="kw">Bloqueio|energia)|créditos?))/g, '<b class="num">$1</b>')
    .replace(/<b class="num">(\d+)<\/b> (créditos?)/g, (m, n, w) => `<span class="simb">${SIMBOLO.credito(n)}</span> ${w}`);
}

/* ---------- ícones ---------- */
const ICONE = {
  ataque: '<svg viewBox="0 0 24 24"><path d="M3 21l3-1 11-11 1-5-5 1L2 16z" fill="#7a1d12" stroke="#1a0603" stroke-width="1.2"/><path d="M4 15l5 5M14 4l6 6" stroke="#1a0603" stroke-width="1.6"/></svg>',
  bloqueio: '<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" fill="#3d6c96" stroke="#0d1d2b" stroke-width="1.3"/><path d="M12 5v14" stroke="#cfe1f2" stroke-width="1.2"/></svg>',
  olho: '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="#efe3c6" stroke="#2a1d0a" stroke-width="1.3"/><circle cx="12" cy="12" r="4" fill="#5b3a7a"/><circle cx="12" cy="12" r="1.6" fill="#000"/></svg>'
};
/* ---------- símbolos de recompensa (os mesmos em inimigos, cartas mini, manual e acessórios) ---------- */
const ESTRELA5 = (cx, cy, r, ri) => Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? ri : r; return `${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`; }).join(" ");
const SIMBOLO = {
  // crédito: a moeda da Fundação Pickman, com o valor
  credito: v => `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#d4a640" stroke="#3b2a08" stroke-width="1"/><circle cx="10.5" cy="9.5" r="6" fill="#f0cf73" opacity=".55"/><circle cx="12" cy="12" r="8.6" fill="none" stroke="#5a3e0c" stroke-width=".6" stroke-dasharray="1 1"/>${v === undefined ? "" : `<text x="12" y="${String(v).length > 1 ? 15.6 : 16.4}" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="${String(v).length > 1 ? 10 : 12.5}" fill="#3b2a08">${v}</text>`}</svg>`,
  // carta do baralho de Recompensas (escura) ou de Raras (dourada), com quantas revelar
  carta: (v, rara) => `<svg viewBox="0 0 24 24"><rect x="8" y="2" width="12.5" height="18" rx="1.6" fill="${rara ? "#8a6514" : "#3a4858"}" stroke="#0b0f14" stroke-width=".7" transform="rotate(9 14 11)"/><rect x="3.5" y="3.5" width="12.5" height="18" rx="1.6" fill="${rara ? "#d4a72c" : "#1d2733"}" stroke="${rara ? "#3b2a08" : "#c9a24a"}" stroke-width=".9"/>${v === undefined ? `<polygon points="${ESTRELA5(9.75, 12.5, 4, 1.7)}" fill="none" stroke="${rara ? "#3b2a08" : "#c9a24a"}" stroke-width=".8"/>` : `<text x="9.75" y="16.6" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="11" fill="${rara ? "#2a1d0a" : "#efe3cf"}">${v}</text>`}</svg>`,
  // artefato: o esteatito de cinco pontas (verde); de chefe, roxo com anel duplo
  artefato: chefe => `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.8" fill="${chefe ? "#4a2d70" : "#2f4a3a"}" stroke="#c9a24a" stroke-width="1.1"/>${chefe ? '<circle cx="12" cy="12" r="8.6" fill="none" stroke="#c9a24a" stroke-width=".6"/>' : ""}<polygon points="${ESTRELA5(12, 12.4, 7, 3)}" fill="#d4a72c" stroke="#3b2a08" stroke-width=".6" stroke-linejoin="round"/><circle cx="12" cy="12.4" r="1.2" fill="#3b2a08"/></svg>`,
  // provisão: o cantil da expedição
  provisao: () => `<svg viewBox="0 0 24 24"><path d="M10 2.5h4v3.2h-4z" fill="#c9a27a" stroke="#2a1206" stroke-width=".7"/><path d="M9.2 5.5h5.6l.8 2.4" fill="none" stroke="#2a1206" stroke-width=".8"/><ellipse cx="12" cy="14.5" rx="8" ry="7.6" fill="#7a3b1d" stroke="#2a1206" stroke-width="1"/><ellipse cx="12" cy="14.5" rx="5.2" ry="4.8" fill="none" stroke="#e8c79a" stroke-width=".7" stroke-dasharray="1.2 .9"/><path d="M4.3 12.5Q12 9.5 19.7 12.5" fill="none" stroke="#2a1206" stroke-width=".7"/></svg>`,
  // dado do Presságio (para a chance de Provisão)
  dado: () => `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3.5" fill="#f3ead6" stroke="#2a1d0a" stroke-width="1.1"/><circle cx="8" cy="8" r="1.7" fill="#2a1d0a"/><circle cx="12" cy="12" r="1.7" fill="#2a1d0a"/><circle cx="16" cy="16" r="1.7" fill="#2a1d0a"/></svg>`
};
// recompensa de cada tipo de combate (manual, Capítulo 9); cada investigador recebe a sua
const RECOMPENSA = {
  criatura: [["credito", 2], ["carta", 3], ["provisao", "5–6"]],
  elite: [["credito", 4], ["carta", 3], ["rara", 1], ["artefato"], ["provisao", "4–6"]],
  chefe: [["credito", 6], ["rara", 3], ["artefatoChefe"]]
};
function simbolo(tipo, v) {
  return tipo === "rara" ? SIMBOLO.carta(v, true) : tipo === "artefatoChefe" ? SIMBOLO.artefato(true) : tipo === "artefato" ? SIMBOLO.artefato(false)
       : tipo === "provisao" ? SIMBOLO.provisao() : SIMBOLO[tipo](v);
}
// selo pequeno no canto superior esquerdo da arte, como no Slay the Spire de tabuleiro
function premioHTML(cat) {
  return `<div class="premio" title="Recompensa">${RECOMPENSA[cat].map(([t, v]) => t === "provisao"
    ? `<span class="pr">${SIMBOLO.provisao()}<small>${v}</small></span>` : `<span class="pr">${simbolo(t, v)}</span>`).join("")}</div>`;
}
function acaoHTML(str) {
  let nome = "";
  const m = str.match(/^([^:;]{2,40}):\s*(.*)$/);
  if (m && !/^(A|AT|B)\d/.test(m[1])) { nome = m[1]; str = m[2]; }
  const partes = str.split(";").map(p => p.trim()).filter(Boolean).map(p => {
    let r = p.match(/^(AT|A)(\d+)(?:x(\d+))?$/);
    if (r) return `<span class="ic${r[1] === "AT" ? " todos" : ""}">${ICONE.ataque}${r[2]}${r[3] ? "×" + r[3] : ""}</span>`;
    r = p.match(/^B(\d+)$/);
    if (r) return `<span class="ic">${ICONE.bloqueio}${r[1]}</span>`;
    return fmt(p);
  });
  return (nome ? `<i>${esc(nome)}:</i> ` : "") + partes.join(" · ");
}

/* ---------- sigilos procedurais (a "arte" das cartas) ---------- */
function escurecer(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function sigilo(seed, tipo, cor, w = 200, h = 100) {
  const R = rng(hash(seed));
  const cx = w / 2, cy = h / 2, base = escurecer(cor, .45), fundo = escurecer(cor, .22);
  const tr = "#efd9a0";
  let s = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">`;
  s += `<defs><radialGradient id="g${hash(seed)}" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${fundo}"/></radialGradient></defs>`;
  s += `<rect width="${w}" height="${h}" fill="url(#g${hash(seed)})"/>`;
  for (let i = 0; i < 40; i++) s += `<circle cx="${(R() * w).toFixed(1)}" cy="${(R() * h).toFixed(1)}" r="${(R() * .9 + .2).toFixed(2)}" fill="${tr}" opacity="${(R() * .6 + .2).toFixed(2)}"/>`;
  const rr = Math.min(w, h) * .42;
  s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${tr}" stroke-width=".8" opacity=".55"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${rr * .82}" fill="none" stroke="${tr}" stroke-width=".5" stroke-dasharray="2 3" opacity=".5"/>`;
  const n = 5 + Math.floor(R() * 5), passo = 2 + Math.floor(R() * (n / 2 - 1));
  let pts = [];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * passo * 2 * Math.PI / n; pts.push([cx + Math.cos(a) * rr * .8, cy + Math.sin(a) * rr * .8]); }
  s += `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${tr}" stroke-width=".7" opacity=".6"/>`;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n + Math.PI / n, x = cx + Math.cos(a) * rr * .91, y = cy + Math.sin(a) * rr * .91;
    const k = Math.floor(R() * 4);
    if (k === 0) s += `<path d="M${x - 2} ${y - 2}l4 4M${x + 2} ${y - 2}l-4 4" stroke="${tr}" stroke-width=".6"/>`;
    else if (k === 1) s += `<circle cx="${x}" cy="${y}" r="1.6" fill="none" stroke="${tr}" stroke-width=".6"/>`;
    else if (k === 2) s += `<path d="M${x} ${y - 2.5}v5M${x - 2} ${y}h4" stroke="${tr}" stroke-width=".6"/>`;
    else s += `<path d="M${x - 2} ${y + 2}L${x} ${y - 2.5}L${x + 2} ${y + 2}" fill="none" stroke="${tr}" stroke-width=".6"/>`;
  }
  if (tipo === "A") {
    for (let i = 0; i < 5; i++) {
      const x0 = cx + (R() - .5) * w * .7, x1 = cx + (R() - .5) * w * .5, y1 = cy + (R() - .5) * h * .3;
      const x2 = cx + (R() - .5) * w * .3, y2 = cy - h * (.15 + R() * .3);
      s += `<path d="M${x0.toFixed(1)} ${h + 4} C ${x1.toFixed(1)} ${(h * .75).toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="#0b0806" stroke-width="${(5 - i * .6).toFixed(1)}" stroke-linecap="round" opacity=".85"/>`;
      s += `<path d="M${x0.toFixed(1)} ${h + 4} C ${x1.toFixed(1)} ${(h * .75).toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${tr}" stroke-width=".5" stroke-dasharray="1 2.5" opacity=".7"/>`;
    }
  } else if (tipo === "H") {
    const r2 = rr * .45; let hx = [];
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; hx.push((cx + Math.cos(a) * r2).toFixed(1) + "," + (cy + Math.sin(a) * r2).toFixed(1)); }
    s += `<polygon points="${hx.join(" ")}" fill="${fundo}" stroke="${tr}" stroke-width="1"/>`;
    s += `<path d="M${cx} ${cy - r2 * .7}v${r2 * 1.4}M${cx - r2 * .5} ${cy - r2 * .2}l${r2} ${r2 * .4}" stroke="${tr}" stroke-width=".9"/>`;
  } else if (tipo === "P") {
    s += `<path d="M${cx - rr * .75} ${cy} Q ${cx} ${cy - rr * .6} ${cx + rr * .75} ${cy} Q ${cx} ${cy + rr * .6} ${cx - rr * .75} ${cy}z" fill="#f2e6c8" stroke="#000" stroke-width=".8"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${rr * .26}" fill="${cor}"/><circle cx="${cx}" cy="${cy}" r="${rr * .11}" fill="#000"/>`;
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; s += `<path d="M${(cx + Math.cos(a) * rr * .85).toFixed(1)} ${(cy + Math.sin(a) * rr * .62).toFixed(1)}L${(cx + Math.cos(a) * rr * 1.15).toFixed(1)} ${(cy + Math.sin(a) * rr * .95).toFixed(1)}" stroke="${tr}" stroke-width=".6" opacity=".7"/>`; }
  } else if (tipo === "S") {
    for (let i = 0; i < 6; i++) { let x = R() * w, y = 0, d = `M${x.toFixed(1)} 0`; while (y < h) { x += (R() - .5) * 18; y += 6 + R() * 10; d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; } s += `<path d="${d}" fill="none" stroke="#000" stroke-width="1" opacity=".55"/>`; }
  } else if (tipo === "T") {
    let d = `M${cx} ${cy}`; for (let t = 0; t < 26; t += .25) { const r = t * 1.35; d += ` L${(cx + Math.cos(t) * r).toFixed(1)} ${(cy + Math.sin(t) * r * .8).toFixed(1)}`; }
    s += `<path d="${d}" fill="none" stroke="#c9a7e8" stroke-width=".9" opacity=".8"/>`;
  } else if (tipo === "M") {
    // monstro: olhos e boca
    const k = 2 + Math.floor(R() * 5);
    for (let i = 0; i < k; i++) {
      const x = cx + (R() - .5) * w * .55, y = cy + (R() - .5) * h * .45, r = 2.5 + R() * 5;
      s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * .6).toFixed(1)}" fill="#f4e7a8" stroke="#000" stroke-width=".6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * .3).toFixed(1)}" fill="#000"/>`;
    }
    for (let i = 0; i < 4; i++) {
      const x0 = R() * w, x2 = R() * w;
      s += `<path d="M${x0.toFixed(1)} ${h + 3} Q ${(cx + (R() - .5) * 60).toFixed(1)} ${(cy + 10).toFixed(1)} ${x2.toFixed(1)} ${(h * .45 + R() * 20).toFixed(1)}" fill="none" stroke="#000" stroke-width="${(3 + R() * 3).toFixed(1)}" stroke-linecap="round" opacity=".8"/>`;
    }
  }
  return s + "</svg>";
}

/* ---------- ilustrações (img_ia/: feitas para cada carta; img2/ e img/: domínio público, reserva) ---------- */
function imgHTML(caminho, semente, foco, zoomExtra) {
  const h = hash(semente || caminho);
  const pos = foco || `${20 + (h % 61)}% ${25 + ((h >> 8) % 51)}%`;
  const url = /\.(jpe?g|png)$/i.test(caminho) ? caminho : `img/${caminho}.jpg`;
  // escaneamentos costumam ter margens de papel: um zoom leve as corta
  const zoom = zoomExtra || (/haeckel/.test(caminho) ? 1.45 : 1.06);
  return `<div class="foto" style="width:100%;height:100%;background:url('${url}') ${pos} / cover no-repeat;transform:scale(${zoom})"></div>`;
}
// ilustração escolhida para cada item (js/imagens.js, gerado a partir dos mapa.json em img2/)
function slugify(t) { return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
const LOTE_PERSONAGEM = { veterano: "L1", ocultista: "L2", professor: "L3", sonhadora: "L4" };
function ilustracao(lotes, nome) {
  if (typeof IMAGENS === "undefined") return null;
  for (const l of [].concat(lotes)) { const i = IMAGENS[l + "/" + slugify(nome)]; if (i) return i; }
  return null;
}
function retratoHTML(id) {
  const i = ilustracao("L8", "retrato_" + id);
  return i ? imgHTML(i.arquivo, id, i.foco, i.zoom) : retratoSVG(id);
}
function escolherImg(pool, nome) { return pool && pool.length ? pool[hash(nome) % pool.length] : null; }

/* ---------- carta de jogador ---------- */
// Aprimoramentos que não são só troca de números: resumo curto exibido abaixo do texto
const APR_CURTO = {
  "Preparação": "Compre 2 cartas e descarte 2.", "Catalisador": "Triplique em vez de dobrar.", "Bandeja Cirúrgica": "+1 Bisturi.",
  "Bombardeio Cerebral": "+1 de dano.", "Mente Fria": "Compre 2 cartas.", "Pilha de Anotações": "+2 de Bloqueio.", "Lascas de Rocha": "Compre 2 cartas.",
  "Ciclo Eterno": "Acione 2 vezes.", "Escuridão Primordial": "Também acione o passivo de todos os seus Glifos do Vazio.", "Dissipador": "Compre 2 cartas.",
  "Descarga Estática": "Inscreva 2 Glifos de Relâmpago.", "Amortecedor Psíquico": "Ganhe 2 marcadores.", "Busca no Arquivo": "Escolha 2 cartas.", "Meditar": "Pegue 2 cartas."
};
const NUM = /^(?:\d+|X\+1|X)$/;
const tokens = t => t.match(/\d+|X\+1|X|[^\dX]+/g) || [];
// Devolve { texto: HTML com os valores aprimorados embutidos, nota: texto curto ou "" }
function textoComAprimoramento(c) {
  if (!c.u) return { texto: fmt(c.x), nota: "" };
  if (c.u === c.x) return { texto: fmt(c.x), nota: "" };
  const extras = [["Premonição. ", "ganha Premonição"], ["Guardar. ", "ganha Guardar"]];
  for (const [pre, nota] of extras) if (c.u === pre + c.x) return { texto: fmt(c.x), nota };
  if (c.u + " Banir." === c.x) return { texto: fmt(c.x), nota: "perde Banir" };
  if (c.x === "Efêmero. " + c.u) return { texto: fmt(c.x), nota: "perde Efêmero" };
  const a = tokens(c.x), b = tokens(c.u);
  if (a.length === b.length && a.every((t, i) => NUM.test(t) ? NUM.test(b[i]) : t === b[i])) {
    // marca os números que mudam com um selo; o resto é formatado normalmente
    const MARCA = "\u0001";
    const montado = a.map((t, i) => NUM.test(t) && t !== b[i] ? t + MARCA + b[i] + MARCA : t).join("");
    return { texto: fmt(montado).replace(/\u0001([^\u0001]+)\u0001/g, '<span class="up">$1</span>'), nota: "" };
  }
  return { texto: fmt(c.x), nota: APR_CURTO[c.n] || c.u };
}
function cartaHTML(c, ctx) {
  const cls = { A: "ataque", H: "habilidade", P: "poder", S: "status", T: "trauma" }[c.t];
  const custoUp = (c.uk !== undefined && c.uk !== c.k) ? `<span class="custo-up">${c.uk}</span>` : "";
  const custo = c.k === undefined ? "" : `<div class="custo${c.k === "—" ? " traco" : ""}">${c.k}${custoUp}</div>`;
  const { texto, nota } = textoComAprimoramento(c);
  const temApr = !!(c.u && (c.u !== c.x || custoUp));
  const gema = ctx.rar && "NCIR".includes(ctx.rar) ? `<span class="gema ${ctx.rar}"></span>` : "";
  return `<div class="carta ${cls}" style="--c1:${ctx.cor};--c2:${ctx.cor2 || "#ddd"}">
    <div class="moldura">
      <div class="topo">${custo}<div class="nome">${esc(c.n)}</div></div>
      <div class="arte">${ctx.img ? imgHTML(ctx.img, c.n, ctx.foco, ctx.zoom) : sigilo(c.n + (ctx.rotulo || ""), c.t, ctx.cor)}<div class="tipo">${TIPOS[c.t]}</div></div>
      <div class="texto"><div>${texto}${nota ? `<div class="nota-apr"><span class="up">◆</span> ${fmt(nota)}</div>` : ""}</div></div>
      <div class="rodape"><span>${gema}${RARIDADES[ctx.rar] || ""}${temApr ? ' · <span class="leg-apr">◆ = aprimorada</span>' : ""}</span><span>${esc(ctx.rotulo || "")}</span></div>
    </div></div>`;
}

/* ---------- carta mini (artefato, elixir) ---------- */
function miniHTML(nome, texto, ctx) {
  return `<div class="mini-carta" style="--c1:${ctx.cor}">
    <div class="moldura">
      <div class="nome">${esc(nome)}</div>
      <div class="classe">${esc(ctx.classe)}</div>
      <div class="arte">${ctx.arte || sigilo(nome, "P", ctx.cor, 120, 60)}</div>
      <div class="texto"><div>${fmt(texto)}</div></div>
      ${ctx.preco ? `<div class="preco">${fmt(ctx.preco)}</div>` : ""}${ctx.simb ? `<div class="premio">${ctx.simb}</div>` : ""}
    </div></div>`;
}

/* ---------- inimigos ---------- */
const COMP_ROT = { dado: "Dado do Presságio", seq: "Sequência de rodadas", fixo: "Ação fixa" };
function habHTML(h) { return fmt(h).replace(/^([^:<]{2,40}):/, "<b>$1:</b>"); }
function tabelaAcoes(e) {
  return `<table class="acoes">${e.acoes.map(([r, a]) => `<tr><td class="rot">${e.comp === "dado" ? `<span class="dado-rot">${r}</span>` : esc(r)}</td><td>${acaoHTML(a)}</td></tr>`).join("")}</table>`;
}
function arteInimigo(e, w, h) {
  const il = ilustracao(["L5", "L6"], e.n);
  if (il) return imgHTML(il.arquivo, e.n, il.foco, il.zoom);
  return e.img ? imgHTML(e.img, e.n) : sigilo(e.n, "M", e.cat === "elite" ? "#7a2020" : e.cat === "chefe" ? "#4a2d70" : "#3a4a3f", w, h);
}
function inimigoHTML(e) {
  const catNome = { normal: "Criatura", elite: "Horror", chefe: "Ancião · Chefe" }[e.cat];  // a moldura vermelha já diz que é elite
  return `<div class="inimigo ${e.cat}"><div class="moldura">
    <div class="cab">${e.cat === "elite" ? premioHTML("elite") : ""}<div class="nome">${esc(e.n)}<span class="cat">ATO ${["", "I", "II", "III", "IV"][e.ato]} · ${catNome.toUpperCase()}</span></div>
      <div class="pv">${e.pv}${e.pvj ? "<small>POR JOGADOR</small>" : ""}</div></div>
    <div class="arte">${arteInimigo(e, 200, 60)}</div>
    ${e.hab ? `<div class="hab">${habHTML(e.hab)}</div>` : ""}
    <div class="comp-rot">${COMP_ROT[e.comp]}</div>
    ${tabelaAcoes(e)}
    <div class="flavor">${esc(e.txt || "")}</div>
  </div></div>`;
}
function chefeHTML(e) {
  return `<div class="chefe-ficha"><div class="moldura">
    <div class="lado"><div class="arte">${arteInimigo(e, 140, 200)}</div>
      <div class="pvbox"><div class="pv">${e.pv}</div><div>PV POR<br>JOGADOR</div></div></div>
    <div class="corpo">
      <div class="topo">${premioHTML(e.cat)}<div class="sub">${e.cat === "chefe" ? "ANCIÃO · CHEFE" : "HORROR · ELITE"} DO ATO ${["", "I", "II", "III", "IV"][e.ato]}</div></div>
      <h2>${esc(e.n)}</h2>
      ${e.hab ? `<div class="hab">${habHTML(e.hab)}</div>` : ""}
      <div class="comp-rot" style="text-align:left;font-size:7pt">${COMP_ROT[e.comp]}</div>
      ${tabelaAcoes(e)}
      <div class="flavor">${esc(e.txt || "")}</div>
    </div></div></div>`;
}

/* ---------- paginação ---------- */
function paginar(itens, porFolha, classeGrade, rotulo) {
  let out = "";
  for (let i = 0; i < itens.length; i += porFolha) {
    const pag = Math.floor(i / porFolha) + 1, tot = Math.ceil(itens.length / porFolha);
    out += `<section class="folha"><div class="grade ${classeGrade}">${itens.slice(i, i + porFolha).join("")}</div>
      <div class="rotulo-folha">ALÉM DAS MONTANHAS DA LOUCURA · ${esc(rotulo)} · FOLHA ${pag}/${tot}</div></section>`;
  }
  return out;
}

/* ---------- versos ---------- */
function versoSVG(titulo, sub, cor, w = 63, h = 88) {
  const R = rng(hash(titulo));
  const cx = w / 2, cy = h / 2;
  let s = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<rect width="${w}" height="${h}" fill="${escurecer(cor, .35)}"/>`;
  s += `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="2.5" fill="${escurecer(cor, .2)}" stroke="#c9a85a" stroke-width=".5"/>`;
  s += `<rect x="4.5" y="4.5" width="${w - 9}" height="${h - 9}" rx="2" fill="none" stroke="#c9a85a" stroke-width=".2"/>`;
  for (let i = 0; i < 60; i++) s += `<circle cx="${(4 + R() * (w - 8)).toFixed(1)}" cy="${(4 + R() * (h - 8)).toFixed(1)}" r="${(R() * .35 + .08).toFixed(2)}" fill="#efd9a0" opacity="${(R() * .7 + .2).toFixed(2)}"/>`;
  const r = Math.min(w, h) * .33;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c9a85a" stroke-width=".5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r * .86}" fill="none" stroke="#c9a85a" stroke-width=".25" stroke-dasharray=".8 1"/>`;
  let p = []; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; p.push((cx + Math.cos(a) * r * .8).toFixed(2) + "," + (cy + Math.sin(a) * r * .8).toFixed(2)); }
  s += `<polygon points="${p.join(" ")}" fill="none" stroke="#c9a85a" stroke-width=".45"/>`;
  s += `<path d="M${cx - r * .38} ${cy} Q ${cx} ${cy - r * .32} ${cx + r * .38} ${cy} Q ${cx} ${cy + r * .32} ${cx - r * .38} ${cy}z" fill="#efe3c6"/><circle cx="${cx}" cy="${cy}" r="${r * .13}" fill="#000"/>`;
  s += `<text x="${cx}" y="${h * .14}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${w > 50 ? 3.6 : 2.8}" fill="#e8cf8f" letter-spacing=".4">${esc(titulo)}</text>`;
  s += `<text x="${cx}" y="${h * .9}" text-anchor="middle" font-family="Cinzel" font-size="${w > 50 ? 2.4 : 2}" fill="#c9a85a" letter-spacing=".5">${esc(sub)}</text>`;
  return s + "</svg>";
}

/* ---------- retratos vetoriais dos investigadores ---------- */
const RETRATO_EXTRA = {
  veterano: ["#2a1d18", "#7d97ab", '<path d="M22 42 C22 28 46 28 46 42 C46 36 22 36 22 42z" fill="#2a1d18"/><path d="M20 44 h28 v3 h-28z" fill="#5b4636"/><path d="M26 56 q8 6 16 0 v6 q-8 4 -16 0z" fill="#d9d2c8"/>'],
  ocultista: ["#1f2e26", "#8aa7a0", '<path d="M24 40 C24 30 44 30 44 40 C44 50 50 56 46 60 C44 52 24 52 22 60 C18 56 24 50 24 40z" fill="#1f2e26"/><rect x="40" y="68" width="12" height="9" rx="1" fill="#6b5536"/>'],
  professor: ["#1b2a3a", "#8fa6c2", '<circle cx="30" cy="46" r="3" fill="none" stroke="#e8eff4" stroke-width=".8"/><circle cx="38" cy="46" r="3" fill="none" stroke="#e8eff4" stroke-width=".8"/><path d="M33 46h2" stroke="#e8eff4" stroke-width=".8"/><path d="M48 66 l6 -8 l-3 9 l5 -2" stroke="#d4a72c" stroke-width="1" fill="none"/><path d="M34 20 l2.4 7.4 h7.8 l-6.3 4.6 2.4 7.4 -6.3 -4.6 -6.3 4.6 2.4 -7.4 -6.3 -4.6 h7.8z" fill="none" stroke="#d4a72c" stroke-width=".7"/>'],
  sonhadora: ["#2a1f36", "#9c8fb5", '<path d="M23 44 C22 30 46 30 45 44 C48 52 46 60 42 58 C44 50 24 50 26 58 C22 60 20 52 23 44z" fill="#2a1f36"/><path d="M34 14 v8 M30 18 h8" stroke="#efe3c6" stroke-width=".8"/><circle cx="34" cy="18" r="6" fill="none" stroke="#efe3c6" stroke-width=".5" stroke-dasharray="1 1"/>']
};
function retratoSVG(id) {
  const [cor, fundo, extra] = RETRATO_EXTRA[id];
  return `<svg viewBox="0 0 68 88" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="rg${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fundo}"/><stop offset="1" stop-color="#e8eff4"/></linearGradient></defs>
    <rect width="68" height="88" fill="url(#rg${id})"/>
    <path d="M0 70 L10 58 L18 64 L30 48 L42 62 L52 52 L68 66 L68 88 L0 88z" fill="#c9d7e1"/>
    <path d="M14 88 C14 70 22 62 34 62 C46 62 54 70 54 88z" fill="${cor}"/>
    <ellipse cx="34" cy="46" rx="10" ry="12" fill="${cor}"/>${extra}</svg>`;
}

/* ---------- silhueta de cordilheira (decoração vetorial) ---------- */
function cordilheira(w, h, cor, semente, picos = 14) {
  const R = rng(hash(semente)); let d = `M0 ${h}`;
  for (let i = 0; i <= picos; i++) { const x = i * w / picos, y = h * (.15 + R() * .55); d += ` L${x.toFixed(1)} ${y.toFixed(1)}`; if (i < picos) d += ` L${(x + w / picos / 2).toFixed(1)} ${(h * (.55 + R() * .35)).toFixed(1)}`; }
  return `<path d="${d} L${w} ${h}z" fill="${cor}"/>`;
}
