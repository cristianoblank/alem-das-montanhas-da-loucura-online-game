// PROTOTYPE - NOT FOR PRODUCTION
// Question: As regras e o equilíbrio da versão de tabuleiro funcionam numa campanha completa?
// Date: 2026-11-14
// Textos copiados do manual.html do jogo de tabuleiro (abertura, Atos, epílogos).
const TEXTOS = {
 "abertura": [
  "O avião balança como uma folha. Abaixo, o Planalto Antártico é uma página em branco de três mil metros de altura, e à frente, ocupando metade do céu, erguem-se as montanhas.",
  "Elas não deveriam existir. Nenhum mapa as registra, nenhuma teoria geológica as explica. São mais altas que o Himalaia, negras onde o gelo não as cobre, e em seus picos há formas regulares demais — cubos, muralhas, aberturas que lembram janelas. O vento que desce delas assobia em cinco notas, sempre as mesmas, como uma flauta tocada por algo que não tem pulmões.",
  "Vocês leram o relato de Dyer. Leram as anotações rasuradas do estudante Danforth, que não fala desde 1931 e passa os dias desenhando estrelas de cinco pontas. Sabem o que a Expedição Starkweather-Moore encontrou, porque a última transmissão deles chegou à base de McMurdo às 3h17 da madrugada, e não continha palavras. Apenas um som, repetido até o fim da bateria:",
  "Tekeli-li. Tekeli-li.",
  "O piloto aponta para o desfiladeiro. Abaixo, entre dois picos, há uma cidade."
 ],
 "atos": {
  "I": {"titulo":"A TRAVESSIA","texto":"O navio Arkham range entre placas de gelo do tamanho de catedrais. Na base, os rádios da Starkweather-Moore ainda estão ligados, chiando para ninguém. A trilha para o interior passa pelo antigo acampamento de Lake, abandonado em 1930. Os cães se recusam a chegar perto. Há seis montes de neve em forma de estrela onde Dyer jurou ter enterrado algo — e os seis estão abertos."},
  "II": {
   "titulo": "A CIDADE MORTA",
   "texto": "Ela se estende por quilômetros: torres cônicas, pontes de pedra entre cubos sem portas, rampas onde deveria haver escadas. Ninguém humano a construiu. Nas paredes, entalhes contam uma história de cinquenta milhões de anos — a chegada das Coisas Antigas, a criação dos shoggoths como escravos, a guerra contra a cria de Cthulhu, a revolta. Os entalhes mais recentes são piores, e mais toscos. Alguém os fez com pressa. Ou alguém os fez imitando."
  },
  "III": {
   "titulo": "OS TÚNEIS DO ABISMO",
   "texto": "Sob a cidade, túneis largos o bastante para um trem descem em espiral rumo ao calor. O ar cheira a mar e a algo que lembra borracha queimada. Há corpos de Coisas Antigas pelo caminho — sem cabeça, cobertos por uma película negra e brilhante. Os pinguins cegos passam por vocês sem medo. Eles conhecem coisas piores. No fundo, algo enorme se move, e o som dele enche a escuridão de bolhas iridescentes e de uma única palavra, repetida."
  },
  "IV": {
   "titulo": "AS MONTANHAS MAIS ALTAS",
   "texto": "Atrás da cordilheira há outra. Mais alta, mais distante, violeta contra um céu sem cor. As Coisas Antigas nunca foram até lá. Os murais mostram por quê, e em todos eles a cena está riscada, apagada, coberta de entalhes de proteção. Danforth olhou para lá por um segundo, de dentro de um avião. Vocês vão a pé."
  }
 },
 "epilogos": {
  "derrota": "A equipe de busca de 1934 encontrou as barracas montadas e os diários atualizados até a última página. A última anotação, na letra de um de vocês, diz apenas: «Ele imita a nossa voz agora.» A Fundação Pickman encerrou o financiamento de expedições polares no mesmo ano.",
  "vitoria": "Vocês saem dos túneis ao amanhecer, se é que a palavra faz sentido num lugar onde o sol não se põe. Atrás de vocês, a entrada desaba. Não há sobreviventes da Starkweather-Moore para levar de volta — só um relatório que ninguém vai ler até o fim. Mas a cidade está em silêncio, e o silêncio, desta vez, parece definitivo.",
  "verdadeira": "Margaret Danforth desce das montanhas mais altas com os olhos abertos e a voz intacta. Em Arkham, ela visita o irmão no sanatório e senta-se ao lado da cama. Pela primeira vez em três anos, ele para de desenhar estrelas. Ela segura a mão dele e diz, baixinho, o que viu. Ele sorri. Os dois sabem que ninguém mais precisa ir até lá."
 }
};
globalThis.TEXTOS = TEXTOS;
