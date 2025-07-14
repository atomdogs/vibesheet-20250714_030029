import fs from 'fs/promises';
import glob from 'glob';
import path from 'path';

interface AiListedConfig {
  listedFiles: string[];
}

function parseArgs(): { configPath: string } {
  const args = process.argv.slice(2)
  let configPath = 'ai-listed-files.json'
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--config' || arg === '-c') {
      if (i + 1 < args.length) {
        configPath = args[i + 1]
        i++
      }
    } else if (arg.startsWith('--config=')) {
      configPath = arg.split('=')[1]
    }
  }
  return { configPath }
}

async function loadConfig(configPath: string): Promise<AiListedConfig> {
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    try {
      return JSON.parse(content) as AiListedConfig
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file at ${configPath}: ${err.message}`)
      }
      throw err
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return { listedFiles: [] }
    }
    throw err
  }
}

async function saveConfig(configPath: string, config: AiListedConfig): Promise<void> {
  const content = JSON.stringify(config, null, 2)
  await fs.writeFile(configPath, content, 'utf-8')
}

async function findSourceFiles(patterns: string[]): Promise<string[]> {
  const filesSet = new Set<string>()
  for (const pattern of patterns) {
    const matches = await glob(pattern, { ignore: ['**/node_modules/**'] })
    for (const file of matches) {
      filesSet.add(path.resolve(file))
    }
  }
  return Array.from(filesSet)
}

async function main() {
  const { configPath } = parseArgs()
  const configFullPath = path.resolve(configPath)
  const config = await loadConfig(configFullPath)
  const patterns = ['src/**/*.ts', 'src/**/*.tsx']
  const allFiles = await findSourceFiles(patterns)
  const cwd = process.cwd()
  const relativeFiles = allFiles.map(f => path.relative(cwd, f))
  const missing = relativeFiles.filter(f => !config.listedFiles.includes(f))
  if (missing.length > 0) {
    console.log(`Found ${missing.length} missing AI-listed files.`)
    missing.forEach(f => console.log(`  + ${f}`))
    config.listedFiles.push(...missing)
    config.listedFiles.sort((a, b) => a.localeCompare(b))
    await saveConfig(configFullPath, config)
    console.log(`Updated ${configPath}`)
  } else {
    console.log('No missing AI-listed files found.')
  }
}

main().catch(err => {
  console.error('Error adding missing AI-listed files:', err)
  process.exit(1)
})