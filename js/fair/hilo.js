/*
 * HiLo - the order of the cards.
 *
 *   The card at position c (c = 0 is the first card shown, then 1, 2, ...):
 *     hash  = HMAC-SHA256( key = server_seed, message = client_seed + ":" + nonce + ":" + c )
 *     read the hash as eight 4-byte numbers; take the first one below 4,294,967,248
 *     card  = that number / 82,595,524, decimals cut off   -> 0 .. 51
 *   (4,294,967,248 = 52 x 82,595,524, so all 52 cards are EXACTLY equally likely.)
 *   card -> rank = card / 4 + 1 (A = 1 low ... K = 13), suit = card % 4.
 *
 * Every guess (or skip) brings the next card. Each card is drawn on its own,
 * from a full deck. Your multiplier: 0.95 x 13^n / (k1 x k2 x ... x kn), cut
 * to 2 decimals, where k is how many of the 13 ranks won each guess.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  var ACCEPT_BELOW = 4294967248;
  var BUCKET = 82595524;
  var LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
  var CODES = { H: 'HI', L: 'LO', S: 'SAME', K: 'SKIP' };
  var MAX_CENTS = 100000000;

  async function drawCard(serverSeed, clientSeed, nonce, cursor) {
    var message = clientSeed + ':' + nonce + ':' + cursor;
    for (var round = 0; round < 8; round++) {
      var bytes = await C.hmacSha256(serverSeed, round === 0 ? message : message + ':' + round);
      for (var word = 0; word < 8; word++) {
        var v = C.u32(bytes, word * 4);
        if (v < ACCEPT_BELOW) return { card: Math.floor(v / BUCKET), value: v, word: word, round: round, message: message };
      }
    }
    throw new Error('No acceptable draw.');
  }

  function view(card) {
    var rank = Math.floor(card / 4) + 1;
    return { index: card, rank: rank, label: LABELS[rank - 1], suit: SUITS[card % 4] };
  }

  function winningRanks(rank, guess) {
    if (guess === 'HI') return rank === 13 ? 0 : rank === 1 ? 12 : 14 - rank;
    if (guess === 'LO') return rank === 1 ? 0 : rank === 13 ? 12 : rank;
    if (guess === 'SAME') return rank === 1 || rank === 13 ? 1 : 0;
    return 0;
  }

  function isWin(rank, guess, next) {
    if (guess === 'HI') return rank === 1 ? next > 1 : next >= rank;
    if (guess === 'LO') return rank === 13 ? next < 13 : next <= rank;
    if (guess === 'SAME') return next === rank;
    return false;
  }

  function multiplierCents(ks) {
    if (ks.length === 0) return 100;
    var den = BigInt(100);
    ks.forEach(function (k) { den *= BigInt(k); });
    var num = BigInt(9500) * BigInt(13) ** BigInt(ks.length);
    var cents = num / den;
    return cents >= BigInt(MAX_CENTS) ? MAX_CENTS : Number(cents);
  }

  function isOffered(rank, guess) {
    var k = winningRanks(rank, guess);
    return k > 0 && k < 13 && multiplierCents([k]) >= 101;
  }

  /** The round as played: cards in draw order plus the actions (one letter each). */
  function replay(cards, actions) {
    var ks = [];
    var moves = [];
    var status = 'IN_PROGRESS';
    for (var i = 0; i < actions.length; i++) {
      var action = CODES[actions[i]];
      var rank = view(cards[i]).rank;
      if (!action) return { error: 'Unknown action "' + actions[i] + '". Use H (higher), L (lower), S (same) or K (skip).' };
      if (action === 'SKIP') {
        moves.push({ action: action, result: 'SKIP', multiplier: C.centsToString(multiplierCents(ks)) });
        continue;
      }
      if (!isOffered(rank, action)) return { error: 'Action ' + (i + 1) + ' (' + action + ') cannot be played on ' + view(cards[i]).label + '.' };
      if (isWin(rank, action, view(cards[i + 1]).rank)) {
        ks.push(winningRanks(rank, action));
        moves.push({ action: action, result: 'WIN', multiplier: C.centsToString(multiplierCents(ks)) });
      } else {
        if (i !== actions.length - 1) return { error: 'Guess ' + (i + 1) + ' lost, so the round ended there; remove the actions after it.' };
        status = 'BUSTED';
        moves.push({ action: action, result: 'LOSS', multiplier: '0.00' });
      }
    }
    return { moves: moves, status: status, multiplier: status === 'BUSTED' ? '0.00' : C.centsToString(multiplierCents(ks)) };
  }

  async function verify(input) {
    var actions = String(input.actions || '').toUpperCase().replace(/[^A-Z]/g, '');
    var count = actions ? actions.length + 1 : Math.max(1, Math.min(60, Number(input.count) || 12));
    var cards = [];
    var steps = [];
    for (var c = 0; c < count; c++) {
      var d = await drawCard(input.serverSeed, input.clientSeed, input.nonce, c);
      cards.push(d.card);
      if (c < 6) {
        steps.push({
          t: 'Card ' + (c + 1) + ': ' + d.message + (d.round ? ':' + d.round : ''),
          v: 'number ' + (d.word + 1) + ' of the hash = ' + d.value.toLocaleString('en-US') + ' -> ' + d.card,
          d: view(d.card).label + ' of ' + view(d.card).suit + (d.word ? ' (earlier numbers were in the rejected top 48 values)' : ''),
        });
      }
    }
    if (count > 6) steps.push({ t: 'Cards 7 - ' + count, v: 'Same way, next position each.' });
    var result = { cards: cards.map(view), actions: actions, steps: steps };
    if (actions) result.round = replay(cards, actions);
    return result;
  }

  FPV.fair.hilo = { verify: verify, drawCard: drawCard, replay: replay, multiplierCents: multiplierCents, view: view };
})((typeof window !== "undefined" ? window : globalThis).FPV);
