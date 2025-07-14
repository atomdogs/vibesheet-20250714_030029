import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import kmeans from 'ml-kmeans';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient();
if (!global.prisma) global.prisma = prisma;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export type ToneCluster = {
  centroid: number[];
  samples: string[];
};

async function getEmbeddings(samples: string[]): Promise<number[][]> {
  if (samples.length === 0) return [];
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: samples
  });
  return response.data.map(item => item.embedding);
}

function clusterEmbeddings(embeddings: number[][], samples: string[]): ToneCluster[] {
  const n = embeddings.length;
  if (n === 0) return [];
  const k = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(n))));
  const result = kmeans(embeddings, k);
  const assignments = result.clusters;
  const centroids = result.centroids;
  const map: Record<number, ToneCluster> = {};
  assignments.forEach((clusterIdx, i) => {
    if (!map[clusterIdx]) {
      map[clusterIdx] = { centroid: centroids[clusterIdx].centroid, samples: [] };
    }
    map[clusterIdx].samples.push(samples[i]);
  });
  return Object.values(map);
}

export async function analyzeSamples(userId: string, samples: string[]) {
  if (!samples || samples.length === 0) {
    return await prisma.toneProfile.create({
      data: { userId, clusters: [] }
    });
  }
  const embeddings = await getEmbeddings(samples);
  if (embeddings.length === 0) {
    return await prisma.toneProfile.create({
      data: { userId, clusters: [] }
    });
  }
  const toneProfile = clusterEmbeddings(embeddings, samples);
  const created = await prisma.toneProfile.create({
    data: {
      userId,
      clusters: toneProfile
    }
  });
  return created;
}