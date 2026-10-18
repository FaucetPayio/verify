/*
 * FaucetPay Verify - shared building blocks.
 *
 * Everything on this site runs inside your own browser. Nothing you type is
 * sent anywhere: the page's security policy (connect-src 'none') blocks every
 * network request after the page has loaded.
 *
 * The hashing (SHA-256, SHA-512, HMAC-SHA256) is done by your browser's own
 * built-in cryptography (Web Crypto), not by code we wrote. The only hash we
 * implement ourselves is a fast SHA-256 used to walk the Crash hash chain
 * millions of times; it is checked against the built-in one before use.
 *
 * Some games add their fractions with decimals cut - not rounded - to 12
 * places. The helpers below repeat that arithmetic exactly with whole numbers
 * (BigInt), so a result here is the same number the server computed, down to
 * the last digit.
 */
(function (root) {
  'use strict';

  var FPV = (root.FPV = root.FPV || {});
  FPV.fair = FPV.fair || {};

  var encoder = new TextEncoder();

  function subtle() {
    var c = root.crypto;
    if (!c || !c.subtle) {
      throw new Error(
        'Your browser does not allow its built-in cryptography on this page. Open the page over https:// (for example faucetpayio.github.io/verify).'
      );
    }
    return c.subtle;
  }

  function bytesToHex(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    return out;
  }

  function hexToBytes(hex) {
    var out = new Uint8Array(hex.length >> 1);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
  }

  /** SHA-256 of a text, as 64 hex characters. */
  async function sha256Hex(text) {
    return bytesToHex(new Uint8Array(await subtle().digest('SHA-256', encoder.encode(text))));
  }

  /** SHA-512 of a text, as 128 hex characters. */
  async function sha512Hex(text) {
    return bytesToHex(new Uint8Array(await subtle().digest('SHA-512', encoder.encode(text))));
  }

  /**
   * HMAC-SHA256 with `key` (the server seed) over `message`. Returns the 32
   * raw bytes, the standard result any HMAC-SHA256 tool gives.
   */
  async function hmacSha256(key, message) {
    var s = subtle();
    var k = await s.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return new Uint8Array(await s.sign('HMAC', k, encoder.encode(message)));
  }

  /** The standard provably fair byte stream: HMAC(server, "client:nonce:0"), ":1", ... joined. */
  async function hmacStream(serverSeed, clientSeed, nonce, count) {
    var out = new Uint8Array(count);
    var filled = 0;
    for (var cursor = 0; filled < count; cursor++) {
      var block = await hmacSha256(serverSeed, clientSeed + ':' + nonce + ':' + cursor);
      var take = Math.min(32, count - filled);
      out.set(block.subarray(0, take), filled);
      filled += take;
    }
    return out;
  }

  /** Four bytes read as one whole number 0 .. 4,294,967,295 (big-endian). */
  function u32(bytes, offset) {
    return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
  }

  /**
   * floor(u / 2^32 * n): turns four random bytes into a whole number 0..n-1.
   * Exact: u * n stays far below 2^53, and dividing by 2^32 is exact.
   */
  function pick(u, n) {
    return Math.floor((u * n) / 4294967296);
  }

  // ---- 12-decimal arithmetic, exactly ----------------------------------------

  var TEN12 = BigInt('1000000000000');

  /**
   * b0/256 + b1/256^2 + b2/256^3 + b3/256^4 the way the server adds it:
   * every term cut to 12 decimals first, then added.
   * Returned as a whole number of 10^-12 units (a BigInt).
   */
  function fraction12(b0, b1, b2, b3) {
    return (
      (BigInt(b0) * TEN12) / BigInt(256) +
      (BigInt(b1) * TEN12) / BigInt(65536) +
      (BigInt(b2) * TEN12) / BigInt(16777216) +
      (BigInt(b3) * TEN12) / BigInt(4294967296)
    );
  }

  /** The fraction times n, decimals cut off. */
  function fractionTimes(fraction, n) {
    return Number((fraction * BigInt(n)) / TEN12);
  }

  /** "0.123456789012" - a fraction12 written out with its 12 decimals. */
  function fractionString(fraction) {
    var s = fraction.toString();
    while (s.length < 13) s = '0' + s;
    return s.slice(0, s.length - 12) + '.' + s.slice(-12);
  }

  /**
   * Limbo and Crash write the multiplier with 14 significant digits and then
   * cut it to 2 decimals. Repeated here exactly. Returns "12.34".
   */
  function cut2(x) {
    var text = x.toPrecision(14);
    if (text.indexOf('e') !== -1) text = String(Number(text)); // only for numbers far outside any game's range
    if (text.indexOf('.') !== -1) text = text.replace(/0+$/, '').replace(/\.$/, '');
    var parts = text.split('.');
    var dec = ((parts[1] || '') + '00').slice(0, 2);
    return parts[0] + '.' + dec;
  }

  // ---- small helpers ---------------------------------------------------------

  /** A nonce typed by a person -> the exact text the server put in the message. */
  function normalizeNonce(value) {
    var s = String(value == null ? '' : value).trim();
    if (!/^\d{1,15}$/.test(s)) return null;
    return String(Number(s));
  }

  function cleanText(value) {
    return String(value == null ? '' : value).trim();
  }

  /** "1.5" style multiplier from hundredths: 150 -> "1.50". */
  function centsToString(cents) {
    var c = Math.trunc(cents);
    var frac = String(c % 100);
    return Math.floor(c / 100) + '.' + (frac.length < 2 ? '0' + frac : frac);
  }

  function randomHex(bytes) {
    var a = new Uint8Array(bytes);
    root.crypto.getRandomValues(a);
    return bytesToHex(a);
  }

  // ---- fast SHA-256 for the Crash chain ---------------------------------------

  var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  var IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

  function compress(state, w) {
    for (var t = 16; t < 64; t++) {
      var a15 = w[t - 15];
      var a2 = w[t - 2];
      var s0 = ((a15 >>> 7) | (a15 << 25)) ^ ((a15 >>> 18) | (a15 << 14)) ^ (a15 >>> 3);
      var s1 = ((a2 >>> 17) | (a2 << 15)) ^ ((a2 >>> 19) | (a2 << 13)) ^ (a2 >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    var a = state[0], b = state[1], c = state[2], d = state[3], e = state[4], f = state[5], g = state[6], h = state[7];
    for (var i = 0; i < 64; i++) {
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ (~e & g);
      var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    state[0] = (state[0] + a) | 0; state[1] = (state[1] + b) | 0; state[2] = (state[2] + c) | 0; state[3] = (state[3] + d) | 0;
    state[4] = (state[4] + e) | 0; state[5] = (state[5] + f) | 0; state[6] = (state[6] + g) | 0; state[7] = (state[7] + h) | 0;
  }

  var HEX_CODES = new Uint8Array(16);
  for (var hc = 0; hc < 16; hc++) HEX_CODES[hc] = '0123456789abcdef'.charCodeAt(hc);

  /** Eight digest words -> the 16 message words of their 64-character hex text. */
  function hexWords(digest, w) {
    for (var i = 0; i < 8; i++) {
      var x = digest[i];
      w[i * 2] = (HEX_CODES[(x >>> 28) & 15] << 24) | (HEX_CODES[(x >>> 24) & 15] << 16) | (HEX_CODES[(x >>> 20) & 15] << 8) | HEX_CODES[(x >>> 16) & 15];
      w[i * 2 + 1] = (HEX_CODES[(x >>> 12) & 15] << 24) | (HEX_CODES[(x >>> 8) & 15] << 16) | (HEX_CODES[(x >>> 4) & 15] << 8) | HEX_CODES[x & 15];
    }
  }

  function wordsToHex(words) {
    var out = '';
    for (var i = 0; i < 8; i++) out += ('00000000' + (words[i] >>> 0).toString(16)).slice(-8);
    return out;
  }

  function hexToWords(hex) {
    var out = new Int32Array(8);
    for (var i = 0; i < 8; i++) out[i] = parseInt(hex.substr(i * 8, 8), 16) | 0;
    return out;
  }

  /**
   * A walker that repeatedly replaces `hex` (64 lowercase hex characters) by
   * sha256(hex) - the Crash chain step. step(n) runs n steps; current() gives
   * the hex now. Message = 64 ASCII bytes, so 2 blocks: the text and padding.
   */
  function chainWalker(startHex) {
    var digest = hexToWords(startHex);
    var w = new Int32Array(64);
    var state = new Int32Array(8);
    var count = 0;
    function one() {
      for (var i = 0; i < 8; i++) state[i] = IV[i];
      hexWords(digest, w);
      compress(state, w);
      w[0] = 0x80000000 | 0;
      for (var j = 1; j < 15; j++) w[j] = 0;
      w[15] = 512;
      compress(state, w);
      for (var k = 0; k < 8; k++) digest[k] = state[k];
      count++;
    }
    return {
      step: function (n, target) {
        for (var i = 0; i < n; i++) {
          one();
          if (target && digest[0] === target[0] && digest[1] === target[1] && digest[2] === target[2] && digest[3] === target[3] &&
            digest[4] === target[4] && digest[5] === target[5] && digest[6] === target[6] && digest[7] === target[7]) return true;
        }
        return false;
      },
      current: function () { return wordsToHex(digest); },
      count: function () { return count; },
    };
  }

  FPV.core = {
    sha256Hex: sha256Hex,
    sha512Hex: sha512Hex,
    hmacSha256: hmacSha256,
    hmacStream: hmacStream,
    bytesToHex: bytesToHex,
    hexToBytes: hexToBytes,
    u32: u32,
    pick: pick,
    fraction12: fraction12,
    fractionTimes: fractionTimes,
    fractionString: fractionString,
    cut2: cut2,
    normalizeNonce: normalizeNonce,
    cleanText: cleanText,
    centsToString: centsToString,
    randomHex: randomHex,
    chainWalker: chainWalker,
    hexToWords: hexToWords,
  };
})(typeof window !== 'undefined' ? window : globalThis);
