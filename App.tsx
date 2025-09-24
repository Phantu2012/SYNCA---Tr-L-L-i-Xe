/** @jsxRuntime classic */
import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
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
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './contexts/AuthContext';
import { LogoIcon } from './components/Icons';

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


    const renderPage = () => {
        switch (activePage) {
            case Page.DASHBOARD: return <Dashboard setActivePage={setActivePage} />;
            case Page.DOCUMENTS: return <Documents />;
            case Page.EVENT_CALENDAR: return <EventCalendar />;
            case Page.FINANCIAL_MANAGEMENT: return <FinancialManagement />;
            case Page.SELF_DEVELOPMENT: return <SelfDevelopment />;
            case Page.LIFE_GOALS: return <LifeGoals />;
            case Page.VEHICLE_LOG: return <VehicleLog />;
            case Page.SPEED_WARNING: return <SpeedWarning />;
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
            <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <Header 
                    activePage={activePage}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <div className="max-w-7xl mx-auto w-full">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

const WaitingForActivation: React.FC = () => {
    const { logout } = useAuth();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <LogoIcon />
            <h1 className="text-3xl font-bold mt-4">Tài khoản đang chờ kích hoạt</h1>
            <p className="text-gray-400 mt-2 text-center max-w-md">
                Cảm ơn bạn đã đăng ký! Vui lòng chờ quản trị viên phê duyệt tài khoản của bạn để có thể truy cập vào các tính năng của Synca.
            </p>
            <button
                onClick={logout}
                className="mt-8 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
                Đăng xuất
            </button>
        </div>
    );
};

const App: React.FC = () => {
    const { currentUser, loading } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    if (!currentUser) {
        return isLoginView 
            ? <Login onSwitchToRegister={() => setIsLoginView(false)} /> 
            : <Register onSwitchToLogin={() => setIsLoginView(true)} />;
    }

    if (!currentUser.isActive) {
        return <WaitingForActivation />;
    }

    return <MainApp user={currentUser} />;
};

export default App;