import React, { useState } from 'react'
import { ExclamationIcon } from '@heroicons/react/outline'

export default function AddMissingAiFile({
  fileName,
  onFileAdded,
}: AddMissingAiFileProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddFile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.message || 'Failed to add AI file.')
      }
      onFileAdded()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
      <div className="flex items-center space-x-2">
        <ExclamationIcon className="h-5 w-5 text-yellow-700" aria-hidden="true" />
        <p className="text-sm font-medium text-yellow-700">
          AI file &ldquo;{fileName}&rdquo; is missing.
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleAddFile}
        disabled={isLoading}
        className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white ${
          isLoading
            ? 'bg-yellow-400 cursor-not-allowed'
            : 'bg-yellow-600 hover:bg-yellow-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {isLoading ? 'Adding...' : 'Add AI File'}
      </button>
    </div>
  )
}