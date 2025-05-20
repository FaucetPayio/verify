import React from "react";

import { PathContext } from "./type";

const defaultValues: PathContext = {
  page: {
    path: "",
    navigate: () => {},
  },

  defaultLocation: {
    hash: "",
    key: "",
    pathname: "",
    search: "",
    state: {},
  },
};

export const Context = React.createContext<PathContext>(defaultValues);

export default Context;
