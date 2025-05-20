import { useContext } from "react";
import Context from "../context";

export const usePath = () => {
  return useContext(Context);
};

