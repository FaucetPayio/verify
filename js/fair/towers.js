/*
 * Towers - where the traps are, row by row (9 rows, row 1 = the bottom row you climb first).
 *
 *   for row r = 0 .. 8:
 *     hash = HMAC-SHA256( key = server_seed, message = client_seed + ":" + nonce + ":" + r )
 *     f    = b1/256 + b2/256^2 + b3/256^3 + b4/256^4   (first 4 bytes, each part cut to 12 decimals)
 *     tile = f x tiles, decimals cut off   (tiles: Easy 4, Medium 3, Hard 2, Wicked 3, Brutal 4)
 *
 * Easy / Medium / Hard: that tile is the trap, the others are safe.
 * Wicked / Brutal: that tile is the only safe one, the others are traps.
 * The whole tower is decided when you place the bet, before your first click.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  var TILES = { EASY: 4, MEDIUM: 3, HARD: 2, WICKED: 3, BRUTAL: 4 };

  async function verify(input) {
    var difficulty = input.difficulty;
    var tiles = TILES[difficulty];
    if (!tiles) throw new Error('Pick a difficulty.');
    var oneSafe = difficulty === 'WICKED' || difficulty === 'BRUTAL';

    var rows = [];
    var steps = [];
    for (var r = 0; r < 9; r++) {
      var message = input.clientSeed + ':' + input.nonce + ':' + r;
      var bytes = await C.hmacSha256(input.serverSeed, message);
      var fraction = C.fraction12(bytes[0], bytes[1], bytes[2], bytes[3]);
      var picked = C.fractionTimes(fraction, tiles);
      var safe = [];
      for (var t = 0; t < tiles; t++) safe.push(oneSafe ? t === picked : t !== picked);
      rows.push({ picked: picked, safe: safe });
      steps.push({
        t: 'Row ' + (r + 1) + ': ' + message,
        v: C.fractionString(fraction) + ' x ' + tiles + ' = ' + picked,
        d: (oneSafe ? 'Safe tile' : 'Trap') + ' at position ' + (picked + 1) + ' from the left.',
      });
    }
    return { tiles: tiles, rows: rows, oneSafe: oneSafe, steps: steps };
  }

  FPV.fair.towers = { verify: verify, TILES: TILES };
})((typeof window !== "undefined" ? window : globalThis).FPV);
