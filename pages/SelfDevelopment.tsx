import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { GratitudeEntry, GoodDeed, Habit, HabitLog, HabitIconKey } from '../types';
import { PlusIcon, BookOpenIcon, SparklesIcon, HeartIcon, EditIcon, DeleteIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';


// --- Reusable Tab Component ---
const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const todayStr = new Date().toISOString().slice(0, 10);

const habitIconMap: Record<HabitIconKey, React.FC<{ className?: string }>> = {
    BookOpenIcon,
    SparklesIcon,
    HeartIcon,
};


// --- Components for Self Development ---

// Gratitude Journal Component
const GratitudeJournal: React.FC<{ entries: GratitudeEntry[], onSave: (content: string, id?: string) => Promise<void>, onDelete: (id: string) => void }> = ({ entries, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<GratitudeEntry | null>(null);

    const handleOpenModal = (entry: GratitudeEntry | null = null) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);
    
    const handleSaveEntry = async (content: string) => {
        await onSave(content, editingEntry?.id);
        handleCloseModal();
    };

    return (
        <div className="mt-6">
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <PlusIcon /> Thêm điều Biết ơn
                </button>
            </div>
            <div className="space-y-4">
                {entries.map(entry => (
                    <div key={entry.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-semibold text-gray-400">{new Date(entry.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <div className="flex gap-3">
                                <button onClick={() => handleOpenModal(entry)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                                <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                            </div>
                        </div>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-200">
                            {entry.content.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEntry ? "Chỉnh sửa" : "Hôm nay bạn biết ơn vì điều gì?"}>
                <GratitudeForm onSave={handleSaveEntry} existingEntry={editingEntry} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

const GratitudeForm: React.FC<{ onSave: (content: string) => Promise<void>, existingEntry: GratitudeEntry | null, onClose: () => void }> = ({ onSave, existingEntry, onClose }) => {
    const [content, setContent] = useState(existingEntry?.content.join('\n') || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(content);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">Viết ra những điều bạn cảm thấy biết ơn, mỗi điều một dòng.</p>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" placeholder="VD: Bữa sáng ngon miệng..." required />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                     {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
            </div>
        </form>
    );
};

// Good Deeds Journal Component
const GoodDeedsJournal: React.FC<{ deeds: GoodDeed[], onSave: (content: string, id?: string) => Promise<void>, onDelete: (id: string) => void }> = ({ deeds, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeed, setEditingDeed] = useState<GoodDeed | null>(null);

    const handleOpenModal = (deed: GoodDeed | null = null) => {
        setEditingDeed(deed);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveDeed = async (content: string) => {
        await onSave(content, editingDeed?.id);
        handleCloseModal();
    };

    return (
        <div className="mt-6">
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <PlusIcon /> Ghi lại Việc tốt
                </button>
            </div>
            <div className="space-y-4">
                {deeds.map(deed => (
                    <div key={deed.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-semibold text-gray-400">{new Date(deed.date).toLocaleDateString('vi-VN')}</p>
                            <div className="flex gap-3">
                                <button onClick={() => handleOpenModal(deed)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                                <button onClick={() => onDelete(deed.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                            </div>
                        </div>
                        <p className="mt-2 text-gray-200 italic">"{deed.content}"</p>
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingDeed ? "Chỉnh sửa" : "Hôm nay bạn đã làm việc tốt gì?"}>
                <DeedForm onSave={handleSaveDeed} existingDeed={editingDeed} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

const DeedForm: React.FC<{ onSave: (content: string) => Promise<void>, existingDeed: GoodDeed | null, onClose: () => void }> = ({ onSave, existingDeed, onClose }) => {
    const [content, setContent] = useState(existingDeed?.content || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(content);
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" placeholder="Hành động tử tế, dù nhỏ nhất..." required />
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
            </div>
        </form>
    );
};

// Habit Tracker Component
const HabitTracker: React.FC<{ habits: Habit[], log: HabitLog, onToggle: (id: string) => void, onSave: (name: string, id?: string) => Promise<void>, onDelete: (id: string) => void }> = ({ habits, log, onToggle, onSave, onDelete }) => {
    const [isManageModalOpen, setManageModalOpen] = useState(false);
    
    return (
        <div className="mt-6">
             <div className="flex justify-end mb-6">
                <button onClick={() => setManageModalOpen(true)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500">
                    Quản lý Thói quen
                </button>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-4">Hôm nay ({new Date().toLocaleDateString('vi-VN')})</h3>
                {habits.map(habit => {
                    const IconComponent = habitIconMap[habit.icon];
                    return (
                        <div key={habit.id} className="flex items-center justify-between py-3 border-b border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className={habit.color}>
                                    {IconComponent ? <IconComponent className="w-8 h-8" /> : null}
                                </span>
                                <p className="font-semibold text-white">{habit.name}</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={log[todayStr]?.includes(habit.id) || false}
                                onChange={() => onToggle(habit.id)}
                                className="w-6 h-6 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-600 cursor-pointer"
                            />
                        </div>
                    );
                })}
            </div>
             <Modal isOpen={isManageModalOpen} onClose={() => setManageModalOpen(false)} title="Quản lý Thói quen">
                <ManageHabitsForm habits={habits} onSave={onSave} onDelete={onDelete} />
            </Modal>
        </div>
    );
};

const ManageHabitsForm: React.FC<{ habits: Habit[], onSave: (name: string, id?: string) => Promise<void>, onDelete: (id: string) => void }> = ({ habits, onSave, onDelete }) => {
    const [newHabitName, setNewHabitName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newHabitName.trim()) {
            setIsSaving(true);
            try {
                await onSave(newHabitName.trim());
                setNewHabitName('');
            } finally {
                setIsSaving(false);
            }
        }
    };
    return (
        <div className="space-y-4">
            <div>
                {habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-2 hover:bg-gray-700 rounded-md">
                         <p className="text-gray-200">{habit.name}</p>
                         <button onClick={() => onDelete(habit.id)} className="text-gray-500 hover:text-red-500"><DeleteIcon className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAdd} className="flex gap-2 pt-4 border-t border-gray-700">
                <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="Tên thói quen mới..." className="flex-grow bg-gray-600 text-white rounded-md p-2" />
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-800">
                    {isSaving ? '...' : 'Thêm'}
                </button>
            </form>
        </div>
    );
}

// --- Main Page Component ---
const SelfDevelopment: React.FC = () => {
    const { getUserData, updateUserData, currentUser } = useAuth();
    const [gratitudeEntries, setGratitudeEntries] = useState<GratitudeEntry[]>([]);
    const [deeds, setDeeds] = useState<GoodDeed[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [habitLog, setHabitLog] = useState<HabitLog>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'gratitude' | 'deeds' | 'habits'>('gratitude');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserData();
            setGratitudeEntries(data.selfDevelopment?.gratitude || []);
            setDeeds(data.selfDevelopment?.deeds || []);
            setHabits(data.selfDevelopment?.habits || []);
            setHabitLog(data.selfDevelopment?.habitLog || {});
        } catch(err) {
            console.error("Failed to fetch self-development data:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getUserData]);

    useEffect(() => {
        if(currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);
    
    const updateSelfDevData = async (updatedData: { gratitude?: GratitudeEntry[], deeds?: GoodDeed[], habits?: Habit[], habitLog?: HabitLog }) => {
        const currentData = {
            gratitude: gratitudeEntries,
            deeds: deeds,
            habits: habits,
            habitLog: habitLog,
        };
        const newData = { ...currentData, ...updatedData };

        if(updatedData.gratitude) setGratitudeEntries(updatedData.gratitude);
        if(updatedData.deeds) setDeeds(updatedData.deeds);
        if(updatedData.habits) setHabits(updatedData.habits);
        if(updatedData.habitLog) setHabitLog(updatedData.habitLog);

        await updateUserData({ selfDevelopment: newData });
    };

    // --- Handlers ---
    const handleSaveGratitude = async (content: string, id?: string) => {
        const contentArray = content.split('\n').filter(line => line.trim() !== '');
        let updatedEntries;
        if (id) {
            updatedEntries = gratitudeEntries.map(e => e.id === id ? { ...e, content: contentArray } : e);
        } else {
            updatedEntries = [{ id: Date.now().toString(), date: todayStr, content: contentArray }, ...gratitudeEntries];
        }
        await updateSelfDevData({ gratitude: updatedEntries });
    };
    const handleDeleteGratitude = (id: string) => updateSelfDevData({ gratitude: gratitudeEntries.filter(e => e.id !== id) });

    const handleSaveDeed = async (content: string, id?: string) => {
        let updatedDeeds;
        if (id) {
            updatedDeeds = deeds.map(d => d.id === id ? { ...d, content } : d);
        } else {
            updatedDeeds = [{ id: Date.now().toString(), date: todayStr, content }, ...deeds];
        }
        await updateSelfDevData({ deeds: updatedDeeds });
    };
    const handleDeleteDeed = (id: string) => updateSelfDevData({ deeds: deeds.filter(d => d.id !== id) });
    
    const handleToggleHabit = (habitId: string) => {
        const todayLog = habitLog[todayStr] || [];
        const newLog = todayLog.includes(habitId) ? todayLog.filter(id => id !== habitId) : [...todayLog, habitId];
        updateSelfDevData({ habitLog: { ...habitLog, [todayStr]: newLog } });
    };

    const handleSaveHabit = async (name: string, id?: string) => {
        let updatedHabits;
        if (id) {
            updatedHabits = habits.map(h => h.id === id ? { ...h, name } : h);
        } else {
            const initialHabits: { icon: HabitIconKey, color: string }[] = [
                { icon: 'BookOpenIcon', color: 'text-blue-400' },
                { icon: 'SparklesIcon', color: 'text-purple-400' },
                { icon: 'HeartIcon', color: 'text-red-400' },
            ];
            const newIconDetails = initialHabits[habits.length % initialHabits.length];
            const newHabit: Habit = { 
                id: `h${Date.now()}`, 
                name, 
                icon: newIconDetails.icon, 
                color: newIconDetails.color 
            };
            updatedHabits = [...habits, newHabit];
        }
        await updateSelfDevData({ habits: updatedHabits });
    };
    const handleDeleteHabit = (id: string) => updateSelfDevData({ habits: habits.filter(h => h.id !== id) });

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )
        }
        if (error) {
            return (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center mt-6">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )
        }
        switch (activeTab) {
            case 'gratitude': return <GratitudeJournal entries={gratitudeEntries} onSave={handleSaveGratitude} onDelete={handleDeleteGratitude} />;
            case 'deeds': return <GoodDeedsJournal deeds={deeds} onSave={handleSaveDeed} onDelete={handleDeleteDeed} />;
            case 'habits': return <HabitTracker habits={habits} log={habitLog} onToggle={handleToggleHabit} onSave={handleSaveHabit} onDelete={handleDeleteHabit} />;
            default: return null;
        }
    };

    return (
        <div>
            <PageHeader title="Phát triển Bản thân" subtitle="Gieo trồng những hạt giống tốt đẹp mỗi ngày để kiến tạo cuộc sống ý nghĩa." />
            
            <div className="flex space-x-2 border-b border-gray-700 pb-2 mb-4">
                <TabButton active={activeTab === 'gratitude'} onClick={() => setActiveTab('gratitude')}>Nhật ký Biết ơn</TabButton>
                <TabButton active={activeTab === 'deeds'} onClick={() => setActiveTab('deeds')}>Gieo Hạt Yêu Thương</TabButton>
                <TabButton active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}>Theo dõi Thói quen</TabButton>
            </div>

            {renderContent()}
        </div>
    );
};

export default SelfDevelopment;