import babel from 'rollup-plugin-babel';

import terser from "rollup-plugin-terser";

const plugins = [
    babel({
        exclude: 'node_modules/**'
    }),
    terser.terser()
];

const entries = [{
    name: "fre",
    file: "fre.js"
}, {
    name: "observable",
    file: "./observable/index.js",
}, {
    name: "operator",
    file: "./operator/index.js",
}, {
    name: "scheduler",
    file: "./scheduler/index.js",
}];

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

const es5Module = entries.map((entry) => {

    return {
        input: './src/' + entry.file,
        output: {
            file: './dist/es5/' + entry.file,
            format: 'es',
            name: entry.name
        },
        plugins: plugins
    }
});

const esModule = entries.map((entry) => {

    return {
        input: './src/' + entry.file,
        output: {
            file: './dist/es2015/' + entry.file,
            format: 'es',
            name: entry.name
        },
        plugins: [terser.terser()]
    }
});

export default [
    cjsModule,
    iifeModule,
    ...esModule,
    ...es5Module
];