import React, { Fragment } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, Transition } from '@headlessui/react'
import Link from 'next/link'
import { UserIcon, CogIcon, LogoutIcon } from '@heroicons/react/outline'

function classNames(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function TopNavBarUserMenu() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <Menu as="div" className="ml-3 relative">
      <div>
        <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <span className="sr-only">Open user menu</span>
          <img
            className="h-8 w-8 rounded-full"
            src={session.user.image || "/default-avatar.png"}
            alt={session.user.name || session.user.email || "User avatar"}
          />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link href="/profile">
                  <a
                    className={classNames(
                      active && "bg-gray-100",
                      "flex items-center px-4 py-2 text-sm text-gray-700"
                    )}
                  >
                    <UserIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Your Profile
                  </a>
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link href="/settings">
                  <a
                    className={classNames(
                      active && "bg-gray-100",
                      "flex items-center px-4 py-2 text-sm text-gray-700"
                    )}
                  >
                    <CogIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                    Settings
                  </a>
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className={classNames(
                    active && "bg-gray-100",
                    "w-full text-left flex items-center px-4 py-2 text-sm text-gray-700"
                  )}
                >
                  <LogoutIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Sign out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}