// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
/* =====================================================================
   ARTEFATOS, PROVISÕES E AÇÕES ESPECIAIS DE INIMIGOS
   Alguns artefatos agem direto no motor (custo, energia, compra, morte):
   Maleta de Dissecação, Caderno de Decalques, Lanterna de Querosene,
   Caderno de Campo, Lupa de Campo, Fotografia da Família, Bastão de Esqui,
   Cachecol de Lã, Binóculo Zeiss, Talismã, Contrato, Pedra Verde,
   Necronomicon, Cristal Prismático e os demais de "+1 de energia",
   Coroa de Hieróglifos, Cápsula do Tempo, Cultura de Bactérias, Sangue de
   Shoggoth, Lâmpada Ancestral, Ídolo da Cria Estelar, Bússola Desregulada,
   Carteira de Sócio, Kit de Manutenção. Os demais estão abaixo.
   ===================================================================== */
'use strict';
const GATILHOS_ART = {
  "Cantil de Aquavit": { async fimCombate(j) { await this.curar(j, 2); } },
  "As Cartas do Irmão": { async inicioCombate(j) { this.colocar(j, "Lampejo", "mao"); } },
  "Medalha Polar Norueguesa": { async inicioCombate(j) { j.c.cond.furia += 1; } },
  "Fogareiro Primus": { async entrarAcampamento(j) { await this.curar(j, 2); } },
  "Casaco de Pele de Rena": { async inicioCombate(j) { await this.ganharBloqueio(j, 3, { carta: false }); } },
  "Bolsa de Créditos Pickman": { async obter(j, a, d) { if (d.artefato === a.nome) this.ganharCreditos(j, 6); } },
  "Crucifixo de Prata": { async inicioCombate(j) { j.c.cond.amparo += 1; } },
  "Crampons Afiados": { async inicioCombate(j) { j.c.cond.espinhos += 1; } },
  "Relógio de Bolso": { async ataqueJogado(j) { if (j.c.t.ataques === 3) { await this.ganharBloqueio(j, 2, { carta: false }); this.log("Relógio de Bolso: +2 de Bloqueio."); } } },
  "Pena de Petrel": { async fimCombate(j, a, d) { if (j.pvVitoria !== undefined && j.pvVitoria <= 5) { this.log("Pena de Petrel."); await this.curar(j, 2); } } },
  "Mochila de Lona": { async obter(j, a, d) { if (d.artefato === a.nome) j.slotsProv += 1; } },
  "Cronômetro de Navegação": { async inicioTurno(j, a) { a.marc = (a.marc || 0) + 1; if (a.marc >= 3) { a.marc = 0; j.c.energia += 1; this.log("Cronômetro de Navegação: +1 de energia."); } } },
  "Garrafa Térmica de Café": { async poderJogado(j) { await this.curar(j, 1); } },
  "Mapa de Dyer": { async inicioCombate(j) { for (const e of this.todosDe(j)) this.aplicar(e, "exposto", 1); } },
  "Diário de Caça": { async inimigoMorreu(j, a, d) { if (!j.c || !this.s.combate.inimigos.some(e => e.pv > 0)) return; const ji = this.idx(j); if (d.fileira === ji || d.fileira === "c") { j.c.energia += 1; await this.comprar(j, 1); this.log("Diário de Caça: +1 de energia e 1 carta."); } } },
  "Fragmento de Meteorito": { async inicioCombate(j) { j.c.cond.agilidade += 1; } },
  "Caneta-Tinteiro de Lake": {},   // tratada em jogarCarta (marcadores entre combates)
  "Sinalizador de Magnésio": { async inicioCombate(j) { for (const e of this.todosDe(j)) this.aplicar(e, "debilitado", 1); } },
  "Cachimbo do Capitão": { async banida(j) { if (j.c && !j.c.t.primeiraBanida) { j.c.t.primeiraBanida = true; await this.comprar(j, 1); this.log("Cachimbo do Capitão: compra 1 carta."); } } },
  "O Necronomicon da Miskatonic": { async obter(j, a, d) { if (d.artefato === a.nome) { j.baralho.push(this.nova("Maldição do Livro", "trauma")); this.log("O Necronomicon: Maldição do Livro entra no baralho."); } } },
  "Fonte Termal Subterrânea": { async obter(j, a, d) { if (d.artefato === a.nome) { j.pvMax += 3; j.pv = j.pvMax; } } },
  "Reforma do Equipamento": { async obter(j, a, d) {
    if (d.artefato !== a.nome) return;
    for (let i = 0; i < 2; i++) {
      const opc = j.baralho.filter(x => x.nome === "Golpe" || x.nome === "Defesa"); if (!opc.length) break;
      const r = await this.io.escolher({ tipo: "cartas", jog: this.idx(j), cartas: opc, min: 0, max: 1, titulo: `Reforma do Equipamento: remova até 2 Golpes ou Defesas (${i + 1}/2)` });
      if (!r.length) break; this.removerDoBaralho(j, r[0]);
    }
    await this.aprimorarEscolha(j, "Reforma do Equipamento: Aprimore", 2);
  } },
  "Gramofone Portátil": { async inicioCombate(j) { await this.vislumbrar(j, 2); } },
  "Caixa Térmica": { async obter(j, a, d) { if (d.artefato === a.nome) { j.slotsProv += 1; await this.ganharProvisao(j); } } }
};

