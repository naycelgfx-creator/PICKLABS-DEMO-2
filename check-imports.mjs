import fs from 'fs';
import path from 'path';

function walkDir(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
      file = dir + '/' + file;
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) { 
        results = results.concat(walkDir(file));
      } else { 
        results.push(file);
      }
    });
  } catch(e) {}
  return results;
}

const files = walkDir('./src').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

const allFiles = new Set(walkDir('./src').map(f => path.resolve(f)));
let hasError = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g), ...content.matchAll(/import\s+['"]([^'"]+)['"]/g)];
  for (const m of matches) {
    const importPath = m[1];
    if (importPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(file), importPath);
      let found = false;
      const extensions = ['', '.ts', '.tsx', '.css', '.js', '.json', '.svg', '.png', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
         if (allFiles.has(resolved + ext)) {
             found = true;
             break;
         }
      }
      if (!found) {
         const dir = path.dirname(resolved);
         if (fs.existsSync(dir)) {
             const base = path.basename(resolved);
             const exactFiles = fs.readdirSync(dir);
             
             // Check if it exists with different case
             const matchingIgnoreCase = exactFiles.find(f => {
                const noExt = f.replace(/\.[^/.]+$/, "");
                return noExt.toLowerCase() === base.toLowerCase() || f.toLowerCase() === base.toLowerCase();
             });
             
             if (matchingIgnoreCase) {
                 const matchNoExt = matchingIgnoreCase.replace(/\.[^/.]+$/, "");
                 if (matchNoExt !== base && matchingIgnoreCase !== base) {
                     console.log(`CASE MISMATCH in ${file}: imports '${importPath}' but actual file is '${matchingIgnoreCase}'`);
                     hasError = true;
                 }
             } else {
                 console.log(`MISSING in ${file}: imports '${importPath}'`);
                 hasError = true;
             }
         }
      }
    }
  }
}
if (!hasError) console.log("No import errors found!");
