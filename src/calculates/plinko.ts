import { forge } from "calculates";
import { plinko_payouts } from "./plinkoPayouts";

export type PlinkoRisk = "low" | "medium" | "high";

export const calculatePlinko = (
  client_seed: string,
  server_seed: string,
  nonce: string,
  rows: number,
  risk: PlinkoRisk,
) => {
  const seeds: string[] = [];
  let split_numbers: number[] = [];
  let position = 0;

  const md = forge.md.sha256.create();
  md.update(server_seed);
  var server_seed_hash = md.digest().toHex();

  let series_1 = forge.hmac.create();
  series_1.start("sha256", server_seed);
  series_1.update(client_seed + ":" + nonce + ":0");
  const series_1_hash = series_1.digest().toHex();

  let series_2 = forge.hmac.create();
  series_2.start("sha256", server_seed);
  series_2.update(client_seed + ":" + nonce + ":1");
  const series_2_hash = series_2.digest().toHex();

  let series_3 = forge.hmac.create();
  series_3.start("sha256", server_seed);
  series_3.update(client_seed + ":" + nonce + ":2");
  const series_3_hash = series_3.digest().toHex();

  let s = 0;

  for (let x = 0; x < 32; x++) {
    s = x * 2;
    seeds.push(series_1_hash.substring(x * 2, s + 2));
  }

  for (let x = 0; x < 32; x++) {
    s = x * 2;
    seeds.push(series_2_hash.substring(x * 2, s + 2));
  }

  for (let x = 0; x < 32; x++) {
    s = x * 2;
    seeds.push(series_3_hash.substring(x * 2, s + 2));
  }

  for (let x = 0; x < 20; x++) {
    let s = x * 4;

    const seedForNum_1 = parseInt(seeds[s], 16) / Math.pow(256, 1);
    const seedForNum_2 = parseInt(seeds[s + 1], 16) / Math.pow(256, 2);
    const seedForNum_3 = parseInt(seeds[s + 2], 16) / Math.pow(256, 3);
    const seedForNum_4 = parseInt(seeds[s + 3], 16) / Math.pow(256, 4);

    let num1 = parseFloat(seedForNum_1.toString()).toFixed(12);
    let num2 = parseFloat(seedForNum_2.toString()).toFixed(12);
    let num3 = parseFloat(seedForNum_3.toString()).toFixed(12);
    let num4 = parseFloat(seedForNum_4.toString()).toFixed(12);

    const sum = Math.floor((+num1 + +num2 + +num3 + +num4) * 2);

    split_numbers.push(sum);
  }

  split_numbers = split_numbers.slice(0, rows);

  for (let i = 0; i < split_numbers.length; i++) {
    position = +position + +split_numbers[i];
  }

  return {
    result:
      plinko_payouts[rows as unknown as keyof typeof plinko_payouts][risk][
        position
      ],
    server_seed_hash,
  };
};
