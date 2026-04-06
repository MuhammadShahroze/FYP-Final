const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync(process.argv[2]);

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf_output.txt', data.text);
    console.log("Extracted " + data.numpages + " pages to pdf_output.txt");
}).catch(err => {
    console.error(err);
});
