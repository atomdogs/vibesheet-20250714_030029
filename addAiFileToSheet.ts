import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import { Readable } from 'stream'

let authClient: JWT | null = null

function getAuthClient(): JWT {
  if (authClient) return authClient
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new Error('Missing Google service account credentials: ensure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY are set')
  }
  let key: string
  if (rawKey.includes('-----BEGIN')) {
    key = rawKey.replace(/\\n/g, '\n')
  } else {
    key = Buffer.from(rawKey, 'base64').toString('utf8')
  }
  authClient = new google.auth.JWT(
    email,
    undefined,
    key,
    [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  )
  return authClient
}

export async function addAiFileToSheet(
  params: AddAiFileToSheetParams
): Promise<AddAiFileToSheetResult> {
  const { fileName, mimeType, fileBuffer, spreadsheetId, sheetName, description, folderId } = params
  const auth = getAuthClient()
  await auth.authorize()

  const drive = google.drive({ version: 'v3', auth })
  const sheets = google.sheets({ version: 'v4', auth })

  const media = {
    mimeType,
    body: Readable.from(fileBuffer)
  }

  let fileId: string
  let webViewLink: string

  try {
    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        description,
        parents: folderId ? [folderId] : undefined
      },
      media,
      fields: 'id, webViewLink'
    })
    if (!driveResponse.data.id) {
      throw new Error('No file ID returned')
    }
    fileId = driveResponse.data.id
    webViewLink = driveResponse.data.webViewLink || ''
  } catch (error) {
    throw new Error(`Failed to create file in Google Drive: ${(error as Error).message}`)
  }

  const timestamp = new Date().toISOString()
  const values = [[timestamp, fileName, fileId, webViewLink, description || '']]

  let updatedRange: string | undefined
  let updatedRows: number | undefined
  let updatedColumns: number | undefined
  let updatedCells: number | undefined

  try {
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:E`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values }
    })
    const data = appendResponse.data
    updatedRange = data.updatedRange
    updatedRows = data.updatedRows
    updatedColumns = data.updatedColumns
    updatedCells = data.updatedCells
  } catch (error) {
    throw new Error(`Failed to append to sheet ${spreadsheetId} (${sheetName}): ${(error as Error).message}`)
  }

  return {
    fileId,
    webViewLink,
    spreadsheetUpdate: {
      updatedRange,
      updatedRows,
      updatedColumns,
      updatedCells
    }
  }
}