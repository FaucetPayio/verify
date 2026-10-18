/*
 * FaucetPay Verify - the home page and the router.
 */
(function (FPV) {
  'use strict';
  var h = FPV.ui.h;
  var icon = FPV.ui.icon;
  var app = document.getElementById('app');

  function section(id, eyebrow, title, lead) {
    var children = Array.prototype.slice.call(arguments, 4);
    return h('section', { class: 'section container', id: id },
      h('div', { class: 'section-head' },
        h('div', { class: 'eyebrow', text: eyebrow }),
        h('h2', { text: title }),
        lead ? h('p', { class: 'lead', text: lead }) : null),
      children);
  }

  // ---- hero --------------------------------------------------------------------------
  function hero() {
    return h('section', { class: 'hero container' },
      h('div', { class: 'hero-copy' },
        h('div', { class: 'pill' }, icon('shield-check', 14), 'Provably fair'),
        h('h1', null, 'Every result was locked in ', h('span', { class: 'grad', text: 'before you played.' })),
        h('p', { class: 'lead' }, 'Don\u2019t trust us - check it. Pick your game, paste three values from your bet, and your own browser re-calculates the result. If it matches, nobody touched it. Not even us.'),
        h('div', { class: 'hero-actions' },
          h('a', { class: 'btn btn-primary btn-lg', href: '#games' }, icon('search', 17), 'Verify a bet'),
          h('a', { class: 'btn btn-outline btn-lg', href: '#try' }, icon('play', 16), 'See how it works')),
        h('ul', { class: 'trust' },
          trust('monitor-smartphone', 'Runs 100% in your browser'),
          trust('wifi-off', 'Sends nothing, anywhere'),
          trust('code', 'Open source'),
          trust('calculator', 'Standard maths anyone can redo'))),
      h('div', { class: 'hero-art', 'aria-hidden': 'true' }, heroArt()));
  }

  function trust(ic, text) { return h('li', null, icon(ic, 15), h('span', { text: text })); }

  function heroArt() {
    return h('div', { class: 'seal' },
      h('div', { class: 'seal-row' }, h('span', { class: 'seal-k', text: 'Server seed' }), h('span', { class: 'seal-v locked' }, icon('lock-keyhole', 14), 'hidden until you rotate')),
      h('div', { class: 'seal-row' }, h('span', { class: 'seal-k', text: 'Its fingerprint' }), h('code', { class: 'seal-v', text: '3b9f0c41e7\u2026a07d' })),
      h('div', { class: 'seal-row' }, h('span', { class: 'seal-k', text: 'Your client seed' }), h('code', { class: 'seal-v', text: 'my-lucky-seed' })),
      h('div', { class: 'seal-row' }, h('span', { class: 'seal-k', text: 'Nonce' }), h('code', { class: 'seal-v', text: '1, 2, 3, \u2026' })),
      h('div', { class: 'seal-arrow' }, icon('chevron-down', 18)),
      h('div', { class: 'seal-result' }, h('span', { text: 'Result' }), h('b', { text: '52.34' })),
      h('div', { class: 'seal-ok' }, icon('circle-check', 15), 'Fingerprint matches - result confirmed'));
  }

  // ---- 4 steps ----------------------------------------------------------------------------
  function steps() {
    var list = [
      ['lock-keyhole', 'We lock our secret first', 'Before you bet, FaucetPay picks a random secret (the server seed) and shows you only its fingerprint (a hash). The fingerprint proves which secret it is, but reveals nothing about it.'],
      ['key-round', 'You add your own secret', 'Your client seed is yours - change it to anything, any time. We cannot know it when we lock our secret. A counter (the nonce) goes up by 1 with every bet.'],
      ['shuffle', 'Maths mixes all three', 'The result = a standard, public formula (HMAC-SHA256) of server seed + client seed + nonce. Same inputs always give the same result. Change one letter and the result is completely different.'],
      ['lock-keyhole-open', 'You open the lock and check', 'Rotate your seed: we reveal the old secret. Its fingerprint must match the one you saw before. Paste it here - the results must match your bets. If we had cheated, they wouldn\u2019t.'],
    ];
    return section('how', 'How it works', 'Fair in four simple steps', 'Like a sealed envelope: we can\u2019t change what\u2019s inside once you\u2019ve seen the seal, and you can open it afterwards.',
      h('div', { class: 'steps-grid' }, list.map(function (s, i) {
        return h('div', { class: 'card step' },
          h('div', { class: 'step-top' }, h('span', { class: 'num', text: String(i + 1) }), icon(s[0], 20)),
          h('h3', { text: s[1] }), h('p', { text: s[2] }));
      })));
  }

  // ---- interactive demo ------------------------------------------------------------------------
  function demo() {
    var state;
    var C = FPV.core;
    var hashEl = h('code', { class: 'demo-hash' });
    var seedEl = h('div', { class: 'demo-secret' });
    var clientInput = h('input', { type: 'text', class: 'mono', value: 'my-lucky-seed', maxlength: 64, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Your client seed' });
    var rollsEl = h('ol', { class: 'demo-rolls' });
    var verdict = h('div', { class: 'demo-verdict' });
    var rollBtn = h('button', { type: 'button', class: 'btn btn-primary' }, icon('dices', 16), 'Roll the dice');
    var revealBtn = h('button', { type: 'button', class: 'btn btn-outline' }, icon('lock-keyhole-open', 16), 'Reveal the secret');
    var cheatBtn = h('button', { type: 'button', class: 'btn btn-ghost' }, icon('wand-sparkles', 15), 'What if we swapped it?');
    var resetBtn = h('button', { type: 'button', class: 'btn btn-ghost' }, icon('refresh-cw', 15), 'Start over');

    async function reset() {
      state = { seed: C.randomHex(32), rolls: [], revealed: false };
      state.hash = await C.sha256Hex(state.seed);
      hashEl.textContent = state.hash;
      FPV.ui.clear(seedEl).appendChild(h('span', { class: 'locked' }, icon('lock-keyhole', 14), 'Hidden - only its fingerprint is shown'));
      FPV.ui.clear(rollsEl);
      FPV.ui.clear(verdict);
      rollBtn.disabled = false;
      clientInput.disabled = false;
      revealBtn.disabled = true;
      cheatBtn.hidden = true;
    }

    rollBtn.addEventListener('click', async function () {
      var client = clientInput.value.trim() || 'my-lucky-seed';
      var nonce = state.rolls.length + 1;
      var r = await FPV.fair.dice.verify({ serverSeed: state.seed, clientSeed: client, nonce: String(nonce) });
      state.rolls.push({ client: client, nonce: nonce, display: r.display });
      rollsEl.appendChild(h('li', null, h('span', { class: 'muted', text: 'Bet #' + nonce + ' \u00b7 ' + client }), h('b', { text: r.display })));
      revealBtn.disabled = false;
    });

    revealBtn.addEventListener('click', async function () {
      state.revealed = true;
      rollBtn.disabled = true;
      clientInput.disabled = true;
      revealBtn.disabled = true;
      FPV.ui.clear(seedEl).appendChild(h('code', { text: state.seed }));
      await check(state.seed, false);
      cheatBtn.hidden = false;
    });

    cheatBtn.addEventListener('click', async function () {
      var fake = C.randomHex(32);
      FPV.ui.clear(seedEl).appendChild(h('code', { class: 'fake', text: fake }));
      await check(fake, true);
      cheatBtn.hidden = true;
    });

    resetBtn.addEventListener('click', reset);

    async function check(seed, cheating) {
      var fp = await C.sha256Hex(seed);
      var sameFp = fp === state.hash;
      var lines = [];
      var allSame = true;
      for (var i = 0; i < state.rolls.length; i++) {
        var x = state.rolls[i];
        var r = await FPV.fair.dice.verify({ serverSeed: seed, clientSeed: x.client, nonce: String(x.nonce) });
        var same = r.display === x.display;
        allSame = allSame && same;
        lines.push(h('li', { class: same ? 'good' : 'bad' }, icon(same ? 'check' : 'x', 14), 'Bet #' + x.nonce + ': you got ' + x.display + ', re-calculated ' + r.display));
      }
      FPV.ui.clear(verdict).appendChild(h('div', { class: 'demo-check ' + (sameFp && allSame ? 'ok' : 'bad') },
        h('div', { class: 'demo-check-head' }, icon(sameFp && allSame ? 'circle-check' : 'circle-x', 20),
          h('b', { text: cheating ? 'Caught! A swapped secret has a different fingerprint, and the results change.' : 'Fair! The secret matches its fingerprint, and every result re-calculates exactly.' })),
        h('div', { class: 'small' }, 'Fingerprint of the revealed secret: ', h('code', { class: sameFp ? 'good' : 'bad', text: fp.slice(0, 20) + '\u2026' }), sameFp ? ' = the one shown before your bets' : ' \u2260 the one shown before your bets (' + state.hash.slice(0, 12) + '\u2026)'),
        h('ul', { class: 'demo-lines' }, lines)));
    }

    reset();
    return section('try', 'Try it yourself', 'Play the fairness game: try to catch us', 'A tiny simulation of exactly what happens on FaucetPay. Nothing here is real money - it just shows why cheating is impossible.',
      h('div', { class: 'card demo' },
        h('div', { class: 'demo-step' }, h('span', { class: 'num', text: '1' }), h('div', null,
          h('h3', { text: 'FaucetPay locks a secret' }),
          h('div', { class: 'demo-label', text: 'Secret server seed' }), seedEl,
          h('div', { class: 'demo-label', text: 'Its fingerprint (SHA-256), shown to you BEFORE you bet' }), hashEl)),
        h('div', { class: 'demo-step' }, h('span', { class: 'num', text: '2' }), h('div', null,
          h('h3', { text: 'You choose your client seed' }),
          clientInput, h('p', { class: 'muted small', text: 'Type anything. FaucetPay could not have known it when the secret was locked.' }))),
        h('div', { class: 'demo-step' }, h('span', { class: 'num', text: '3' }), h('div', null,
          h('h3', { text: 'You bet' }), h('div', { class: 'row-gap' }, rollBtn), rollsEl)),
        h('div', { class: 'demo-step' }, h('span', { class: 'num', text: '4' }), h('div', null,
          h('h3', { text: 'Reveal and check' }), h('div', { class: 'row-gap' }, revealBtn, cheatBtn, resetBtn), verdict))));
  }

  // ---- why we can't cheat ---------------------------------------------------------------------------
  function gotchas() {
    var items = [
      ['lock', 'We can\u2019t change a result after you bet', 'Our secret was locked before you bet - you saw its fingerprint. Any other secret has a different fingerprint, and you would see the switch.'],
      ['key-round', 'We can\u2019t pick a secret that\u2019s bad for you', 'We lock our secret before we know your client seed, and you can change your client seed whenever you like. A secret can\u2019t be "bad" on purpose for a seed nobody knew yet.'],
      ['fingerprint-pattern', 'We can\u2019t fake a fingerprint', 'Making a second secret with the same SHA-256 fingerprint would take every computer on Earth billions of years. Bitcoin is protected by the same maths.'],
      ['hash', 'We can\u2019t skip a bad result', 'Every bet uses the next nonce: 1, 2, 3, ... A skipped or reused number would stand out in your bet history.'],
      ['blocks', 'Shared games use randomness nobody owns', 'Crash is salted with a Bitcoin block, the Lottery with an Ethereum block, Meme Trade with the drand public beacon. Nobody - us included - could know them in advance.'],
      ['wifi-off', 'This page can\u2019t cheat you either', 'It runs only in your browser and is blocked from sending anything (look for connect-src \u2019none\u2019 in the page source). The code is open on GitHub.'],
      ['calculator', 'You don\u2019t even need this page', 'The formulas are standard (SHA-256, SHA-512, HMAC-SHA256). Any calculator for those - or five lines of Python - gives exactly the same numbers. Every step is shown.'],
      ['bomb', 'Your clicks can\u2019t move a mine', 'In Mines, Towers, Chicken and Pump the whole board is fixed the moment you bet. Your clicks only reveal it - the verifier shows you the full board, so you can see nothing moved.'],
    ];
    return section('why', 'No trust needed', 'Why we can\u2019t cheat - even if we wanted to', null,
      h('div', { class: 'gotchas' }, items.map(function (g) {
        return h('div', { class: 'card gotcha' }, h('span', { class: 'gotcha-icon' }, icon(g[0], 20)), h('h3', { text: g[1] }), h('p', { text: g[2] }));
      })));
  }

  // ---- games grid ------------------------------------------------------------------------------------
  function gamesGrid() {
    var groups = [
      ['seeds', 'Your seeds', 'Server seed + your client seed + nonce'],
      ['round', 'Shared rounds & draws', 'One result for everyone, mixed with public randomness'],
      ['other', 'More', 'Faucet sites and partner games'],
    ];
    var list = FPV.games.list();
    function card(g) {
      var external = !!g.external;
      return h('a', { class: 'game-card', href: external ? g.external : '#/' + g.id, target: external ? '_blank' : null, rel: external ? 'noopener' : null },
        h('span', { class: 'game-icon' }, icon(g.icon, 18)),
        h('span', { class: 'game-card-body' },
          h('span', { class: 'game-name' }, g.name, external ? icon('external-link', 13, 'ext') : null),
          h('span', { class: 'game-blurb', text: g.blurb })),
        icon('chevron-right', 16, 'chev'));
    }
    return section('games', 'Verify a bet', 'Pick your game', 'Every game on faucetpay.io, with its own verifier.',
      groups.map(function (gr) {
        var items = list.filter(function (g) {
          if (gr[0] === 'seeds') return g.group === 'seeds';
          if (gr[0] === 'round') return g.group === 'round' || g.group === 'draw';
          return g.group === 'external' || g.group === 'partner';
        });
        return h('div', { class: 'game-group' },
          h('div', { class: 'group-head' }, h('h3', { text: gr[1] }), h('span', { class: 'muted small', text: gr[2] })),
          h('div', { class: 'games-grid' }, items.map(card)));
      }));
  }

  // ---- FAQ --------------------------------------------------------------------------------------------
  function faq() {
    var py = [
      'import hmac, hashlib',
      'server_seed = "paste the server seed"',
      'client_seed = "paste the client seed"',
      'nonce = 1',
      'msg = f"{client_seed}:{nonce}"',
      'print(hmac.new(server_seed.encode(), msg.encode(), hashlib.sha256).hexdigest())',
    ].join('\n');
    var items = [
      ['What is a hash, or "fingerprint"?', ['A hash is a fixed-length code calculated from any text, like 3b9f0c41e7... It always comes out the same for the same text, but changes completely if you change even one letter - and you cannot work backwards from it to the text. So showing you the hash of our secret commits us to that secret without giving it away.']],
      ['Why can\u2019t I see the server seed of my current bets?', ['Because with it you could calculate every next result before betting and win every time. So while a seed is in use you only see its fingerprint. When you rotate, the old seed is revealed (it can take a minute) and a new one starts.']],
      ['What is the nonce?', ['A simple bet counter: your 1st bet on a seed uses nonce 1, the 2nd uses 2, and so on. It makes every bet different even with the same seeds, and it starts again when you rotate.']],
      ['I checked a bet and the result is different. What now?', ['First check you copied everything exactly: the whole server seed, the client seed (spaces count), the nonce of that bet, and the right game and settings (difficulty, rows, mines...). If it still differs, contact FaucetPay support with the bet ID - that must never happen and we want to know.']],
      ['Can I check without this website?', ['Yes. The formulas are standard. For example, this Python gives the HMAC-SHA256 that Limbo, Roulette, Diamonds and Towers start from - compare it with "Show me the math" on the game\u2019s page:', h('pre', { class: 'code-block', text: py })]],
      ['Does this page send my data anywhere?', ['No. Everything is calculated in your browser. The page\u2019s security policy (connect-src \u2019none\u2019) technically blocks it from sending anything; you can even save it and use it offline. There are no trackers, cookies or analytics.']],
      ['Why do Crash, Meme Trade and the Lottery have no client seed?', ['Because every player shares the same round, one player\u2019s seed can\u2019t decide it. Instead, public randomness that nobody controls is mixed in: a Bitcoin block (Crash), an Ethereum block (Lottery), the drand beacon (Meme Trade). And for Crash, all rounds were fixed back in January 2023 - the Crash page proves it.']],
      ['Does rotating my seed or changing my client seed change my luck?', ['No. Every seed is equally random. Rotating only lets you check your past bets. Changing your client seed proves FaucetPay can\u2019t prepare results for you, but it doesn\u2019t make you more or less likely to win.']],
      ['What about Slots, prediction markets and sports betting?', ['Slots are made by Basilisk Gaming, who verify them on their own site (linked above). Prediction markets and sports bets are not random at all: they are settled by real-world results, so there is nothing to re-calculate.']],
    ];
    return section('faq', 'Questions', 'Frequently asked questions', null,
      h('div', { class: 'faq' }, items.map(function (q) {
        return h('details', { class: 'faq-item' }, h('summary', null, h('span', { text: q[0] }), icon('chevron-down', 16)), h('div', { class: 'faq-a' }, q[1].map(function (p) { return typeof p === 'string' ? h('p', { text: p }) : p; })));
      })));
  }

  function external(def) {
    return h('section', { class: 'game-page container' },
      h('a', { class: 'back', href: '#/' }, icon('arrow-left', 15), 'All games'),
      h('div', { class: 'card narrow' },
        h('header', { class: 'game-head' }, h('span', { class: 'game-icon big' }, icon(def.icon, 26)), h('div', null, h('div', { class: 'eyebrow', text: 'External provider' }), h('h1', { text: def.name }))),
        h('p', { class: 'lead', text: 'FaucetPay\u2019s slot games are made and run by Basilisk Gaming. They draw the reels and publish their own verifier.' }),
        h('a', { class: 'btn btn-primary', href: def.external, target: '_blank', rel: 'noopener' }, 'Open Basilisk\u2019s verifier', icon('external-link', 15))));
  }

  // ---- router ------------------------------------------------------------------------------------------
  function render() {
    var route = FPV.ui.parseHash();
    FPV.ui.clear(app);
    if (route.page === 'game') {
      var def = FPV.games.get(route.id);
      if (def) {
        document.title = def.name + ' verifier \u00b7 FaucetPay Verify';
        if (def.external) app.appendChild(external(def));
        else FPV.ui.renderGame(def, route.params, app);
        window.scrollTo(0, 0);
        return;
      }
    }
    document.title = 'FaucetPay Verify \u00b7 Check that every game result is fair';
    app.appendChild(hero());
    app.appendChild(steps());
    app.appendChild(gamesGrid());
    app.appendChild(demo());
    app.appendChild(gotchas());
    app.appendChild(faq());
    var target = route.anchor && document.getElementById(route.anchor);
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  var lastPage = null;
  window.addEventListener('hashchange', function () {
    var route = FPV.ui.parseHash();
    var key = route.page === 'game' ? 'game:' + route.id + ':' + location.hash : 'home';
    if (route.page === 'home' && lastPage === 'home') {
      var target = route.anchor && document.getElementById(route.anchor);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    lastPage = key;
    render();
  });

  var first = FPV.ui.parseHash();
  lastPage = first.page === 'home' ? 'home' : 'game';
  render();
})((typeof window !== "undefined" ? window : globalThis).FPV);
