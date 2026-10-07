// Assembles src/* into one self-contained, offline HTML file.
const fs = require('fs');
const read = f => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const js = [read('questions.js'), read('pdfwriter.js').replace(/if \(typeof module[\s\S]*$/, ''), read('app.js')].join('\n\n').replace(/<\/script/gi, '<\\/script');
const html = read('template.html').replace('/*__CSS__*/', () => read('styles.css')).replace('/*__JS__*/', () => js);
fs.writeFileSync(__dirname + '/abhisaran-field-form.html', html);
console.log('built', (html.length / 1024).toFixed(1) + ' KB');
