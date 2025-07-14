import React, { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { DotsVerticalIcon, CheckIcon, ClockIcon, BellSlashIcon } from '@heroicons/react/outline'

export default function EngagementAlertActionsPopover({
  onMarkAsRead,
  onReschedule,
  onMute,
  className = '',
}: EngagementAlertActionsPopoverProps) {
  return (
    <Popover className={`relative inline-block text-left ${className}`}>
      {({ close }) => (
        <>
          <Popover.Button
            className="inline-flex justify-center w-full p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Open actions menu"
          >
            <DotsVerticalIcon className="w-5 h-5" aria-hidden="true" />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-2 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onMarkAsRead()
                    close()
                  }}
                  className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CheckIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Mark as Read
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReschedule()
                    close()
                  }}
                  className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ClockIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onMute()
                    close()
                  }}
                  className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <BellSlashIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                  Mute Notifications
                </button>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}