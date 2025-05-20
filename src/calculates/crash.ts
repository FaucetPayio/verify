import { forge } from "calculates";
import { toFixed } from "./toFixed";

export interface CrashResult {
  gameHash: string;
  crashPoint: string;
}

export const calculateCrashResult = (
  client_seed: string,
  serverSeed: string,
  numberOfGames: string | number,
) => {
  let lastSeed = serverSeed;
  let actual_hash = "";
  let p1: number,
    p2: number,
    p3: number,
    p4: number,
    roll: number,
    crashPoint: string;

  const result: CrashResult[] = [];

  for (let x = 0; x < numberOfGames; x++) {
    const md = forge.md.sha512.create();
    md.update(client_seed + "-" + lastSeed);
    actual_hash = md.digest().toHex();

    p1 = parseInt(
      (actual_hash.substring(0, 2) + "").replace(/[^a-f0-9]/gi, ""),
      16,
    );
    p2 = parseInt(
      (actual_hash.substring(2, 4) + "").replace(/[^a-f0-9]/gi, ""),
      16,
    );
    p3 = parseInt(
      (actual_hash.substring(4, 6) + "").replace(/[^a-f0-9]/gi, ""),
      16,
    );
    p4 = parseInt(
      (actual_hash.substring(6, 8) + "").replace(/[^a-f0-9]/gi, ""),
      16,
    );

    roll = Math.floor(
      (p1 / Math.pow(256, 1) +
        p2 / Math.pow(256, 2) +
        p3 / Math.pow(256, 3) +
        p4 / Math.pow(256, 4)) *
        1000000,
    );
    crashPoint = toFixed(
      parseFloat(((1000000 / (roll + 1)) * 0.96).toString()),
      2,
    );

    result.push({
      crashPoint,
      gameHash: lastSeed,
    });

    const newSeedMD = forge.md.sha256.create();
    newSeedMD.update(lastSeed);
    lastSeed = newSeedMD.digest().toHex();
  }

  return result;
};
