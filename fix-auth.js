const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.resolve(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            if (file.endsWith('page.tsx')) results.push(file);
        }
    });
    return results;
}

const files = walkDir('c:/Users/adars/Desktop/Rudra/web/src/app/dashboard');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Update destructured useAuthStore
    if (content.includes('useAuthStore()') && !content.includes('_hasHydrated')) {
        content = content.replace(/(const {[^}]*?)isAuthenticated([^}]*?} = useAuthStore\(\);)/g, '$1isAuthenticated, _hasHydrated$2');
        modified = true;
    }

    // Replace useEffect
    const targetEffect = /useEffect\(\(\) => \{\s*if \(\!isAuthenticated \|\| currentUser\?\.role !== "([^"]+)"\) \{\s*router\.replace\("([^"]+)"\);\s*return;\s*\}\s*([\s\S]*?)\}, \[([^\]]+)\]\);/g;
    
    if (targetEffect.test(content)) {
        content = content.replace(targetEffect, (match, p1, p2, p3, p4) => {
            if (p4.includes('_hasHydrated')) return match;
            return `useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || currentUser?.role !== "${p1}") {
      router.replace("${p2}");
      return;
    }
    ${p3.trim()}
  }, [${p4}, _hasHydrated]);`;
        });
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
        count++;
    }
}
console.log('Fixed ' + count + ' files.');
