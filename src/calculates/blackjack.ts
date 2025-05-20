import { forge } from "calculates";
import { toFixed } from "./toFixed";

export const calculateBlackJack = (
  client_seed: string,
  server_seed: string,
  nonce: string,
) => {
  const seeds: string[] = [];
  const roll_numbers: number[] = [];
  let position = 0;

  const md = forge.md.sha256.create();
  md.update(server_seed);
  const server_seed_hash = md.digest().toHex();

  let s = 0;

  for (let n = 0; n < 7; n++) {
    const hash_series = forge.hmac.create();
    hash_series.start("sha256", server_seed);
    hash_series.update(client_seed + ":" + nonce + ":" + n);
    const hash_result = hash_series.digest().toHex();

    for (let x = 0; x < 32; x++) {
      s = x * 2;
      seeds.push(hash_result.substring(x * 2, s + 2));
    }
  }

  for (let x = 52; x > 0; x--) {
    const seedForNum_1 = parseInt(seeds[position + 0], 16) / Math.pow(256, 1);
    const seedForNum_2 = parseInt(seeds[position + 1], 16) / Math.pow(256, 2);
    const seedForNum_3 = parseInt(seeds[position + 2], 16) / Math.pow(256, 3);
    const seedForNum_4 = parseInt(seeds[position + 3], 16) / Math.pow(256, 4);

    let num1 = parseFloat(seedForNum_1.toString()).toFixed(12);
    let num2 = parseFloat(seedForNum_2.toString()).toFixed(12);
    let num3 = parseFloat(seedForNum_3.toString()).toFixed(12);
    let num4 = parseFloat(seedForNum_4.toString()).toFixed(12);
    let sum = toFixed(+num1 + +num2 + +num3 + +num4, 12);
    let roll_number = toFixed(+sum * 52, 0);

    position += 4;

    roll_numbers.push(+roll_number);
  }

  const player_hand = [roll_numbers[0], roll_numbers[1]];
  const dealer_hand = [roll_numbers[2], roll_numbers[3]];
  const all_cards = [];

  for (let x = 4; x < 52; x++) {
    all_cards.push(roll_numbers[x]);
  }

  return {
    cards: {
      player: player_hand,
      dealer: dealer_hand,
      all: all_cards,
    },
    seed: server_seed_hash,
  };
};
