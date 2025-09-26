import React, { useState } from 'react';
import { Page } from '../types';
import { DashboardIcon, DocumentIcon, CarIcon, SpeedometerIcon, LogoIcon, SettingsIcon, UserIcon, SeedlingIcon, FlagIcon, GiftIcon, WalletIcon, AdminIcon, HomeIcon, UsersIcon, InfoIcon, QuestionMarkCircleIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import AboutModal from './AboutModal';
import UserGuideModal from './UserGuideModal';

interface NavItemProps {
    icon: React.ReactNode;
    label: Page;
    isActive: boolean;
    onClick: () => void;
    isProFeature?: boolean;
    hasNotification?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isProFeature, hasNotification }) => {
    const { currentUser } = useAuth();
    const isProUser = currentUser?.subscriptionTier === 'pro' && currentUser?.expiryDate && new Date(currentUser.expiryDate) > new Date();
    
    return (
    <button
        onClick={onClick}
        className={`flex items-center justify-between w-full px-4 py-3 my-1 transition-colors duration-200 rounded-lg ${
            isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`}
    >
        <div className="relative flex items-center">
            {icon}
            <span className={`ml-4 ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
            {hasNotification && (
                <span className="absolute left-[-4px] top-[-2px] block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
            )}
        </div>
        {isProFeature && !isProUser && (
            <span className="text-xs font-bold bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full">PRO</span>
        )}
    </button>
)};

interface SidebarProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    isOpen: boolean;
    onClose: () => void;
    communityHasNew: boolean;
    familyHasNew: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, onClose, communityHasNew, familyHasNew }) => {
    const { currentUser } = useAuth();
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    const handleItemClick = (page: Page) => {
        setActivePage(page);
        onClose(); // Close sidebar after navigation on mobile
    };

    const navItems = [
        { icon: <DashboardIcon />, label: Page.DASHBOARD, isPro: false, hasNotification: false },
        { icon: <DocumentIcon />, label: Page.DOCUMENTS, isPro: false, hasNotification: false },
        { icon: <GiftIcon />, label: Page.EVENT_CALENDAR, isPro: false, hasNotification: false },
        { icon: <WalletIcon />, label: Page.FINANCIAL_MANAGEMENT, isPro: false, hasNotification: false },
        { icon: <HomeIcon />, label: Page.HAPPY_FAMILY, isPro: false, hasNotification: familyHasNew },
        { icon: <UsersIcon />, label: Page.COMMUNITY, isPro: false, hasNotification: communityHasNew },
        { icon: <SeedlingIcon />, label: Page.SELF_DEVELOPMENT, isPro: false, hasNotification: false },
        { icon: <FlagIcon />, label: Page.LIFE_GOALS, isPro: false, hasNotification: false },
        { icon: <CarIcon />, label: Page.VEHICLE_LOG, isPro: false, hasNotification: false },
        { icon: <SpeedometerIcon />, label: Page.SPEED_WARNING, isPro: true, hasNotification: false },
    ];
    
    if (currentUser?.role === 'admin') {
        navItems.push({ icon: <AdminIcon />, label: Page.ADMIN, isPro: false, hasNotification: false });
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
                            isProFeature={item.isPro}
                            hasNotification={item.hasNotification}
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
                 <div className="mt-4 border-t border-gray-700 pt-4">
                      <button
                        onClick={() => setIsGuideModalOpen(true)}
                        className="flex items-center w-full px-4 py-3 my-1 transition-colors duration-200 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                     >
                        <QuestionMarkCircleIcon className="w-6 h-6" />
                        <span className="ml-4 font-medium">Hướng dẫn Sử dụng</span>
                    </button>
                     <button
                        onClick={() => setIsAboutModalOpen(true)}
                        className="flex items-center w-full px-4 py-3 my-1 transition-colors duration-200 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                     >
                        <InfoIcon className="w-6 h-6" />
                        <span className="ml-4 font-medium">Về Synca</span>
                    </button>
                 </div>
                <div className="mt-4 p-2 text-center text-gray-400 dark:text-gray-500 text-xs">
                    <p>&copy; 2024 Synca Inc.</p>
                    <p>Trợ lý Cuộc sống của bạn.</p>
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
            <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
            <UserGuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />
        </>
    );
};

export default Sidebar;