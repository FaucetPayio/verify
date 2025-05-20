import React, { FC } from "react";

interface Props {
  sourceLink?: string;
}

export const Checking: FC<Props> = ({
  sourceLink = "https://github.com/FaucetPayio/verify",
}) => {
  return (
    <p>
      If you are interested in checking the code behind this, please open
      <b>
        <a target="_blank" href={sourceLink}>
          {` source code`}
        </a>
      </b>
      .
    </p>
  );
};
