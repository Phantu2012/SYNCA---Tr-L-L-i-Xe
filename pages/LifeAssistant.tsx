import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { PersonalReminder, ReminderType } from '../types';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/Icons';
import Modal from '../components/Modal';

const sampleReminders: PersonalReminder[] = [
    { id: '1', type: ReminderType.BIRTHDAY, title: 'Sinh nhật Mẹ', date: '2024-08-25' },
    { id: '2', type: ReminderType.TODO, title: 'Gọi điện cho khách hàng A', date: '2024-07-30' },
    { id: '3', type: ReminderType.GOAL, title: 'Hoàn thành báo cáo quý 3', date: '2024-09-30' },
];

const LifeAssistant: React.FC = () => {
    const [reminders, setReminders] = useState<PersonalReminder[]>(sampleReminders);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<PersonalReminder | null>(null);

    const handleOpenModal = (reminder?: PersonalReminder) => {
        setEditingReminder(reminder || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReminder(null);
    };

    const handleSave = (reminder: PersonalReminder) => {
        if (editingReminder) {
            setReminders(reminders.map(r => r.id === editingReminder.id ? { ...reminder, id: editingReminder.id } : r));
        } else {
            setReminders([...reminders, { ...reminder, id: Date.now().toString() }]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Bạn có chắc muốn xóa lời nhắc này không?')) {
            setReminders(reminders.filter(r => r.id !== id));
        }
    };
    
    const ReminderForm: React.FC = () => {
        const [formData, setFormData] = useState<Partial<PersonalReminder>>(editingReminder || {
            type: ReminderType.TODO,
            title: '',
            date: ''
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleSave(formData as PersonalReminder);
        };
        
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Loại lời nhắc</label>
                    <select id="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as ReminderType})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                        {Object.values(ReminderType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Tiêu đề</label>
                    <input type="text" id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Ngày</label>
                    <input type="date" id="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label>
                    <textarea id="notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" rows={3}></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors text-white font-semibold">Lưu</button>
                </div>
            </form>
        )
    }

    return (
        <div>
            <PageHeader title="Trợ lý Cuộc sống" subtitle="Quản lý các sự kiện, mục tiêu và công việc quan trọng của bạn." />
            
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <PlusIcon />
                    Thêm Lời nhắc
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {reminders.map((reminder) => (
                        <div key={reminder.id} className="bg-gray-700 rounded-lg p-4 flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-semibold uppercase text-blue-400">{reminder.type}</span>
                                <h4 className="text-lg font-bold text-white mt-1">{reminder.title}</h4>
                                <p className="text-sm text-gray-300 mt-1">{reminder.date}</p>
                                {reminder.notes && <p className="text-sm text-gray-400 mt-2 italic">"{reminder.notes}"</p>}
                            </div>
                            <div className="flex gap-3 mt-4 self-end">
                                <button onClick={() => handleOpenModal(reminder)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                                <button onClick={() => handleDelete(reminder.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                            </div>
                        </div>
                    ))}
                 </div>
                 {reminders.length === 0 && <p className="p-6 text-center text-gray-400">Không có lời nhắc nào.</p>}
            </div>

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingReminder ? "Chỉnh sửa Lời nhắc" : "Thêm Lời nhắc mới"}>
                <ReminderForm />
            </Modal>
        </div>
    );
};

export default LifeAssistant;
