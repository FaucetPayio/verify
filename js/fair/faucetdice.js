/*
 * Faucet Dice - the Dice game on FaucetPay-powered faucet sites.
 *
 *   hash  = SHA-256( server_seed + ":" + client_seed + ":" + nonce )
 *   lucky = floor( (first 12 hex characters as a number) / 16^12 x 100,000 )
 *   roll  = lucky % 10000          -> 0 .. 9999, shown as 0.00 .. 99.99
 *
 * Limbo and Towers on faucet sites use exactly the same formulas as Limbo and
 * Towers on faucetpay.io, so use those verifiers for them.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  async function verify(input) {
    var message = input.serverSeed + ':' + input.clientSeed + ':' + input.nonce;
    var hash = await C.sha256Hex(message);
    var head = hash.slice(0, 12);
    var lucky = Math.floor((parseInt(head, 16) / 281474976710656) * 100000);
    var roll = lucky % 10000;
    return {
      roll: roll,
      display: (roll / 100).toFixed(2),
      steps: [
        { t: 'Message', v: message, d: 'Server seed, client seed and nonce joined with ":".' },
        { t: 'SHA-256 of the message', v: hash },
        { t: 'First 12 characters "' + head + '"', v: parseInt(head, 16).toLocaleString('en-US') },
        { t: 'Lucky number = that / 16^12 x 100,000', v: String(lucky) },
        { t: 'Roll = ' + lucky + ' % 10000', v: String(roll), d: 'Shown as ' + (roll / 100).toFixed(2) + '.' },
      ],
    };
  }

  FPV.fair.faucetdice = { verify: verify };
})((typeof window !== "undefined" ? window : globalThis).FPV);
