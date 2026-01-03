const fs = require('fs');
const path = require('path');

console.log('--- MANUAL ENV CHECK ---');
console.log('Current CWD:', process.cwd());
const envPath = path.join(process.cwd(), '.env');
console.log('Checking for .env at:', envPath);

if (!fs.existsSync(envPath)) {
    console.log('ERROR: .env file does not exist at this path!');
    process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
console.log('File Content (lines):');
const lines = content.split('\n');
lines.forEach((line, i) => {
    console.log(`${i + 1}: [${line.trim()}]`);
});

require('dotenv').config();
console.log('Dotenv DB_USER:', process.env.DB_USER);
console.log('Dotenv SMTP_USER:', process.env.SMTP_USER);
