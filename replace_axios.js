const fs = require('fs');
const path = require('path');

function replaceAxios(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceAxios(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('http://localhost:5000/api')) {
        const relativePath = path.relative(path.dirname(fullPath), path.join('c:/Users/Azan/Desktop/Net Cafe/frontend/src', 'api.js')).replace(/\\/g, '/');
        const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
        
        content = content.replace(/import axios from 'axios';/g, "import api from '" + importPath.replace('.js', '') + "';");
        
        content = content.replace(/axios\.(get|post|put|delete)\('http:\/\/localhost:5000\/api/g, "api.$1('");
        content = content.replace(/axios\.(get|post|put|delete)\(`http:\/\/localhost:5000\/api/g, "api.$1(`");
        
        // Also replace some left over axios calls
        content = content.replace(/axios\.(get|post|put|delete)/g, "api.$1");
        
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceAxios('c:/Users/Azan/Desktop/Net Cafe/frontend/src');
