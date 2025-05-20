import { forge } from "calculates";
import { toFixed } from "./toFixed";

const wheel_outcomes = [
  "1X",
  "6X",
  "1X",
  "12X",
  "1X",
  "3X",
  "1X",
  "6X",
  "1X",
  "3X",
  "1X",
  "52XA",
  "1X",
  "3X",
  "1X",
  "6X",
  "3X",
  "1X",
  "12X",
  "1X",
  "6X",
  "1X",
  "3X",
  "1X",
  "25X",
  "1X",
  "3X",
  "1X",
  "6X",
  "1X",
  "3X",
  "1X",
  "12X",
  "1X",
  "6X",
  "1X",
  "3X",
  "1X",
  "52XB",
  "3X",
  "1X",
  "3X",
  "1X",
  "3X",
  "1X",
  "12X",
  "1X",
  "6X",
  "1X",
  "3X",
  "1X",
  "25X",
  "1X",
  "3X",
];

export const calculateFortune = (
  client_seed: string,
  last_seed: string,
  games: string | number,
) => {
  let actual_hash;
  let p1, p2, p3, p4;

  const result: {
    seed: string;
    outcome: string;
  }[] = [];

  for (let x = 0; x <= games; x++) {
    const md = forge.md.sha512.create();
    md.update(client_seed + "-" + last_seed);
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

    const roll = toFixed(
      p1 / Math.pow(256, 1) +
        p2 / Math.pow(256, 2) +
        p3 / Math.pow(256, 3) +
        p4 / Math.pow(256, 4),
      12,
    );
    const outcome = toFixed(+roll * 53, 0);
    const outcomeResult = wheel_outcomes[+outcome];

    result.push({
      outcome: outcomeResult,
      seed: last_seed,
    });

    var last_seedMD = forge.md.sha256.create();
    last_seedMD.update(last_seed);
    last_seed = last_seedMD.digest().toHex();
  }

  return result;
};
