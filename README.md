# node_code_correction

## Install

Clone and run `npm install` to install dependencies.

To install as a dependency (from GitHub) run:
<!--
```sh
npm install --save "https://github.com/Brittany-Reid/node_code_correction.git"
```-->

[REMOVED LINK]

## Usage

### As a dependency

Import as:

```js
const NCC = require("node_code_correction");
```

Compile a set of strings:

```js
const NCC = require("node_code_correction");

var snippets = ["var a = 0;"];
var compiled = await NCC.getErrors(snippets); // returns Snippet objects
console.log(compiled[0].errors) // -> []
```

```js
const NCC = require("node_code_correction");

var snippets = ["console.log(a);"];
var fixed = await NCC.fix(snippets);
console.log(fixed[0].code) // -> "// console.log(a);"
```

### For experiments:

To generate results:

Run `npm run setup` to download the database of code snippets. This should create a `data` folder.

The test cases are in the `test/info` directory, and can be run with `mocha`.

For the old NCQ ESLint configuration, run:

```sh
mocha test/info/eslint/info-all
```




 
