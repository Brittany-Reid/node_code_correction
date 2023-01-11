const ts = require("typescript");
const NCC = require(".");
const Evaluator = require("./src/ncq/evaluator");
const Snippet = require("./src/snippet");

var snippets = [
    `const {username, email} = await prompt.get(['username', 'email']);`,
    `const { prompt } = require('enquirer');
    const question = [
      {
        type: 'input',
        name: 'username',
        message: 'What is your username?'
      },
      {
        type: 'password',
        name: 'password',
        message: 'What is your password?'
      }
    ];
    
    let answers = await prompt(question);
    console.log(answers);`,
    `(async () => {
        const questions = [{ ... }];
        const onCancel = prompt => {
          console.log('Never stop prompting!');
          return true;
        }
        const response = await prompts(questions, { onCancel });
      })();`
];

async function main(){
    var i = 1;
    var compiled = await NCC.getErrors(snippets);
    console.log(compiled[i].errors)
    

    var fixed = await NCC.fix(snippets);
    console.log(fixed[i].code)

    var e = new Evaluator();
    var r = e.errors(snippets.map(s => {return new Snippet(s)}))
    console.log(r[1].errors)
    var r = e.fix(snippets.map(s => {return new Snippet(s)}))
    console.log(r[1].code)
}

var s = ts.createSourceFile("a.js", snippets[1], {});
console.log(s)

main();