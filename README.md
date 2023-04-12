# node_code_correction

## Install

Clone and run `npm install` to install dependencies.

To install as a dependency (from GitHub) run:

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

Fix a set of strings:

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

To see information on TypeScript that was reported in the paper:

```sh
mocha test/info/stats
```

To run each stage of NCC, run the `info-all`, `info-ts` and `info-errors` files. 
These will produce the required log files, as well as JSON files containing the modified snippets, and their error information (these files are too large to upload to GitHub). The `info-sample` file runs a random 384 sample at each stage that was used for testing. I recommend running the sample first to confirm the configuration is correct.

Runtime of the entire NPM dataset was 1-2 days on a 3.5Ghz processor.

Because of the long run time the code still outputs each index and dubug info for errors, I recommend piping as such:

```sh
mocha test/info/info-all > run.txt
```


For the old NCQ ESLint configuration at each stage, run:

```sh
mocha test/info/eslint/info-all
```

This was considerably faster so all stages are reported in one Log.

Log files will be saved in the `/logs` directory.




 
