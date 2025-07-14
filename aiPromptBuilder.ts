import fs from 'fs/promises';
import path from 'path';

interface ToneProfile {
  style: string;
  formality?: string;
  additionalInstructions?: string;
}

const templatesCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100;
const TEMPLATES_DIR = path.resolve(process.cwd(), 'prompts');

async function loadTemplate(intent: string): Promise<string> {
  // Validate intent to prevent path traversal
  if (!/^[a-zA-Z0-9_]+$/.test(intent)) {
    throw new Error(`Invalid intent "${intent}". Intent must be alphanumeric or underscores only.`);
  }

  if (templatesCache.has(intent)) {
    return templatesCache.get(intent)!;
  }

  const filePath = path.resolve(TEMPLATES_DIR, `${intent}.txt`);
  // Ensure resolved path is within the templates directory
  if (!filePath.startsWith(TEMPLATES_DIR + path.sep)) {
    throw new Error(`Access to template "${intent}" is denied.`);
  }

  let content: string;
  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw new Error(`Template for intent "${intent}" not found at ${filePath}`);
    }
    throw err;
  }

  templatesCache.set(intent, content);
  // Evict oldest entry if cache exceeds max size
  if (templatesCache.size > MAX_CACHE_SIZE) {
    const oldestKey = templatesCache.keys().next().value;
    templatesCache.delete(oldestKey);
  }

  return content;
}

function injectTone(template: string, toneProfile: ToneProfile): string {
  if (!toneProfile.style) {
    throw new Error('ToneProfile.style is required');
  }
  const parts: string[] = [];
  parts.push(`Style: ${toneProfile.style}`);
  if (toneProfile.formality) {
    parts.push(`Formality: ${toneProfile.formality}`);
  }
  if (toneProfile.additionalInstructions) {
    parts.push(toneProfile.additionalInstructions);
  }
  const toneBlock = parts.join('; ');
  if (template.includes('{{TONE}}')) {
    return template.replace(/{{TONE}}/g, toneBlock);
  }
  return `${toneBlock}\n\n${template}`;
}

export async function buildPrompt(intent: string, toneProfile: ToneProfile): Promise<string> {
  const baseTemplate = await loadTemplate(intent);
  return injectTone(baseTemplate, toneProfile);
}