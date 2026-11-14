/* Copiado sem alterações de acessorios.html do jogo de tabuleiro: constantes dos Atos, ícones dos nós e o gerador de mapas por semente. */
const ROMANO = ["", "I", "II", "III", "IV"];
const NOME_ATO = ["", "A Travessia", "A Cidade Morta", "Os Túneis do Abismo", "As Montanhas Mais Altas"];
const COR_ATO = ["", "#2c4a5e", "#4a3f5c", "#1f3b3a", "#3a2f4f"];

/* =========================================================
   ÍCONES DOS NÓS DO MAPA
   ========================================================= */
const NO = {
  combate:   { nome: "Criatura",   cor: "#3b3b3b" },
  elite:     { nome: "Horror",     cor: "#8e2a1f" },
  misterio:  { nome: "Mistério",   cor: "#2f5d3a" },
  refugio:   { nome: "Acampamento", cor: "#b5651d" },
  antiquario:{ nome: "Depósito",   cor: "#a8812f" },
  relicario: { nome: "Achado",     cor: "#5b3a7a" }
};
function iconeNo(tipo, x, y, r, desperto) {
  const c = NO[tipo].cor;
  let s = `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">`;
  s += `<circle r="${r + 1.2}" fill="#f3ead8" stroke="${c}" stroke-width=".7"/>`;
  s += `<circle r="${r}" fill="${c}"/>`;
  const k = r / 5;
  if (tipo === "combate") { // olho com tentáculo
    s += `<path d="M${-3.6 * k} 0 Q 0 ${-3 * k} ${3.6 * k} 0 Q 0 ${3 * k} ${-3.6 * k} 0z" fill="#f3ead8"/><circle r="${1.2 * k}" fill="#000"/>`;
    s += `<path d="M${-1 * k} ${2 * k} q ${-1 * k} ${2 * k} ${1 * k} ${2.6 * k}" stroke="#f3ead8" stroke-width="${.6 * k}" fill="none"/>`;
  } else if (tipo === "elite") { // chifres
    s += `<path d="M${-3.5 * k} ${-3 * k} Q ${-2 * k} ${1 * k} 0 ${1 * k} Q ${2 * k} ${1 * k} ${3.5 * k} ${-3 * k} Q ${2 * k} ${-.2 * k} 0 ${-.4 * k} Q ${-2 * k} ${-.2 * k} ${-3.5 * k} ${-3 * k}z" fill="#f3ead8"/>`;
    s += `<circle cx="${-1.2 * k}" cy="${2.4 * k}" r="${.7 * k}" fill="#f3ead8"/><circle cx="${1.2 * k}" cy="${2.4 * k}" r="${.7 * k}" fill="#f3ead8"/>`;
  } else if (tipo === "misterio") {
    s += `<text y="${2.6 * k}" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="${8 * k}" fill="#f3ead8">?</text>`;
  } else if (tipo === "refugio") { // fogueira
    s += `<path d="M0 ${-3.6 * k} Q ${2.6 * k} ${-.5 * k} ${1.6 * k} ${1.8 * k} Q ${.8 * k} ${.3 * k} 0 ${1.6 * k} Q ${-.8 * k} ${.3 * k} ${-1.6 * k} ${1.8 * k} Q ${-2.6 * k} ${-.5 * k} 0 ${-3.6 * k}z" fill="#f7d58a"/>`;
    s += `<path d="M${-3 * k} ${3 * k} L ${3 * k} ${2 * k} M${-3 * k} ${2 * k} L ${3 * k} ${3 * k}" stroke="#f3ead8" stroke-width="${.7 * k}"/>`;
  } else if (tipo === "antiquario") { // moeda
    s += `<circle r="${3 * k}" fill="none" stroke="#f3ead8" stroke-width="${.6 * k}"/><text y="${1.6 * k}" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="${4.6 * k}" fill="#f3ead8">¤</text>`;
  } else if (tipo === "relicario") { // baú
    s += `<rect x="${-3.4 * k}" y="${-1.6 * k}" width="${6.8 * k}" height="${4.4 * k}" fill="#f3ead8"/><path d="M${-3.4 * k} ${-1.6 * k} Q 0 ${-4.6 * k} ${3.4 * k} ${-1.6 * k}z" fill="#f3ead8"/><rect x="${-.6 * k}" y="${-.6 * k}" width="${1.2 * k}" height="${1.6 * k}" fill="${c}"/>`;
  }
  if (desperto) s += `<circle r="${r + 2.6}" fill="none" stroke="#d4a72c" stroke-width=".8" stroke-dasharray="1.2 1"/><text y="${-r - 3.2}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="2.6" fill="#8e2a1f">DESPERTO</text>`;
  return s + "</g>";
}

