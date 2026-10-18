/*
 * Packs - which 5 cards are in your pack (242 cards, table version 1).
 *
 *   bytes  = HMAC-SHA256( key = server_seed, message = client_seed + ":" + nonce + ":0" )
 *   card k (k = 1..5): u = bytes 4k-3 .. 4k as one number (0 .. 4,294,967,295)
 *   The card is the first one in the table (No. 1 first) whose running total of
 *   weights is bigger than u. Weights add up to exactly 2^32, so every u lands on one card.
 *   The pack pays the SUM of its 5 card multipliers.
 *
 * The table is fixed and public (below). Every card's chance = its weight / 2^32.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  // [tier, multiplier in hundredths, how many cards, weight of EACH card out of 2^32], card No. 1 first.
  var TABLE_V1 = [
    ['LEGENDARY', 100000, 1, 12200], ['LEGENDARY', 50000, 1, 30500],
    ['EPIC', 25000, 1, 48800], ['EPIC', 15000, 1, 73200], ['EPIC', 10000, 2, 97600], ['EPIC', 7500, 2, 122000], ['EPIC', 5000, 2, 159000],
    ['SUPER_RARE', 3500, 2, 195000], ['SUPER_RARE', 2500, 2, 256000], ['SUPER_RARE', 2000, 3, 329000], ['SUPER_RARE', 1500, 3, 415000],
    ['SUPER_RARE', 1200, 3, 512000], ['SUPER_RARE', 1000, 3, 634000], ['SUPER_RARE', 800, 4, 793000],
    ['RARE', 500, 4, 1220000], ['RARE', 300, 6, 1950000], ['RARE', 200, 8, 2800000], ['RARE', 150, 10, 3660000],
    ['RARE', 120, 10, 4510000], ['RARE', 100, 12, 5370000],
    ['UNCOMMON', 75, 4, 5850000], ['UNCOMMON', 50, 6, 6830000], ['UNCOMMON', 40, 8, 7800000], ['UNCOMMON', 30, 10, 8900000],
    ['UNCOMMON', 25, 12, 10000000], ['UNCOMMON', 20, 14, 11200000], ['UNCOMMON', 15, 18, 12600000],
    ['COMMON', 9, 4, 19600000], ['COMMON', 8, 6, 23100000], ['COMMON', 7, 8, 26600000], ['COMMON', 6, 10, 30100000],
    ['COMMON', 5, 10, 33600000], ['COMMON', 4, 12, 37800000], ['COMMON', 3, 12, 42000000], ['COMMON', 2, 13, 46200000],
    ['COMMON', 2, 1, 43677228], ['COMMON', 1, 13, 50400000], ['COMMON', 1, 1, 55924168],
  ];
  // sha256 of the table as the game server writes it; the server refuses to deal from any other table.
  var FINGERPRINT_V1 = '1c22bae0daa146a897fddcc8f23e001cc7f49985dfeca2c9995b329974b05c9d';

  // Each card owns the numbers from the previous card's `top` up to its own `top`.
  function expand(runs) {
    var cards = [];
    var top = 0;
    runs.forEach(function (run) {
      for (var i = 0; i < run[2]; i++) {
        top += run[3];
        cards.push({ id: cards.length + 1, tier: run[0], cents: run[1], weight: run[3], top: top });
      }
    });
    return cards;
  }

  var CARDS = expand(TABLE_V1);

  function canonical(cards) {
    var parts = ['packs', 'v1', 'total4294967296', 'cards5'];
    cards.forEach(function (c) { parts.push(c.id + ':' + c.tier + ':' + c.cents + ':' + c.weight); });
    return parts.join('|');
  }

  function cardFor(u) {
    var low = 0;
    var high = CARDS.length - 1;
    while (low < high) {
      var mid = (low + high) >> 1;
      if (u < CARDS[mid].top) high = mid;
      else low = mid + 1;
    }
    return CARDS[low];
  }

  async function verify(input) {
    var bytes = await C.hmacStream(input.serverSeed, input.clientSeed, input.nonce, 20);
    var cards = [];
    var total = 0;
    var steps = [
      { t: 'Message', v: input.clientSeed + ':' + input.nonce + ':0', d: 'HMAC-SHA256 keyed with your server seed. The first 20 bytes are used.' },
      { t: 'Bytes', v: C.bytesToHex(bytes) },
    ];
    for (var k = 0; k < 5; k++) {
      var u = C.u32(bytes, k * 4);
      var card = cardFor(u);
      total += card.cents;
      cards.push({ id: card.id, tier: card.tier, multiplier: C.centsToString(card.cents), chance: card.weight / 4294967296 });
      steps.push({ t: 'Card ' + (k + 1), v: 'u = ' + u.toLocaleString('en-US'), d: 'Lands on No. ' + card.id + ' (' + card.tier.replace('_', ' ').toLowerCase() + ', ' + C.centsToString(card.cents) + 'x).' });
    }
    var fingerprint = await C.sha256Hex(canonical(CARDS));
    steps.push({ t: 'Pack payout = sum of the 5 cards', v: C.centsToString(total) + 'x' });
    steps.push({
      t: 'Card table fingerprint',
      v: fingerprint,
      d: fingerprint === FINGERPRINT_V1 ? 'Same table the game server is locked to (version 1).' : 'Table differs from version 1!',
    });
    return { cards: cards, total: C.centsToString(total), tableOk: fingerprint === FINGERPRINT_V1, steps: steps };
  }

  FPV.fair.packs = { verify: verify, CARDS: CARDS, canonical: canonical, FINGERPRINT_V1: FINGERPRINT_V1 };
})((typeof window !== "undefined" ? window : globalThis).FPV);
