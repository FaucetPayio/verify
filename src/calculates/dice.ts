import { forge } from "calculates";

export const calculateDiceResult = (
  clientSeed: string,
  serverSeed: string,
  nonce: string | number,
) => {
  let combo = serverSeed + ":" + clientSeed + ":" + nonce;

  const serverMD = forge.md.sha256.create();
  serverMD.update(serverSeed);
  var serverSeedHash = serverMD.digest().toHex();

  const comboMD = forge.md.sha512.create();
  comboMD.update(combo);
  combo = comboMD.digest().toHex();

  const combo_length = combo.length;
  let index = 0;
  let lucky = 1000000;
  let hexString = "";

  while (lucky >= 1000000) {
    hexString = combo.substring(index, index + 5);
    lucky = parseInt((hexString + "").replace(/[^a-f0-9]/gi, ""), 16);

    if (index + 5 > combo_length) {
      break;
    }

    index = index + 5;
  }

  let roll = 0;

  let result = "Impossible Game";

  if (lucky < 1000000) {
    roll = lucky % 10000;
    result = `${roll}`;
  }

  return {
    serverSeed: serverSeedHash,
    rollResult: result,
  };
};
