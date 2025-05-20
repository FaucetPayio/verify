import { Location, NavigateOptions } from "react-router-dom";

export interface PathContext {
  page: {
    path: string;
    navigate: (to: string, options?: NavigateOptions) => void;
  };

  defaultLocation: Location;
}
