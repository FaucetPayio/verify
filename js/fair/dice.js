/*
 * Dice - how the roll is made.
 *
 *   hash  = SHA-512( server_seed + ":" + client_seed + ":" + nonce )
 *   take the hash 5 characters at a time and read them as a number;
 *   use the first one that is below 1,000,000 (almost always the first)
 *   roll  = that number % 10000          -> 0 .. 9999, shown as 0.00 .. 99.99
 *
 * "Under" wins when roll < chance x 100; "Over" wins when roll > 9999 - chance x 100.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  async function verify(input) {
    var serverSeed = input.serverSeed;
    var clientSeed = input.clientSeed;
    var nonce = input.nonce;

    var message = serverSeed + ':' + clientSeed + ':' + nonce;
    var hash = await C.sha512Hex(message);

    var index = 0;
    var lucky = 1000000;
    var tries = [];
    while (lucky >= 1000000) {
      var chunk = hash.substr(index, 5);
      lucky = chunk === '' ? 0 : parseInt(chunk, 16);
      tries.push({ chunk: chunk, value: lucky });
      if (index + 5 > hash.length) break;
      index += 5;
    }

    var roll = lucky % 10000;
    var steps = [
      { t: 'Message', v: message, d: 'Server seed, client seed and nonce joined with ":".' },
      { t: 'SHA-512 of the message', v: hash },
    ];
    tries.forEach(function (x, i) {
      steps.push({
        t: 'Characters ' + (i * 5 + 1) + '-' + (i * 5 + 5) + ': "' + x.chunk + '"',
        v: x.value.toLocaleString('en-US'),
        d: x.value < 1000000 ? 'Below 1,000,000, so this number is used.' : 'Not below 1,000,000, so the next 5 characters are tried.',
      });
    });
    steps.push({ t: 'Roll = ' + lucky + ' % 10000', v: String(roll), d: 'Shown in the game as ' + (roll / 100).toFixed(2) + '.' });

    return { roll: roll, display: (roll / 100).toFixed(2), steps: steps };
  }

  /** Did this roll win? type 1 = Under, 2 = Over; chance in percent (e.g. 49.50). */
  function wins(roll, chance, type) {
    var per = Math.round(Number(chance) * 100);
    return type === 2 ? roll > 9999 - per : roll < per;
  }

  FPV.fair.dice = { verify: verify, wins: wins };
})((typeof window !== "undefined" ? window : globalThis).FPV);
