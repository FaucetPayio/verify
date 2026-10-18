/* Old links such as /verify/dice or /verify/crash -> /verify/#/dice (404.html loads this). */
(function () {
  'use strict';
  var known = ['dice', 'crash', 'meme-trade', 'limbo', 'roulette', 'plinko', 'diamonds', 'towers', 'mines', 'pump', 'blackjack', 'chicken', 'packs', 'hilo', 'snakes', 'slots', 'lottery', 'faucet-dice'];
  var m = /\/verify\/([a-z-]+)\/?$/.exec(location.pathname);
  var target = '/verify/' + (m && known.indexOf(m[1]) !== -1 ? '#/' + m[1] : '');
  location.replace(target);
})();
