import { forge } from "calculates";
import { toFixed } from "./toFixed";

export const calculateVideoPoker = (
  client_seed: string,
  server_seed: string,
  nonce: string,
) => {
  const seeds: string[] = [];
  const roll_numbers: string[] = [];
  let position = 0;

  const md = forge.md.sha256.create();
  md.update(server_seed);
  const server_seed_hash = md.digest().toHex();

  let s = 0;

  for (let n = 0; n < 8; n++) {
    const hash_series = forge.hmac.create();
    hash_series.start("sha256", server_seed);
    hash_series.update(client_seed + ":" + nonce + ":" + n);
    const series_result = hash_series.digest().toHex();

    for (let x = 0; x < 32; x++) {
      s = x * 2;
      seeds.push(series_result.substring(x * 2, s + 2));
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

    const sum = toFixed(+num1 + +num2 + +num3 + +num4, 12);
    let roll_number = toFixed(+sum * x, 0);

    position += 4;

    roll_numbers.push(roll_number);
  }

  let deck = Array.from(Array(51).keys());
  let initial_cards: number[] = [];
  let coming_cards: number[] = [];

  roll_numbers.every((i) => {
    let card_id = deck[+i];

    if (initial_cards.length < 5) {
      initial_cards.push(card_id);
    } else if (coming_cards.length < 5) {
      coming_cards.push(card_id);
    } else {
      return false;
    }

    deck.splice(+i, 1);

    return true;
  });

  return {
    cards: {
      initial: initial_cards,
      coming: coming_cards,
    },
    seed: server_seed_hash,
  };
};
