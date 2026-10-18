# FaucetPay Verify

**Live:** https://faucetpayio.github.io/verify/

Check any FaucetPay game result yourself. Paste the seeds of a bet and your own
browser re-calculates the result with standard, public maths. If it matches what
you saw in the game, nobody touched it.

- **Runs 100% in your browser.** No server, no account, no tracking.
- **Sends nothing anywhere.** The page's Content-Security-Policy has
  `connect-src 'none'`, so it cannot make a single network request after loading.
- **No build step.** The files in this repository are exactly the files the site
  serves. What you read here is what runs.
- **Standard maths.** SHA-256, SHA-512 and HMAC-SHA256, done by your browser's
  built-in Web Crypto. Every page has a "Show me the math" panel with each
  intermediate value, so you can redo it with any other tool.

## Games

| Game | Randomness | Code |
| --- | --- | --- |
| Dice | SHA-512(server seed:client seed:nonce) | [js/fair/dice.js](js/fair/dice.js) |
| Crash | SHA-256 hash chain published Jan 2023 + Bitcoin block 772,214 | [js/fair/crash.js](js/fair/crash.js) |
| Meme Trade | seedrandom(server seed \| drand beacon) | [js/fair/memetrade.js](js/fair/memetrade.js) |
| Limbo | HMAC-SHA256(server seed, client seed:nonce) | [js/fair/limbo.js](js/fair/limbo.js) |
| Roulette | HMAC-SHA256 | [js/fair/roulette.js](js/fair/roulette.js) |
| Plinko | HMAC-SHA256, one bounce per row | [js/fair/plinko.js](js/fair/plinko.js) |
| Diamonds | HMAC-SHA256, 5 gems | [js/fair/diamonds.js](js/fair/diamonds.js) |
| Towers | HMAC-SHA256 per row | [js/fair/towers.js](js/fair/towers.js) |
| Mines | HMAC-SHA256 shuffle of 25 tiles | [js/fair/mines.js](js/fair/mines.js) |
| Pump | HMAC-SHA256 shuffle of 25 positions | [js/fair/pump.js](js/fair/pump.js) |
| Blackjack | HMAC-SHA256, 52 card draws | [js/fair/blackjack.js](js/fair/blackjack.js) |
| Chicken | HMAC-SHA256 shuffle of 20 lanes | [js/fair/chicken.js](js/fair/chicken.js) |
| Packs | HMAC-SHA256 against a fixed, fingerprinted card table | [js/fair/packs.js](js/fair/packs.js) |
| HiLo | HMAC-SHA256 per card, rejection sampling | [js/fair/hilo.js](js/fair/hilo.js) |
| Snakes | HMAC-SHA256 per roll, two dice | [js/fair/snakes.js](js/fair/snakes.js) |
| Lottery | HMAC-SHA256(server seed, Ethereum block hash) | [js/fair/lottery.js](js/fair/lottery.js) |
| Faucet Dice (FaucetPay-powered faucet sites) | SHA-256(server seed:client seed:nonce) | [js/fair/faucetdice.js](js/fair/faucetdice.js) |
| Slots | Verified by the provider, Basilisk Gaming | https://basiliskgaming.com/verify |

Where a game cuts decimals (not rounds them) to 12 places, or writes a
multiplier with 14 significant digits before cutting it to 2 decimals, the
verifier repeats that arithmetic exactly (`js/core.js`), so results match to
the last digit.

## How it was checked

Before release every verifier was compared with the game servers' own code:
tens of thousands of random seeds per game run through the backend engines and
through these files, every Limbo and Crash payout for all 1,000,000 possible
rolls, the Meme Trade server's golden vectors (exact float bits), real Crash
rounds and real revealed bets from production. All identical.

## Use it offline

Download the repository and open `index.html`, or serve the folder with any
static web server (`python3 -m http.server`). Nothing else is needed.

## Files

```
index.html          the page (and its security policy)
css/style.css       FaucetPay look
js/core.js          hashing (Web Crypto) and the exact 12-decimal arithmetic
js/fair/*.js        one file per game: only the maths
js/views.js         what each game page shows
js/ui.js, js/app.js page building, home page, router
js/vendor/seedrandom.js  seedrandom 3.0.5, unmodified (MIT)
404.html, js/redirect.js old links like /verify/dice -> /verify/#/dice
```

Third-party licences: [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).
