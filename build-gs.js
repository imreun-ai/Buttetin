// Regenerates gs-code.js from Code.gs (used by the "copy Apps Script" button)
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/Code.gs', 'utf8');
fs.writeFileSync(__dirname + '/gs-code.js', 'window.GS_CODE = ' + JSON.stringify(src) + ';\n');
console.log('gs-code.js written');
