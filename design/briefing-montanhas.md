# Briefing — Além das Montanhas da Loucura (versão digital para testes)

Documento de entrada para `/prototype` e para as sessões seguintes. Escrito em 14/11/2026.

## O que queremos

Uma versão jogável **no navegador** do jogo de tabuleiro *Além das Montanhas da Loucura*
(construção de baralho cooperativa, 1–4 investigadores, Antártida 1933, inspirada em Lovecraft),
para **testar se o jogo de cartas e tabuleiro funciona**.

- **100% das regras do jogo físico.** Nada de regra nova, simplificada ou "mais divertida no PC".
  Quando a carta contradiz o manual, a carta vence; dúvida sem solução = interpretação pior para
  os investigadores (Regra de Ouro do manual).
- **Emular a partida física o máximo possível**, usando o material original: as cartas (texto e
  arte), os mapas dos Atos, os tabuleiros e as fichas dos investigadores, o Dado do Presságio.
- **Modelo de interface: gênero roguelike deckbuilder (estilo Slay the Spire)** — mapa de nós
  subindo, combate com mão de cartas, energia, intenções dos inimigos visíveis, recompensas após o
  combate. Usar as convenções do gênero, mas com a arte e a identidade do nosso jogo.
- **Uma pessoa joga**, controlando de 1 a 4 investigadores (solo ou "hot-seat"). O manual
  recomenda "solo com dois investigadores" para aprender — esse deve ser um modo de primeira classe.
- **Multiplayer pela internet: depois.** O motor de regras deve ficar separado da tela
  (estado puro + ações), determinístico com semente, para que um servidor possa ser plugado mais
  tarde sem reescrever regras.

## Onde está o jogo base

- Pasta local: `F:\trabalhos claude\jogos tabuleiro\alem das montanhas da loucura`
- GitHub: https://github.com/cristianoblank/alem-das-montanhas-da-loucura

| Arquivo | O que tem |
|---|---|
| `js/dados.js` (~70 KB) | **Todo o conteúdo do jogo**: `JOGO.personagens` (4), `fichas` (3), `incolores` (13), `status` (5), `traumas` (9), `artefatos` (iniciais, comuns, incomuns, raros, chefe, antiquário), `elixires`/provisões (18), `inimigos` (44), `encontros` (37), `eventos` (22), `loucura` (10 níveis). Fonte única de verdade — a versão digital deve ler daqui (cópia ou import), não redigitar. |
| `js/comum.js` | Renderização de cartas em HTML, símbolos de recompensa (`SIMBOLO`, `RECOMPENSA`, `premioHTML`). Reaproveitável para desenhar as cartas na tela. |
| `css/estilo.css` | Estilo das cartas/folhas (fontes, cores, molduras). |
| `js/imagens_ia.js` + `img_ia/L1..L8/` | As 344 artes atuais das cartas (800 px). `img2/` são as antigas, de reserva. |
| `manual.html` | Regras completas (18 capítulos + apêndices). Capítulos-chave: 5 Mapa e Atos, 7 Combate (as 5 fases da rodada, cálculo de dano por golpe), 8 Inimigos (Dado do Presságio / Sequência / Fixo, Horrores e Anciões), 9 Recompensas, 10 Mistério/Acampamento/Depósito/Achado, 11 Aprimorar/Transformar/Remover, 12 Condições, 13 Investigadores, 14 Ato IV e Níveis de Loucura, 15 Jogo em grupo e escala por jogadores. |
| `cartas.html`, `inimigos.html`, `acessorios.html` | O material físico renderizado: cartas, inimigos, mapas dos Atos (A/B), tabuleiros e fichas-resumo dos investigadores, trilhas de PV, dado. |
| `ferramentas/simulador.js` | Simulador do Ato I em Node com IA gulosa. **Interpreta o texto das cartas por regex** — útil como referência de regras, mas deixa várias cartas de fora (ver abaixo). |
| `guia_estrategia.html`, `relatorio_simulacao.html` | Estratégia e resultados de 48 mil campanhas simuladas — bons para comparar o equilíbrio digital com o simulado. |

### Resumo das regras centrais (conferir sempre no manual)

- Partida = Atos I–III (+ Ato IV opcional com os Três Esteatitos). Mapa de 12 linhas subindo até o
  Ancião; o grupo anda junto. Nós: Criatura, Horror (elite, um é "Desperto"), Mistério, Acampamento,
  Depósito, Achado Arqueológico, Ancião.
- Derrota se **qualquer** investigador chegar a 0 PV.
- Investigador: 10 cartas iniciais, baralho de Recompensas (Comuns+Incomuns) e de Raras próprios,
  Artefato Inicial, 3 créditos. Personagens: O Explorador (Fúria e sacrifício), A Bióloga (Necrose e
  Bisturis), O Geólogo (Glifos), A Estudante (Posturas: Lucidez/Pânico/Compreensão).
- Combate normal: cada jogador revela um Encontro (Fácil nos 3 primeiros combates do Ato) e tem sua
  própria fileira. Horror/Ancião: fileira central, PV × nº de jogadores.
- Rodada: 1 Presságio (rolar dado, revelar intenções) → 2 Turno simultâneo dos jogadores (remove
  Bloqueio, efeitos de início, energia = 3, compra 5) → 3 Fim do turno → 4 Turno dos inimigos
  (ordem: fileira de quem tem o Olhar do Abismo, depois sentido horário, esquerda→direita, central
  por último) → 5 Fim da rodada (Regenerar, −1 Intangível, passa o Olhar).
- Dano por golpe: base + Fúria − 1 se Debilitado (mín. 1) × 2 se Exposto × postura; Bloqueio máx. 20;
  mão máx. 10; primeira mão do combate já é a do 1º turno.

### Cartas que o simulador não entende (precisam de implementação explícita)

`node ferramentas/simulador.js 50` lista em `fora` as cartas cujo texto o parser não cobre — por
exemplo, do Explorador: Cabeçada, Choque Direto, Fôlego Final, Fúria Crescente, Sentinela, Disciplina
Polar, Provisão Macabra, Ceifar a Vida; e dezenas da Bióloga, do Geólogo e da Estudante. Para cumprir
"100% das regras", **cada carta, artefato, provisão, evento e inimigo precisa de efeito implementado
e testado** — não basta o parser por regex. Sugestão: um registro de efeitos por id de carta, com um
teste por carta, e um relatório de cobertura (quantas cartas implementadas / total).

## Decisões já tomadas

- Navegador, uma pessoa, 1–4 investigadores. Multiplayer online fica para depois.
- Interface no estilo do gênero (mapa de nós + combate com mão de cartas), arte do próprio jogo.
- Idioma: português do Brasil (os textos já estão em `dados.js`).

## Sugestões técnicas (a confirmar na sessão)

- Cartas são texto + arte: renderizar em **DOM/HTML+CSS** (reaproveitando `comum.js`/`estilo.css`)
  tende a ficar mais fiel ao material impresso do que canvas.
- Motor de regras em módulo puro (sem DOM), com semente, log de ações e salvar/carregar (o manual já
  define o que se anota ao salvar entre nós — Cap. 15).
- Fatia vertical sugerida para a primeira versão: Ato I completo com 1 investigador (O Explorador),
  depois os outros três, depois 2–4 investigadores simultâneos, depois Atos II–IV.

## Como começar na sessão do template

Abra o Claude Code dentro desta pasta (`nas montanhas da loucura online`) e rode, por exemplo:

```
/prototype a versão digital de "Além das Montanhas da Loucura" descrita em design/briefing-montanhas.md
```

ou `/start` para o fluxo guiado.
