import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { PersonalReminder, ReminderType, RepeatFrequency, EventGroup } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, MoonIcon, RepeatIcon, FamilyIcon, FriendsIcon, WorkIcon, PersonalIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { solarToLunar, lunarToSolar } from '../utils/calendar';
import { useAuth } from '../contexts/AuthContext';

const groupInfo: { [key in EventGroup]: { color: string, icon: React.ReactNode } } = {
    [EventGroup.FAMILY]: { color: 'border-blue-400', icon: <FamilyIcon className="w-6 h-6 text-blue-400" /> },
    [EventGroup.FRIENDS]: { color: 'border-green-400', icon: <FriendsIcon className="w-6 h-6 text-green-400" /> },
    [EventGroup.WORK]: { color: 'border-purple-400', icon: <WorkIcon className="w-6 h-6 text-purple-400" /> },
    [EventGroup.PERSONAL]: { color: 'border-yellow-400', icon: <PersonalIcon className="w-6 h-6 text-yellow-400" /> },
};

const calculateNextOccurrence = (reminder: PersonalReminder): Date => {
    const originalDate = new Date(reminder.date);
    if (isNaN(originalDate.getTime())) return new Date('9999-12-31');
    if (!reminder.repeat || reminder.repeat === 'none') return originalDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const originalMonth = originalDate.getMonth();
    const originalDay = originalDate.getDate();
    if (reminder.repeat === 'yearly') {
        const thisYearOccurrence = new Date(today.getFullYear(), originalMonth, originalDay);
        return thisYearOccurrence >= today ? thisYearOccurrence : new Date(today.getFullYear() + 1, originalMonth, originalDay);
    }
    let nextOccurrence = new Date(originalDate);
    while (nextOccurrence < today) {
        if (reminder.repeat === 'monthly') nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        else if (reminder.repeat === 'quarterly') nextOccurrence.setMonth(nextOccurrence.getMonth() + 3);
        else break;
    }
    return nextOccurrence;
};

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

