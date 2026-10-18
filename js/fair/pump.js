/*
 * Pump - at which pump the balloon pops (25 positions).
 *
 *   bytes = HMAC-SHA256(server_seed, client_seed:nonce:0) + ...:1 + ...:2   (96 bytes)
 *   24 numbers, 4 bytes each: f = b1/256 + b2/256^2 + b3/256^3 + b4/256^4
 *   Shuffle positions 1..25: index = floor(f x positions left); take that one out.
 *   The first N positions taken are pop positions (Easy 1, Medium 3, Hard 5, Expert 10).
 *   The balloon pops on the pump number equal to the lowest pop position.
 *
 * Decided when you place the bet, before your first pump.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  var POPS = { EASY: 1, MEDIUM: 3, HARD: 5, EXPERT: 10 };
  var POSITIONS = 25;

  async function verify(input) {
    var pops = POPS[input.difficulty];
    if (!pops) throw new Error('Pick a difficulty.');
    var bytes = await C.hmacStream(input.serverSeed, input.clientSeed, input.nonce, 96);

    var available = [];
    for (var p = 1; p <= POSITIONS; p++) available.push(p);
    var order = [];
    var steps = [
      { t: 'Messages', v: input.clientSeed + ':' + input.nonce + ':0  (and :1, :2)', d: 'HMAC-SHA256 keyed with your server seed; the bytes are joined.' },
      { t: 'Bytes', v: C.bytesToHex(bytes) },
    ];
    for (var i = 0; i < 24; i++) {
      var u = C.u32(bytes, i * 4);
      var index = Math.min(C.pick(u, available.length), available.length - 1);
      var position = available[index];
      available.splice(index, 1);
      order.push(position);
      if (i < pops) steps.push({ t: 'Pop position ' + (i + 1), v: (u / 4294967296).toFixed(10) + ' x ' + (POSITIONS - i) + ' -> index ' + index, d: 'Takes position ' + position + '.' });
    }
    order.push(available[0]);
    var popPositions = order.slice(0, pops).sort(function (a, b) { return a - b; });
    var popAt = popPositions[0];
    steps.push({ t: 'Pop positions (sorted)', v: popPositions.join(', ') });
    steps.push({ t: 'The balloon pops on pump number', v: String(popAt), d: 'You could pump ' + (popAt - 1) + ' time(s) safely.' });
    return { popPositions: popPositions, popAt: popAt, positions: POSITIONS, steps: steps };
  }

  FPV.fair.pump = { verify: verify, POPS: POPS };
})((typeof window !== "undefined" ? window : globalThis).FPV);
