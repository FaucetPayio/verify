import { forge } from "calculates";

export const calculateLottery = (client_seed: string, server_seed: string) => {
  const md = forge.md.sha256.create();
  md.update(server_seed);
  const server_seed_hash = md.digest().toHex();

  const game_hash = forge.hmac.create();
  game_hash.start("sha256", server_seed);
  game_hash.update(client_seed);
  const hash_result = game_hash.digest().toHex();

  const remainingBalls = Array(36)
    .fill(null)
    .map((v, i) => i + 1);
  const balls = [];

  for (let i = 0; i < 5; i++) {
    const cut = i * 8;
    const random = parseInt(hash_result.substring(cut, cut + 8), 16);

    const index = Math.floor((random / 0x100000000) * remainingBalls.length);
    balls.push(remainingBalls.splice(index, 1)[0]);
  }

  const jackpot =
    Math.floor(
      (parseInt(hash_result.substring(40, 48), 16) / 0x100000000) * 10,
    ) + 1;

  return {
    winNumbers: balls,
    jackpot,
    hash: server_seed_hash,
  };
};
