import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';


export default [
    {
        input: 'src/index.js',
        output: [
            { file: 'dist/index.mjs', format: 'esm', name: 'WebSerialBarcodeScanner' },
            { file: 'dist/index.cjs', format: 'cjs', name: 'WebSerialBarcodeScanner' },
            { file: 'dist/index.browser.js', format: 'iife', name: 'WebSerialBarcodeScanner' }
        ],
        plugins: [resolve(), commonjs(), terser()]
    }
];