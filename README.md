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

## Dataset

Required files for experiments will be downloaded automatically when running `npm run setup`. Additionally:

The NPM dataset is available at: https://doi.org/10.5281/zenodo.5094598

The original StackOverflow Edits from SOTorrent (code only edit blocks from Node.js accepted answer), that are processed by `script/getSoFixes.js` to create the SOEdit dataset, are available at: [REMOVED LINK]

The SOTorrent dataset is available at: https://empirical-software.engineering/sotorrent/

### SOEdits Dataset

The SOEdits Dataset consists of three subsets:

`soFixes.json` contains all edits pairs with at least one error pre-edit. This is that `all` dataset.

`soFixesImprove.json` is the subset where post-edit, the snippets showed a reduction in errors. This is the `improved` dataset.

`soFixesFixed.json` is the subset where post-edit, all errors were fixed. This is the `fixed` dataset.




## Running Experiments

To generate results:

Run `npm run setup` to download the database of code snippets. This should create a `data` folder.

The test cases are in the `test/info` directory, and can be run with `mocha`.

To see information on TypeScript that was reported in the paper:

```sh
mocha test/info/stats
```

To generate results, use the files in `test/info`. This will produce the required log files, as well as JSON files containing the modified snippets, and their error information (these files are too large to upload to GitHub). The `info-sample` file runs a random 384 sample at each stage that was used for testing. I recommend running the sample first to confirm the configuration is correct. 

### SO Results

The files `info-so-all`, `info-so-fixed` and `info-so-improve` run all stages for each subset of the dataset. 

### NPM Results


Runtime of the entire NPM dataset was 1-2 days on a 3.5Ghz processor.

Because of the long run time the code still outputs each index and dubug info for errors, I recommend piping as such:

```sh
mocha test/info/info-npm-all > run.txt
```

#### NCQ (ESLint) Results

For the old NCQ ESLint configuration at each stage, run:

```sh
mocha test/eslint/info-all
```

This was considerably faster, so all stages are reported in one Log.

Log files will be saved in the `/logs` directory.




 
