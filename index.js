const Compiler = require("./src/compiler/compiler");

var compiler = new Compiler();
var code = 'function MyChart() {\n' +
'  const data = React.useMemo(\n' +
'    () => [\n' +
'      [\n' +
'        [1, 10],\n' +
'        [2, 10],\n' +
'        [3, 10],\n' +
'      ],\n' +
'      [\n' +
'        [1, 10],\n' +
'        [2, 10],\n' +
'        [3, 10],\n' +
'      ],\n' +
'      [\n' +
'        [1, 10],\n' +
'        [2, 10],\n' +
'        [3, 10],\n' +
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
'//       <Chart data={data} axes={axes} />\n' +
'    </div>\n' +
'  )\n' +
'}'
async function main(){
    var e;
    try{
        var e = await compiler.compile(code);
    }catch(e){
        console.log(e)
    }

    // e = await compiler.compile("var a");
    console.log(e)

    compiler.close()
}
// main();
