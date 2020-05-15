// transpile the builds into es5 compatible versions
import babel from 'rollup-plugin-babel';

// minify the the builds
import terser from "rollup-plugin-terser";

// browser bundle to include everything
const iifeBuild = {
    input: './src/index.js',
    output: {
        file: './dist/fre.iife.js',
        format: 'iife',
        name: 'Fre'
    },
    plugins: [
        babel({
            exclude: 'node_modules/**'
        }),
        terser.terser()
    ]
};

// cjs should expose the root directly (tree shaking should be done automatically on consumption?)
const cjsBuild = [
    {
        name: "fre",
        file: "fre.js",
        output: "index.js"
    }, {
        name: "observable",
        file: "observable/index.js",
    }, {
        name: "operator",
        file: "operator/index.js",
    }, {
        name: "scheduler",
        file: "scheduler/index.js",
    }
].map((entry) => {

    return {
        input: './src/' + entry.file,
        output: {
            file: './dist/' + (entry.output ? entry.output : entry.file),
            format: 'cjs',
            name: entry.name
        },
        plugins: [
            babel({
                exclude: 'node_modules/**'
            }),
            terser.terser()
        ]
    }
});

// only iife bundle and cjsModule to be built by rollup everything else will be handled by make-esmodules
export default [
    iifeBuild,
    ...cjsBuild,
];