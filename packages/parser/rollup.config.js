import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
// import typescript from '@rollup/plugin-typescript';

export default [
    {
        input: 'src/index.js',
        output: [
            { file: 'dist/index.mjs', format: 'esm', name: 'BarcodeDataParser' },
            { file: 'dist/index.cjs', format: 'cjs', name: 'BarcodeDataParser' },
            { file: 'dist/index.browser.js', format: 'iife', name: 'BarcodeDataParser' }
        ],
        plugins: [resolve(), commonjs(), terser()]
    }
];