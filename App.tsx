import React, { useState, useEffect } from 'react';
import { Page, User } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import SelfDevelopment from './pages/SelfDevelopment';
import LifeGoals from './pages/LifeGoals';
import VehicleLog from './pages/VehicleLog';
import SpeedWarning from './pages/SpeedWarning';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import EventCalendar from './pages/EventCalendar';
import FinancialManagement from './pages/FinancialManagement';
import HappyFamily from './pages/HappyFamily';
import Admin from './pages/Admin';
import Community from './pages/Community';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './contexts/AuthContext';
import { SpeedometerIcon } from './components/Icons';
import InvitationHandler from './components/InvitationHandler';
import InstallPrompt from './components/InstallPrompt';


const UpgradePage: React.FC<{ setActivePage: (page: Page) => void }> = ({ setActivePage }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center h-full p-6 bg-gray-800 rounded-lg">
            <div className="p-4 bg-yellow-500/20 rounded-full mb-4">
                <SpeedometerIcon className="w-12 h-12 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Mở khóa Tính năng PRO</h2>
            <p className="text-gray-400 mb-6 max-w-sm">
                Tính năng Cảnh báo Tốc độ & Dẫn đường chỉ dành cho thành viên PRO. Nâng cấp ngay để lái xe an toàn và thông minh hơn.
            </p>
            <button
                onClick={() => setActivePage(Page.PROFILE)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
                Xem các gói Nâng cấp
            </button>
        </div>
    );
};

const MainApp: React.FC<{ user: User }> = ({ user }) => {
    const [activePage, setActivePage] = useState<Page>(Page.DASHBOARD);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

     useEffect(() => {
        // Daily Reminder Scheduler Logic (moved from previous implementation)
        let timeoutId: number;
        const scheduleDailyReminder = () => {
            const settingsRaw = localStorage.getItem('dailyReminder');
            if (!settingsRaw) return;
            try {
                const settings = JSON.parse(settingsRaw);
                if (!settings.enabled || !settings.time) return;
                const [hours, minutes] = settings.time.split(':').map(Number);
                const now = new Date();
                let reminderTime = new Date();
                reminderTime.setHours(hours, minutes, 0, 0);
                if (now > reminderTime) {
                    reminderTime.setDate(reminderTime.getDate() + 1);
                }
                const timeToReminder = reminderTime.getTime() - now.getTime();
                timeoutId = window.setTimeout(() => {
                    if (Notification.permission === 'granted') {
                        new Notification('Nhắc nhở hàng ngày từ Synca', {
                            body: 'Đến giờ cập nhật rồi! Hãy ghi lại chi tiêu và những điều bạn biết ơn hôm nay nhé.',
                            icon: '/icon-192x192.png',
                            tag: 'synca-daily-reminder',
                        });
                    }
                    scheduleDailyReminder(); 
                }, timeToReminder);
            } catch (error) {
                console.error("Error scheduling daily reminder:", error);
            }
        };
        scheduleDailyReminder();
        return () => clearTimeout(timeoutId);
    }, []);

    const isProUser = user.subscriptionTier === 'pro' && user.expiryDate && new Date(user.expiryDate) > new Date();

    const renderPage = () => {
        switch (activePage) {
            case Page.DASHBOARD: return <Dashboard setActivePage={setActivePage} />;
            case Page.DOCUMENTS: return <Documents />;
            case Page.EVENT_CALENDAR: return <EventCalendar />;
            case Page.FINANCIAL_MANAGEMENT: return <FinancialManagement />;
            case Page.HAPPY_FAMILY: return <HappyFamily />;
            case Page.COMMUNITY: return <Community />;
            case Page.SELF_DEVELOPMENT: return <SelfDevelopment />;
            case Page.LIFE_GOALS: return <LifeGoals />;
            case Page.VEHICLE_LOG: return <VehicleLog />;
            case Page.SPEED_WARNING: return isProUser ? <SpeedWarning /> : <UpgradePage setActivePage={setActivePage} />;
            case Page.PROFILE: return <Profile setActivePage={setActivePage} />;
            case Page.SETTINGS: return <Settings />;
            case Page.ADMIN: return user.role === 'admin' ? <Admin /> : <Dashboard setActivePage={setActivePage} />;
            default: return <Dashboard setActivePage={setActivePage} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
            <Sidebar 
                activePage={activePage} 
                setActivePage={setActivePage} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto relative">
                <Header 
                    activePage={activePage}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <InvitationHandler />
                <div className="max-w-7xl mx-auto w-full">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    const { currentUser, loading } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const dismissed = localStorage.getItem('syncaInstallDismissed');
            if (!dismissed && !window.matchMedia('(display-mode: standalone)').matches) {
                setDeferredPrompt(e);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        localStorage.setItem('syncaInstallDismissed', 'true');
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        localStorage.setItem('syncaInstallDismissed', 'true');
        setDeferredPrompt(null);
    };

    const renderContent = () => {
        if (!currentUser) {
            return isLoginView 
                ? <Login onSwitchToRegister={() => setIsLoginView(false)} /> 
                : <Register onSwitchToLogin={() => setIsLoginView(true)} />;
        }
        return <MainApp user={currentUser} />;
    };

    return (
        <>
            {renderContent()}
            {deferredPrompt && <InstallPrompt onInstall={handleInstall} onDismiss={handleDismiss} />}
        </>
    );
};

export default App;