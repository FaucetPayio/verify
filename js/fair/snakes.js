/*
 * Snakes - the dice of every roll (up to 5 rolls per round).
 *
 *   roll r (r = 0 .. 4):
 *     hash  = HMAC-SHA256( key = server_seed, message = client_seed + ":" + nonce + ":" + r )
 *     die 1 = floor(u1 / 2^32 x 6) + 1     u1 = bytes 1-4 of the hash as one number
 *     die 2 = floor(u2 / 2^32 x 6) + 1     u2 = bytes 5-8
 *   The token lands on the square numbered die 1 + die 2 (2 .. 12).
 *   Each square pays a multiplier or is a snake (round lost). Your multiplier is
 *   the product of every square you landed on.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  // The boards the game publishes, in hundredths, for sums 2..7 (sums 8..12
  // mirror 6..2). 0 = snake. The first roll has its own board; every later
  // roll uses the second one.
  var FIRST_ROLL = {
    EASY: { 2: 191, 3: 123, 4: 114, 5: 104, 6: 103, 7: 0 },
    MEDIUM: { 2: 381, 3: 237, 4: 133, 5: 114, 6: 0, 7: 0 },
    HARD: { 2: 712, 3: 286, 4: 142, 5: 0, 6: 0, 7: 0 },
    EXPERT: { 2: 950, 3: 380, 4: 0, 5: 0, 6: 0, 7: 0 },
    MASTER: { 2: 1710, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
  };
  var LATER_ROLLS = {
    EASY: { 2: 200, 3: 130, 4: 120, 5: 110, 6: 108, 7: 0 },
    MEDIUM: { 2: 400, 3: 250, 4: 140, 5: 120, 6: 0, 7: 0 },
    HARD: { 2: 750, 3: 300, 4: 150, 5: 0, 6: 0, 7: 0 },
    EXPERT: { 2: 1000, 3: 400, 4: 0, 5: 0, 6: 0, 7: 0 },
    MASTER: { 2: 1800, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
  };

  function mirror(half) {
    var board = {};
    for (var s = 2; s <= 12; s++) board[s] = half[s <= 7 ? s : 14 - s];
    return board;
  }

  function firstBoard(difficulty) { return mirror(FIRST_ROLL[difficulty]); }
  function laterBoard(difficulty) { return mirror(LATER_ROLLS[difficulty]); }

  /** "1.1664000000" -> "1.1664", "2.0000000000" -> "2.00". */
  function format(product, decimals) {
    var s = product.toString();
    while (s.length <= decimals) s = '0' + s;
    var int = s.slice(0, s.length - decimals);
    var frac = s.slice(-decimals).replace(/0+$/, '');
    while (frac.length < 2) frac += '0';
    return int + '.' + frac;
  }

  async function verify(input) {
    var difficulty = input.difficulty;
    if (!FIRST_ROLL[difficulty]) throw new Error('Pick a difficulty.');
    var rolls = [];
    var product = BigInt(1);
    var decimals = 0;
    var steps = [];
    for (var r = 0; r < 5; r++) {
      var message = input.clientSeed + ':' + input.nonce + ':' + r;
      var bytes = await C.hmacSha256(input.serverSeed, message);
      var d1 = C.pick(C.u32(bytes, 0), 6) + 1;
      var d2 = C.pick(C.u32(bytes, 4), 6) + 1;
      var sum = d1 + d2;
      var cents = (r === 0 ? firstBoard(difficulty) : laterBoard(difficulty))[sum];
      product *= BigInt(cents);
      decimals += 2;
      var running = cents === 0 ? '0.00' : format(product, decimals);
      rolls.push({ d1: d1, d2: d2, sum: sum, square: C.centsToString(cents), snake: cents === 0, multiplier: running });
      steps.push({
        t: 'Roll ' + (r + 1) + ': ' + message,
        v: 'dice ' + d1 + ' + ' + d2 + ' = square ' + sum,
        d: cents === 0 ? 'Snake - the round ends here.' : 'Square pays ' + C.centsToString(cents) + 'x, running multiplier ' + running + 'x.',
      });
      if (cents === 0) break;
    }
    return { rolls: rolls, first: firstBoard(difficulty), later: laterBoard(difficulty), steps: steps };
  }

  FPV.fair.snakes = { verify: verify, firstBoard: firstBoard, laterBoard: laterBoard };
})((typeof window !== "undefined" ? window : globalThis).FPV);
