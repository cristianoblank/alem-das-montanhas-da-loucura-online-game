// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
// As regras do tabuleiro vêm do manual: os valores abaixo são os do manual e só devem mudar
// para testar uma variação da regra impressa.
window.CONFIG = {
  seed: 1933, // semente padrão da expedição (?seed= no endereço muda)
  volume: { value: 0.4, min: 0, max: 1, step: 0.05 },
  // --- regras do manual (Cap. 7 e 12) ---
  energia: { value: 3, min: 1, max: 6, step: 1 },          // energia por turno
  compraTurno: { value: 5, min: 1, max: 10, step: 1 },     // cartas compradas por turno
  maoMax: { value: 10, min: 5, max: 15, step: 1 },          // mão máxima
  bloqueioMax: { value: 20, min: 5, max: 99, step: 1 },     // Bloqueio máximo
  descanso: { value: 3, min: 0, max: 10, step: 1 },         // PV recuperados ao Descansar (Loucura 6: 2)
  // --- tela ---
  pausaAnim: { value: 8, min: 0, max: 30, step: 1 },        // passos (1/60 s) entre efeitos resolvidos em ordem
  escalaMao: { value: 0.62, min: 0.4, max: 1, step: 0.02 }, // tamanho das cartas na mão
  escalaInimigo: { value: 0.66, min: 0.4, max: 1, step: 0.02 } // tamanho das cartas de inimigo na mesa
};
