// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from "@rollup/plugin-json";

export default {
  input: 'src/frontend.ts',
  output: {
    format: 'umd',
    name: 'funnel',
    file: './.tmp/build/bundle.js'
  },
  plugins: [
    typescript({ tsconfig: 'tsconfig.json' }),
    json(),
    nodeResolve({ browser: true }),
    commonjs()
  ]
};
