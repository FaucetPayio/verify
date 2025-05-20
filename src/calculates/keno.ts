import { forge } from "calculates";

export const calculateKeno = (
  client_seed: string,
  server_seed: string,
  nonce: string,
) => {
  var result: number[] = [];
  var seeds: string[] = [];
  var split_numbers: number[] = [];
  var deck = Array.from({ length: 40 }, (_, i) => i + 1);

  var md = forge.md.sha256.create();
  md.update(server_seed);
  var server_seed_hash = md.digest().toHex();

  var series_1 = forge.hmac.create();
  series_1.start("sha256", server_seed);
  series_1.update(client_seed + ":" + nonce + ":0");
  const series_1_result = series_1.digest().toHex();

  var series_2 = forge.hmac.create();
  series_2.start("sha256", server_seed);
  series_2.update(client_seed + ":" + nonce + ":1");
  const series_2_result = series_2.digest().toHex();

  let s = 0;

  for (let x = 0; x < 32; x++) {
    s = x * 2;
    seeds.push(series_1_result.substring(x * 2, s + 2));
  }

  for (let x = 0; x < 32; x++) {
    s = x * 2;
    seeds.push(series_2_result.substring(x * 2, s + 2));
  }

  for (let x = 0; x < 10; x++) {
    let s = x * 4;
    let p = 40 - x;

    const seedForNum_1 = parseInt(seeds[s + 0], 16) / Math.pow(256, 1);
    const seedForNum_2 = parseInt(seeds[s + 1], 16) / Math.pow(256, 2);
    const seedForNum_3 = parseInt(seeds[s + 2], 16) / Math.pow(256, 3);
    const seedForNum_4 = parseInt(seeds[s + 3], 16) / Math.pow(256, 4);

    let num1 = parseFloat(seedForNum_1.toString()).toFixed(12);
    let num2 = parseFloat(seedForNum_2.toString()).toFixed(12);
    let num3 = parseFloat(seedForNum_3.toString()).toFixed(12);
    let num4 = parseFloat(seedForNum_4.toString()).toFixed(12);

    let sum = Math.floor((+num1 + +num2 + +num3 + +num4) * p);

    split_numbers.push(sum);
  }

  for (let i = 0; i < split_numbers.length; i++) {
    let number = deck[split_numbers[i]];

    result.push(number);
    deck.splice(split_numbers[i], 1);
  }

  return {
    result,
    seed: server_seed_hash,
  };
};
