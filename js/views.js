/*
 * FaucetPay Verify - the game pages: which boxes to show, how to draw the result.
 * The maths of every game is in js/fair/<game>.js.
 */
(function (FPV) {
  'use strict';
  var h = FPV.ui.h;
  var svg = FPV.ui.svg;
  var icon = FPV.ui.icon;
  var field = FPV.field;
  var fair = FPV.fair;
  var reg = FPV.games.register;

  var SEEDS = [field('serverSeed'), field('serverSeedHash'), field('clientSeed'), field('nonce')];
  function seedsWith(extra) { return SEEDS.concat(extra); }
  function opts(list) { return list.map(function (x) { return [x, x.charAt(0) + x.slice(1).toLowerCase()]; }); }
  function src(name) { return 'js/fair/' + name + '.js'; }

  var SUIT_SYMBOL = { spades: '\u2660', hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663' };

  function playingCard(rank, suit, extraClass) {
    var red = suit === 'hearts' || suit === 'diamonds';
    return h('div', { class: 'pcard' + (red ? ' red' : '') + (extraClass ? ' ' + extraClass : ''), title: rank + ' of ' + suit },
      h('span', { class: 'pcard-rank', text: rank }),
      h('span', { class: 'pcard-suit', text: SUIT_SYMBOL[suit] }));
  }

  function tiles(list, cls) { return h('div', { class: cls }, list); }

  function stat(label, value) {
    return h('div', { class: 'stat' }, h('div', { class: 'stat-l', text: label }), h('div', { class: 'stat-v', text: value }));
  }

  function rollGauge(roll) {
    var pct = roll / 100;
    return h('div', { class: 'gauge' },
      h('div', { class: 'gauge-track' }, h('div', { class: 'gauge-marker', style: { left: pct + '%' } }, h('span', { text: pct.toFixed(2) }))),
      h('div', { class: 'gauge-scale' }, ['0', '25', '50', '75', '100'].map(function (t) { return h('span', { text: t }); })));
  }

  // ---- Dice ---------------------------------------------------------------------
  reg({
    id: 'dice', name: 'Dice', group: 'seeds', icon: 'dices', source: src('dice'),
    blurb: 'Roll over or under your number.',
    random: 'the roll, a number from 0.00 to 99.99.',
    fields: SEEDS,
    verify: fair.dice.verify,
    headline: function (r) { return { label: 'Roll', value: r.display }; },
    render: function (r) {
      return h('div', null, rollGauge(r.roll),
        h('p', { class: 'muted small', text: '"Roll under X" wins when the roll is below X. "Roll over X" wins when the roll is above X. Compare this roll with the number you bet on.' }));
    },
    recipe: [
      'Your server seed, your client seed and the nonce are joined: server_seed:client_seed:nonce.',
      'That text goes through SHA-512, a standard hash. Same input = same output, always.',
      'The first 5 characters of the hash are read as a number. If it is below 1,000,000 it is used (if not, the next 5, and so on).',
      'The last 4 digits of that number are the roll: 0 to 9999, shown as 0.00 to 99.99.',
    ],
  });

  // ---- Crash ----------------------------------------------------------------------
  reg({
    id: 'crash', name: 'Crash', group: 'round', icon: 'rocket', source: src('crash'),
    blurb: 'Cash out before the rocket crashes.',
    random: 'the crash point of each round - the same for every player.',
    formTitle: 'Paste a round seed',
    fields: [
      { key: 'seed', param: 'seed', label: 'Round seed', mono: true, required: true, wide: true, lower: true, placeholder: '64 characters, revealed when the round crashes', help: 'In Crash, open Fairness: every recent round is listed with its revealed seed.' },
      { key: 'rounds', param: 'rounds', label: 'Rounds to list', type: 'int', min: 1, max: 200, default: '10', help: 'This round plus the rounds before it.' },
    ],
    where: function () {
      return [
        ['In the Crash game, click ', h('b', { text: 'Fairness' }), '. The ', h('b', { text: 'Recent rounds' }), ' list shows each round\u2019s crash point and its seed (revealed the moment it crashes).'],
        ['Copy any seed into the box here. You get its crash point - and the crash points of every round before it, because each seed hashes to the previous one.'],
      ];
    },
    whereNote: 'There is no client seed or nonce per player: all players share each round. Instead the rounds were fixed years in advance, and salted with a Bitcoin block nobody could predict (see below).',
    noSeedCheck: true,
    // A real round played on 18 October 2026, so "Prove it goes back to 2023" works with the example too.
    example: function () { return { seed: '8a18206b48e28647fac861e83d37102f12bd15c13062591f36d5425b6ac3444a', rounds: '10' }; },
    verify: fair.crash.verify,
    headline: function (r) { return { label: 'Crash point', value: r.point + 'x', tone: Number(r.point) >= 2 ? 'good' : null }; },
    render: function (r) {
      var table = h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', { text: 'Round' }), h('th', { text: 'Seed' }), h('th', { class: 'r', text: 'Crash' }))),
        h('tbody', null, r.rounds.map(function (x) {
          return h('tr', null,
            h('td', { text: x.offset === 0 ? 'This round' : x.offset + ' before' }),
            h('td', null, h('code', { class: 'trunc', text: x.seed })),
            h('td', { class: 'r mono' + (Number(x.point) >= 2 ? ' good' : ''), text: x.point + 'x' }));
        })));
      return h('div', { class: 'table-wrap' }, table);
    },
    compareNote: 'Compare with the crash points in the game\u2019s round history: they must be identical.',
    extra: function (r, input) { return chainProof(input.seed); },
    recipe: [
      'In January 2023 FaucetPay hashed a secret 10 million times in a row (SHA-256) and published ONLY the last hash on Bitcointalk: 6f2860fd02aa\u2026449c. The rounds use these hashes backwards.',
      'So the next round\u2019s seed is always the one whose hash is the current one. Nobody - not even FaucetPay - can change a future round without breaking that chain.',
      'To stop FaucetPay from hand-picking a "good" secret, every round is mixed with the hash of Bitcoin block 772,214, which did not exist yet when the chain was announced.',
      'Crash point = SHA-512(bitcoin_block_hash - round_seed) -> first 4 bytes -> a number from 0 to 999,999 -> 1,000,000 / (number + 1) x 0.96.',
    ],
  });

  function chainProof(seed) {
    var status = h('div', { class: 'chain-status muted small', text: 'Hashes the seed again and again in your browser until it reaches the hash published in January 2023. Takes a few seconds.' });
    var bar = h('div', { class: 'progress' }, h('div', { class: 'progress-fill' }));
    bar.hidden = true;
    var stop = false;
    var btn = h('button', { type: 'button', class: 'btn btn-outline btn-sm' }, icon('blocks', 15), 'Prove it goes back to 2023');
    btn.addEventListener('click', async function () {
      btn.disabled = true;
      bar.hidden = false;
      stop = false;
      var t0 = performance.now();
      try {
        var res = await fair.crash.walkToCommitment(seed, function (done) {
          bar.firstChild.style.setProperty('width', Math.min(100, (done / fair.crash.CHAIN_LENGTH) * 100) + '%');
          status.textContent = done.toLocaleString('en-US') + ' hashes so far\u2026';
        }, function () { return stop || !document.body.contains(btn); });
        if (res.stopped) return;
        var secs = ((performance.now() - t0) / 1000).toFixed(1);
        FPV.ui.clear(status);
        if (res.found) {
          bar.firstChild.style.setProperty('width', '100%');
          bar.classList.add('ok');
          status.className = 'chain-status ok';
          status.appendChild(icon('circle-check', 16));
          status.appendChild(h('span', null,
            'Reached the published hash after ', h('b', { text: res.count.toLocaleString('en-US') }), ' hashes (' + secs + ' s). So this round is game number ' + res.count.toLocaleString('en-US') + ' of the chain FaucetPay committed to publicly in January 2023 - fixed long before anyone bet on it. ',
            h('a', { href: fair.crash.ANNOUNCEMENT, target: '_blank', rel: 'noopener', text: 'See the announcement' }), '.'));
        } else {
          bar.classList.add('bad');
          status.className = 'chain-status bad';
          status.appendChild(icon('circle-x', 16));
          status.appendChild(h('span', { text: 'Did not reach the published hash within 10,000,000 hashes. Check that you pasted a Crash round seed.' }));
        }
      } catch (e) {
        status.className = 'chain-status bad';
        status.textContent = e.message;
      } finally {
        btn.disabled = false;
      }
    });
    return h('div', { class: 'chain-proof' },
      h('div', { class: 'chain-head' }, icon('blocks', 18), h('b', { text: 'Was this round decided years ago?' })),
      h('div', { class: 'kv' }, h('span', { class: 'k', text: 'Published final hash (Jan 2023)' }), FPV.ui.codeRow(fair.crash.TERMINATING_HASH)),
      h('div', { class: 'kv' }, h('span', { class: 'k', text: 'Client seed: Bitcoin block ' + fair.crash.BITCOIN_BLOCK.toLocaleString('en-US') }), FPV.ui.codeRow(fair.crash.CLIENT_SEED)),
      h('div', { class: 'row-gap' }, btn, h('a', { class: 'btn btn-ghost btn-sm', href: 'https://mempool.space/block/' + fair.crash.CLIENT_SEED, target: '_blank', rel: 'noopener' }, icon('bitcoin', 14), 'Bitcoin block'), h('a', { class: 'btn btn-ghost btn-sm', href: fair.crash.ANNOUNCEMENT, target: '_blank', rel: 'noopener' }, icon('external-link', 14), 'Announcement')),
      bar, status);
  }

  // ---- Meme Trade -------------------------------------------------------------------
  var DRAND_CHAIN = '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971';
  reg({
    id: 'meme-trade', name: 'Meme Trade', group: 'round', icon: 'candlestick-chart', source: src('memetrade'),
    blurb: 'Ride the chart, sell before the rug.',
    random: 'the whole price chart of a round, tick by tick, and when the rug happens.',
    formTitle: 'Paste a round\u2019s details',
    hashOf: 'serverSeed',
    fields: [
      field('serverSeed', { help: 'Revealed after the rug.' }),
      field('serverSeedHash', { help: 'Optional. Published before the round started.' }),
      { key: 'roundId', param: 'round_id', label: 'Round ID', mono: true, required: true, placeholder: 'e.g. 01920c5e-3b7a-7c41-...', help: 'The round\u2019s ID.' },
      { key: 'externalHash', param: 'external_hash', label: 'Beacon hash', mono: true, optional: true, wide: true, placeholder: 'e.g. drand-quicknet:12345678:ab12...', help: 'The public drand value mixed into the round (empty for older rounds).' },
    ],
    where: function () {
      return [
        ['In Meme Trade, open ', h('b', { text: 'Round history & provably fair' }), ' and pick a round.'],
        ['Copy the ', h('b', { text: 'Server seed' }), ', ', h('b', { text: 'Server seed hash' }), ', ', h('b', { text: 'Round ID' }), ' and ', h('b', { text: 'Beacon hash' }), ' here.'],
      ];
    },
    whereNote: null,
    example: function () { return { serverSeed: FPV.core.randomHex(32), roundId: uuid7(), externalHash: 'drand-quicknet:' + (25000000 + Math.floor(Math.random() * 1000000)) + ':' + FPV.core.randomHex(32) }; },
    verify: fair.memetrade.verify,
    headline: function (r) { return { label: 'Rug after', value: r.rugTick + ' ticks', sub: 'Peak ' + r.peak.toFixed(4) + 'x' }; },
    render: function (r) {
      return h('div', null, priceChart(r.prices),
        h('div', { class: 'stats' }, stat('Ticks', String(r.rugTick)), stat('Peak', r.peak.toFixed(4) + 'x'), stat('Rug price', r.rugPrice.toFixed(6) + 'x'), stat('Scheme', r.scheme)));
    },
    extra: function (r) {
      if (!r.drandRound) return null;
      return h('p', { class: 'muted small' }, icon('globe', 14), ' The beacon is drand round ', h('b', { text: String(r.drandRound) }), '. Anyone can look it up: ',
        h('a', { href: 'https://api.drand.sh/' + DRAND_CHAIN + '/public/' + r.drandRound, target: '_blank', rel: 'noopener', text: 'api.drand.sh' }), ' - its "randomness" must equal the end of the beacon hash.');
    },
    compareNote: 'Compare with the round in the game: same number of ticks, same peak, same rug price.',
    recipe: [
      'Before a round starts, the server picks a random server seed and publishes its fingerprint (SHA-256). From then on the seed cannot change.',
      'Only after that, it takes the newest value of drand - a public randomness beacon run by independent organisations around the world, a new value every 3 seconds. So the server could not choose a seed that fits the beacon.',
      'seed + "|" + beacon starts a standard random number generator (seedrandom, open source). Every tick draws numbers from it: a 0.5% chance of the rug, otherwise the price moves by fixed, public rules.',
      'After the rug the seed is revealed. Same seed + beacon = the exact same chart, tick for tick.',
    ],
  });

  function uuid7() {
    var hex = FPV.core.randomHex(16);
    var ts = Date.now().toString(16).padStart(12, '0');
    var v = ts + '7' + hex.slice(13, 16) + ((parseInt(hex[16], 16) & 3) | 8).toString(16) + hex.slice(17, 20) + hex.slice(20, 32);
    return v.slice(0, 8) + '-' + v.slice(8, 12) + '-' + v.slice(12, 16) + '-' + v.slice(16, 20) + '-' + v.slice(20, 32);
  }

  function priceChart(prices) {
    var W = 600, H = 220, pad = 8;
    var max = Math.max.apply(null, prices.concat([1.2]));
    var useLog = max > 8;
    function y(p) {
      var v = useLog ? Math.log(Math.max(p, 0.001)) : p;
      var top = useLog ? Math.log(max) : max;
      var bottom = useLog ? Math.log(0.001) : 0;
      return pad + (H - 2 * pad) * (1 - (v - bottom) / (top - bottom));
    }
    var n = prices.length;
    var pts = prices.map(function (p, i) { return (pad + (W - 2 * pad) * (n === 1 ? 0 : i / (n - 1))).toFixed(1) + ',' + y(p).toFixed(1); });
    var area = 'M' + pts[0] + ' L' + pts.join(' L') + ' L' + (W - pad) + ',' + (H - pad) + ' L' + pad + ',' + (H - pad) + ' Z';
    var one = y(1);
    return svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img', 'aria-label': 'Price chart of the round' },
      svg('line', { x1: pad, x2: W - pad, y1: one, y2: one, class: 'chart-base' }),
      svg('path', { d: area, class: 'chart-area' }),
      svg('polyline', { points: pts.join(' '), class: 'chart-line' }),
      svg('circle', { cx: pts[n - 1].split(',')[0], cy: pts[n - 1].split(',')[1], r: 5, class: 'chart-rug' }));
  }

  // ---- Limbo ---------------------------------------------------------------------
  reg({
    id: 'limbo', name: 'Limbo', group: 'seeds', icon: 'arrow-up-right', source: src('limbo'),
    blurb: 'Pick a target multiplier and hope it flies past.',
    random: 'the result multiplier, from 0.97x up to 970,000x.',
    fields: SEEDS,
    verify: fair.limbo.verify,
    headline: function (r) { return { label: 'Result multiplier', value: r.multiplier + 'x', tone: Number(r.multiplier) >= 2 ? 'good' : null }; },
    render: function (r) {
      return h('p', { class: 'muted', text: 'Every target up to ' + r.multiplier + 'x won. Any target above it lost.' });
    },
    recipe: [
      'Your client seed and the nonce are joined (client_seed:nonce) and hashed with HMAC-SHA256, using your server seed as the key.',
      'The first 4 bytes of that hash become a number from 0 to 999,999 - each equally likely.',
      'Result = 1,000,000 / (number + 1) x 0.97, cut to 2 decimals. Same formula for every player and every bet.',
    ],
  });

  // ---- Roulette ------------------------------------------------------------------------
  reg({
    id: 'roulette', name: 'Roulette', group: 'seeds', icon: 'circle-dot', source: src('roulette'),
    blurb: 'European roulette, single zero.',
    random: 'the pocket the ball lands in, 0 to 36.',
    fields: SEEDS,
    verify: fair.roulette.verify,
    headline: function (r) { return { label: 'Pocket', value: String(r.pocket) }; },
    render: function (r) {
      var n = r.pocket;
      var facts = n === 0 ? ['Green zero'] : [
        r.color === 'red' ? 'Red' : 'Black',
        n % 2 ? 'Odd' : 'Even',
        n <= 18 ? '1 - 18' : '19 - 36',
        n <= 12 ? '1st dozen' : n <= 24 ? '2nd dozen' : '3rd dozen',
        'Column ' + (((n - 1) % 3) + 1),
      ];
      return h('div', { class: 'roulette' },
        h('div', { class: 'pocket ' + r.color, text: String(n) }),
        h('div', { class: 'chips' }, facts.map(function (f) { return h('span', { class: 'chip', text: f }); })));
    },
    recipe: [
      'client_seed:nonce is hashed with HMAC-SHA256, keyed with your server seed.',
      'The first 4 bytes become a fraction between 0 and 1.',
      'Fraction x 37, decimals cut off = the pocket. All 37 pockets are equally likely.',
    ],
  });

  // ---- Plinko -----------------------------------------------------------------------------
  reg({
    id: 'plinko', name: 'Plinko', group: 'seeds', icon: 'triangle', source: src('plinko'),
    blurb: 'Drop the ball through the pins.',
    random: 'left or right at every row of pins - and so the slot the ball ends in.',
    fields: seedsWith([
      { key: 'rows', param: 'rows', label: 'Rows', type: 'select', options: [8, 9, 10, 11, 12, 13, 14, 15, 16].map(function (r) { return [String(r), r + ' rows']; }), default: '16' },
      { key: 'risk', param: 'risk', label: 'Risk', type: 'select', options: [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], default: 'medium' },
    ]),
    example: function () { return { serverSeed: FPV.core.randomHex(32), clientSeed: FPV.core.randomHex(8), nonce: String(1 + Math.floor(Math.random() * 50)) }; },
    verify: fair.plinko.verify,
    headline: function (r) { return { label: 'Payout', value: r.multiplier + 'x', sub: 'Slot ' + (r.slot + 1) + ' of ' + r.payouts.length + ' from the left', tone: r.multiplier >= 1 ? 'good' : null }; },
    render: function (r) { return plinkoBoard(r); },
    recipe: [
      'Three HMAC-SHA256 hashes (client_seed:nonce:0, :1, :2, keyed with your server seed) give a long list of random bytes.',
      'Every row of pins uses 4 bytes: a fraction x 2, decimals cut off. 0 = the ball goes left, 1 = right. 50/50 at every pin.',
      'The slot is simply how many times the ball went right. Its payout comes from the fixed table of the game (rows + risk).',
    ],
  });

  function plinkoBoard(r) {
    var rows = r.path.length;
    var W = 600, H = 40 + rows * 26 + 40;
    var gap = (W - 40) / (rows + 2);
    var parts = [];
    for (var row = 0; row < rows; row++) {
      for (var k = 0; k <= row + 2; k++) {
        var x = W / 2 + (k - (row + 2) / 2) * gap;
        parts.push(svg('circle', { cx: x.toFixed(1), cy: 30 + row * 26, r: 3.2, class: 'peg' }));
      }
    }
    var px = W / 2;
    var pts = [px.toFixed(1) + ',8'];
    var pos = 0;
    for (var i = 0; i < rows; i++) {
      pos += r.path[i];
      px = W / 2 + (pos - (i + 1) / 2) * gap;
      pts.push(px.toFixed(1) + ',' + (30 + i * 26 + 13));
    }
    parts.push(svg('polyline', { points: pts.join(' '), class: 'ball-path' }));
    parts.push(svg('circle', { cx: px.toFixed(1), cy: 30 + (rows - 1) * 26 + 13, r: 7, class: 'ball' }));
    var slots = h('div', { class: 'plinko-slots' }, r.payouts.map(function (m, idx) {
      return h('span', { class: 'slot' + (idx === r.slot ? ' hit' : '') + (m >= 1 ? ' up' : ''), text: m + 'x' });
    }));
    return h('div', { class: 'plinko' }, svg.apply(null, ['svg', { viewBox: '0 0 ' + W + ' ' + (H - 40), class: 'plinko-svg', role: 'img', 'aria-label': 'Path of the ball' }].concat(parts)), slots);
  }

  // ---- Diamonds -----------------------------------------------------------------------------
  var GEMS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  var GEM_NAMES = ['Sapphire', 'Emerald', 'Amber', 'Amethyst', 'Ruby', 'Topaz', 'Rose'];
  reg({
    id: 'diamonds', name: 'Diamonds', group: 'seeds', icon: 'gem', source: src('diamonds'),
    blurb: 'Five gems, poker-style hands.',
    random: 'the 5 gems, each one of 7 colours.',
    fields: SEEDS,
    verify: fair.diamonds.verify,
    headline: function (r) { return { label: r.outcome.name, value: r.outcome.multiplier + 'x', tone: r.outcome.multiplier >= 1 ? 'good' : null }; },
    render: function (r) {
      return h('div', { class: 'gems' }, r.gems.map(function (g) {
        var s = svg('svg', { viewBox: '0 0 40 40', class: 'gem', role: 'img', 'aria-label': GEM_NAMES[g] },
          svg('polygon', { points: '20,3 36,15 20,37 4,15', fill: GEMS[g] }),
          svg('polygon', { points: '20,3 28,15 20,37 12,15', fill: 'rgba(255,255,255,0.22)' }),
          svg('polyline', { points: '4,15 36,15', stroke: 'rgba(255,255,255,0.35)', 'stroke-width': 1.2, fill: 'none' }));
        return h('div', { class: 'gem-wrap' }, s, h('span', { text: GEM_NAMES[g] }));
      }));
    },
    recipe: [
      'client_seed:nonce is hashed with HMAC-SHA256, keyed with your server seed.',
      'The hash gives 5 groups of 4 bytes. Each group: a fraction x 7, decimals cut off = one of 7 gem colours, all equally likely.',
      'The payout depends only on how many gems match (pair, two pairs, three, full house, four, five).',
    ],
  });

  // ---- Towers --------------------------------------------------------------------------------
  reg({
    id: 'towers', name: 'Towers', group: 'seeds', icon: 'layout-panel-top', source: src('towers'),
    blurb: 'Climb 9 rows without hitting a trap.',
    random: 'where the traps are on each of the 9 rows - all fixed before your first click.',
    fields: seedsWith([{ key: 'difficulty', param: 'difficulty', label: 'Difficulty', type: 'select', options: opts(['EASY', 'MEDIUM', 'HARD', 'WICKED', 'BRUTAL']), default: 'EASY' }]),
    verify: fair.towers.verify,
    headline: function (r, input) {
      var name = input.difficulty.charAt(0) + input.difficulty.slice(1).toLowerCase();
      return { label: 'Tower (' + name + ')', value: r.tiles + ' tiles x 9 rows', sub: r.oneSafe ? 'Only 1 safe tile per row' : '1 trap per row, the rest is safe' };
    },
    render: function (r) {
      var rows = r.rows.map(function (row, i) {
        return h('div', { class: 'tower-row' },
          h('span', { class: 'row-n', text: String(i + 1) }),
          row.safe.map(function (safe) { return h('span', { class: 'tile ' + (safe ? 'safe' : 'trap') }, icon(safe ? 'gem' : 'bomb', 16)); }));
      }).reverse();
      return h('div', { class: 'tower' }, rows, h('p', { class: 'muted small', text: 'Row 1 is the bottom row, the first one you pick in.' }));
    },
    recipe: [
      'Each row has its own hash: HMAC-SHA256 of client_seed:nonce:row (row 0 to 8), keyed with your server seed.',
      'The first 4 bytes become a fraction; x tiles, decimals cut off, picks one tile of the row.',
      'Easy / Medium / Hard: that tile is the trap. Wicked / Brutal: it is the only safe tile.',
      'The whole tower exists the moment you bet. Your clicks only reveal it.',
    ],
  });

  // ---- Mines ----------------------------------------------------------------------------------
  reg({
    id: 'mines', name: 'Mines', group: 'seeds', icon: 'bomb', source: src('mines'),
    blurb: 'Find the gems, avoid the mines.',
    random: 'where the mines are on the 5 x 5 board - fixed before your first click.',
    fields: seedsWith([{ key: 'mines', param: 'mines', label: 'Number of mines', type: 'int', min: 1, max: 24, default: '3', mono: true }]),
    example: function () { return { serverSeed: FPV.core.randomHex(32), clientSeed: FPV.core.randomHex(8), nonce: String(1 + Math.floor(Math.random() * 50)), mines: '3' }; },
    verify: fair.mines.verify,
    headline: function (r) { return { label: 'Mines at tiles', value: r.sorted.map(function (t) { return t + 1; }).join(', ') }; },
    render: function (r) {
      var set = {};
      r.mines.forEach(function (m) { set[m] = true; });
      var cells = [];
      for (var i = 0; i < 25; i++) cells.push(h('span', { class: 'tile ' + (set[i] ? 'trap' : 'safe'), title: 'Tile ' + (i + 1) }, icon(set[i] ? 'bomb' : 'gem', 18)));
      return h('div', null, h('div', { class: 'mines-grid' }, cells), h('p', { class: 'muted small', text: 'Tiles are numbered 1 to 25: left to right, top to bottom.' }));
    },
    recipe: [
      'Three HMAC-SHA256 hashes (client_seed:nonce:0, :1, :2, keyed with your server seed) give 96 random bytes.',
      'The 25 tiles are shuffled with them: 4 bytes pick one of the 25 tiles, the next 4 bytes one of the 24 left, and so on.',
      'The first tiles picked are the mines. The board exists the moment you bet; your clicks only reveal it.',
    ],
  });

  // ---- Pump --------------------------------------------------------------------------------------
  reg({
    id: 'pump', name: 'Pump', group: 'seeds', icon: 'balloon', source: src('pump'),
    blurb: 'Pump the balloon, cash out before it pops.',
    random: 'at which pump the balloon pops - fixed before your first pump.',
    fields: seedsWith([{ key: 'difficulty', param: 'difficulty', label: 'Difficulty', type: 'select', options: opts(['EASY', 'MEDIUM', 'HARD', 'EXPERT']), default: 'EASY' }]),
    verify: fair.pump.verify,
    headline: function (r) { return { label: 'Pops on pump', value: '#' + r.popAt, sub: (r.popAt - 1) + ' safe pump' + (r.popAt === 2 ? '' : 's') }; },
    render: function (r) {
      var cells = [];
      for (var p = 1; p <= r.positions; p++) {
        var isPop = r.popPositions.indexOf(p) !== -1;
        cells.push(h('span', { class: 'cell ' + (isPop ? 'trap' : p < r.popAt ? 'safe' : 'idle') + (p === r.popAt ? ' first' : ''), text: String(p) }));
      }
      return h('div', null, h('div', { class: 'cells' }, cells), h('p', { class: 'muted small', text: 'Red = pop positions. Green = pumps that were safe. The balloon pops at the first red one.' }));
    },
    recipe: [
      'Three HMAC-SHA256 hashes (client_seed:nonce:0, :1, :2, keyed with your server seed) give 96 random bytes.',
      'The 25 pump positions are shuffled with them, 4 bytes per pick.',
      'The first 1 / 3 / 5 / 10 positions picked (Easy / Medium / Hard / Expert) pop the balloon. It pops at the lowest one.',
    ],
  });

  // ---- Blackjack -------------------------------------------------------------------------------------
  reg({
    id: 'blackjack', name: 'Blackjack', group: 'seeds', icon: 'spade', source: src('blackjack'),
    blurb: 'Beat the dealer to 21.',
    random: 'the order of the cards.',
    fields: SEEDS,
    verify: fair.blackjack.verify,
    headline: function (r) {
      return { label: 'Your first two cards', value: r.player.map(function (c) { return c.rank + SUIT_SYMBOL[c.suit]; }).join('  ') };
    },
    render: function (r) {
      function hand(label, cards) {
        return h('div', { class: 'hand' }, h('div', { class: 'hand-l', text: label }), h('div', { class: 'cards' }, cards.map(function (c) { return playingCard(c.rank, c.suit); })));
      }
      return h('div', null,
        hand('You', r.player),
        hand('Dealer (the 2nd card is the face-down one)', r.dealer),
        hand('Next cards, in order (every hit, double or split takes the next one)', r.next.slice(0, 16)));
    },
    recipe: [
      'Seven HMAC-SHA256 hashes (client_seed:nonce:0 to :6, keyed with your server seed) give 224 random bytes.',
      'Every 4 bytes make one card: a fraction x 52, decimals cut off. Each card is drawn from a full deck, like a shoe that never runs out.',
      'Cards 1 and 2 are yours, 3 and 4 the dealer\u2019s. Every hit, double or split takes the next card in this list. Your choices change which cards you get - never the order they come in.',
    ],
  });

  // ---- Chicken ------------------------------------------------------------------------------------------
  reg({
    id: 'chicken', name: 'Chicken', group: 'seeds', icon: 'bird', source: src('chicken'),
    blurb: 'Cross the road lane by lane.',
    random: 'which of the 20 lanes are deadly - fixed before your first step.',
    fields: seedsWith([{ key: 'difficulty', param: 'difficulty', label: 'Difficulty', type: 'select', options: opts(['EASY', 'MEDIUM', 'HARD', 'EXPERT']), default: 'EASY' }]),
    verify: fair.chicken.verify,
    headline: function (r) { return { label: 'Deadly lanes', value: r.deadly.join(', '), sub: 'At most ' + (r.first - 1) + ' safe lane' + (r.first === 2 ? '' : 's') }; },
    render: function (r) {
      var cells = [];
      for (var l = 1; l <= r.lanes; l++) {
        var dead = r.deadly.indexOf(l) !== -1;
        cells.push(h('span', { class: 'cell ' + (dead ? 'trap' : l < r.first ? 'safe' : 'idle') + (l === r.first ? ' first' : ''), text: String(l) }));
      }
      return h('div', null, h('div', { class: 'cells lanes' }, cells), h('p', { class: 'muted small', text: 'Lane 1 is the first lane you cross. The chicken is caught on the first red lane it steps on.' }));
    },
    recipe: [
      'Three HMAC-SHA256 hashes (client_seed:nonce:0, :1, :2, keyed with your server seed) give the random bytes.',
      'The 20 lanes are shuffled with them, 4 bytes per pick.',
      'The first 1 / 3 / 5 / 10 lanes picked (Easy / Medium / Hard / Expert) are deadly. The road exists the moment you bet.',
    ],
  });

  // ---- Packs ------------------------------------------------------------------------------------------------
  var TIER_LABEL = { LEGENDARY: 'Legendary', EPIC: 'Epic', SUPER_RARE: 'Super rare', RARE: 'Rare', UNCOMMON: 'Uncommon', COMMON: 'Common' };
  reg({
    id: 'packs', name: 'Packs', group: 'seeds', icon: 'package-open', source: src('packs'),
    blurb: 'Open a pack of 5 cards.',
    random: 'which 5 of the 242 cards are in your pack.',
    fields: SEEDS,
    verify: fair.packs.verify,
    headline: function (r) { return { label: 'Pack payout', value: r.total + 'x', tone: Number(r.total) >= 1 ? 'good' : null }; },
    render: function (r) {
      return h('div', { class: 'packs' }, r.cards.map(function (c) {
        return h('div', { class: 'pack-card tier-' + c.tier.toLowerCase() },
          h('span', { class: 'pack-tier', text: TIER_LABEL[c.tier] }),
          h('span', { class: 'pack-no', text: 'No. ' + c.id }),
          h('span', { class: 'pack-mult', text: c.multiplier + 'x' }),
          h('span', { class: 'pack-odds', text: '1 in ' + Math.round(1 / c.chance).toLocaleString('en-US') }));
      }));
    },
    recipe: [
      'HMAC-SHA256 of client_seed:nonce:0, keyed with your server seed. The first 20 bytes are used, 4 per card.',
      'Each card: the 4 bytes are a number from 0 to 4,294,967,295. Every card in the fixed table owns a slice of that range - rarer cards a smaller slice. The number lands in exactly one slice.',
      'The pack pays the sum of its 5 cards. The table is public (see the code) and its fingerprint must match the one the game server is locked to.',
    ],
  });

  // ---- HiLo ---------------------------------------------------------------------------------------------------
  var ACTION_LABEL = { HI: 'Higher', LO: 'Lower', SAME: 'Same', SKIP: 'Skip' };
  reg({
    id: 'hilo', name: 'HiLo', group: 'seeds', icon: 'arrow-up-down', source: src('hilo'),
    blurb: 'Higher or lower than the card?',
    random: 'the order of the cards.',
    fields: seedsWith([
      { key: 'actions', param: 'actions', label: 'Your moves', optional: true, mono: true, placeholder: 'e.g. HLKH', help: 'Optional. One letter per move: H higher, L lower, S same, K skip (as in your bet details).' },
      { key: 'count', param: 'count', label: 'Cards to show', type: 'int', min: 1, max: 60, default: '12', optional: true, help: 'Used when no moves are given.' },
    ]),
    verify: fair.hilo.verify,
    headline: function (r) {
      if (r.round && !r.round.error) return { label: r.round.status === 'BUSTED' ? 'Round lost' : 'Multiplier', value: r.round.multiplier + 'x', tone: r.round.status === 'BUSTED' ? 'bad' : 'good' };
      return { label: 'First card', value: r.cards[0].label + SUIT_SYMBOL[r.cards[0].suit] };
    },
    render: function (r) {
      var moves = r.round && r.round.moves ? r.round.moves : [];
      var row = r.cards.map(function (c, i) {
        var m = moves[i];
        return h('div', { class: 'hilo-step' },
          playingCard(c.label, c.suit),
          m ? h('span', { class: 'chip ' + (m.result === 'WIN' ? 'good' : m.result === 'LOSS' ? 'bad' : ''), text: ACTION_LABEL[m.action] + (m.result === 'SKIP' ? '' : m.result === 'WIN' ? ' \u2713' : ' \u2717') }) : null);
      });
      return h('div', null,
        r.round && r.round.error ? h('div', { class: 'alert bad' }, icon('circle-alert', 16), h('span', { text: r.round.error })) : null,
        h('div', { class: 'cards wrap' }, row),
        h('p', { class: 'muted small', text: 'Card 1 is the first card shown. Every guess or skip brings the next card. A is low, K is high.' }));
    },
    recipe: [
      'Card number c has its own hash: HMAC-SHA256 of client_seed:nonce:c, keyed with your server seed.',
      'The hash is read as 8 numbers of 4 bytes. The first one below 4,294,967,248 (= 52 x 82,595,524) is divided by 82,595,524: that is the card, 0 to 51.',
      'Throwing away the top 48 values makes all 52 cards exactly equally likely. Your guesses never change which card comes next.',
    ],
  });

  // ---- Snakes ----------------------------------------------------------------------------------------------------
  var RING = [1, 2, 3, 4, 12, 0, 0, 5, 11, 0, 0, 6, 10, 9, 8, 7];
  reg({
    id: 'snakes', name: 'Snakes', group: 'seeds', icon: 'worm', source: src('snakes'),
    blurb: 'Roll the dice, avoid the snakes.',
    random: 'the two dice of every roll.',
    fields: seedsWith([{ key: 'difficulty', param: 'difficulty', label: 'Difficulty', type: 'select', options: opts(['EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MASTER']), default: 'EASY' }]),
    verify: fair.snakes.verify,
    headline: function (r) {
      var last = r.rolls[r.rolls.length - 1];
      return last.snake
        ? { label: 'Snake on roll ' + r.rolls.length, value: 'Square ' + last.sum, tone: 'bad', sub: r.rolls.length > 1 ? 'Before it: ' + r.rolls[r.rolls.length - 2].multiplier + 'x' : 'The very first roll' }
        : { label: 'After 5 rolls', value: last.multiplier + 'x', tone: 'good' };
    },
    render: function (r) {
      var hits = {};
      r.rolls.forEach(function (x, i) { hits[x.sum] = (hits[x.sum] || []).concat([i + 1]); });
      var board = h('div', { class: 'snakes-board' }, RING.map(function (sq) {
        if (!sq) return h('span', { class: 'sq empty' });
        var later = r.later[sq];
        var cls = 'sq' + (sq === 1 ? ' start' : later === 0 ? ' snake' : '') + (hits[sq] ? ' hit' : '');
        return h('span', { class: cls },
          h('b', { text: String(sq) }),
          h('small', { text: sq === 1 ? 'Start' : later === 0 ? 'Snake' : r.first[sq] / 100 + 'x / ' + later / 100 + 'x' }),
          hits[sq] ? h('i', { text: 'roll ' + hits[sq].join(', ') }) : null);
      }));
      var list = h('ol', { class: 'roll-list' }, r.rolls.map(function (x) {
        return h('li', null,
          h('span', { class: 'die', text: String(x.d1) }), h('span', { class: 'die', text: String(x.d2) }),
          h('span', null, '= square ' + x.sum + ': '), h('b', { class: x.snake ? 'bad' : 'good', text: x.snake ? 'snake' : x.square + 'x -> ' + x.multiplier + 'x' }));
      }));
      return h('div', { class: 'snakes' }, board, list,
        h('p', { class: 'muted small', text: 'Square values: first roll / later rolls. You may have cashed out before the last roll shown.' }));
    },
    recipe: [
      'Roll r (0 to 4) has its own hash: HMAC-SHA256 of client_seed:nonce:r, keyed with your server seed.',
      'Bytes 1-4 make die 1 and bytes 5-8 die 2: a number from 0 to 4,294,967,295, x 6, divided by 4,294,967,296, + 1. Every face is equally likely.',
      'The token lands on the square numbered die 1 + die 2. Your multiplier is the product of the squares you landed on; a snake ends the round.',
    ],
  });

  // ---- Slots (external) ------------------------------------------------------------------------------------------
  reg({
    id: 'slots', name: 'Slots', group: 'external', icon: 'cherry', source: 'https://basiliskgaming.com/verify', external: 'https://basiliskgaming.com/verify',
    blurb: 'Slot games by Basilisk Gaming.',
    random: 'the reels - drawn by the game provider, Basilisk Gaming.',
    fields: [], recipe: [],
  });

  // ---- Lottery ------------------------------------------------------------------------------------------------------
  reg({
    id: 'lottery', name: 'Lottery', group: 'draw', icon: 'ticket', source: src('lottery'),
    blurb: 'The daily draw: 5 numbers + a jackpot ball.',
    random: 'the 5 winning numbers (1 - 36) and the jackpot ball (1 - 10).',
    formTitle: 'Paste the draw\u2019s details',
    fields: [
      field('serverSeed', { help: 'Revealed after the draw.' }),
      field('serverSeedHash', { help: 'Optional. Shown on the lottery page a day before the draw.' }),
      field('clientSeed', { label: 'Client seed (Ethereum block hash)', placeholder: '0x...', help: 'The hash of an Ethereum block mined after ticket sales closed. Keep the 0x.', wide: true }),
    ],
    where: function () {
      return [
        ['On the Lottery page, open ', h('b', { text: 'Fairness' }), ' for a finished draw.'],
        ['Copy the ', h('b', { text: 'Server seed' }), ', ', h('b', { text: 'Server seed hash' }), ' and ', h('b', { text: 'Client seed' }), ' here.'],
      ];
    },
    whereNote: 'You can look the client seed up on any Ethereum explorer (for example etherscan.io): it is a real block hash, mined minutes before the draw - nobody could know it in advance.',
    example: function () { return { serverSeed: FPV.core.randomHex(32), clientSeed: '0x' + FPV.core.randomHex(32) }; },
    verify: fair.lottery.verify,
    headline: function (r) { return { label: 'Winning numbers', value: r.balls.join('  ') + '  +  ' + r.jackpot }; },
    render: function (r) {
      return h('div', { class: 'balls' },
        r.balls.map(function (b) { return h('span', { class: 'ball', text: String(b) }); }),
        h('span', { class: 'plus', text: '+' }),
        h('span', { class: 'ball jackpot', text: String(r.jackpot) }));
    },
    compareNote: 'Compare with the winning numbers of that draw. They are in the order they were drawn.',
    recipe: [
      'About a day before the draw, a random server seed is created and its fingerprint (SHA-256) is shown on the lottery page.',
      'Ticket sales close 5 minutes before the draw. The client seed is the hash of the Ethereum block mined 10 blocks after that - nobody on earth can know or choose it in advance.',
      'HMAC-SHA256(client seed, keyed with the server seed) gives the hash. Its first 5 groups of 8 characters draw 5 numbers from 1-36 (no repeats); the 6th group draws the jackpot ball from 1-10.',
    ],
  });

  // ---- Faucet Dice (partner faucet sites) -------------------------------------------------------------------------------
  reg({
    id: 'faucet-dice', name: 'Faucet Dice', group: 'partner', icon: 'dice-5', source: src('faucetdice'),
    blurb: 'Dice on FaucetPay-powered faucet sites.',
    random: 'the roll, a number from 0.00 to 99.99.',
    fields: SEEDS,
    where: function () {
      return [
        ['On the faucet site, open the Dice game. The ', h('b', { text: 'Provably fair' }), ' box shows the hashed current and next server seed.'],
        ['Rotate your seed, then click ', h('b', { text: 'Verify' }), ' next to a bet: it shows the client seed, nonce and server seed.'],
      ];
    },
    whereNote: 'Limbo and Towers on faucet sites use exactly the same formulas as on faucetpay.io: use the Limbo and Towers pages for them.',
    verify: fair.faucetdice.verify,
    headline: function (r) { return { label: 'Roll', value: r.display }; },
    render: function (r) { return rollGauge(r.roll); },
    recipe: [
      'server_seed:client_seed:nonce goes through SHA-256.',
      'The first 12 characters of the hash become a fraction between 0 and 1; x 100,000, decimals cut off.',
      'The last 4 digits are the roll: 0 to 9999, shown as 0.00 to 99.99.',
    ],
  });
})((typeof window !== "undefined" ? window : globalThis).FPV);
