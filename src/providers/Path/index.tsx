import React, { FC, useEffect, useState } from "react";
import { useLocation, useNavigate, NavigateOptions } from "react-router";

import Context from "./context";
import { clearSlash } from "./utils";
import { SearchParams } from "./hook/type";

interface Props {
  children?: React.ReactNode;
}

interface State {
  pagePath: string;
}

const modalSplitter = "/modal/";

export const PathProvider: FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<State>({
    pagePath: location.pathname,
  });

  useEffect(() => {
    const { pathname } = location;

    const [pagePath] = pathname.split(modalSplitter) as [string?, string?];

    setState((old) => ({
      ...old,
      pagePath: pagePath || "/",
    }));
  }, [location.pathname]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const entities = searchParams.entries();
    const returnParams: SearchParams = {};

    for (const [key, value] of entities) {
      const param = returnParams[key];
      if (!param) {
        returnParams[key] = [value];
      } else {
        param.push(value);
      }
    }

    // setSearchParams(returnParams);
    setState((old) => ({ ...old, searchParams: returnParams }));
  }, [location.search]);

  const setPath = (to: string, options?: NavigateOptions) => {
    if (location.pathname !== to) navigate(clearSlash(to), options);
  };

  return (
    <Context.Provider
      value={{
        page: {
          path: state.pagePath,
          navigate: setPath,
        },

        defaultLocation: location,
      }}>
      {children}
    </Context.Provider>
  );
};