const EventCalendar: React.FC = () => {
    const { getUserData, updateUserData, currentUser } = useAuth();
    const [reminders, setReminders] = useState<PersonalReminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<PersonalReminder | null>(null);
    const [reminderToDelete, setReminderToDelete] = useState<PersonalReminder | null>(null);

     const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserData();
            setReminders(data.events || []);
        } catch (err) {
            console.error("Failed to fetch events:", err);
            setError("Không thể tải dữ liệu sự kiện. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getUserData]);

    useEffect(() => {
        if(currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    const handleOpenModal = (reminder?: PersonalReminder) => {
        setEditingReminder(reminder || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReminder(null);
    };

    const handleSave = async (reminder: Omit<PersonalReminder, 'id'>) => {
        let updatedReminders;
        if (editingReminder) {
            updatedReminders = reminders.map(r => r.id === editingReminder.id ? { ...reminder, id: editingReminder.id } : r);
        } else {
            updatedReminders = [...reminders, { ...reminder, id: Date.now().toString() }];
        }
        await updateUserData({ events: updatedReminders });
        setReminders(updatedReminders);
        handleCloseModal();
    };

    const handleConfirmDelete = async () => {
        if (!reminderToDelete) return;
        try {
            const updatedReminders = reminders.filter(r => r.id !== reminderToDelete.id);
            await updateUserData({ events: updatedReminders });
            setReminders(updatedReminders);
        } catch (err) {
            console.error("Failed to delete event:", err);
            setError("Không thể xóa sự kiện. Vui lòng thử lại.");
        } finally {
            setReminderToDelete(null);
        }
    };


    const upcomingReminders = useMemo(() => {
        return reminders
            .map(r => ({ ...r, nextOccurrenceDate: calculateNextOccurrence(r) }))
            .sort((a, b) => a.nextOccurrenceDate.getTime() - b.nextOccurrenceDate.getTime());
    }, [reminders]);

    const groupedReminders = useMemo(() => {
        const groups: { [key in EventGroup]?: (PersonalReminder & { nextOccurrenceDate: Date })[] } = {};
        upcomingReminders.forEach(reminder => {
            if (!groups[reminder.group]) {
                groups[reminder.group] = [];
            }
            groups[reminder.group]!.push(reminder);
        });
        return Object.entries(groups) as [EventGroup, (PersonalReminder & { nextOccurrenceDate: Date })[]][];
    }, [upcomingReminders]);
    
    const ReminderForm: React.FC<{ onSave: (r: Omit<PersonalReminder, 'id'>) => Promise<void>; initialData: PersonalReminder | null }> = ({ onSave, initialData }) => {
        const [formData, setFormData] = useState<Partial<PersonalReminder>>(initialData || { group: EventGroup.FAMILY, type: ReminderType.TODO, title: '', date: '', time: '', calendarType: 'solar', reminderSettings: [0], repeat: 'none' });
        const [convertedDateStr, setConvertedDateStr] = useState('');
        const [customReminder, setCustomReminder] = useState('');
        const [isSaving, setIsSaving] = useState(false);
        
        const reminderOptions = [{ value: 0, label: 'Đúng ngày' }, { value: 1, label: '1 ngày' }, { value: 3, label: '3 ngày' }, { value: 7, label: '7 ngày' }];

        useEffect(() => {
            if (!initialData && (formData.type === ReminderType.BIRTHDAY || formData.type === ReminderType.ANNIVERSARY)) {
                setFormData(prev => ({ ...prev, repeat: 'yearly' }));
            }
        }, [formData.type, initialData]);

        useEffect(() => {
            if (formData.date) {
                try {
                    const [year, month, day] = formData.date.split('-').map(Number);
                    if (formData.calendarType === 'solar') {
                        const lunar = solarToLunar(year, month, day);
                        setConvertedDateStr(`(Tương ứng Âm lịch: ${lunar.day}/${lunar.month}/${lunar.year})`);
                    } else {
                        const solar = new Date(lunarToSolar(year, month, day, false).join('/'));
                        setConvertedDateStr(`(Tương ứng Dương lịch: ${solar.getDate()}/${solar.getMonth() + 1}/${solar.getFullYear()})`);
                    }
                } catch (e) { setConvertedDateStr(''); }
            } else { setConvertedDateStr(''); }
        }, [formData.date, formData.calendarType]);
        
        const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => setFormData({ ...formData, image: event.target?.result as string });
                reader.readAsDataURL(e.target.files[0]);
            }
        };
        
        const handleReminderCheckboxChange = (value: number) => {
            const currentSettings = formData.reminderSettings || [];
            if (currentSettings.includes(value)) {
                setFormData({ ...formData, reminderSettings: currentSettings.filter(d => d !== value) });
            } else {
                setFormData({ ...formData, reminderSettings: [...currentSettings, value].sort((a,b) => a-b) });
            }
        };

        const handleAddCustomReminder = () => {
            const days = parseInt(customReminder, 10);
            if (!isNaN(days) && days >= 0) {
                const currentSettings = formData.reminderSettings || [];
                if (!currentSettings.includes(days)) {
                    setFormData({ ...formData, reminderSettings: [...currentSettings, days].sort((a, b) => a - b) });
                }
                setCustomReminder('');
            }
        };

        const handleRemoveReminder = (value: number) => {
            const currentSettings = formData.reminderSettings || [];
            setFormData({ ...formData, reminderSettings: currentSettings.filter(d => d !== value) });
        };
        
        const handleSubmit = async (e: React.FormEvent) => {
             e.preventDefault();
             setIsSaving(true);
             try {
                await onSave(formData as Omit<PersonalReminder, 'id'>);
             } catch (err) {
                console.error("Failed to save event:", err);
                // Optionally show an error message to the user
             } finally {
                setIsSaving(false);
             }
        };
        
        return (
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="group" className="block text-sm font-medium text-gray-300 mb-1">Nhóm sự kiện</label>
                    <select id="group" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value as EventGroup})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required>
                        {Object.values(EventGroup).map(group => <option key={group} value={group}>{group}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Loại sự kiện</label>
                    <select id="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ReminderType})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                        {Object.values(ReminderType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Tiêu đề</label>
                    <input type="text" id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                 <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Loại lịch</label>
                        <div className="flex gap-4">
                            <label className="flex items-center space-x-2 text-sm text-gray-200"><input type="radio" name="calendarType" value="solar" checked={formData.calendarType === 'solar'} onChange={() => setFormData({...formData, calendarType: 'solar'})} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 focus:ring-blue-600" /><span>Lịch Dương</span></label>
                            <label className="flex items-center space-x-2 text-sm text-gray-200"><input type="radio" name="calendarType" value="lunar" checked={formData.calendarType === 'lunar'} onChange={() => setFormData({...formData, calendarType: 'lunar'})} className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 focus:ring-blue-600" /><span>Lịch Âm</span></label>
                        </div>
                    </div>
                     <div className="flex-1">
                         <label htmlFor="repeat" className="block text-sm font-medium text-gray-300 mb-2">Lặp lại</label>
                         <select id="repeat" value={formData.repeat || 'none'} onChange={e => setFormData({...formData, repeat: e.target.value as RepeatFrequency})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                             <option value="none">Không lặp lại</option><option value="yearly">Hàng năm</option><option value="quarterly">Hàng quý</option><option value="monthly">Hàng tháng</option>
                         </select>
                     </div>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Ngày & Giờ (gốc)</label>
                    <div className="flex gap-2">
                        <input type="date" id="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-2/3 bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                        <input type="time" id="time" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} className="w-1/3 bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    {convertedDateStr && <p className="text-xs text-gray-400 mt-1">{convertedDateStr}</p>}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cài đặt nhắc nhở</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
                         {reminderOptions.map(opt => (
                            <label key={opt.value} className="flex items-center space-x-2 text-sm text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={formData.reminderSettings?.includes(opt.value)}
                                    onChange={() => handleReminderCheckboxChange(opt.value)}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-600"
                                />
                                <span>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                         <input
                            type="number"
                            value={customReminder}
                            onChange={(e) => setCustomReminder(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomReminder(); } }}
                            placeholder="Tùy chọn khác (số ngày trước)"
                            className="w-48 bg-gray-600 border-gray-500 text-white rounded-md p-2"
                        />
                        <button type="button" onClick={handleAddCustomReminder} className="px-4 py-2 bg-gray-500 rounded-md hover:bg-gray-400 text-white font-semibold">Thêm</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.reminderSettings?.filter(d => !reminderOptions.map(o => o.value).includes(d)).map(day => (
                            <span key={day} className="flex items-center gap-2 bg-blue-600/50 text-blue-100 text-sm font-medium px-2.5 py-1 rounded-full">
                                {day} ngày trước
                                <button type="button" onClick={() => handleRemoveReminder(day)} className="text-blue-200 hover:text-white">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
                 <div>
                    <label htmlFor="reminderImage" className="block text-sm font-medium text-gray-300 mb-1">Ảnh đính kèm</label>
                    <input type="file" id="reminderImage" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                    {formData.image && <img src={formData.image} alt="Xem trước" className="mt-4 rounded-md max-h-40 object-cover" />}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                         {isSaving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </form>
        )
    };
    
    if (isLoading) {
        return (
             <div>
                <PageHeader title="Lịch Sự kiện" subtitle="Quản lý sinh nhật, ngày giỗ, và các sự kiện quan trọng theo từng nhóm." />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
             <div>
                <PageHeader title="Lịch Sự kiện" subtitle="Quản lý sinh nhật, ngày giỗ, và các sự kiện quan trọng theo từng nhóm." />
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Lịch Sự kiện" subtitle="Quản lý sinh nhật, ngày giỗ, và các sự kiện quan trọng theo từng nhóm." />
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <PlusIcon /> Thêm Sự kiện
                </button>
            </div>
            <div className="space-y-8">
                {groupedReminders.map(([group, remindersInGroup]) => (
                    <div key={group}>
                        <div className="flex items-center gap-3 mb-4 pl-1">
                            {groupInfo[group].icon}
                            <h3 className="text-xl font-bold text-white">{group}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {remindersInGroup.map((r) => (
                                <div key={r.id} className={`bg-gray-800 rounded-lg flex flex-col overflow-hidden shadow-lg border-l-4 ${groupInfo[r.group].color}`}>
                                    {r.image && <img src={r.image} alt={r.title} className="w-full h-32 object-cover" />}
                                    <div className="p-4 flex flex-col justify-between flex-grow">
                                        <div>
                                            <span className="text-xs font-semibold uppercase text-blue-400">{r.type}</span>
                                            <h4 className="text-lg font-bold text-white mt-1">{r.title}</h4>
                                            <p className="text-sm text-gray-300 mt-1 flex items-center">
                                                {formatDate(r.nextOccurrenceDate)}
                                                {r.time && <span className="ml-2 font-semibold text-gray-100">{r.time}</span>}
                                                {r.calendarType === 'lunar' && <MoonIcon />}
                                                {r.repeat && r.repeat !== 'none' && <RepeatIcon />}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 mt-4 self-end">
                                            <button onClick={() => handleOpenModal(r)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                                            <button onClick={() => setReminderToDelete(r)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {reminders.length === 0 && !isLoading && (
                    <div className="bg-gray-800 rounded-lg shadow-lg p-10 text-center">
                        <p className="text-gray-400">Chưa có sự kiện nào.</p>
                        <p className="text-gray-500 text-sm mt-2">Hãy nhấn "Thêm Sự kiện" để bắt đầu quản lý cuộc sống của bạn!</p>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingReminder ? "Chỉnh sửa Sự kiện" : "Thêm Sự kiện mới"}>
                <ReminderForm onSave={handleSave} initialData={editingReminder} />
            </Modal>
            <Modal isOpen={!!reminderToDelete} onClose={() => setReminderToDelete(null)} title="Xác nhận Xóa Sự kiện">
                <div>
                    <p className="text-gray-300">Bạn có chắc chắn muốn xóa sự kiện: <strong className="text-white">{reminderToDelete?.title}</strong>? Thao tác này không thể hoàn tác.</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setReminderToDelete(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                        <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors">Xóa</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EventCalendar;