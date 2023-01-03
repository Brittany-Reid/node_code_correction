require("mocha");
var assert = require("assert");
const Compiler = require("../src/compiler/compiler");
const Fixer = require("../src/fixer");
const Snippet = require("../src/snippet");

var compiler;
var fixer;

describe("Fixer", function () {

    this.beforeAll(()=>{
        compiler = new Compiler();
        fixer = new Fixer(compiler);
    })

    describe("functions", function () {
        it("Should fix a snippet", async function () {
            var code = `console.log(a);\nconsole.log(b);`
            var snippet = new Snippet(code);
            var fixed = await fixer.fix(snippet);
            assert.strictEqual(fixed.errors.length, 0)
            assert.strictEqual(fixed.code, `// console.log(a);\n// console.log(b);`)
        });
    });
    it("handle snippet with no errors", async function () {
        var code = `require('babel-core').transform('code', {
            plugins: [
                ['react-remove-properties', {properties: ['data-test', 'data-foo', /my-suffix-expression$/]}],
            ],
            });`
        var snippet = new Snippet(code);
        var fixed = await fixer.fix(snippet);
        assert.strictEqual(fixed.errors.length, 0);
        assert.strictEqual(fixed.fixed, false)
    });
    it("should not endless loop on commented out errors", async function () {
        //i couldn't really minimize this case
        var code = 'function MyChart() {\n' +
        '  const data = React.useMemo(\n' +
        '    () => [\n' +
        '      [\n' +
        '        [1, 10],\n' +
        '      ],\n' +
        '      [\n' +
        '        [1, 10],\n' +
        '      ],\n' +
        '      [\n' +
        '        [1, 10],\n' +
        '      ],\n' +
        '    ],\n' +
        '    []\n' +
        '  )\n' +
        '\n' +
        '  const axes = React.useMemo(\n' +
        '    () => [\n' +
        "      { primary: true, type: 'linear', position: 'bottom' },\n" +
        "      { type: 'linear', position: 'left' },\n" +
        '    ],\n' +
        '    []\n' +
        '  )\n' +
        '\n' +
        '  return (\n' +
        '    <div\n' +
        '      style={{\n' +
        "        width: '400px',\n" +
        "        height: '300px',\n" +
        '      }}\n' +
        '    >\n' +
        '      <Chart />\n' +
        '    </div>\n' +
        '  )\n' +
        '}'
        var snippet = new Snippet(code);
        var fixed = await fixer.fix(snippet);
        assert.strictEqual(fixed.errors[4].line, 32);
        assert.strictEqual(fixed.code.split("\n")[32-1], "//       <Chart />");
    });

    //# 2P-Kt version LAST_VERSION_HERE

//?- <write your dot-terminated Prolog query here>.


    this.afterAll(()=>{
        compiler.close();
    })
});