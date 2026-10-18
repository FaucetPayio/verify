/*
 * Lottery - the daily draw (5 numbers from 1 - 36, plus a jackpot ball 1 - 10).
 *
 *   - About a day before the draw, the server seed is created and its SHA-256
 *     fingerprint is shown on the lottery page.
 *   - Ticket sales stop 5 minutes before the draw. The client seed is the hash
 *     of the Ethereum block mined 10 blocks after that moment - a value nobody
 *     on earth can know or choose in advance.
 *
 *   hash = HMAC-SHA256( key = server_seed, message = client_seed )   (the block hash, with its "0x")
 *   ball k (k = 1..5): u = hex characters 8k-7 .. 8k as a number;
 *                      index = floor(u / 2^32 x balls left); take that ball out of 1..36.
 *   jackpot ball = floor(u6 / 2^32 x 10) + 1, u6 = hex characters 41 .. 48.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  async function verify(input) {
    var bytes = await C.hmacSha256(input.serverSeed, input.clientSeed);
    var hash = C.bytesToHex(bytes);
    var left = [];
    for (var b = 1; b <= 36; b++) left.push(b);
    var balls = [];
    var steps = [
      { t: 'Message (client seed = Ethereum block hash)', v: input.clientSeed, d: 'HMAC-SHA256 keyed with the draw\'s server seed.' },
      { t: 'HMAC-SHA256', v: hash },
    ];
    for (var i = 0; i < 5; i++) {
      var u = C.u32(bytes, i * 4);
      var index = C.pick(u, left.length);
      var ball = left[index];
      left.splice(index, 1);
      balls.push(ball);
      steps.push({ t: 'Ball ' + (i + 1) + ': "' + hash.substr(i * 8, 8) + '"', v: u + ' / 2^32 x ' + (36 - i) + ' -> index ' + index, d: 'Number ' + ball + '.' });
    }
    var u6 = C.u32(bytes, 20);
    var jackpot = C.pick(u6, 10) + 1;
    steps.push({ t: 'Jackpot ball: "' + hash.substr(40, 8) + '"', v: u6 + ' / 2^32 x 10 + 1 = ' + jackpot });
    return { balls: balls, jackpot: jackpot, steps: steps };
  }

  FPV.fair.lottery = { verify: verify };
})((typeof window !== "undefined" ? window : globalThis).FPV);
