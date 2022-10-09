import path from "path";
import esbuild from "rollup-plugin-esbuild";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import resolve from "rollup-plugin-node-resolve";

export default [
  {
    input: path.resolve(__dirname, "./index.js"),
    output: [
      {
        // file: path.resolve(__dirname, "../public", "index.js"),
        dir: path.resolve(__dirname, 'esm'),
        format: "cjs",
      },
    ],
    plugins: [
      resolve(),
      babel({
        exclude: ["node_modules/**"],
      }),
      esbuild({
        target: "es2018",
      }),
      terser(),
    ],
  },
];
