/*
 * Roulette - how the pocket is picked (European wheel, 0 - 36).
 *
 *   hash   = HMAC-SHA256( key = server_seed, message = client_seed + ":" + nonce )
 *   f      = byte1/256 + byte2/256^2 + byte3/256^3 + byte4/256^4   (each part cut to 12 decimals)
 *   pocket = f x 37, decimals cut off                               -> 0 .. 36
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  var RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  function colorOf(n) {
    if (n === 0) return 'green';
    return RED.indexOf(n) !== -1 ? 'red' : 'black';
  }

  async function verify(input) {
    var message = input.clientSeed + ':' + input.nonce;
    var bytes = await C.hmacSha256(input.serverSeed, message);
    var fraction = C.fraction12(bytes[0], bytes[1], bytes[2], bytes[3]);
    var pocket = C.fractionTimes(fraction, 37);
    return {
      pocket: pocket,
      color: colorOf(pocket),
      steps: [
        { t: 'Message', v: message, d: 'Client seed and nonce joined with ":". The key is your server seed.' },
        { t: 'HMAC-SHA256', v: C.bytesToHex(bytes) },
        { t: 'First 4 bytes', v: [bytes[0], bytes[1], bytes[2], bytes[3]].join(', ') },
        { t: 'As a fraction (0 to 1)', v: C.fractionString(fraction) },
        { t: 'Pocket = fraction x 37', v: String(pocket), d: 'Every one of the 37 pockets is equally likely.' },
      ],
    };
  }

  FPV.fair.roulette = { verify: verify, colorOf: colorOf };
})((typeof window !== "undefined" ? window : globalThis).FPV);
