import React, { useRef, useState, ChangeEvent, KeyboardEvent } from 'react'

const MissingAiFileAdder: React.FC<MissingAiFileAdderProps> = ({
  onFilesAdded,
  acceptedTypes = ['.pdf', '.docx', '.txt'],
  maxFileSizeMB = 10,
  multiple = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string>('')

  const handleFiles = (fileList: FileList) => {
    const newFiles: File[] = []
    const errors: string[] = []

    Array.from(fileList).forEach(file => {
      let ext: string | undefined
      if (file.name.includes('.')) {
        const parts = file.name.split('.')
        const last = parts.pop()
        if (last) {
          ext = '.' + last.toLowerCase()
        }
      }
      if (acceptedTypes.length && (!ext || !acceptedTypes.includes(ext))) {
        errors.push(`"${file.name}" has invalid type.`)
        return
      }
      const sizeMB = file.size / 1024 / 1024
      if (sizeMB > maxFileSizeMB) {
        errors.push(`"${file.name}" exceeds ${maxFileSizeMB}MB.`)
        return
      }
      newFiles.push(file)
    })

    if (errors.length) {
      setError(errors.join(' '))
      return
    }

    const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
    setFiles(updatedFiles)
    onFilesAdded(updatedFiles)
    setError('')
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openFileDialog()
    }
  }

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index)
    setFiles(updated)
    onFilesAdded(updated)
  }

  return (
    <div className="w-full">
      <div
        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Add AI file"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileChange}
        />
        <svg
          className="w-12 h-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 48 48"
        >
          <path
            d="M24 4v32m0 0l-8-8m8 8l8-8M12 40h24"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-gray-600">
          Drag & drop AI file here, or click to select
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {acceptedTypes.join(', ')} up to {maxFileSizeMB}MB
        </p>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <span className="text-gray-800 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-red-500 hover:text-red-700 ml-4"
                aria-label={`Remove ${file.name}`}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MissingAiFileAdder