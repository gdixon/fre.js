// transpile the builds into es5 compatible versions
import babel from '@rollup/plugin-babel';

// minify the the builds
import terser from "rollup-plugin-terser";

// browser bundle to include everything
const iifeBuild = {
    input: './src/fre.js',
    output: {
        file: './dist/fre.bundle.js',
        format: 'iife',
        name: 'Fre'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        terser.terser()
    ]
};

// only iife bundle to be built by rollup everything else will be handled by tools/make-esmodules
export default [
    iifeBuild
];
