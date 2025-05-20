import React, { FC } from "react";

interface Props {
  children?: React.ReactNode;
}

export const PageTemplate: FC<Props> = ({ children }) => {
  return (
    <div>
      <p className="lead">
        This page does not send any data to the server. All of the calculations
        happen right in your browser.
      </p>

      <p>We've the following parameters:</p>

      {children}
    </div>
  );
};
