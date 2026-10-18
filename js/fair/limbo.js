/*
 * Limbo - how the result multiplier is made.
 *
 *   hash  = HMAC-SHA256( key = server_seed, message = client_seed + ":" + nonce )
 *   f     = byte1/256 + byte2/256^2 + byte3/256^3 + byte4/256^4   (each part cut to 12 decimals)
 *   roll  = f x 1,000,000, decimals cut off                         -> 0 .. 999,999
 *   result multiplier = 1,000,000 / (roll + 1) x 0.97, cut to 2 decimals
 *
 * You win when the result multiplier is at least your target.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  async function verify(input) {
    var message = input.clientSeed + ':' + input.nonce;
    var bytes = await C.hmacSha256(input.serverSeed, message);
    var fraction = C.fraction12(bytes[0], bytes[1], bytes[2], bytes[3]);
    var roll = C.fractionTimes(fraction, 1000000);
    var multiplier = C.cut2((1000000 / (roll + 1)) * 0.97);

    return {
      roll: roll,
      multiplier: multiplier,
      steps: [
        { t: 'Message', v: message, d: 'Client seed and nonce joined with ":". The key is your server seed.' },
        { t: 'HMAC-SHA256', v: C.bytesToHex(bytes) },
        { t: 'First 4 bytes', v: [bytes[0], bytes[1], bytes[2], bytes[3]].join(', ') },
        { t: 'As a fraction (0 to 1)', v: C.fractionString(fraction), d: 'byte1/256 + byte2/256^2 + byte3/256^3 + byte4/256^4' },
        { t: 'Roll = fraction x 1,000,000', v: String(roll) },
        { t: 'Result = 1,000,000 / (roll + 1) x 0.97', v: multiplier + 'x', d: 'Cut (not rounded) to 2 decimals.' },
      ],
    };
  }

  FPV.fair.limbo = { verify: verify };
})((typeof window !== "undefined" ? window : globalThis).FPV);
