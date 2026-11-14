// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
/* =====================================================================
   EFEITOS DAS CARTAS — um efeito por carta, pelo nome em dados.js.
   fx = { m: motor, j: investigador, x: carta, alvo, X, v(a, b): valor comum / aprimorado,
          ultima: tipo da última carta jogada antes desta, ataque }
   Texto é lido de cima para baixo, como manda o Capítulo 6.
   ===================================================================== */
'use strict';
const EFEITOS = (function () {
const E = {};
const ALVO = true;
const def = (nome, alvo, f) => { E[nome] = { alvo: !!alvo, f }; };
// atalhos
const at = (fx, n, vezes = 1) => fx.m.atacar(fx.j, fx.alvo, n, vezes, { ataque: fx.ataque });
const todos = (fx, n, vezes = 1) => fx.m.atacarTodos(fx.j, n, vezes, { ataque: fx.ataque });
const bl = (fx, n) => fx.m.ganharBloqueio(fx.j, n, { carta: true });
const comp = (fx, n) => fx.m.comprar(fx.j, n);
const apl = (fx, cond, n, e) => fx.m.aplicar(e || fx.alvo, cond, n);
const aplTodos = (fx, cond, n, lista) => { for (const e of (lista || fx.m.todosDe(fx.j))) fx.m.aplicar(e, cond, n); };
const energia = (fx, n) => { fx.j.c.energia += n; };
const intencaoAtaca = e => !!(e && e.intencao && /(^|;\s*|:\s*)AT?\d/.test(e.intencao.texto));
async function daPilha(fx, pilha, n, titulo, destino) {
  const c = fx.j.c; const opc = [...c[pilha]]; n = Math.min(n, opc.length); if (!n) return [];
  const r = await fx.m.io.escolher({ tipo: "cartas", jog: fx.m.idx(fx.j), cartas: opc, min: n, max: n, titulo });
  const out = [];
  for (const u of r) { const i = c[pilha].findIndex(y => y.uid === u); if (i < 0) continue; const y = c[pilha].splice(i, 1)[0]; out.push(y);
    if (destino === "topo") c.compra.unshift(y); else if (c.mao.length < 10) c.mao.push(y); else c.descarte.push(y); }
  return out;
}

/* ---------------- iniciais comuns a todos ---------------- */
def("Golpe", ALVO, fx => at(fx, fx.v(1, 2)));
def("Defesa", 0, fx => bl(fx, fx.v(1, 2)));

/* ---------------- O EXPLORADOR ---------------- */
def("Coronhada", ALVO, async fx => { await at(fx, fx.v(2, 3)); apl(fx, "exposto", fx.v(1, 2)); });
def("Golpes de Picareta", ALVO, fx => at(fx, 1, fx.v(2, 3)));
def("Dinamite", 0, fx => todos(fx, fx.v(1, 2)));
def("Golpe de Pá", ALVO, async fx => { await at(fx, 2); await bl(fx, fx.v(1, 2)); });
def("Soco Sujo", ALVO, async fx => { await at(fx, fx.v(2, 3)); fx.m.colocar(fx.j, "Ferida", "compra"); });
def("Avanço na Nevasca", ALVO, fx => at(fx, fx.j.c.bloqueio));
def("Grito de Comando", 0, fx => { const n = fx.v(1, 2); fx.j.c.cond.furia += n; (fx.j.c.fimTurnoFx = fx.j.c.fimTurnoFx || []).push(["furia", n]); });
def("Abrigo de Neve", 0, fx => bl(fx, fx.v(2, 3)));
def("Ignorar a Dor", 0, async fx => { await bl(fx, fx.v(1, 2)); await comp(fx, 1); });
def("Coronhada de Revólver", ALVO, async fx => { await at(fx, fx.v(1, 2)); await comp(fx, 1); });
def("Cabeçada", ALVO, async fx => { await at(fx, fx.v(2, 3)); await daPilha(fx, "descarte", 1, "Cabeçada: escolha 1 carta do descarte para o topo da pilha de compra", "topo"); });
def("Garrafada", ALVO, async fx => { await at(fx, fx.v(3, 4)); apl(fx, "debilitado", fx.v(1, 2)); });
def("Faca de Esfolar", ALVO, fx => at(fx, fx.j.c.t.perdeuPV ? fx.v(3, 4) : fx.v(1, 2)));
def("Tiro de Sinalizador", 0, async fx => { const alvos = fx.m.todosDe(fx.j); await todos(fx, fx.v(1, 2)); aplTodos(fx, "exposto", 1, alvos); });
def("Choque Direto", ALVO, fx => at(fx, fx.v(3, 4)));
def("Teimosia Nórdica", 0, () => { });                         // poder: gatilho em perderPV
def("Juramento ao Filho", 0, async fx => { fx.j.c.cond.furia += 1; await comp(fx, 1); });
def("Esforço Extremo", 0, async fx => { await fx.m.perderPV(fx.j, 1, { fonte: "carta" }); energia(fx, fx.v(2, 3)); });
def("Queimar os Suprimentos", 0, () => { });                   // poder: fim do turno
def("Iglu", 0, fx => bl(fx, fx.j.c.bloqueio));
def("Fúria Berserker", ALVO, fx => at(fx, fx.v(4, 6)));
def("Gancho", ALVO, async fx => { await at(fx, 2); apl(fx, "debilitado", fx.v(1, 2)); apl(fx, "exposto", fx.v(1, 2)); });
def("Golpe Imprudente", ALVO, async fx => { await fx.m.perderPV(fx.j, 2, { fonte: "carta" }); if (fx.m.s.fim) return; await at(fx, fx.v(4, 5)); });
def("Fôlego Final", 0, async fx => { const c = fx.j.c; const nao = c.mao.filter(y => fx.m.tipo(y) !== "A"); for (const y of nao) await fx.m.banir(fx.j, y, "Fôlego Final"); await bl(fx, nao.length * fx.v(1, 2)); });
def("Aliviar a Carga", 0, async fx => { await fx.m.banirEscolha(fx.j, 1, "Aliviar a Carga: Bana 1 carta da sua mão"); await comp(fx, fx.v(2, 3)); });
def("Fúria Crescente", ALVO, async fx => { await at(fx, fx.v(1, 2) + (fx.x.marc || 0)); fx.x.marc = (fx.x.marc || 0) + 1; });
def("Avalanche", 0, fx => todos(fx, 1, fx.X + (fx.apr ? 1 : 0)));
def("Sentinela", 0, fx => bl(fx, fx.v(2, 3)));
def("Intimidar", 0, fx => aplTodos(fx, "debilitado", fx.v(1, 2)));
def("Pele Curtida", 0, () => { });
def("Ira do Sobrevivente", 0, () => { });
def("Muralha de Gelo", 0, () => { });
def("Sangue Viking", 0, () => { });
def("Disciplina Polar", 0, () => { });
def("Bastião", 0, fx => bl(fx, fx.v(6, 8)));
def("Marreta de Perfuração", ALVO, fx => at(fx, fx.v(7, 9)));
def("Última Reserva", 0, async fx => { await fx.m.perderPV(fx.j, 2, { fonte: "carta" }); if (fx.m.s.fim) return; energia(fx, 2); await comp(fx, fx.v(3, 5)); });
def("Ódio Ilimitado", 0, fx => { fx.j.c.cond.furia *= 2; });
def("Provisão Macabra", ALVO, async fx => { const r = await at(fx, fx.v(2, 3)); if (r.matou) { const n = fx.v(1, 2); fx.j.pvMax += n; fx.m.log(`Provisão Macabra: PV máximo de ${fx.j.nome} +${n} (${fx.j.pvMax}).`); } });
def("Ceifar a Vida", 0, async fx => { const n = await todos(fx, fx.v(1, 2)); await fx.m.curar(fx.j, n); });

/* ---------------- A BIÓLOGA ---------------- */
def("Injeção Paralisante", ALVO, async fx => { await at(fx, 1); apl(fx, "debilitado", fx.v(1, 2)); });
def("Recuo Cauteloso", 0, async fx => { await bl(fx, fx.v(2, 3)); await fx.m.descartarEscolha(fx.j, 1, "Recuo Cauteloso: descarte 1 carta"); });
def("Seringa Tóxica", ALVO, async fx => { await at(fx, 1); apl(fx, "necrose", fx.v(2, 3)); });
def("Frasco de Cultura", ALVO, fx => apl(fx, "necrose", fx.v(3, 4)));
def("Abrir a Maleta", 0, fx => fx.m.colocar(fx.j, "Bisturi", "mao", fx.v(2, 3)));
def("Incisão Rápida", ALVO, async fx => { await at(fx, fx.v(1, 2)); await comp(fx, 1); });
def("Esquivar e Rolar", 0, async fx => { await bl(fx, fx.v(2, 3)); const n = fx.v(1, 2); fx.j.c.proxTurno.push(async function (j) { await this.ganharBloqueio(j, n, { carta: true }); }); });
def("Revisar Anotações", 0, async fx => { await comp(fx, fx.v(3, 4)); await fx.m.descartarEscolha(fx.j, 1, "Revisar Anotações: descarte 1 carta"); });
def("Preparação", 0, async fx => { await comp(fx, fx.v(1, 2)); await fx.m.descartarEscolha(fx.j, fx.v(1, 2), "Preparação: descarte"); });
def("Corte", ALVO, fx => at(fx, fx.v(1, 2)));
def("Aparar", 0, fx => bl(fx, fx.v(1, 2)));
def("Spray de Formol", 0, fx => todos(fx, 1, 2));
def("Infecção Secundária", ALVO, fx => at(fx, fx.v(2, 3), fx.alvo && fx.alvo.cond.necrose > 0 ? 2 : 1));
def("Golpe Clínico", ALVO, async fx => { await at(fx, fx.v(4, 5)); if (fx.j.c.t.descartou) energia(fx, 2); });
def("Gás Clorofórmio", 0, fx => aplTodos(fx, "necrose", fx.v(2, 3)));
def("Passo Atrás", 0, async fx => { await bl(fx, fx.v(1, 2)); await comp(fx, 2); });
def("Agulhada", ALVO, async fx => { await at(fx, fx.v(1, 2)); apl(fx, "debilitado", fx.v(1, 2)); });
def("Catalisador", ALVO, fx => { const e = fx.alvo; if (!e) return; e.cond.necrose = Math.min(30, e.cond.necrose * (fx.apr ? 3 : 2)); });
def("Esporos no Ar", 0, () => { });
def("Mão Firme", 0, () => { });
def("Instrumentação", 0, () => { });
def("Dissecação Completa", ALVO, fx => at(fx, Math.max(0, fx.j.c.t.ataques - 1)));
def("Reflexo", 0, () => { });
def("Tática", 0, () => { });
def("Hipótese Arriscada", 0, async fx => { const c = fx.j.c; const n = c.mao.length; for (const y of [...c.mao]) await fx.m.descartarCarta(fx.j, y); await comp(fx, n); });
def("Frasco Ricocheteante", 0, async fx => { for (let i = 0; i < fx.v(3, 4); i++) { const e = await fx.m.escolherInimigo(fx.j, `Frasco Ricocheteante: 1 Necrose (${i + 1}/${fx.v(3, 4)})`); if (e) fx.m.aplicar(e, "necrose", 1); } });
def("Neblina Polar", 0, async fx => { await bl(fx, fx.v(2, 3)); fx.j.c.manterBloqueio = true; });
def("Rasteira", ALVO, async fx => { apl(fx, "debilitado", 2); await bl(fx, fx.v(3, 4)); });
def("Diagnóstico", ALVO, fx => apl(fx, "exposto", 3));
def("Perícia", 0, fx => comp(fx, Math.max(0, fx.v(5, 6) - fx.j.c.mao.length)));
def("Botas com Cravos", 0, fx => { fx.j.c.cond.agilidade += fx.v(1, 2); });
def("Observação Paciente", ALVO, async fx => { await at(fx, fx.v(3, 4)); fx.j.c.compraExtra = (fx.j.c.compraExtra || 0) + 2; });
def("Destilar", 0, fx => fx.m.ganharProvisao(fx.j));
def("Mil Incisões", 0, () => { });
def("Hipotermia Controlada", 0, fx => { fx.j.c.cond.intangivel += fx.v(2, 3); });
def("Carcaça Pútrida", ALVO, fx => { apl(fx, "necrose", fx.v(3, 4)); if (fx.alvo) (fx.alvo.marcas.carcaca = fx.alvo.marcas.carcaca || []).push(fx.m.idx(fx.j)); });
def("Adrenalina", 0, async fx => { energia(fx, fx.v(1, 2)); await comp(fx, 2); });
def("Reflexos Treinados", 0, () => { });
def("Lâmina de Esteatito", ALVO, async fx => { await at(fx, Math.max(0, fx.v(2, 3) - (fx.x.marc || 0)), 2); fx.x.marc = (fx.x.marc || 0) + 1; });
def("Septicemia", 0, () => { });
def("Bandeja Cirúrgica", 0, async fx => { const c = fx.j.c; const n = c.mao.length; for (const y of [...c.mao]) await fx.m.descartarCarta(fx.j, y); fx.m.colocar(fx.j, "Bisturi", "mao", n + (fx.apr ? 1 : 0)); });
def("Autópsia Final", 0, fx => todos(fx, fx.v(8, 10)));

/* ---------------- O GEÓLOGO ---------------- */
def("Traçar Hieróglifo", 0, fx => fx.m.inscrever(fx.j, "relampago"));
def("Liberação Dupla", 0, fx => fx.m.ativar(fx.j, 2));
def("Toque Glacial", ALVO, async fx => { await at(fx, fx.v(2, 3)); await fx.m.inscrever(fx.j, "gelo"); });
def("Esfera Elétrica", ALVO, async fx => { await at(fx, fx.v(1, 2)); await fx.m.inscrever(fx.j, "relampago"); });
def("Raio Fotônico", ALVO, async fx => { await at(fx, fx.v(1, 2)); apl(fx, "exposto", fx.v(1, 2)); });
def("Acumular Energia", 0, async fx => { await bl(fx, fx.v(2, 3)); fx.j.c.proxTurno.push(async function (j) { j.c.energia += 1; }); });
def("Bombardeio Cerebral", ALVO, fx => at(fx, fx.j.c.glifos.length + (fx.apr ? 1 : 0)));
def("Tradução Compilada", ALVO, async fx => { await at(fx, fx.v(2, 3)); await comp(fx, new Set(fx.j.c.glifos.map(g => g.t)).size); });
def("Mente Fria", 0, async fx => { await fx.m.inscrever(fx.j, "gelo"); await comp(fx, fx.v(1, 2)); });
def("Mirar nos Olhos", ALVO, async fx => { const ia = intencaoAtaca(fx.alvo); await at(fx, fx.v(1, 2)); if (ia) apl(fx, "debilitado", 1); });
def("Memória Recuperada", 0, async fx => { await bl(fx, 1); await daPilha(fx, "descarte", 1, "Memória Recuperada: 1 carta do descarte para a mão", "mao"); });
def("Barreira Lógica", 0, fx => bl(fx, fx.v(3, 4)));
def("Reflexão", ALVO, fx => at(fx, fx.v(2, 3)));
def("Recursão", 0, async fx => { const g = await fx.m.ativar(fx.j, 1); if (g) await fx.m.inscrever(fx.j, g.t); });
def("Pilha de Anotações", 0, fx => bl(fx, Math.floor(fx.j.c.descarte.length / 2) + (fx.apr ? 2 : 0)));
def("Otimização", ALVO, async fx => { await at(fx, fx.v(3, 4)); fx.x.marc = (fx.x.marc || 0) + 1; });
def("Lascas de Rocha", 0, async fx => { await todos(fx, 1); await comp(fx, fx.v(1, 2)); });
def("Concentração Profunda", 0, fx => { fx.j.c.concentracao += 1; });
def("Biblioteca Mental", 0, fx => { fx.j.c.slotsGlifo += fx.v(2, 3); });
def("Ciclo Eterno", 0, () => { });
def("Geleira", 0, async fx => { await bl(fx, fx.v(3, 4)); await fx.m.inscrever(fx.j, "gelo", 2); });
def("Frio Interestelar", 0, fx => fx.m.inscrever(fx.j, "gelo", fx.m.todosDe(fx.j).length));
def("Escuridão Primordial", 0, async fx => { await fx.m.inscrever(fx.j, "vazio"); if (fx.apr) for (const g of fx.j.c.glifos.filter(g => g.t === "vazio")) await fx.m.glifoPassivo(fx.j, g); });
def("Fusão Estelar", 0, fx => fx.m.inscrever(fx.j, "estelar"));
def("Absorver", 0, async fx => { const c = fx.j.c; c.concentracao += fx.v(2, 3); c.slotsGlifo = Math.max(0, c.slotsGlifo - 1); while (c.glifos.length > c.slotsGlifo) await fx.m.ativar(fx.j, 1); });
def("Tempestade", 0, fx => fx.m.inscrever(fx.j, "relampago", fx.X + (fx.apr ? 1 : 0)));
def("Equilíbrio", 0, async fx => { await bl(fx, fx.v(3, 4)); fx.j.c.t.guardarMao = true; });
def("Sobrecarga Mental", 0, async fx => { await comp(fx, fx.v(2, 3)); fx.m.colocar(fx.j, "Congelamento", "descarte"); });
def("Acúmulo", 0, fx => energia(fx, Math.floor(fx.j.c.compra.length / fx.v(4, 3))));
def("Necrose Iminente", 0, async fx => { await todos(fx, fx.v(2, 3)); await fx.m.inscrever(fx.j, "vazio"); });
def("Dissipador", 0, () => { });
def("Descarga Estática", 0, () => { });
def("Derreter", ALVO, async fx => { if (fx.alvo) fx.alvo.bloqueio = 0; await at(fx, fx.v(2, 3)); });
def("Forma Eco", 0, () => { });
def("Eletrodinâmica", 0, fx => fx.m.inscrever(fx.j, "relampago", fx.v(2, 3)));
def("Cognição Distorcida", 0, fx => { fx.j.c.concentracao += fx.v(3, 4); });
def("Amortecedor Psíquico", 0, fx => { fx.j.c.amort = (fx.j.c.amort || 0) + fx.v(1, 2); });
def("Surto do Núcleo", ALVO, async fx => { await at(fx, fx.v(4, 5)); fx.j.c.cond.amparo += 1; });
def("Raio Hiperdimensional", 0, async fx => { await todos(fx, fx.v(5, 6)); fx.j.c.concentracao = Math.max(0, fx.j.c.concentracao - 3); });
def("Busca no Arquivo", 0, async fx => { await daPilha(fx, "compra", fx.v(1, 2), "Busca no Arquivo: escolha da pilha de compra", "mao"); fx.m.embaralhar(fx.j.c.compra); });
def("Chuva de Meteoritos", ALVO, async fx => { await at(fx, fx.v(8, 10)); await fx.m.inscrever(fx.j, "estelar", 3); });
def("Aprendizado Contínuo", 0, () => { });

/* ---------------- A ESTUDANTE ---------------- */
const post = (fx, p) => fx.m.mudarPostura(fx.j, p);
def("Corpo Vazio", 0, async fx => { await bl(fx, fx.v(2, 3)); await post(fx, "neutra"); });
def("Grito Contido", ALVO, async fx => { await at(fx, fx.v(2, 3)); await post(fx, "panico"); });
def("Respirar Fundo", 0, async fx => { await bl(fx, fx.v(3, 4)); await post(fx, "lucidez"); });
def("Punho Vazio", ALVO, async fx => { await at(fx, fx.v(2, 3)); await post(fx, "neutra"); });
def("Rajada de Golpes", ALVO, fx => at(fx, fx.v(1, 2)));
def("Pânico Crescente", 0, fx => post(fx, "panico"));
def("Contar até Dez", 0, fx => post(fx, "lucidez"));
def("Olhar Atento", 0, async fx => { await bl(fx, fx.v(2, 3)); await fx.m.vislumbrar(fx.j, fx.v(3, 5)); });
def("Cortar o Destino", ALVO, async fx => { await at(fx, fx.v(1, 2)); await fx.m.vislumbrar(fx.j, fx.v(2, 3)); await comp(fx, 1); });
def("Ajoelhar-se", 0, async fx => { await fx.m.ganharRevelacao(fx.j, fx.v(1, 2)); await bl(fx, 1); });
def("Avaliar", 0, async fx => { await bl(fx, fx.v(2, 3)); fx.m.colocar(fx.j, "Clarividência", "compra"); });
def("Golpe de Faixa", ALVO, async fx => { await at(fx, fx.v(2, 3)); if (fx.ultima === "A") apl(fx, "debilitado", 1); });
def("Esmagar Articulações", ALVO, async fx => { await at(fx, fx.v(2, 3)); if (fx.ultima === "H") apl(fx, "exposto", 1); });
def("Golpe Concêntrico", ALVO, fx => at(fx, fx.v(1, 2) * fx.m.todosDe(fx.j).length));
def("Pausa", 0, fx => bl(fx, fx.v(1, 2) + (fx.j.c.postura === "panico" ? fx.v(2, 3) : 0)));
def("Continuidade", ALVO, async fx => { await at(fx, fx.v(2, 3)); if (fx.ultima === "A") energia(fx, 1); });
def("Proteção Instintiva", 0, fx => bl(fx, fx.v(3, 4)));
def("Fortaleza Mental", 0, () => { });
def("Ímpeto", 0, () => { });
def("Como a Água", 0, () => { });
def("Sem Medo do Escuro", ALVO, async fx => { const ia = intencaoAtaca(fx.alvo); await at(fx, fx.v(2, 3)); if (ia) await post(fx, "lucidez"); });
def("Paz Interior", 0, async fx => { if (fx.j.c.postura === "lucidez") await comp(fx, fx.v(3, 4)); else await post(fx, "lucidez"); });
def("Indignação", 0, async fx => { if (fx.j.c.postura === "panico") aplTodos(fx, "exposto", fx.v(1, 2)); else await post(fx, "panico"); });
def("Ataque de Fúria", ALVO, async fx => { await at(fx, 1, fx.v(3, 4)); await post(fx, "panico"); fx.x.paraCompra = true; });
def("Contemplação", 0, fx => fx.m.ganharRevelacao(fx.j, 3));
def("Releitura", 0, async fx => { await fx.m.ganharRevelacao(fx.j, fx.v(2, 3)); fx.m.colocar(fx.j, "Clarividência", "compra"); });
def("Pancada Serena", ALVO, async fx => { const r = await at(fx, fx.v(3, 4)); if (r.naoBloq) await bl(fx, r.naoBloq); });
def("Santidade", 0, async fx => { await bl(fx, fx.v(3, 4)); if (fx.ultima === "H") await comp(fx, 2); });
def("Previsão", 0, () => { });
def("Colher Lampejos", 0, fx => { const n = fx.X + (fx.apr ? 1 : 0); fx.j.c.proxTurno.push(async function (j) { this.colocar(j, "Lampejo", "mao", n); }); });
def("Tecer Ideias", ALVO, fx => at(fx, fx.v(1, 2)));
def("Mão Espalmada", ALVO, async fx => { await at(fx, fx.v(2, 3)); if (fx.alvo) (fx.alvo.marcas.maoEspalmada = fx.alvo.marcas.maoEspalmada || []).push(fx.m.idx(fx.j)); });
def("Meditar", 0, async fx => { const out = await daPilha(fx, "descarte", fx.v(1, 2), "Meditar: pegue carta(s) do descarte (ganham Guardar)", "mao"); for (const y of out) y.mod = Object.assign({}, y.mod, { guardar: true }); await post(fx, "lucidez"); fx.j.c.t.encerrar = true; });
def("Estudo Obsessivo", 0, () => { });
def("Mente Expandida", 0, () => { });
def("Olhar para Trás", 0, async fx => { await post(fx, "compreensao"); const n = fx.v(5, 3); fx.j.c.proxTurno.push(async function (j) { this.log(`Olhar para Trás: ${j.nome} perde ${n} PV.`); await this.perderPV(j, n, { fonte: "carta" }); }); });
def("Onisciência", 0, async fx => {
  const c = fx.j.c; if (!c.compra.length) return;
  const r = await fx.m.io.escolher({ tipo: "cartas", jog: fx.m.idx(fx.j), cartas: [...c.compra], min: 1, max: 1, titulo: "Onisciência: escolha 1 carta da pilha de compra" });
  const y = c.compra.find(z => z.uid === r[0]); if (!y) return;
  c.compra.splice(c.compra.indexOf(y), 1); c.mao.push(y); y.banirAoResolver = true;
  let alvo = null; if (fx.m.precisaAlvo(y)) { const e = await fx.m.escolherInimigo(fx.j, `Onisciência: alvo de ${y.nome}`); alvo = e && e.uid; }
  await fx.m.jogarCarta(fx.j, y.uid, alvo, { semCusto: true, vezes: 2 });
});
def("Escrita Automática", 0, fx => comp(fx, Math.max(0, 10 - fx.j.c.mao.length)));
def("Conclusão", ALVO, async fx => { const e = fx.alvo; if (e && e.pv <= fx.v(6, 8)) { fx.m.log(`Conclusão: ${e.nome} é derrotado.`); await fx.m.perdaInimigo(e, e.pv, { jog: fx.j }, true); } });
def("Avalanche de Ideias", 0, async fx => {
  const c = fx.j.c; const debil = c.cond.debilitado > 0; const atingidos = new Set(); const n = fx.v(5, 6);
  for (let i = 0; i < n; i++) { const e = await fx.m.escolherInimigo(fx.j, `Avalanche de Ideias: golpe ${i + 1}/${n}`); if (!e) break; atingidos.add(e); await fx.m.atacar(fx.j, e, 1, 1, { semConsumir: true }); if (fx.m.checarFim()) break; }
  if (debil) c.cond.debilitado--; for (const e of atingidos) if (e.cond.exposto > 0) e.cond.exposto--;
});
def("Desejo", 0, async fx => {
  const r = await fx.m.io.escolher({ tipo: "opcoes", titulo: "Desejo — escolha uma", opcoes: [{ rotulo: `Ganhe ${fx.v(2, 3)} Fúria` }, { rotulo: `Ganhe ${fx.v(6, 8)} de Bloqueio` }, { rotulo: `Ganhe ${fx.v(5, 7)} créditos` }] });
  if (r === 0) fx.j.c.cond.furia += fx.v(2, 3); else if (r === 1) await bl(fx, fx.v(6, 8)); else fx.m.ganharCreditos(fx.j, fx.v(5, 7));
});
def("Estabelecimento", 0, () => { });
def("Lição Aprendida", ALVO, async fx => { const r = await at(fx, fx.v(3, 4)); if (r.matou) await fx.m.aprimorarEscolha(fx.j, "Lição Aprendida: Aprimore 1 carta do seu baralho"); });

/* ---------------- FICHAS ---------------- */
def("Bisturi", ALVO, fx => at(fx, fx.v(1, 2) + fx.m.poderesDe(fx.j, "Mão Firme").reduce((s, p) => s + p.n * (p.apr ? 2 : 1), 0)));
def("Lampejo", 0, fx => energia(fx, fx.v(1, 2)));
def("Clarividência", 0, fx => comp(fx, fx.v(2, 3)));

/* ---------------- INCOLORES ---------------- */
def("Primeiros Socorros", 0, fx => fx.m.curar(fx.j, fx.v(2, 3)));
def("Fôlego Renovado", 0, fx => comp(fx, fx.v(2, 3)));
def("Golpe de Sorte", ALVO, fx => at(fx, fx.v(2, 3)));
def("Sinal Estrelado", 0, async fx => { fx.j.c.cond.amparo += fx.v(2, 3); await bl(fx, fx.v(2, 3)); });
def("Ajuda Mútua", 0, async fx => { const a = await fx.m.escolherAliado(fx.j, "Ajuda Mútua: qual aliado compra?"); await fx.m.comprar(a, fx.v(2, 3)); });
def("Cobertura", 0, async fx => { const a = await fx.m.escolherAliado(fx.j, "Cobertura: qual aliado ganha Bloqueio?"); await fx.m.ganharBloqueio(a, fx.v(3, 4), { carta: true }); });
def("Plano Arriscado", 0, fx => { energia(fx, fx.v(2, 3)); fx.m.colocar(fx.j, "Atordoado", "mao"); });
def("Lampião", 0, async fx => { await fx.m.vislumbrar(fx.j, 3); await comp(fx, 1); });
def("Revólver Calibre .38", ALVO, fx => at(fx, 1, fx.v(2, 3)));
def("Fuga Desesperada", 0, fx => bl(fx, fx.v(4, 6)));
def("Anotações de Campo", 0, async fx => { await daPilha(fx, "descarte", 1, "Anotações de Campo: 1 carta do descarte para o topo da pilha", "topo"); await comp(fx, 1); });
def("Carga de Dinamite", 0, fx => todos(fx, fx.v(3, 4)));
def("Grito Primal", 0, fx => aplTodos(fx, "debilitado", fx.v(1, 2), fx.m.todasFileiras()));

/* ---------------- STATUS E TRAUMAS ---------------- */
def("Lodo", 0, () => { });          // custo 1, Banir
for (const n of ["Ferida", "Atordoado", "Congelamento", "Abismo Interior", "Paranoia", "Dúvida", "Vergonha", "Paralisia", "Lembrança Proibida", "Ferida Psíquica", "Agonia", "Sussurros", "Maldição do Livro"]) def(n, 0, () => { });
return E;
})();