/* ---------- Provisões (sem custo de energia, no seu turno) ---------- */
const EFEITOS_PROV = {
  "Conhaque": { f(j) { j.c.cond.furia += 2; } },
  "Café Forte": { f(j) { j.c.cond.agilidade += 2; } },
  "Sais Aromáticos": { foraCombate: true, async f(j) { await this.curar(j, 3); } },
  "Vitaminas de Bordo": { f(j) { this.removerNegativas(j.c.cond); } },
  "Banana de Dinamite": { alvo: true, async f(j, e) { await this.danoInimigo(e || this.alvosPossiveis(j)[0], 4, { ataque: false, jog: j }); } },
  "Nitroglicerina": { async f(j) { await this.atacarTodos(j, 2, 1, { ataque: false }); } },
  "Cobertor de Lã": { async f(j) { await this.ganharBloqueio(j, 4, { carta: false }); } },
  "Benzedrina": { f(j) { j.c.energia += 2; } },
  "Pó de Magnésio": { alvo: true, f(j, e) { this.aplicar(e, "exposto", 3); } },
  "Estricnina": { alvo: true, f(j, e) { this.aplicar(e, "necrose", 5); } },
  "Diário de Bordo": { async f(j) { await this.comprar(j, 3); } },
  "Gás Lacrimogêneo": { alvo: true, f(j, e) { this.aplicar(e, "debilitado", 3); } },
  "Ampola de Adrenalina": { foraCombate: false, async f(j) { await this.curar(j, 1); } },
  "Sinalizador de Fumaça": { async f(j) {
    const c = this.s.combate, ji = this.idx(j);
    if (c.tipo !== "criatura") { this.log("Sinalizador de Fumaça só funciona em combate normal."); return; }
    for (const e of c.inimigos) if (e.fileira === ji && e.pv > 0) { e.pv = 0; e.fugiu = true; }
    c.fugiu.push(ji); this.log(`Os inimigos da fileira de ${j.nome} fogem.`);
  } },
  "Chá de Folha de Coca": { f(j) { j.c.t.coca = true; } },
  "Camuflagem Branca": { f(j) { j.c.cond.intangivel += 1; } },
  "Pemmican Concentrado": { foraCombate: true, f(j) { j.pvMax += 2; this.log(`PV máximo de ${j.nome}: ${j.pvMax}.`); } },
  "Sopa Quente": { async f(j) { for (const x of this.vivos()) { await this.curar(x, 1); if (x.c) await this.ganharBloqueio(x, 1, { carta: false }); } } }
};

/* ---------- Ações de inimigos com texto próprio ----------
   chave = trecho da ação (depois do nome da ação, sem o nome) ou parte entre ";"  */
const ACOES_INIMIGO = {
  "o jogador perde 1 crédito e o pinguim ganha 2 de Bloqueio"(e, alvo) { if (alvo.creditos > 0) alvo.creditos--; this.blqInimigo(e, 2); this.log(`${alvo.nome} perde 1 crédito.`); },
  "todos os inimigos da fileira ganham 1 Fúria"(e) { for (const x of this.s.combate.inimigos) if (x.pv > 0 && x.fileira === e.fileira) x.cond.furia++; },
  "um Escravo Protoplásmico com 5 PV entra na fileira do Alvo"(e, alvo) { this.invocar("Escravo Protoplásmico", this.idx(alvo), { pv: 5 }, e); },
  "duas Crias Estelares Menores (PV 6 cada) entram na fileira central"(e) { this.invocar("Cria Estelar Menor", "c", { pv: 6 }, e); this.invocar("Cria Estelar Menor", "c", { pv: 6 }, e); },
  "o jogador descarta 2 cartas à escolha dele no início do próximo turno"(e, alvo) { if (alvo.c) alvo.c.descartarInicio = (alvo.c.descartarInicio || 0) + 2; },
  "2 Atordoado na pilha de compra do jogador"(e, alvo) { this.colocar(alvo, "Atordoado", "compra", 2); this.log(`2 Atordoado embaralhados na pilha de ${alvo.nome}.`); },
  "remove suas condições negativas"(e) { this.removerNegativas(e.cond); },
  async "cada jogador descarta 1 carta à escolha"() { for (const j of this.vivos()) if (j.c && j.c.mao.length) await this.descartarEscolha(j, 1, `Correnteza: ${j.nome} descarta 1 carta`); },
  "um Broto de Shoggoth (PV 6, fixo: A2) entra em cada fileira"(e) { for (const j of this.vivos()) this.invocar("Broto de Shoggoth", this.idx(j), { pv: 6 }, e); },
  "cada jogador coloca 1 Dúvida temporária (use Atordoado) na mão"() { for (const j of this.vivos()) this.colocar(j, "Atordoado", "mao"); },
  async "cada jogador perde 2 PV (ignora Bloqueio)"() { for (const j of this.vivos()) { await this.perderPV(j, 2, { fonte: "inimigo" }); if (this.s.fim) return; } }
};
if (typeof window !== "undefined") Object.assign(window, { GATILHOS_ART, EFEITOS_PROV, ACOES_INIMIGO });
if (typeof globalThis !== "undefined") Object.assign(globalThis, { GATILHOS_ART, EFEITOS_PROV, ACOES_INIMIGO });
