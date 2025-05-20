import { forge } from "calculates";
import type { TowersDifficulty, TowersBuildLine } from "pages/Towers";
import { toFixed } from "./toFixed";

export const calculateTowers = (
  client_seed: string,
  server_seed: string,
  nonce: string,
  difficulty: TowersDifficulty,
) => {
  let columns = 4;

  if (difficulty === "medium" || difficulty === "wicked") {
    columns = 3;
  } else if (difficulty === "hard") {
    columns = 2;
  }

  const md = forge.md.sha256.create();
  md.update(server_seed);
  let server_seed_hash = md.digest().toHex();

  const matrix_results = [];

  for (let x = 0; x < 9; ++x) {
    const seeds = [];

    const md = forge.md.sha256.create();
    md.update(server_seed);
    server_seed_hash = md.digest().toHex();

    const hash = forge.hmac.create();
    hash.start("sha256", server_seed);
    hash.update(client_seed + ":" + nonce + ":" + x);
    const hashResult = hash.digest().toHex();

    let s = 0;

    for (let k = 0; k < 32; k++) {
      s = k * 2;
      seeds.push(hashResult.substring(k * 2, s + 2));
    }

    const seedForNum_1 = parseInt(seeds[0], 16) / Math.pow(256, 1);
    const seedForNum_2 = parseInt(seeds[1], 16) / Math.pow(256, 2);
    const seedForNum_3 = parseInt(seeds[2], 16) / Math.pow(256, 3);
    const seedForNum_4 = parseInt(seeds[3], 16) / Math.pow(256, 4);

    let num1 = parseFloat(seedForNum_1.toString()).toFixed(12);
    let num2 = parseFloat(seedForNum_2.toString()).toFixed(12);
    let num3 = parseFloat(seedForNum_3.toString()).toFixed(12);
    let num4 = parseFloat(seedForNum_4.toString()).toFixed(12);
    let sum = toFixed(+num1 + +num2 + +num3 + +num4, 12);
    let found_location = parseInt(toFixed(+sum * columns, 0));

    let generated_other_positions = [];

    let good_locations = [];
    let bad_locations = [];

    for (let y = 0; y < columns; y++) {
      if (y === found_location) {
        continue;
      }

      generated_other_positions.push(y);
    }

    if (difficulty === "wicked" || difficulty === "brutal") {
      good_locations.push(found_location);
      bad_locations = generated_other_positions;
    } else {
      good_locations = generated_other_positions;
      bad_locations.push(found_location);
    }

    matrix_results.push({
      good_locations: good_locations,
      bad_locations: bad_locations,
    });
  }

  const reversed = matrix_results.reverse();
  const tower: TowersBuildLine[] = [];

  for (let i = 0; i < reversed.length; i++) {
    let line: TowersBuildLine = [];

    for (let j = 0; j < columns; j++) {
      if (reversed[i]["good_locations"].includes(j)) {
        line.push(true);
      } else {
        line.push(false);
      }
    }
    tower.push(line);
  }

  return {
    tower,
    seed: server_seed_hash,
  };
};
