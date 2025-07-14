import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';

export default function ConfirmMissingFile({
  isOpen,
  missingFiles,
  onCancel,
  onConfirm,
}: ConfirmMissingFileProps) {
  if (!isOpen || missingFiles.length === 0) {
    return null;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onCancel}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-60"
            leave="ease-in duration-200"
            leaveFrom="opacity-60"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black" />
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
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Missing Required Files
                </Dialog.Title>
                <button
                  type="button"
                  aria-label="Close"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={onCancel}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  The following required file{missingFiles.length > 1 ? 's are' : ' is'} missing:
                </p>
                <ul className="list-disc list-inside mt-2 text-gray-700">
                  {missingFiles.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-gray-600">
                  Do you want to proceed without {missingFiles.length > 1 ? 'these files' : 'this file'}?
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={onConfirm}
                >
                  Proceed
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}