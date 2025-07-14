import React, { useState, useRef, useCallback, useEffect } from 'react'
import RichTextEditorWrapper from './richtexteditorwrapper'
import { ChevronRightIcon } from '@heroicons/react/outline'

interface AIStreamingEditorProps {
  initialContent?: string
  placeholder?: string
  onContentChange?: (value: string) => void
}

const AIStreamingEditor: React.FC<AIStreamingEditorProps> = ({
  initialContent = '',
  placeholder = 'Start writing...',
  onContentChange,
}) => {
  const [content, setContent] = useState<string>(initialContent)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleChange = useCallback(
    (value: string) => {
      setContent(value)
      onContentChange?.(value)
    },
    [onContentChange]
  )

  const handleGenerate = useCallback(async () => {
    if (isGenerating) {
      abortControllerRef.current?.abort()
      setIsGenerating(false)
      return
    }

    setIsGenerating(true)
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let streamedText = content

      if (reader) {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          const chunkValue = decoder.decode(value, { stream: true })
          streamedText += chunkValue
          handleChange(streamedText)
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI streaming error:', err)
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [content, handleChange, isGenerating])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return (
    <div className="flex flex-col space-y-4">
      <RichTextEditorWrapper
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={handleGenerate}
        className="self-end inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {isGenerating ? 'Stop' : 'Generate'}
        <ChevronRightIcon className="w-4 h-4 ml-2" />
      </button>
    </div>
  )
}

export default AIStreamingEditor