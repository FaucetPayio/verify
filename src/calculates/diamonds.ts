import { forge } from "calculates";

export const calculateDiamonds = (
  client_seed: string,
  server_seed: string,
  nonce: string,
) => {
  const seeds: string[] = [];
  let split_numbers: number[] = [];

  const md = forge.md.sha256.create();
  md.update(server_seed);
  let server_seed_hash = md.digest().toHex();

  var hash_series = forge.hmac.create();
  hash_series.start("sha256", server_seed);
  hash_series.update(client_seed + ":" + nonce);
  const result_hash = hash_series.digest().toHex();

  let s = 0;

  for (let x = 0; x < 32; x++) {
    s = x * 2;
    seeds.push(result_hash.substring(x * 2, s + 2));
  }

  for (let x = 0; x < 20; x++) {
    let s = x * 4;

    const seedForNum_1 = parseInt(seeds[s + 0], 16) / Math.pow(256, 1);
    const seedForNum_2 = parseInt(seeds[s + 1], 16) / Math.pow(256, 2);
    const seedForNum_3 = parseInt(seeds[s + 2], 16) / Math.pow(256, 3);
    const seedForNum_4 = parseInt(seeds[s + 3], 16) / Math.pow(256, 4);

    let num1 = parseFloat(seedForNum_1.toString()).toFixed(12);
    let num2 = parseFloat(seedForNum_2.toString()).toFixed(12);
    let num3 = parseFloat(seedForNum_3.toString()).toFixed(12);
    let num4 = parseFloat(seedForNum_4.toString()).toFixed(12);

    let sum = Math.floor((+num1 + +num2 + +num3 + +num4) * 7);

    split_numbers.push(sum);
  }

  split_numbers = split_numbers.slice(0, 5);

  return {
    diamonds: split_numbers,
    seed: server_seed_hash,
  };
};
