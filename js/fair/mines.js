/*
 * Mines - where the mines are on the 5 x 5 board (tiles numbered 1 - 25, left to right, top to bottom).
 *
 *   bytes = HMAC-SHA256(server_seed, client_seed:nonce:0) + ...:1 + ...:2     (96 bytes)
 *   Shuffle the 25 tiles: for x = 25 down to 2, take 4 bytes ->
 *     f = b1/256 + b2/256^2 + b3/256^3 + b4/256^4 (cut to 12 decimals)
 *     index = f x x, decimals cut off; take the tile at that index out of the tiles left.
 *   The first N tiles taken are the N mines.
 *
 * The board is decided when you place the bet, before your first click.
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  async function verify(input) {
    var mines = Number(input.mines);
    if (!(mines >= 1 && mines <= 24)) throw new Error('Mines must be between 1 and 24.');

    var bytes = new Uint8Array(96);
    for (var n = 0; n < 3; n++) bytes.set(await C.hmacSha256(input.serverSeed, input.clientSeed + ':' + input.nonce + ':' + n), n * 32);

    var deck = [];
    for (var i = 0; i < 25; i++) deck.push(i);
    var order = [];
    var steps = [
      { t: 'Messages', v: input.clientSeed + ':' + input.nonce + ':0  (and :1, :2)', d: 'Three HMAC-SHA256 hashes keyed with your server seed, joined into one list of bytes.' },
      { t: 'Bytes', v: C.bytesToHex(bytes) },
    ];
    var position = 0;
    for (var x = 25; x > 1; x--) {
      var fraction = C.fraction12(bytes[position], bytes[position + 1], bytes[position + 2], bytes[position + 3]);
      var index = C.fractionTimes(fraction, x);
      position += 4;
      var tile = deck[index];
      deck.splice(index, 1);
      order.push(tile);
      if (order.length <= mines) {
        steps.push({ t: 'Mine ' + order.length, v: C.fractionString(fraction) + ' x ' + x + ' = ' + index, d: 'Takes tile ' + (tile + 1) + ' out of the ' + x + ' tiles left.' });
      }
    }
    var mineTiles = order.slice(0, mines);
    return { mines: mineTiles, sorted: mineTiles.slice().sort(function (a, b) { return a - b; }), steps: steps };
  }

  FPV.fair.mines = { verify: verify };
})((typeof window !== "undefined" ? window : globalThis).FPV);
