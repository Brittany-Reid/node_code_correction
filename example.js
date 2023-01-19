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
      })();`,
  `assert(true)`,
  `import sum from './sum';\n\nit('sums numbers', () => {\n  expect(sum(1, 2)).toEqual(3);\n  expect(sum(2, 2)).toEqual(4);\n});`,
  `import sum from './sum';

  expect(sum(1, 2)).toEqual(3)
  `
];

async function main(){
    var i = 5;
    var compiled = await NCC.getErrors(snippets);
    console.log(compiled[i].errors)
    

    NCC.evaluator.fixer.deletions = false;
    var fixed = await NCC.fix(snippets);
    console.log(fixed[i])
    console.log(fixed[i].errors)

    // var e = new Evaluator();
    // var r = e.errors(snippets.map(s => {return new Snippet(s)}))
    // console.log(r[1].errors)
    // var r = e.fix(snippets.map(s => {return new Snippet(s)}))
    // console.log(r[1].code)
}


main();