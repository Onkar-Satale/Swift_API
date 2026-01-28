import { createContext } from "react";

export const RequestContext = createContext({
  requestCount: 0,
  setRequestCount: () => { },
});
