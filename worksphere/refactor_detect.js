const fs = require('fs');
const path = require('path');

const repoDir = 'src/main/java/com/ucocs/worksphere/repository';
const repos = fs.readdirSync(repoDir).filter(f => f.endsWith('Repository.java'));

const result = [];
for (const repo of repos) {
    const fullPath = path.join(repoDir, repo);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    let hasMethods = false;
    const methods = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('findBy') && !line.includes('@Query') && !line.includes('//')) {
            // Check previous line for @Query
            if (i > 0 && lines[i-1].includes('@Query')) continue;
            // Also check if it's actually a method declaration
            if (line.includes('(') && line.includes(';')) {
                methods.push(line.trim());
                hasMethods = true;
            }
        }
    }
    if (hasMethods) {
        result.push({repo, methods});
    }
}
fs.writeFileSync('detect_output.json', JSON.stringify(result, null, 2));
console.log('Detection complete. Results written to detect_output.json');
