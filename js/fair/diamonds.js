/*
 * Diamonds - which 5 gems are drawn (7 gem colours, numbered 0 - 6).
 *
 *   hash = HMAC-SHA256( key = server_seed, message = client_seed + ":" + nonce )
 *   gem k (k = 1..5) uses bytes 4k-3 .. 4k:
 *     f   = b1/256 + b2/256^2 + b3/256^3 + b4/256^4   (each part cut to 12 decimals)
 *     gem = f x 7, decimals cut off                    -> 0 .. 6
 *
 * Payout by how many different colours there are:
 *   1 colour (5 same) 40x | 4 + 1 = 5x | 3 + 2 = 4x | 3 + 1 + 1 = 3x | 2 + 2 + 1 = 2x | one pair 0.10x | all different 0x
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  function outcomeOf(gems) {
    var counts = {};
    gems.forEach(function (g) { counts[g] = (counts[g] || 0) + 1; });
    var sizes = Object.keys(counts).map(function (k) { return counts[k]; }).sort(function (a, b) { return b - a; });
    var key = sizes.join('+');
    var table = {
      '5': ['Five of a kind', 40],
      '4+1': ['Four of a kind', 5],
      '3+2': ['Full house (3 + 2)', 4],
      '3+1+1': ['Three of a kind', 3],
      '2+2+1': ['Two pairs', 2],
      '2+1+1+1': ['One pair', 0.1],
      '1+1+1+1+1': ['Nothing', 0],
    };
    return { name: table[key][0], multiplier: table[key][1], pattern: key };
  }

  async function verify(input) {
    var message = input.clientSeed + ':' + input.nonce;
    var bytes = await C.hmacSha256(input.serverSeed, message);
    var gems = [];
    var steps = [
      { t: 'Message', v: message, d: 'Client seed and nonce joined with ":". The key is your server seed.' },
      { t: 'HMAC-SHA256', v: C.bytesToHex(bytes) },
    ];
    for (var k = 0; k < 5; k++) {
      var o = k * 4;
      var fraction = C.fraction12(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
      var gem = C.fractionTimes(fraction, 7);
      gems.push(gem);
      steps.push({ t: 'Gem ' + (k + 1) + ' (bytes ' + (o + 1) + '-' + (o + 4) + ')', v: C.fractionString(fraction) + ' x 7 = ' + gem });
    }
    var outcome = outcomeOf(gems);
    steps.push({ t: 'Pattern', v: outcome.pattern, d: outcome.name + ' pays ' + outcome.multiplier + 'x.' });
    return { gems: gems, outcome: outcome, steps: steps };
  }

  FPV.fair.diamonds = { verify: verify, outcomeOf: outcomeOf };
})((typeof window !== "undefined" ? window : globalThis).FPV);
