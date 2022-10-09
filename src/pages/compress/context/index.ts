import React from "react";
import { FontParam } from "../types";

export const FontContext = React.createContext<FontParam>({
  text: "",
  fontFile: null,
  fontBuffer: null,
  types: ["eot", "svg", "ttf", "woff"]
});
