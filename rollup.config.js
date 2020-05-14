import babel from 'rollup-plugin-babel';
import terser from "rollup-plugin-terser";

const plugins = [
    babel({
        exclude: 'node_modules/**'
    }),
    terser.terser()
];

const esModule = {
    input: './src/index.js',
    output: {
        file: './dist/fre.js',
        format: 'es',
        name: 'Fre'
    },
    plugins: [terser.terser()]
};

const es5Module =  {
    input: './src/index.js',
    output: {
        file: './dist/fre.es5.js',
        format: 'es',
        name: 'Fre'
    },
    plugins: plugins
};

const cjsModule = {
    input: './src/index.js',
    output: {
        file: './dist/fre.cjs.js',
        format: 'cjs',
        name: 'Fre'
    },
    plugins: plugins
};

const iifeModule = {
    input: './src/index.js',
    output: {
        file: './dist/fre.iife.js',
        format: 'iife',
        name: 'Fre'
    },
    plugins: plugins
};


export default [
    esModule,
    es5Module,
    cjsModule,
    iifeModule,
];