/* =========================================================
   GERADOR DE MAPAS (determinístico por semente)
   ========================================================= */
function gerarMapa(semente) {
  const R = rng(hash(semente));
  const LIN = 12, COL = 7;
  const arestas = new Set(), nos = new Set();
  const cruza = (r, c, c2) => { // aresta (r,c)->(r+1,c2) cruza alguma existente?
    for (const a of arestas) { const [ar, ac, ac2] = a.split(",").map(Number); if (ar !== r) continue; if ((ac < c && ac2 > c2) || (ac > c && ac2 < c2)) return true; }
    return false;
  };
  const inicios = [];
  for (let p = 0; p < 6; p++) {
    let c = Math.floor(R() * COL);
    if (p === 1) while (c === inicios[0]) c = Math.floor(R() * COL);
    inicios.push(c);
    nos.add(`0,${c}`);
    for (let r = 0; r < LIN - 1; r++) {
      const opc = [c - 1, c, c + 1].filter(x => x >= 0 && x < COL && !cruza(r, c, x));
      const prox = opc.length ? opc[Math.floor(R() * opc.length)] : c;
      arestas.add(`${r},${c},${prox}`); nos.add(`${r + 1},${prox}`); c = prox;
    }
  }
  // tipos
  const tipo = {};
  const pais = k => [...arestas].filter(a => { const [r, c, c2] = a.split(",").map(Number); return `${r + 1},${c2}` === k; }).map(a => { const [r, c] = a.split(",").map(Number); return `${r},${c}`; });
  const ordem = [...nos].sort((a, b) => a.split(",")[0] - b.split(",")[0]);
  for (const k of ordem) {
    const r = +k.split(",")[0];
    if (r === 0) { tipo[k] = "combate"; continue; }
    if (r === LIN - 1) { tipo[k] = "refugio"; continue; }
    if (r === 6) { tipo[k] = "relicario"; continue; }
    for (let t = 0; t < 30; t++) {
      const x = R() * 100; let ti;
      if (x < 45) ti = "combate"; else if (x < 67) ti = "misterio"; else if (x < 80) ti = "elite"; else if (x < 91) ti = "refugio"; else ti = "antiquario";
      if (ti === "elite" && r < 4) continue;
      if (ti === "refugio" && (r < 4 || r === LIN - 2)) continue;
      if (ti === "antiquario" && r < 2) continue;
      if (ti !== "combate" && ti !== "misterio" && pais(k).some(p => tipo[p] === ti)) continue;
      tipo[k] = ti; break;
    }
    tipo[k] = tipo[k] || "combate";
  }
  // garante pelo menos 1 antiquário e 2 elites
  const garante = (ti, n, rmin) => {
    let qtd = Object.values(tipo).filter(v => v === ti).length;
    for (const k of ordem) { if (qtd >= n) break; const r = +k.split(",")[0]; if (r >= rmin && r < LIN - 1 && r !== 6 && tipo[k] === "combate") { tipo[k] = ti; qtd++; } }
  };
  garante("antiquario", 2, 3); garante("elite", 3, 5);
  const elites = ordem.filter(k => tipo[k] === "elite");
  const desperto = elites[Math.floor(R() * elites.length)];
  return { LIN, COL, nos, arestas, tipo, desperto, R };
}

