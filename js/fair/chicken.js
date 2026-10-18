/*
 * Chicken - which lanes of the road are deadly (20 lanes).
 *
 *   bytes = HMAC-SHA256(server_seed, client_seed:nonce:0) + ...:1 + ...:2   (first 80 bytes used)
 *   Shuffle lanes 1..20: for each of 20 steps take 4 bytes as one number u (0 .. 4,294,967,295),
 *     index = floor(u / 2^32 x lanes left); take that lane out of the lanes left.
 *   The first N lanes taken are deadly (Easy 1, Medium 3, Hard 5, Expert 10).
 *
 * The chicken dies on the first deadly lane it steps on. The road is decided
 * when you place the bet, before your first step.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  var DEATHS = { EASY: 1, MEDIUM: 3, HARD: 5, EXPERT: 10 };
  var LANES = 20;

  async function verify(input) {
    var deaths = DEATHS[input.difficulty];
    if (!deaths) throw new Error('Pick a difficulty.');
    var bytes = await C.hmacStream(input.serverSeed, input.clientSeed, input.nonce, LANES * 4);

    var available = [];
    for (var l = 1; l <= LANES; l++) available.push(l);
    var order = [];
    var steps = [
      { t: 'Messages', v: input.clientSeed + ':' + input.nonce + ':0  (and :1, :2)', d: 'HMAC-SHA256 keyed with your server seed; the bytes are joined.' },
      { t: 'Bytes used', v: C.bytesToHex(bytes) },
    ];
    for (var i = 0; i < LANES; i++) {
      var u = C.u32(bytes, i * 4);
      var index = C.pick(u, available.length);
      var lane = available[index];
      available.splice(index, 1);
      order.push(lane);
      if (i < deaths) steps.push({ t: 'Deadly lane ' + (i + 1), v: u + ' / 2^32 x ' + (LANES - i) + ' = ' + index, d: 'Takes lane ' + lane + '.' });
    }
    var deadly = order.slice(0, deaths).sort(function (a, b) { return a - b; });
    var first = deadly[0];
    steps.push({ t: 'Deadly lanes (sorted)', v: deadly.join(', ') });
    steps.push({ t: 'First deadly lane', v: String(first), d: 'The chicken can cross at most ' + (first - 1) + ' lane(s) safely.' });
    return { deadly: deadly, first: first, lanes: LANES, steps: steps };
  }

  FPV.fair.chicken = { verify: verify, DEATHS: DEATHS };
})((typeof window !== "undefined" ? window : globalThis).FPV);
