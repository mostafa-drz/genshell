const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'dist', 'index.js');
const data = fs.readFileSync(filePath, 'utf8');
const newData = '#!/usr/bin/env node\n' + data;
fs.writeFileSync(filePath, newData);
