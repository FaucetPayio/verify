import { forge } from "calculates";
import { toFixed } from "./toFixed";

export const calculateRoulette = (
  client_seed: string,
  server_seed: string,
  nonce: string,
) => {
  var seeds: string[] = [];

  var md = forge.md.sha256.create();
  md.update(server_seed);
  var server_seed_hash = md.digest().toHex();

  var hash_series = forge.hmac.create();
  hash_series.start("sha256", server_seed);
  hash_series.update(client_seed + ":" + nonce);
  const hash_result = hash_series.digest().toHex();

  let s = 0;

  for (let x = 0; x < 32; x++) {
    s = x * 2;
    seeds.push(hash_result.substring(x * 2, s + 2));
  }

  const seedForNum_1 = parseInt(seeds[0], 16) / Math.pow(256, 1);
  const seedForNum_2 = parseInt(seeds[1], 16) / Math.pow(256, 2);
  const seedForNum_3 = parseInt(seeds[2], 16) / Math.pow(256, 3);
  const seedForNum_4 = parseInt(seeds[3], 16) / Math.pow(256, 4);

  let num1 = parseFloat(seedForNum_1.toString()).toFixed(12);
  let num2 = parseFloat(seedForNum_2.toString()).toFixed(12);
  let num3 = parseFloat(seedForNum_3.toString()).toFixed(12);
  let num4 = parseFloat(seedForNum_4.toString()).toFixed(12);

  let roll_number = toFixed((+num1 + +num2 + +num3 + +num4) * 37, 0);

  return {
    result: roll_number,
    seed: server_seed_hash,
  };
};
