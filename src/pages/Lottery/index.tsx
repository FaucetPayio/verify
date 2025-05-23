import { useState } from "react";
import { Checking, Input, PageTemplate } from "components";
import { calculateLottery } from "calculates";
import { mainBranch } from "config";

const Lottery = () => {
  const [clientSeed, setClientSeed] = useState("");
  const [serverSeed, setServerSeed] = useState("");

  const [result, setResult] = useState({
    hash: "",
    jackpot: "",
    winNumbers: "",
  });

  const calculate = () => {
    const { hash, jackpot, winNumbers } = calculateLottery(
      clientSeed,
      serverSeed,
    );

    setResult({
      hash,
      jackpot: jackpot + "",
      winNumbers: winNumbers.join(", "),
    });
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

        <Checking sourceLink={`https://github.com/FaucetPayio/verify/blob/${mainBranch}/src/calculates/lottery.ts`} />

        <div className="pageContent">
          <div className="inputsRow">
            <Input
              title="Client Seed"
              subTitle="Target block of ETH blockchain"
              value={clientSeed}
              onChange={({ target }) => setClientSeed(target.value)}
            />
            <Input
              title="Server Seed"
              subTitle="Server Seed is randomly generated by the server. It is only shared with you after you rotate the seed."
              value={serverSeed}
              onChange={({ target }) => setServerSeed(target.value)}
            />
          </div>

          <div className="inputsRow">
            <Input disabled title="Winning numbers" value={result.winNumbers} />
            <Input disabled title="Jackpot number" value={result.jackpot} />
          </div>

          <div className="inputsRow">
            <Input
              disabled
              title="Server Seed (SHA-256)"
              subTitle="This is the SHA-256 hash of the Server Seed shown prior to lottery draw."
              value={result.hash}
            />
          </div>

          <button
            type="button"
            className="btn btn-info marginTop"
            onClick={calculate}>
            Calculate
          </button>
        </div>
      </PageTemplate>
    </div>
  );
};

export default Lottery;
