
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulate server.js location (core/backend)
const serverDir = path.join(__dirname, 'core/backend');

console.log('Testing module path resolution...');

const modulesConfigPath = path.join(__dirname, 'config/modules.json');
if (!fs.existsSync(modulesConfigPath)) {
  console.error('Modules config not found at:', modulesConfigPath);
  process.exit(1);
}

const modulesConfig = JSON.parse(fs.readFileSync(modulesConfigPath, 'utf8'));
const modules = modulesConfig.modules;

for (const [key, module] of Object.entries(modules)) {
  if (module.enabled && key !== 'core') {
    console.log(`Checking module: ${key}`);
    
    // Logic from server.js
    // const modulePath = path.resolve(__dirname, '../../', module.path, module.entryPoint || 'index.js');
    // Here __dirname is root, so we simulate serverDir
    
    const resolvedPath = path.resolve(serverDir, '../../', module.path, module.entryPoint || 'index.js');
    
    console.log(`  Config Path: ${module.path}`);
    console.log(`  Entry Point: ${module.entryPoint}`);
    console.log(`  Resolved Path: ${resolvedPath}`);
    
    if (fs.existsSync(resolvedPath)) {
      console.log(`  ✓ File exists`);
    } else {
      console.error(`  ✗ File NOT found`);
    }

    // Check frontend path
    const moduleFrontendPath = path.resolve(serverDir, '../../', module.path, 'frontend');
    console.log(`  Frontend Path: ${moduleFrontendPath}`);
    if (fs.existsSync(moduleFrontendPath)) {
        console.log(`  ✓ Frontend directory exists`);
    } else {
        console.log(`  - Frontend directory not found (optional)`);
    }
  }
}
