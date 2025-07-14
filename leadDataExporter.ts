import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import { finished } from 'stream/promises';
import axios from 'axios';

function escapeCsvValue(value: any, delimiter: string): string {
  if (value == null) return ''
  let stringValue: string
  if (typeof value === 'object') {
    try {
      stringValue = JSON.stringify(value)
    } catch {
      stringValue = String(value)
    }
  } else {
    stringValue = String(value)
  }
  const shouldEscape =
    stringValue.includes(delimiter) ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  if (shouldEscape) {
    const escaped = stringValue.replace(/"/g, '""')
    return `"${escaped}"`
  }
  return stringValue
}

export async function exportLeads(
  leads: Lead[],
  config: ExportConfig
): Promise<ExportResult> {
  try {
    if (config.type === 'csv') {
      const delimiter = config.delimiter ?? ','
      const filePath = config.filePath
      const dir = path.dirname(filePath)
      await fsp.mkdir(dir, { recursive: true })

      // Determine stable headers: union of all keys in first-appearance order
      const headers: string[] = []
      const headerSet = new Set<string>()
      for (const lead of leads) {
        for (const key of Object.keys(lead)) {
          if (!headerSet.has(key)) {
            headerSet.add(key)
            headers.push(key)
          }
        }
      }

      const stream = fs.createWriteStream(filePath, { encoding: 'utf8' })
      // Write header row
      if (headers.length > 0) {
        const headerLine = headers.map(h => escapeCsvValue(h, delimiter)).join(delimiter)
        stream.write(headerLine + '\n')
      }
      // Write data rows
      for (const lead of leads) {
        const row = headers
          .map(header => escapeCsvValue(lead[header], delimiter))
          .join(delimiter)
        stream.write(row + '\n')
      }
      stream.end()
      await finished(stream)

      return { success: true, message: `CSV exported to ${filePath}` }
    } else if (config.type === 'hubspot') {
      const response = await axios.post(
        config.url,
        { leads },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )
      return { success: true, message: 'Data posted to HubSpot', details: response.data }
    } else {
      return { success: false, message: 'Unsupported export type' }
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Export failed',
      details: error.response?.data || error.message,
    }
  }
}