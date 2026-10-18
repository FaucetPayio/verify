/*
 * Blackjack - the order of the cards.
 *
 *   bytes = HMAC-SHA256(server_seed, client_seed:nonce:0) + ... + ...:6     (224 bytes)
 *   card k (k = 1..52) uses 4 bytes:
 *     f    = b1/256 + b2/256^2 + b3/256^3 + b4/256^4   (each part cut to 12 decimals)
 *     card = f x 52, decimals cut off   -> 0 .. 51
 *   card -> rank = card / 4 (2, 3, ... 10, J, Q, K, A), suit = card % 4 (spades, hearts, diamonds, clubs)
 *
 * Every card is drawn on its own from a full deck (like a casino shoe that never runs out).
 * Cards 1-2 are yours, cards 3-4 the dealer's, then every hit, double or split
 * takes the next card in this order.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  var RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  var SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];

  function card(index) {
    return { index: index, rank: RANKS[Math.floor(index / 4)], suit: SUITS[index % 4] };
  }

  async function verify(input) {
    var bytes = new Uint8Array(224);
    for (var n = 0; n < 7; n++) bytes.set(await C.hmacSha256(input.serverSeed, input.clientSeed + ':' + input.nonce + ':' + n), n * 32);
    var cards = [];
    var steps = [
      { t: 'Messages', v: input.clientSeed + ':' + input.nonce + ':0  (up to :6)', d: 'Seven HMAC-SHA256 hashes keyed with your server seed, joined into one list of bytes.' },
    ];
    for (var k = 0; k < 52; k++) {
      var o = k * 4;
      var fraction = C.fraction12(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
      var idx = C.fractionTimes(fraction, 52);
      cards.push(card(idx));
      if (k < 8) steps.push({ t: 'Card ' + (k + 1), v: C.fractionString(fraction) + ' x 52 = ' + idx, d: cards[k].rank + ' of ' + cards[k].suit });
    }
    steps.push({ t: 'Cards 9 - 52', v: 'Same way, 4 bytes each.' });
    return { cards: cards, player: cards.slice(0, 2), dealer: cards.slice(2, 4), next: cards.slice(4), steps: steps };
  }

  FPV.fair.blackjack = { verify: verify, card: card };
})((typeof window !== "undefined" ? window : globalThis).FPV);
