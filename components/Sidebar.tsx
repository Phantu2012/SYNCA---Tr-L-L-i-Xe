import React from 'react';
import { Page } from '../types';
import { DashboardIcon, DocumentIcon, HeartIcon, CarIcon, SpeedometerIcon, LogoIcon, SettingsIcon, UserIcon } from './Icons';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: Page;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 my-1 transition-colors duration-200 rounded-lg ${
            isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`}
    >
        {icon}
        <span className={`ml-4 hidden lg:block ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
    const navItems = [
        { icon: <DashboardIcon />, label: Page.DASHBOARD },
        { icon: <DocumentIcon />, label: Page.DOCUMENTS },
        { icon: <HeartIcon />, label: Page.LIFE_ASSISTANT },
        { icon: <CarIcon />, label: Page.VEHICLE_LOG },
        { icon: <SpeedometerIcon />, label: Page.SPEED_WARNING },
    ];
    
    const userMenuItems = [
        { icon: <UserIcon />, label: Page.PROFILE },
        { icon: <SettingsIcon />, label: Page.SETTINGS },
    ];

    return (
        <aside className="w-20 lg:w-64 bg-white dark:bg-gray-800 p-4 flex flex-col justify-between transition-all duration-300 border-r border-gray-200 dark:border-gray-700">
            <div>
                <div className="flex items-center justify-center lg:justify-start mb-10 px-2">
                     <LogoIcon />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-3 hidden lg:block">Synca</h1>
                </div>
                <nav>
                    {navItems.map((item) => (
                        <NavItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            isActive={activePage === item.label}
                            onClick={() => setActivePage(item.label)}
                        />
                    ))}
                </nav>
            </div>
             <div>
                 <nav>
                    {userMenuItems.map((item) => (
                        <NavItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            isActive={activePage === item.label}
                            onClick={() => setActivePage(item.label)}
                        />
                    ))}
                 </nav>
                <div className="mt-4 p-2 text-center text-gray-400 dark:text-gray-500 text-xs hidden lg:block">
                    <p>&copy; 2024 Synca Inc.</p>
                    <p>Trợ lý lái xe của bạn.</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
