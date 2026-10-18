/*
 * Plinko - which way the ball bounces at every row of pins.
 *
 *   bytes = HMAC-SHA256(server_seed, client_seed:nonce:0)
 *         + HMAC-SHA256(server_seed, client_seed:nonce:1)
 *         + HMAC-SHA256(server_seed, client_seed:nonce:2)
 *   for every row, 4 bytes -> f = b1/256 + b2/256^2 + b3/256^3 + b4/256^4 (cut to 12 decimals)
 *   direction = f x 2, decimals cut off: 0 = left, 1 = right
 *   slot = how many times the ball went right; the payout is the multiplier under that slot.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  // The payout table of the game server, unchanged: rows -> risk -> slot multipliers.
  var PAYOUTS = {
    8: { low: [4, 1.82, 1.1, 1, 0.5, 1, 1.1, 1.82, 4], medium: [14, 2.4, 1.3, 0.7, 0.4, 0.7, 1.3, 2.4, 14], high: [28, 3.63, 1.5, 0.3, 0.2, 0.3, 1.5, 3.63, 28] },
    9: { low: [6, 1.9, 1.4, 1, 0.7, 0.7, 1, 1.4, 1.9, 6], medium: [17, 3.2, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 3.2, 17], high: [42.2, 6.2, 2, 0.6, 0.2, 0.2, 0.6, 2, 6.2, 42.2] },
    10: { low: [7, 2.1, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 2.1, 7], medium: [20, 3.7, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 3.7, 20], high: [70, 9, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 9, 70] },
    11: { low: [7, 1.8, 1.6, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.6, 1.8, 7], medium: [24, 4.6, 2.7, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 2.7, 4.6, 24], high: [120, 11, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 11, 120] },
    12: { low: [5, 1.8, 1.3, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.3, 1.8, 5], medium: [33, 8, 3.6, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 3.6, 8, 33], high: [163, 21, 8.1, 1.9, 0.7, 0.2, 0.2, 0.2, 0.7, 1.9, 8.1, 21, 163] },
    13: { low: [8, 3.2, 1.9, 1.8, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.8, 1.9, 3.2, 8], medium: [40, 12, 5, 2.9, 1.3, 0.7, 0.4, 0.4, 0.7, 1.3, 2.9, 5, 12, 40], high: [252, 36, 10, 3.9, 1, 0.2, 0.2, 0.2, 0.2, 1, 3.9, 10, 36, 252] },
    14: { low: [7, 2.5, 2, 1.3, 1.1, 1.1, 1, 0.5, 1, 1.1, 1.1, 1.3, 2, 2.5, 7], medium: [58, 15, 5.8, 3.9, 1.8, 1, 0.5, 0.2, 0.5, 1, 1.8, 3.9, 5.8, 15, 58], high: [420, 50, 17, 4.8, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 4.8, 17, 50, 420] },
    15: { low: [13, 6.5, 2, 1.5, 1.4, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.4, 1.5, 2, 6.5, 13], medium: [88, 19, 10, 4.4, 2.9, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 2.9, 4.4, 10, 19, 88], high: [620, 79, 27, 7, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 7, 27, 79, 620] },
    16: { low: [14, 5, 1.4, 1.3, 1.2, 1.1, 1.1, 1, 0.5, 1, 1.1, 1.1, 1.2, 1.3, 1.4, 5, 14], medium: [110, 41, 8, 4, 2.9, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 2.9, 4, 8, 41, 110], high: [1000, 100, 22, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 22, 100, 1000] },
  };

  async function verify(input) {
    var rows = Number(input.rows);
    var risk = input.risk;
    if (!PAYOUTS[rows] || !PAYOUTS[rows][risk]) throw new Error('Pick 8 to 16 rows and a risk level.');

    var parts = [];
    for (var n = 0; n < 3; n++) parts.push(await C.hmacSha256(input.serverSeed, input.clientSeed + ':' + input.nonce + ':' + n));
    var bytes = new Uint8Array(96);
    parts.forEach(function (p, i) { bytes.set(p, i * 32); });

    var path = [];
    var steps = [
      { t: 'Messages', v: input.clientSeed + ':' + input.nonce + ':0  (and :1, :2)', d: 'Three HMAC-SHA256 hashes keyed with your server seed, joined into one list of bytes.' },
      { t: 'Bytes', v: C.bytesToHex(bytes.subarray(0, rows * 4)) },
    ];
    for (var r = 0; r < rows; r++) {
      var o = r * 4;
      var fraction = C.fraction12(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
      var dir = C.fractionTimes(fraction, 2);
      path.push(dir);
      steps.push({ t: 'Row ' + (r + 1), v: C.fractionString(fraction) + ' x 2 = ' + dir, d: dir ? 'Right' : 'Left' });
    }
    var slot = path.reduce(function (a, b) { return a + b; }, 0);
    var multiplier = PAYOUTS[rows][risk][slot];
    steps.push({ t: 'Slot = number of "Right" bounces', v: String(slot), d: 'Slots are counted from the left, starting at 0.' });
    steps.push({ t: 'Payout for slot ' + slot + ' (' + rows + ' rows, ' + risk + ' risk)', v: multiplier + 'x' });

    return { path: path, slot: slot, multiplier: multiplier, payouts: PAYOUTS[rows][risk], steps: steps };
  }

  FPV.fair.plinko = { verify: verify, PAYOUTS: PAYOUTS };
})((typeof window !== "undefined" ? window : globalThis).FPV);
