import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  HomeIcon,
  LightBulbIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/outline';

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Ideas', href: '/ideas', icon: LightBulbIcon },
  { name: 'Scheduler', href: '/scheduler', icon: CalendarIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'CRM', href: '/crm', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon },
];

const DashboardSidebarNavigation: React.FC = () => {
  const router = useRouter();

  return (
    <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-4 bg-white border-b border-gray-200">
        <Link href="/">
          <a className="text-lg font-semibold text-gray-900">LinkedIn Automator</a>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 overflow-y-auto" aria-label="Sidebar">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              router.pathname === item.href ||
              router.pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon
                      className={`mr-3 h-6 w-6 flex-shrink-0 ${
                        isActive
                          ? 'text-gray-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default DashboardSidebarNavigation;