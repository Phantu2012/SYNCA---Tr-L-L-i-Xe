
import React from 'react';
import { Page } from '../types';
import { DashboardIcon, DocumentIcon, CarIcon, SpeedometerIcon, LogoIcon, SettingsIcon, UserIcon, SeedlingIcon, FlagIcon, GiftIcon, WalletIcon, AdminIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    isOpen: boolean;
    onClose: () => void;
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
        <span className={`ml-4 ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, onClose }) => {
    const { currentUser } = useAuth();

    const handleItemClick = (page: Page) => {
        setActivePage(page);
        onClose(); // Close sidebar after navigation on mobile
    };

    const navItems = [
        { icon: <DashboardIcon />, label: Page.DASHBOARD },
        { icon: <DocumentIcon />, label: Page.DOCUMENTS },
        { icon: <GiftIcon />, label: Page.EVENT_CALENDAR },
        { icon: <WalletIcon />, label: Page.FINANCIAL_MANAGEMENT },
        { icon: <SeedlingIcon />, label: Page.SELF_DEVELOPMENT },
        { icon: <FlagIcon />, label: Page.LIFE_GOALS },
        { icon: <CarIcon />, label: Page.VEHICLE_LOG },
        { icon: <SpeedometerIcon />, label: Page.SPEED_WARNING },
    ];
    
    if (currentUser?.role === 'admin') {
        navItems.push({ icon: <AdminIcon />, label: Page.ADMIN });
    }

    const userMenuItems = [
        { icon: <UserIcon />, label: Page.PROFILE },
        { icon: <SettingsIcon />, label: Page.SETTINGS },
    ];

    const sidebarContent = (isMobile: boolean) => (
        <>
            <div>
                <div className="flex items-center justify-start mb-10 px-2">
                     <LogoIcon />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-3">Synca</h1>
                </div>
                <nav>
                    {navItems.map((item) => (
                        <NavItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            isActive={activePage === item.label}
                            onClick={() => isMobile ? handleItemClick(item.label) : setActivePage(item.label)}
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
                            onClick={() => isMobile ? handleItemClick(item.label) : setActivePage(item.label)}
                        />
                    ))}
                 </nav>
                <div className="mt-4 p-2 text-center text-gray-400 dark:text-gray-500 text-xs">
                    <p>&copy; 2024 Synca Inc.</p>
                    <p>Trợ lý lái xe của bạn.</p>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Sidebar (off-canvas) */}
            <div className={`fixed inset-0 z-40 flex lg:hidden ${!isOpen && 'pointer-events-none'}`}>
                 {/* Overlay */}
                <div 
                    className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0'}`}
                    onClick={onClose}
                    aria-hidden="true"
                ></div>
                {/* Content */}
                <div className={`relative w-64 h-full bg-white dark:bg-gray-800 p-4 flex flex-col transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebarContent(true)}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 bg-white dark:bg-gray-800 p-4 flex-col justify-between border-r border-gray-200 dark:border-gray-700">
                {sidebarContent(false)}
            </aside>
        </>
    );
};

export default Sidebar;