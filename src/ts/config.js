/**
 * Shared config between LS and Compiler.
 */
const Config = {
    filteredErrors : [
        2307, //cannot find module - this is because we do not install every package.
        //should be warnings
        2403, //subsequent must be of type
    ],
    filteredFixes : [
        "disableJsDiagnostics"
    ],
    compilerOptions : {
        module: "esnext",
        target: "esnext",
        lib:["esnext"], //ignore dom etc
        allowJs: true,
        checkJs:true,
        types: ["node"],
        jsx: false,
        // skipDefaultLibCheck: true,
        // skipLibCheck: true,
        // strict: false,
        // emitDecoratorMetadata: true,
        // experimentalDecorators: true,
        // noEmitOnError: true,
        // noImplicitAny: false,
        removeComments: false,
    }
}

module.exports = Config;