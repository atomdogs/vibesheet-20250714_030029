import globby from 'globby';
import fs from 'fs-extra';
import path from 'path';

function toPascalCase(input: string): string {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join('');
}

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const componentPattern = 'packages/*/src/components/**/*.tsx';
  const componentPaths = await globby(componentPattern, { cwd: projectRoot });

  if (componentPaths.length === 0) {
    console.log('No component files found.');
    return;
  }

  let createdCount = 0;

  for (const relativePath of componentPaths) {
    const fullPath = path.join(projectRoot, relativePath);
    const dir = path.dirname(fullPath);
    const ext = path.extname(fullPath);
    const baseName = path.basename(fullPath, ext);
    const sanitizedName = toPascalCase(baseName);
    const aiFilename = `${baseName}.ai.ts`;
    const aiFilePath = path.join(dir, aiFilename);

    const exists = await fs.pathExists(aiFilePath);
    if (exists) continue;

    const template = `// Auto-generated AI helper for ${baseName}
// Generated on ${new Date().toISOString()}

export interface ${sanitizedName}AiContext {
  // define context properties here
}

export async function ${sanitizedName}Ai(context: ${sanitizedName}AiContext): Promise<any> {
  // TODO: implement AI logic for ${baseName}
  throw new Error('Not implemented');
}
`;

    await fs.writeFile(aiFilePath, template, 'utf8');
    console.log(`Created ${path.relative(projectRoot, aiFilePath)}`);
    createdCount++;
  }

  console.log(`Done. ${createdCount} AI helper file(s) created.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});