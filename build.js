const fs = require('fs');
const path = require('path');

const { DEBUG } = process.env;

function parseVariables(style) {
  const variables = {};
  const themes = [];
  const variableNames = new Set();
  const regex = '\\.(\\S+)\\s*{(.*?)}'
  const blocks = style.match(new RegExp(regex, 'gs'));
  for (const block of blocks) {
    const [_, theme, style] = block.match(new RegExp(regex, 'ms'));
    const lines = style.split('\n');
    themes.push(theme);
    for (const line of lines) {
      const g = line.match(/\s*(\S+)\s*:\s*([^;\s]+)\s*;?$/);
      if (g) {
        const name = g[1];
        variableNames.add(name);
        variables[`${theme}_${name}`] = g[2];
      }
    }
  }
  return { themes, variables, variableNames: Array.from(variableNames) };
}

function readFile(name) {
  return fs.readFileSync(path.join(__dirname, name)).toString()
}

const { themes, variables, variableNames } = parseVariables(readFile('variables.css'));

let style = readFile('style.css');
for (const name of variableNames) {
  style = style.replace(new RegExp(name, 'gm'), `'"\`read_variable $theme ${name}\`"'`);
}


const script = `
function read_variable {
  eval "echo \\$$1_$2"
}

function append_css {
  local theme=$1;
  local filename=$BUNDLE_PATH/theme-$1.css;
  local original_css=\`ruby -e "print STDIN.read.split('$DELIMITER')[0]" < $filename\`
  echo "$original_css$DELIMITER"'


${style}
'${DEBUG ? '' : ' > $filename'};
}

DELIMITER=".css.map*/"
BUNDLES_PATH=/Applications/Riot.app/Contents/Resources/webapp/bundles
BUNDLE_PATH=$BUNDLES_PATH/\`ls $BUNDLES_PATH\`

${Object.keys(variables).map((name) => `${name}=${variables[name]}`).join('\n')}

${themes.map((theme) => `append_css ${theme}`).join('\n')}

echo "DONE!"
`;

console.log(script);