/* =====================================================================
   GATILHOS DOS PODERES (cartas na área de Poderes)
   handler(this = motor, j, p = { nome, apr, n, marc }, dados)
   ===================================================================== */
const GATILHOS_PODER = {
  "Queimar os Suprimentos": { async fimTurno(j, p) { await this.perderPV(j, 1, { fonte: "carta" }); if (this.s.fim) return; await this.atacarTodos(j, p.apr ? 2 : 1, 1, { ataque: false }); } },
  "Pele Curtida": { async fimTurno(j, p) { await this.ganharBloqueio(j, p.apr ? 2 : 1, { carta: false }); } },
  "Ira do Sobrevivente": { async banida(j, p) { await this.ganharBloqueio(j, p.apr ? 2 : 1, { carta: false }); } },
  "Sangue Viking": { async inicioTurno(j) { j.c.cond.furia += 1; } },
  "Esporos no Ar": { async inicioTurno(j, p) { for (const e of this.todosDe(j)) this.aplicar(e, "necrose", p.apr ? 2 : 1); } },
  "Instrumentação": { async inicioTurno(j) { this.colocar(j, "Bisturi", "mao"); } },
  "Mil Incisões": { async cartaJogada(j) { await this.atacarTodos(j, 1, 1, { ataque: false }); } },
  "Hipotermia Controlada": { async inicioTurno(j) { j.c.cond.agilidade -= 1; } },
  "Reflexos Treinados": { async cartaJogada(j) { await this.ganharBloqueio(j, 1, { carta: false }); } },
  "Septicemia": { async danoNaoBloqueadoCausado(j, p, d) { this.aplicar(d.alvo, "necrose", 1); } },
  "Ciclo Eterno": { async inicioTurno(j, p) { const g = j.c.glifos[0]; if (g) for (let i = 0; i < (p.apr ? 2 : 1); i++) await this.glifoPassivo(j, g); } },
  "Dissipador": { async poderJogado(j, p, d) { if (d.carta.uid !== p.uid) await this.comprar(j, p.apr ? 2 : 1); } },
  "Descarga Estática": { async danoNaoBloqueadoRecebido(j, p) { await this.inscrever(j, "relampago", p.apr ? 2 : 1); } },
  "Cognição Distorcida": { async inicioTurno(j) { j.c.concentracao = Math.max(0, j.c.concentracao - 1); } },
  "Fortaleza Mental": { async mudouPostura(j, p) { await this.ganharBloqueio(j, p.apr ? 2 : 1, { carta: false }); } },
  "Ímpeto": { async entrouPanico(j) { await this.comprar(j, 2); } },
  "Como a Água": { async fimTurno(j, p) { if (j.c.postura === "lucidez") await this.ganharBloqueio(j, p.apr ? 2 : 1, { carta: false }); } },
  "Previsão": { async inicioTurno(j, p) { await this.vislumbrar(j, p.apr ? 3 : 2); } },
  "Estudo Obsessivo": { async inicioTurno(j, p) { await this.ganharRevelacao(j, p.apr ? 3 : 2); } },
  "Mente Expandida": { async inicioTurno(j, p) { p.marc = (p.marc || 0) + 1; j.c.energia += p.marc; } },
  "Estabelecimento": { async guardada(j, p, d) { d.carta.mod = Object.assign({}, d.carta.mod, { desconto: ((d.carta.mod && d.carta.mod.desconto) || 0) + 1 }); } }
};
Object.assign(globalThis, { EFEITOS, GATILHOS_PODER });
