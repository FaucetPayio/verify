/*
 * Crash - one result per round, the same for every player.
 *
 * Seeding event (January 16, 2023, announced publicly on Bitcointalk):
 *   - a secret was hashed with SHA-256 ten million times in a row; the round
 *     seeds are those hashes, played in REVERSE order (the last one first);
 *   - the final hash of the chain was published up front:
 *       6f2860fd02aaa414a5e9bd518801bed060fb8baa20243c0fc37b96ecde9d449c
 *   - every round is salted with a client seed nobody controlled: the hash of
 *     Bitcoin block 772,214, which had not been mined yet when it was announced.
 *
 * Because the seeds are played backwards, SHA-256 of a round's seed is the seed
 * of the round BEFORE it. Hash any revealed seed again and again and you walk
 * back through every earlier round until you reach the published hash. So the
 * whole sequence was fixed in January 2023 and cannot have been changed since.
 *
 * Crash point of a round:
 *   hash  = SHA-512( client_seed + "-" + round_seed )
 *   f     = byte1/256 + byte2/256^2 + byte3/256^3 + byte4/256^4
 *   roll  = f x 1,000,000, decimals cut off
 *   crash = 1,000,000 / (roll + 1) x 0.96, cut to 2 decimals (at least 1.00)
 */
(function (FPV) {
  'use strict';
  var C = FPV.core;

  var CLIENT_SEED = '00000000000000000003c83e80909b2dd4fe795828ad014fb5053b5e598d3812';
  var BITCOIN_BLOCK = 772214;
  var TERMINATING_HASH = '6f2860fd02aaa414a5e9bd518801bed060fb8baa20243c0fc37b96ecde9d449c';
  var ANNOUNCEMENT = 'https://bitcointalk.org/index.php?topic=5255740.msg61602291#msg61602291';
  var CHAIN_LENGTH = 10000000;

  async function crashPoint(seed) {
    var hash = await C.sha512Hex(CLIENT_SEED + '-' + seed);
    var b = C.hexToBytes(hash.slice(0, 8));
    var roll = Math.floor((b[0] / 256 + b[1] / 65536 + b[2] / 16777216 + b[3] / 4294967296) * 1000000);
    var point = C.cut2((1000000 / (roll + 1)) * 0.96);
    if (Number(point) < 1) point = '1.00';
    return { hash: hash, bytes: [b[0], b[1], b[2], b[3]], roll: roll, point: point };
  }

  async function verify(input) {
    var seed = input.seed;
    if (!/^[0-9a-f]{64}$/.test(seed)) throw new Error('A round seed is 64 characters of 0-9 and a-f.');
    var count = Math.max(1, Math.min(200, Number(input.rounds) || 10));
    var first = await crashPoint(seed);
    var rounds = [{ seed: seed, point: first.point, offset: 0 }];
    var s = seed;
    for (var i = 1; i < count; i++) {
      s = await C.sha256Hex(s);
      rounds.push({ seed: s, point: (await crashPoint(s)).point, offset: i });
    }
    return {
      point: first.point,
      rounds: rounds,
      steps: [
        { t: 'Client seed (Bitcoin block ' + BITCOIN_BLOCK.toLocaleString('en-US') + ')', v: CLIENT_SEED },
        { t: 'Message', v: CLIENT_SEED + '-' + seed, d: 'Client seed, "-", round seed.' },
        { t: 'SHA-512 of the message', v: first.hash },
        { t: 'First 4 bytes', v: first.bytes.join(', ') },
        { t: 'Roll = (b1/256 + b2/256^2 + b3/256^3 + b4/256^4) x 1,000,000', v: String(first.roll) },
        { t: 'Crash = 1,000,000 / (roll + 1) x 0.96', v: first.point + 'x', d: 'Cut (not rounded) to 2 decimals, never below 1.00.' },
        { t: 'Previous round seed = SHA-256(this seed)', v: rounds[1] ? rounds[1].seed : '-', d: 'That is how the table below walks back in time.' },
      ],
    };
  }

  /**
   * Hash `seed` again and again until the published final hash appears.
   * onProgress(done) is called between slices; resolves with the number of
   * hashes it took (= this round's position in the chain), or null if the
   * chain's length passed without finding it.
   */
  async function walkToCommitment(seed, onProgress, shouldStop) {
    // First make sure the fast hasher agrees with the browser's own SHA-256.
    var check = C.chainWalker(seed);
    var expect = seed;
    for (var i = 0; i < 3; i++) {
      check.step(1);
      expect = await C.sha256Hex(expect);
      if (check.current() !== expect) throw new Error('Self-check failed: the fast SHA-256 disagrees with the browser.');
    }
    var walker = C.chainWalker(seed);
    var target = C.hexToWords(TERMINATING_HASH);
    var slice = 250000;
    while (walker.count() < CHAIN_LENGTH) {
      if (shouldStop && shouldStop()) return { stopped: true, count: walker.count() };
      if (walker.step(slice, target)) return { found: true, count: walker.count() };
      if (onProgress) onProgress(walker.count());
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    return { found: false, count: walker.count() };
  }

  FPV.fair.crash = {
    verify: verify,
    crashPoint: crashPoint,
    walkToCommitment: walkToCommitment,
    CLIENT_SEED: CLIENT_SEED,
    BITCOIN_BLOCK: BITCOIN_BLOCK,
    TERMINATING_HASH: TERMINATING_HASH,
    ANNOUNCEMENT: ANNOUNCEMENT,
    CHAIN_LENGTH: CHAIN_LENGTH,
  };
})((typeof window !== "undefined" ? window : globalThis).FPV);
