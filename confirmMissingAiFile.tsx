import React, { Fragment, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationIcon } from '@heroicons/react/outline'

interface ConfirmMissingAiFileProps {
  isOpen: boolean
  fileName?: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmMissingAiFile({
  isOpen,
  fileName,
  onConfirm,
  onCancel,
}: ConfirmMissingAiFileProps): JSX.Element {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onCancel}
        initialFocus={confirmButtonRef}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center">
                <ExclamationIcon className="w-6 h-6 text-yellow-500" aria-hidden="true" />
                <Dialog.Title as="h3" className="ml-2 text-lg font-medium leading-6 text-gray-900">
                  Missing AI File
                </Dialog.Title>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  The AI file{fileName ? ` "${fileName}"` : ''} is not found. Would you like to generate it now?
                </p>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 border border-transparent rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  onClick={onConfirm}
                  ref={confirmButtonRef}
                >
                  Generate
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ConfirmMissingAiFile