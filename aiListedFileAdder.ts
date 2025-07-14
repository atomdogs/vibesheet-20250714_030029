import path from 'path';
import fs from 'fs/promises';

const DEFAULT_LISTING_FILE = path.resolve(process.cwd(), 'ai-listing.json');

async function ensureListingFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const initial: ListedFile[] = [];
      await fs.writeFile(filePath, JSON.stringify(initial, null, 2), 'utf-8');
    } else {
      throw err;
    }
  }
}

async function readListing(filePath: string): Promise<ListedFile[]> {
  let data: string;
  try {
    data = await fs.readFile(filePath, 'utf-8');
  } catch (err: any) {
    throw new Error(`Failed to read listing file at ${filePath}: ${err.message}`);
  }

  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      throw new Error('Listing file does not contain an array');
    }
    return parsed as ListedFile[];
  } catch {
    const backupPath = `${filePath}.corrupted.${Date.now()}`;
    try {
      await fs.rename(filePath, backupPath);
    } catch {
      // ignore rename errors
    }
    const initial: ListedFile[] = [];
    await fs.writeFile(filePath, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

async function writeListing(filePath: string, listing: ListedFile[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(listing, null, 2), 'utf-8');
}

export async function addListedFile(options: AddListedFileOptions): Promise<ListedFile[]> {
  const listingFilePath = options.listingFilePath
    ? path.resolve(process.cwd(), options.listingFilePath)
    : DEFAULT_LISTING_FILE;
  const absoluteFilePath = path.resolve(process.cwd(), options.filePath);

  await ensureListingFile(listingFilePath);

  const listing = await readListing(listingFilePath);

  const exists = listing.some(item => path.resolve(process.cwd(), item.filePath) === absoluteFilePath);
  if (exists) {
    throw new Error(`File already listed: ${absoluteFilePath}`);
  }

  const entry: ListedFile = {
    filePath: absoluteFilePath,
    metadata: options.metadata,
    addedAt: new Date().toISOString(),
  };

  const updated = [...listing, entry];
  await writeListing(listingFilePath, updated);
  return updated;
}