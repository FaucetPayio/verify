import { useState } from "react";
import { Checking, Input, PageTemplate } from "components";
import { calculateDiceResult } from "calculates";
import { mainBranch } from "config";

const Dice = () => {
  const [clientSeed, setClientSeed] = useState("");
  const [serverSeed, setServerSeed] = useState("");
  const [nonce, setNonce] = useState("");
  const [returnServerSeed, setReturnServerSeed] = useState("");
  const [rollValue, setRollValue] = useState("");

  const calculate = () => {
    const { rollResult, serverSeed: resultSeed } = calculateDiceResult(
      clientSeed,
      serverSeed,
      nonce,
    );

    setReturnServerSeed(resultSeed);
    setRollValue(rollResult.padStart(4, "0"));
  };

  return (
    <div className={"mainWrapper"}>
      <PageTemplate>
        <ul>
          <li>
            Client Seed: This is a random hexadecimal string generated by your
            computer. The server does know about this client seed prior to the
            bet execution. Ideally, it should be freshly generated for each bet.
            However, some players have their "lucky" client seed which they
            prefer to keep.
          </li>

          <li>
            Server Seed: This is a random hexadecimal string generated by the
            server. It is not shared with the player (until they rotate the
            seed).
          </li>

          <li>
            Server Seed Hash: Since the server seed is not shared with the user,
            the server provides you with a hash of the server seed. This means
            that you can check (after the seed is rotated) whether the server
            was using the correct, shown server seed or not. The server seed
            hash is always unique and corresponds to a server seed being used to
            play games previously.
          </li>
        </ul>

        <Checking sourceLink={`https://github.com/FaucetPayio/verify/blob/${mainBranch}/src/calculates/dice.ts`} />

        <div className="pageContent">
          <div className="inputsRow">
            <Input
              placeholder="Client Seed"
              subTitle="Client Seed comes from your browser and is never generated by the server."
              onChange={({ target }) => setClientSeed(target.value)}
              value={clientSeed}
            />
          </div>

          <div className="inputsRow">
            <Input
              placeholder="Server Seed"
              subTitle="Server Seed is generated by the server. It is only shared with you after you rotate the seed."
              onChange={({ target }) => setServerSeed(target.value)}
              value={serverSeed}
            />

            <Input
              placeholder="Nonce"
              subTitle="Nonce starts from 1 and is a count for the games you play (associated to the particular server seed)."
              onChange={({ target }) => setNonce(target.value)}
              value={nonce}
            />
          </div>

          <div className="inputsRow">
            <Input
              placeholder="Server Seed (SHA-256)"
              subTitle="This is the SHA-256 hash of the Server Seed shown prior to rotation of the seed."
              disabled
              value={returnServerSeed}
              onChange={({ target }) => setReturnServerSeed(target.value)}
            />

            <Input
              placeholder="Actual Outcome"
              subTitle="This is the result/outcome of the game calculated locally in your game. It should match that shown at the main site."
              disabled
              value={rollValue}
              onChange={({ target }) => setRollValue(target.value)}
            />
          </div>

          <button type="button" className="btn btn-info" onClick={calculate}>
            Calculate
          </button>
        </div>
      </PageTemplate>
    </div>
  );
};

export default Dice;
