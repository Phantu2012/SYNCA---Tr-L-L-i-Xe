/** @jsxRuntime classic */
import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import PageHeader from '../components/PageHeader';

type Theme = 'light' | 'dark';
interface DailyReminderSettings {
    enabled: boolean;
    time: string; // HH:mm
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
    </label>
  );
};

// Mock voices for illustration purposes when the system lacks them.
const mockVietnameseVoices: SpeechSynthesisVoice[] = [
  { name: 'Synca Tiếng Việt (Nam)', lang: 'vi-VN', default: false, localService: true, voiceURI: 'synca-mock-vi-male' },
  { name: 'Synca Tiếng Việt (Nữ)', lang: 'vi-VN', default: false, localService: true, voiceURI: 'synca-mock-vi-female' },
];

const Settings: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(localStorage.getItem('theme') as Theme || 'dark');
    const [generalNotifications, setGeneralNotifications] = useState(true);
    const [speedWarningNotifications, setSpeedWarningNotifications] = useState(true);
    
    // Daily Reminder state
    const [dailyReminder, setDailyReminder] = useState<DailyReminderSettings>({
        enabled: false,
        time: '21:00'
    });
    
    // Voice settings state
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => localStorage.getItem('alertVoiceURI') || '');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Load daily reminder settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('dailyReminder');
        if (savedSettings) {
            setDailyReminder(JSON.parse(savedSettings));
        }
    }, []);

    const handleDailyReminderChange = (newSettings: Partial<DailyReminderSettings>) => {
        const updatedSettings = { ...dailyReminder, ...newSettings };
        setDailyReminder(updatedSettings);
        localStorage.setItem('dailyReminder', JSON.stringify(updatedSettings));
        // Manually dispatch a storage event to notify other tabs/App.tsx
        window.dispatchEvent(new StorageEvent('storage', { key: 'dailyReminder' }));
    };

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                const realVietnameseVoices = availableVoices.filter(v => v.lang.startsWith('vi'));
                let combinedVoices = [...availableVoices];

                if (realVietnameseVoices.length === 0) {
                    combinedVoices = [...mockVietnameseVoices, ...availableVoices];
                }
                
                setVoices(combinedVoices);
                const currentSelectedVoiceURI = localStorage.getItem('alertVoiceURI');
                const isCurrentVoiceAvailable = combinedVoices.some(v => v.voiceURI === currentSelectedVoiceURI);

                if (!currentSelectedVoiceURI || !isCurrentVoiceAvailable) {
                    const defaultVoice = combinedVoices.find(v => v.lang.startsWith('vi') && v.default) || combinedVoices.find(v => v.lang.startsWith('vi'));
                    if (defaultVoice) {
                        localStorage.setItem('alertVoiceURI', defaultVoice.voiceURI);
                        setSelectedVoiceURI(defaultVoice.voiceURI);
                    } else { 
                        const firstCommonVoice = combinedVoices.find(v => ['en-US', 'en-GB'].includes(v.lang));
                        if(firstCommonVoice){
                            localStorage.setItem('alertVoiceURI', firstCommonVoice.voiceURI);
                            setSelectedVoiceURI(firstCommonVoice.voiceURI);
                        }
                    }
                }
            }
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const handleThemeChange = (isDark: boolean) => {
        setTheme(isDark ? 'dark' : 'light');
    };
    
    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newVoiceURI = e.target.value;
        setSelectedVoiceURI(newVoiceURI);
        localStorage.setItem('alertVoiceURI', newVoiceURI);
    };

    const handleTestVoice = () => {
        if ('speechSynthesis' in window && selectedVoiceURI) {
            window.speechSynthesis.cancel();
            
            const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (!selectedVoice) return;

            if (selectedVoiceURI.startsWith('synca-mock-')) {
                const testText = "Đây là bản xem trước của giọng nói Tiếng Việt.";
                const utterance = new SpeechSynthesisUtterance(testText);
                const fallbackVoice = voices.find(v => !v.voiceURI.startsWith('synca-mock-'));
                if (fallbackVoice) {
                    utterance.voice = fallbackVoice;
                    utterance.lang = fallbackVoice.lang;
                }
                 window.speechSynthesis.speak(utterance);
            } else { 
                const testText = "Đây là giọng nói bạn đã chọn để nhận cảnh báo.";
                const utterance = new SpeechSynthesisUtterance(testText);
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
                utterance.rate = 1;
                utterance.pitch = 1;
                window.speechSynthesis.speak(utterance);
            }
        }
    };
    
    const hasRealVietnameseVoice = voices.some(v => v.lang.startsWith('vi') && !v.voiceURI.startsWith('synca-mock-'));

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

                {/* Daily Reminder Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Nhắc nhở Hàng ngày</h3>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Bật nhắc nhở cập nhật</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Nhận thông báo mỗi ngày để ghi chép chi tiêu, lòng biết ơn...</p>
                        </div>
                        <ToggleSwitch checked={dailyReminder.enabled} onChange={(checked) => handleDailyReminderChange({ enabled: checked })} />
                    </div>
                    {dailyReminder.enabled && (
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                            <label htmlFor="reminder-time" className="block font-medium text-gray-800 dark:text-gray-200 mb-2">Thời gian nhắc nhở</label>
                            <input
                                type="time"
                                id="reminder-time"
                                value={dailyReminder.time}
                                onChange={(e) => handleDailyReminderChange({ time: e.target.value })}
                                className="bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-200"
                            />
                        </div>
                    )}
                </div>
                
                {/* Alert Sound Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cài đặt Âm thanh Cảnh báo</h3>
                    <div className="space-y-4">
                        {voices.length > 0 ? (
                            <>
                                <div>
                                    <label htmlFor="voice-select" className="block font-medium text-gray-800 dark:text-gray-200 mb-2">Giọng nói và Ngôn ngữ</label>
                                    <select
                                        id="voice-select"
                                        value={selectedVoiceURI}
                                        onChange={handleVoiceChange}
                                        className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-200"
                                    >
                                        {voices
                                            .sort((a, b) => { // Sort to prioritize Vietnamese voices
                                                if (a.lang.startsWith('vi') && !b.lang.startsWith('vi')) return -1;
                                                if (!a.lang.startsWith('vi') && b.lang.startsWith('vi')) return 1;
                                                return a.name.localeCompare(b.name);
                                            })
                                            .map(voice => (
                                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                                    {voice.name} ({voice.lang})
                                                    {voice.voiceURI.startsWith('synca-mock-') ? ' (Minh họa)' : ''}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Danh sách giọng nói được cung cấp bởi trình duyệt hoặc hệ điều hành của bạn.
                                    </p>
                                </div>

                                {!hasRealVietnameseVoice && (
                                    <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                                        <h4 className="font-semibold text-yellow-300 mb-2">Làm thế nào để có thêm giọng đọc Tiếng Việt?</h4>
                                        <p className="text-sm text-yellow-200/90 leading-relaxed">
                                            Để thêm giọng đọc Tiếng Việt (nam/nữ), bạn có thể cài đặt gói ngôn ngữ trong phần cài đặt hệ thống:
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-yellow-200/90 mt-2 space-y-1">
                                            <li><strong>Windows:</strong> Cài đặt &gt; Thời gian &amp; Ngôn ngữ &gt; Ngôn ngữ &gt; Thêm 'Tiếng Việt' và tải gói giọng nói.</li>
                                            <li><strong>macOS:</strong> Tùy chọn Hệ thống &gt; Trợ năng &gt; Nội dung được đọc &gt; Giọng nói hệ thống &gt; Quản lý giọng nói &gt; Tải về giọng Tiếng Việt.</li>
                                        </ul>
                                        <p className="text-xs text-yellow-400/80 mt-3">Sau khi cài đặt, hãy khởi động lại trình duyệt để cập nhật danh sách.</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleTestVoice}
                                    disabled={!selectedVoiceURI}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
                                >
                                    Nghe thử
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Trình duyệt của bạn không hỗ trợ tính năng giọng nói, hoặc không có giọng nói nào được cài đặt.</p>
                        )}
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