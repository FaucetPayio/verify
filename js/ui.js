/*
 * FaucetPay Verify - page building blocks (no maths in here; that lives in js/fair/).
 * Text you type is only ever shown with textContent, never as HTML.
 */
(function (FPV) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /** h('div', {class: 'x', onclick: fn}, child, 'text', [more]) */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (p) { el.style.setProperty(p, v[p]); });
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    append(el, Array.prototype.slice.call(arguments, 2));
    return el;
  }

  function append(el, children) {
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) append(el, c);
      else if (typeof c === 'string' || typeof c === 'number') el.appendChild(document.createTextNode(String(c)));
      else el.appendChild(c);
    });
  }

  function svg(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i]) el.appendChild(arguments[i]);
    return el;
  }

  function icon(name, size, cls) {
    var s = svg('svg', {
      width: size || 18, height: size || 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
      class: 'icon' + (cls ? ' ' + cls : ''),
    });
    (FPV.ICONS[name] || []).forEach(function (node) { s.appendChild(svg(node[0], node[1])); });
    return s;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  function copyText(text, button) {
    function done() {
      if (!button) return;
      button.classList.add('copied');
      var label = button.querySelector('.label');
      if (label) label.textContent = 'Copied';
      setTimeout(function () {
        button.classList.remove('copied');
        if (label) label.textContent = button.getAttribute('data-copy-label') || 'Copy';
      }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
    function fallback() {
      var t = h('textarea', { class: 'sr-only' });
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
      document.body.removeChild(t);
      done();
    }
  }

  function copyButton(getText, label) {
    var b = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-copy-label': label || 'Copy' }, icon('copy', 14), h('span', { class: 'label', text: label || 'Copy' }));
    b.addEventListener('click', function () { copyText(typeof getText === 'function' ? getText() : getText, b); });
    return b;
  }

  /** A value shown in a monospace box with a copy button. */
  function codeRow(value) {
    return h('div', { class: 'code-row' }, h('code', { text: value }), copyButton(value));
  }

  // ---- game registry -----------------------------------------------------------

  var GROUPS = {
    seeds: { label: 'Your seeds', hint: 'Server seed + your client seed + nonce' },
    round: { label: 'Shared round', hint: 'One result for everyone, public randomness' },
    draw: { label: 'Daily draw', hint: 'Server seed + an Ethereum block' },
    external: { label: 'External', hint: 'Verified by the game provider' },
    partner: { label: 'Faucet sites', hint: 'On FaucetPay-powered faucet sites' },
  };

  var games = [];
  FPV.games = {
    register: function (def) { games.push(def); },
    list: function () { return games.slice(); },
    get: function (id) { for (var i = 0; i < games.length; i++) if (games[i].id === id) return games[i]; return null; },
    GROUPS: GROUPS,
  };

  // ---- standard fields -----------------------------------------------------------

  var FIELD_LIBRARY = {
    serverSeed: { key: 'serverSeed', param: 'server_seed', label: 'Server seed', mono: true, required: true, placeholder: 'e.g. 9b2f4c...  (64 characters)', help: 'Shown after you rotate your seed.' },
    serverSeedHash: { key: 'serverSeedHash', param: 'server_seed_hash', label: 'Server seed hash', optional: true, mono: true, placeholder: 'Optional: the hashed seed you saw before', help: 'Optional. The "Active server seed (hashed)" you saw before rotating. We check that it matches.' },
    clientSeed: { key: 'clientSeed', param: 'client_seed', label: 'Client seed', mono: true, required: true, placeholder: 'Your client seed', help: 'Yours. You can change it in the game any time.' },
    nonce: { key: 'nonce', param: 'nonce', label: 'Nonce', type: 'nonce', mono: true, required: true, placeholder: 'e.g. 42', help: 'The bet number on this seed: 1, 2, 3 ...' },
  };

  function field(name, extra) {
    var base = FIELD_LIBRARY[name] || {};
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }
  FPV.field = field;

  // ---- router --------------------------------------------------------------------

  function parseHash() {
    var raw = location.hash || '';
    if (raw.indexOf('#/') !== 0) return { page: 'home', anchor: raw.slice(1) };
    var rest = raw.slice(2);
    var q = rest.indexOf('?');
    var id = (q === -1 ? rest : rest.slice(0, q)).replace(/\/$/, '');
    var params = new URLSearchParams(q === -1 ? '' : rest.slice(q + 1));
    if (!id) return { page: 'home', anchor: '' };
    return { page: 'game', id: id, params: params };
  }

  function gameUrl(def, values) {
    var params = new URLSearchParams();
    def.fields.forEach(function (f) {
      var v = values[f.key];
      if (v != null && String(v) !== '') params.set(f.param, String(v));
    });
    var base = location.href.split('#')[0];
    var qs = params.toString();
    return base + '#/' + def.id + (qs ? '?' + qs : '');
  }

  // ---- the game page --------------------------------------------------------------

  var WHERE = {
    seeds: function () { return [
      ['Open the game on faucetpay.io and click ', h('b', { text: 'Fairness' }), ' (the shield icon). Note the ', h('b', { text: 'Active server seed (hashed)' }), ' - that is the fingerprint of the secret seed your bets use.'],
      ['Click ', h('b', { text: 'Rotate seed' }), '. Your old server seed is revealed (give it a minute) and a brand-new one starts.'],
      ['Open your bet history (', h('b', { text: 'Your bets' }), ') and click ', h('b', { text: 'Verify' }), ' on any bet. Copy the client seed, nonce and server seed into the boxes here.'],
    ]; },
  };

  function renderWhere(def) {
    var items = def.where ? def.where() : WHERE[def.group] ? WHERE[def.group]() : [];
    var list = h('ol', { class: 'where-list' });
    items.forEach(function (it) { list.appendChild(h('li', null, it)); });
    var note = def.whereNote !== undefined ? def.whereNote : def.group === 'seeds'
      ? 'Why can\u2019t you see the server seed of your current bets? Because with it you could calculate every next result in advance. You see its fingerprint instead, and the seed itself after you rotate.'
      : null;
    return h('details', { class: 'where' }, h('summary', null, icon('search', 15), ' Where do I find these?'), list, note ? h('p', { class: 'muted small', text: note }) : null);
  }

  function inputFor(f, value, onChange) {
    var id = 'f-' + f.key;
    var control;
    if (f.type === 'select') {
      control = h('select', { id: id, name: f.key });
      f.options.forEach(function (o) {
        var opt = h('option', { value: o[0], text: o[1] });
        if (String(o[0]) === String(value)) opt.selected = true;
        control.appendChild(opt);
      });
      control.addEventListener('change', onChange);
    } else {
      control = h('input', {
        id: id, name: f.key, type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off',
        inputmode: f.type === 'nonce' || f.type === 'int' ? 'numeric' : null,
        placeholder: f.placeholder || '', class: f.mono ? 'mono' : null,
      });
      control.value = value == null ? '' : String(value);
      control.addEventListener('input', onChange);
    }
    return h('label', { class: 'field' + (f.wide ? ' wide' : ''), for: id },
      h('span', { class: 'field-label' }, f.label, f.optional ? h('span', { class: 'opt', text: 'optional' }) : null),
      control,
      f.help ? h('span', { class: 'field-help', text: f.help }) : null);
  }

  function readValues(def, form) {
    var values = {};
    def.fields.forEach(function (f) {
      var el = form.querySelector('[name="' + f.key + '"]');
      values[f.key] = el ? el.value : '';
    });
    return values;
  }

  /** Clean and check the raw form values; returns {input} or {error}. */
  function prepare(def, values) {
    var input = {};
    for (var i = 0; i < def.fields.length; i++) {
      var f = def.fields[i];
      var raw = values[f.key];
      var v = FPV.core.cleanText(raw);
      if (f.type === 'nonce' || f.type === 'int') {
        if (v === '' && f.optional) { input[f.key] = ''; continue; }
        var n = FPV.core.normalizeNonce(v);
        if (n === null) return v === '' ? { missing: true } : { error: f.label + ' must be a whole number.' };
        if (f.min != null && Number(n) < f.min) return { error: f.label + ' must be at least ' + f.min + '.' };
        if (f.max != null && Number(n) > f.max) return { error: f.label + ' can be at most ' + f.max + '.' };
        v = n;
      }
      if (f.lower) v = v.toLowerCase();
      if (f.required && v === '') return { missing: true };
      input[f.key] = v;
    }
    return { input: input };
  }

  function seedCheck(def, input) {
    var seedKey = def.hashOf || 'serverSeed';
    var seed = input[seedKey];
    if (!seed) return null;
    var box = h('div', { class: 'seed-check' });
    FPV.core.sha256Hex(seed).then(function (hash) {
      var given = (input.serverSeedHash || '').toLowerCase();
      var head;
      if (!given) {
        head = h('div', { class: 'check-head neutral' }, icon('fingerprint-pattern', 18),
          h('div', null, h('b', { text: 'Fingerprint of this server seed' }),
            h('span', { text: 'Compare it with the hashed seed you saw before. Same text = same seed. (Or paste it in "Server seed hash" and we compare for you.)' })));
      } else if (given === hash) {
        head = h('div', { class: 'check-head ok' }, icon('circle-check', 18),
          h('div', null, h('b', { text: 'Genuine: the seed matches its fingerprint' }),
            h('span', { text: 'This is exactly the seed that was locked in before the bets. It cannot have been swapped.' })));
      } else {
        head = h('div', { class: 'check-head bad' }, icon('circle-x', 18),
          h('div', null, h('b', { text: 'No match' }),
            h('span', { text: 'This server seed does not belong to that fingerprint. Check that you copied both completely, from the same seed.' })));
      }
      box.appendChild(head);
      box.appendChild(h('div', { class: 'kv' }, h('span', { class: 'k', text: 'SHA-256(server seed)' }), codeRow(hash)));
    });
    return box;
  }

  function stepsList(steps) {
    var ol = h('ol', { class: 'steps' });
    steps.forEach(function (s) {
      ol.appendChild(h('li', null,
        h('div', { class: 'step-t', text: s.t }),
        s.v != null ? h('code', { class: 'step-v', text: s.v }) : null,
        s.d ? h('div', { class: 'step-d', text: s.d }) : null));
    });
    return ol;
  }

  function renderGame(def, params, root) {
    var values = {};
    def.fields.forEach(function (f) {
      var p = params && params.get(f.param);
      values[f.key] = p != null ? p : f.default != null ? f.default : '';
    });

    var resultBox = h('div', { class: 'result-body' });
    var form = h('form', { class: 'game-form', autocomplete: 'off', novalidate: true });
    var timer = null;
    var run = 0;

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(compute, 220);
    }

    function empty() {
      clear(resultBox).appendChild(h('div', { class: 'empty' },
        icon('shield-check', 28),
        h('p', null, 'Fill in the boxes to see the result.'),
        h('p', { class: 'muted small' }, 'No bet at hand? Press ', h('b', { text: 'Try an example' }), ' to see how it works.')));
    }

    async function compute() {
      var mine = ++run;
      var prepared = prepare(def, readValues(def, form));
      if (prepared.missing) return empty();
      if (prepared.error) {
        clear(resultBox).appendChild(h('div', { class: 'alert bad' }, icon('circle-alert', 16), h('span', { text: prepared.error })));
        return;
      }
      var input = prepared.input;
      try {
        var result = await def.verify(input);
        if (mine !== run) return;
        clear(resultBox);
        var headline = def.headline(result, input);
        resultBox.appendChild(h('div', { class: 'headline' },
          h('div', { class: 'headline-label', text: headline.label }),
          h('div', { class: 'headline-value' + (headline.tone ? ' ' + headline.tone : ''), text: headline.value }),
          headline.sub ? h('div', { class: 'headline-sub', text: headline.sub }) : null));
        var visual = def.render ? def.render(result, input) : null;
        if (visual) resultBox.appendChild(h('div', { class: 'visual' }, visual));
        if (def.compareNote !== false) {
          resultBox.appendChild(h('p', { class: 'match-note' }, icon('badge-check', 16),
            h('span', { text: def.compareNote || 'This is the result the server\u2019s formula gives for these values. If it is what you saw in the game, your bet was fair.' })));
        }
        var check = def.noSeedCheck ? null : seedCheck(def, input);
        if (check) resultBox.appendChild(check);
        if (def.extra) {
          var extra = def.extra(result, input);
          if (extra) resultBox.appendChild(extra);
        }
        resultBox.appendChild(h('details', { class: 'math' },
          h('summary', null, icon('calculator', 15), ' Show me the math, step by step'),
          h('p', { class: 'muted small', text: 'Every number below can be re-calculated with any SHA-256 / HMAC tool or a few lines of code.' }),
          stepsList(result.steps || [])));
        resultBox.appendChild(h('div', { class: 'result-actions' },
          copyButton(function () { return gameUrl(def, readValues(def, form)); }, 'Copy link to this check'),
          h('a', { class: 'btn btn-ghost btn-sm', href: def.source, target: '_blank', rel: 'noopener' }, icon('file-code', 14), 'Read this game\u2019s code')));
      } catch (e) {
        if (mine !== run) return;
        clear(resultBox).appendChild(h('div', { class: 'alert bad' }, icon('circle-alert', 16), h('span', { text: e && e.message ? e.message : String(e) })));
      }
    }

    var grid = h('div', { class: 'fields' });
    def.fields.forEach(function (f) { grid.appendChild(inputFor(f, values[f.key], schedule)); });

    function fillExample() {
      var ex = def.example ? def.example() : {
        serverSeed: FPV.core.randomHex(32),
        clientSeed: FPV.core.randomHex(8),
        nonce: String(1 + Math.floor(Math.random() * 50)),
      };
      def.fields.forEach(function (f) {
        var el = form.querySelector('[name="' + f.key + '"]');
        if (!el) return;
        if (f.key === 'serverSeedHash') el.value = '';
        else if (ex[f.key] != null) el.value = ex[f.key];
      });
      if (ex.serverSeed && def.fields.some(function (f) { return f.key === 'serverSeedHash'; })) {
        FPV.core.sha256Hex(ex.serverSeed).then(function (hash) {
          form.querySelector('[name="serverSeedHash"]').value = hash;
          compute();
        });
      } else compute();
    }

    form.appendChild(grid);
    form.appendChild(h('div', { class: 'form-actions' },
      h('button', { type: 'submit', class: 'btn btn-primary' }, icon('shield-check', 16), 'Verify'),
      h('button', { type: 'button', class: 'btn btn-ghost', onclick: fillExample }, icon('wand-sparkles', 15), 'Try an example'),
      h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { form.reset(); grid.querySelectorAll('input').forEach(function (i) { i.value = ''; }); empty(); } }, 'Clear')));
    form.addEventListener('submit', function (e) { e.preventDefault(); compute(); });

    var group = GROUPS[def.group];
    root.appendChild(h('section', { class: 'game-page container' },
      h('a', { class: 'back', href: '#/' }, icon('arrow-left', 15), 'All games'),
      h('header', { class: 'game-head' },
        h('span', { class: 'game-icon big' }, icon(def.icon, 26)),
        h('div', null,
          h('div', { class: 'eyebrow' }, group.label, h('span', { class: 'dot' }), 'Provably fair'),
          h('h1', { text: def.name }),
          h('p', { class: 'lead' }, h('b', { text: 'What\u2019s random: ' }), def.random))),
      h('div', { class: 'game-grid' },
        h('div', { class: 'card' },
          h('div', { class: 'card-title' }, h('span', { class: 'num', text: '1' }), h('h2', { text: def.formTitle || 'Paste your bet\u2019s details' })),
          renderWhere(def),
          form),
        h('div', { class: 'card result-card' },
          h('div', { class: 'card-title' }, h('span', { class: 'num', text: '2' }), h('h2', { text: 'The result' })),
          resultBox)),
      h('section', { class: 'card recipe' },
        h('div', { class: 'card-title' }, icon('list-checks', 18), h('h2', { text: 'How ' + def.name + ' is made random' })),
        h('ol', { class: 'recipe-list' }, def.recipe.map(function (r) { return h('li', null, r); })),
        h('p', { class: 'muted small' }, 'The exact code: ', h('a', { href: def.source, target: '_blank', rel: 'noopener', text: def.source }), ' (the very file this page runs).'))));

    empty();
    var hasParams = def.fields.some(function (f) { return params && params.get(f.param); });
    if (hasParams) compute();
  }

  FPV.ui = {
    h: h, svg: svg, icon: icon, clear: clear, copyText: copyText, copyButton: copyButton, codeRow: codeRow,
    parseHash: parseHash, renderGame: renderGame, stepsList: stepsList,
  };
})((typeof window !== "undefined" ? window : globalThis).FPV);
