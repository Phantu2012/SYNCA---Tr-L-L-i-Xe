
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';

type Theme = 'light' | 'dark';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
    </label>
  );
};

const Settings: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(localStorage.getItem('theme') as Theme || 'dark');
    const [generalNotifications, setGeneralNotifications] = useState(true);
    const [speedWarningNotifications, setSpeedWarningNotifications] = useState(true);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleThemeChange = (isDark: boolean) => {
        setTheme(isDark ? 'dark' : 'light');
    };

    return (
        <div>
            <PageHeader title="Cài đặt" subtitle="Tùy chỉnh giao diện và các tính năng của ứng dụng." />

            <div className="space-y-8 max-w-2xl">
                {/* Appearance Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Giao diện</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Giao diện tối (Dark Mode)</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Chuyển đổi giữa nền sáng và tối.</p>
                        </div>
                        <ToggleSwitch checked={theme === 'dark'} onChange={handleThemeChange} />
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Thông báo & Cảnh báo</h3>
                     <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Thông báo chung</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nhận nhắc nhở về giấy tờ, sinh nhật, v.v.</p>
                        </div>
                        <ToggleSwitch checked={generalNotifications} onChange={setGeneralNotifications} />
                    </div>
                    <div className="flex items-center justify-between pt-4">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Cảnh báo tốc độ</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nhận cảnh báo khi vượt quá tốc độ cho phép.</p>
                        </div>
                        <ToggleSwitch checked={speedWarningNotifications} onChange={setSpeedWarningNotifications} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
