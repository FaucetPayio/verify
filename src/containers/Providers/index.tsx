import React, { FC } from "react";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { PathProvider } from "providers";

interface Props {
  children?: React.ReactNode;
}

export const Providers: FC<Props> = ({ children }) => {
  return (
    <>
      <HashRouter>
        <PathProvider>{children}</PathProvider>
      </HashRouter>
    </>
  );
};
