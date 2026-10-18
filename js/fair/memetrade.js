/*
 * Meme Trade - the whole price chart of a round, the same for every player.
 *
 *   1. Before the round, the server picks a random server seed and publishes
 *      its SHA-256 fingerprint.
 *   2. Only AFTER that, it fetches the newest value of drand (a public
 *      randomness beacon run by independent organisations, a new value every
 *      3 seconds) - the "external hash". So the server could not pick a seed
 *      that suits the beacon.
 *   3. Every price tick comes from the seedrandom generator (an unmodified,
 *      widely used open-source library, js/vendor/seedrandom.js) started with
 *          server_seed + "|" + external_hash
 *      (older rounds: the server seed alone, or server_seed + "-" + round id).
 *
 * Each tick: a 0.5% chance of the rug; otherwise the price drifts by the
 * public rules below. The last price is the rug.
 */
(function (FPV) {
  'use strict';

  var CONFIG = {
    RUG_PROB: 0.005,
    RUG_IMPACT: 0.98,
    DRIFT_MIN: -0.022,
    DRIFT_MAX: 0.028,
    BIG_MOVE_CHANCE: 0.125,
    BIG_MOVE_MIN: 0.15,
    BIG_MOVE_MAX: 0.25,
    GOD_CANDLE_CHANCE: 0.00001,
    GOD_CANDLE_MOVE: 10.0,
  };

  // Byte-for-byte the game's price model. Do not "tidy": the order of the
  // random draws is what makes every tick reproducible.
  function driftPrice(price, randFn) {
    var STARTING_PRICE = 1.0;
    if (randFn() < CONFIG.GOD_CANDLE_CHANCE && price <= 100 * STARTING_PRICE) {
      return price * CONFIG.GOD_CANDLE_MOVE;
    }
    var change = 0;
    if (randFn() < CONFIG.BIG_MOVE_CHANCE) {
      var moveSize = CONFIG.BIG_MOVE_MIN + randFn() * (CONFIG.BIG_MOVE_MAX - CONFIG.BIG_MOVE_MIN);
      change = randFn() > 0.5 ? moveSize : -moveSize;
    } else {
      var drift = CONFIG.DRIFT_MIN + randFn() * (CONFIG.DRIFT_MAX - CONFIG.DRIFT_MIN);
      var volatility = 0.005 * Math.min(10, Math.sqrt(price));
      change = drift + volatility * (2 * randFn() - 1);
    }
    var newPrice = price * (1 + change);
    if (newPrice < 0) newPrice = 0;
    return newPrice;
  }

  function isUuidV7(id) {
    return id.length === 36 && id[14] === '7';
  }

  function schemeOf(roundId, externalHash) {
    if (externalHash) return 'v4';
    return isUuidV7(roundId) ? 'v7' : 'legacy';
  }

  function prngSeed(serverSeed, roundId, externalHash) {
    if (externalHash) return serverSeed + '|' + externalHash;
    return isUuidV7(roundId) ? serverSeed : serverSeed + '-' + roundId;
  }

  function generatePrices(serverSeed, roundId, externalHash) {
    // global: false = return a new generator (the game's `seedrandom(seed)` call),
    // instead of the library's old habit of replacing Math.random.
    var prng = Math.seedrandom(prngSeed(serverSeed, roundId, externalHash), { global: false });
    var prices = [1.0];
    var price = 1.0;
    var lowestPrice = 1.0;
    for (var i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
      if (prng() < CONFIG.RUG_PROB || price <= 0) {
        price = price <= 0 ? 0 : lowestPrice * (1 - CONFIG.RUG_IMPACT);
        prices.push(price);
        break;
      }
      price = driftPrice(price, prng);
      if (price < lowestPrice) lowestPrice = price;
      prices.push(price);
    }
    return prices;
  }

  async function verify(input) {
    if (typeof Math.seedrandom !== 'function') throw new Error('The seedrandom library did not load.');
    var prices = generatePrices(input.serverSeed, input.roundId, input.externalHash);
    var peak = 0;
    for (var i = 0; i < prices.length; i++) if (prices[i] > peak) peak = prices[i];
    var rugTick = prices.length - 1;
    var scheme = schemeOf(input.roundId, input.externalHash);
    var seedText = prngSeed(input.serverSeed, input.roundId, input.externalHash);
    var drand = /^drand-quicknet:(\d+):([0-9a-f]{64})$/.exec(input.externalHash || '');
    return {
      prices: prices,
      peak: peak,
      rugTick: rugTick,
      rugPrice: prices[rugTick],
      scheme: scheme,
      drandRound: drand ? Number(drand[1]) : null,
      steps: [
        { t: 'Seed scheme', v: scheme, d: scheme === 'v4' ? 'Server seed + "|" + external hash (drand beacon).' : scheme === 'v7' ? 'Server seed alone (round id is a UUIDv7).' : 'Server seed + "-" + round id (older rounds).' },
        { t: 'Text given to seedrandom', v: seedText },
        { t: 'Ticks until the rug', v: String(rugTick), d: 'Each tick first draws a number; below 0.005 (0.5%) means rug.' },
        { t: 'Highest price (peak)', v: peak.toFixed(6) + 'x' },
        { t: 'Rug price', v: prices[rugTick].toFixed(6) + 'x', d: 'The lowest price of the round x 0.02.' },
      ],
    };
  }

  FPV.fair.memetrade = { verify: verify, generatePrices: generatePrices, prngSeed: prngSeed, schemeOf: schemeOf, CONFIG: CONFIG };
})((typeof window !== "undefined" ? window : globalThis).FPV);
