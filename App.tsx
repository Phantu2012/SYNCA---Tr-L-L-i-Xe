import React, { useState, useEffect } from 'react';
import { Page } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import LifeAssistant from './pages/LifeAssistant';
import VehicleLog from './pages/VehicleLog';
import SpeedWarning from './pages/SpeedWarning';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<Page>(Page.DASHBOARD);

    // Request notification permission on first load
    useEffect(() => {
        const hasRequestedNotifications = localStorage.getItem('hasRequestedNotifications');
        if (!hasRequestedNotifications && 'Notification' in window && Notification.permission === 'default') {
            const consent = window.confirm(
                "Cho phép Synca gửi thông báo để chúng tôi có thể nhắc bạn về lịch đăng kiểm, bảo hiểm sắp hết hạn và các sự kiện quan trọng khác nhé!"
            );
            if (consent) {
                Notification.requestPermission().then(permission => {
                    console.log('Notification permission status:', permission);
                });
            }
            localStorage.setItem('hasRequestedNotifications', 'true');
        }
    }, []);


    const renderPage = () => {
        switch (activePage) {
            case Page.DASHBOARD:
                return <Dashboard setActivePage={setActivePage} />;
            case Page.DOCUMENTS:
                return <Documents />;
            case Page.LIFE_ASSISTANT:
                return <LifeAssistant />;
            case Page.VEHICLE_LOG:
                return <VehicleLog />;
            case Page.SPEED_WARNING:
                return <SpeedWarning />;
            case Page.PROFILE:
                return <Profile setActivePage={setActivePage} />;
            case Page.SETTINGS:
                return <Settings />;
            default:
                return <Dashboard setActivePage={setActivePage} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;
