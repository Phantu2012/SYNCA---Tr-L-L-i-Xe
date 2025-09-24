import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { VehicleDocument, DocumentType } from '../types';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Documents: React.FC = () => {
    const { getUserData, updateUserData, currentUser } = useAuth();
    const [documents, setDocuments] = useState<VehicleDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserData();
            setDocuments(data.documents || []);
        } catch (err) {
            console.error("Failed to fetch documents:", err);
            setError("Không thể tải dữ liệu giấy tờ. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getUserData]);

    useEffect(() => {
        if(currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    const handleOpenModal = (doc?: VehicleDocument) => {
        setEditingDocument(doc || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDocument(null);
    };

    const handleSave = async (doc: Omit<VehicleDocument, 'id'>) => {
        let updatedDocuments;
        if (editingDocument) {
            updatedDocuments = documents.map(d => d.id === editingDocument.id ? { ...doc, id: editingDocument.id } : d);
        } else {
            updatedDocuments = [...documents, { ...doc, id: Date.now().toString() }];
        }
        await updateUserData({ documents: updatedDocuments });
        setDocuments(updatedDocuments);
        handleCloseModal();
    };

    const handleDelete = async (id: string) => {
        const updatedDocuments = documents.filter(d => d.id !== id);
        await updateUserData({ documents: updatedDocuments });
        setDocuments(updatedDocuments);
    };
    
    const DocumentForm: React.FC<{ onSave: (doc: Omit<VehicleDocument, 'id'>) => Promise<void>; initialData: VehicleDocument | null; }> = ({ onSave, initialData }) => {
        const [formData, setFormData] = useState<Partial<VehicleDocument>>(initialData || {
            type: DocumentType.REGISTRATION,
            expiryDate: '',
            reminderSettings: [7] // Default reminder
        });
        const [customReminder, setCustomReminder] = useState('');
        const [isSaving, setIsSaving] = useState(false);
        const [saveError, setSaveError] = useState<string | null>(null);

        const presetReminders = [1, 3, 7, 14];

        const handleReminderCheckboxChange = (value: number) => {
            const currentSettings = formData.reminderSettings || [];
            if (currentSettings.includes(value)) {
                setFormData({ ...formData, reminderSettings: currentSettings.filter(d => d !== value) });
            } else {
                setFormData({ ...formData, reminderSettings: [...currentSettings, value].sort((a,b) => a-b) });
            }
        };
        
        const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setFormData({ ...formData, image: event.target?.result as string });
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };

        const handleAddReminder = () => {
            const days = parseInt(customReminder, 10);
            if (!isNaN(days) && days > 0) {
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
            setSaveError(null);
            try {
                await onSave(formData as Omit<VehicleDocument, 'id'>);
            } catch (error) {
                console.error("Failed to save document:", error);
                setSaveError("Lưu thất bại. Vui lòng thử lại.");
            } finally {
                setIsSaving(false);
            }
        };
        
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Loại giấy tờ</label>
                    <select id="type" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as DocumentType})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                        {Object.values(DocumentType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-1">Ngày hết hạn</label>
                    <input type="date" id="expiryDate" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label>
                    <textarea id="notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" rows={3}></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cài đặt nhắc nhở (trước khi hết hạn)</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
                        {presetReminders.map(day => (
                            <label key={day} className="flex items-center space-x-2 text-sm text-gray-200">
                                <input
                                    type="checkbox"
                                    checked={formData.reminderSettings?.includes(day)}
                                    onChange={() => handleReminderCheckboxChange(day)}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-600"
                                />
                                <span>{day} ngày</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={customReminder}
                            onChange={(e) => setCustomReminder(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReminder(); } }}
                            placeholder="Tùy chọn khác (số ngày)"
                            className="w-48 bg-gray-600 border-gray-500 text-white rounded-md p-2"
                        />
                        <button type="button" onClick={handleAddReminder} className="px-4 py-2 bg-gray-500 rounded-md hover:bg-gray-400 text-white font-semibold">Thêm</button>
                    </div>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {formData.reminderSettings?.filter(d => !presetReminders.includes(d)).map(day => (
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
                    <label htmlFor="docImage" className="block text-sm font-medium text-gray-300 mb-1">Ảnh chụp giấy tờ</label>
                    <input type="file" id="docImage" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                    <p className="text-xs text-gray-500 mt-1">Synca sẽ xin quyền truy cập máy ảnh và thư viện để bạn có thể lưu ảnh chụp.</p>
                    {formData.image && <img src={formData.image} alt="Xem trước" className="mt-4 rounded-md max-h-40" />}
                </div>
                {saveError && <p className="text-sm text-red-400">{saveError}</p>}
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isSaving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </form>
        )
    }
    
    if (isLoading) {
        return (
            <div>
                <PageHeader title="Quản lý Giấy tờ" subtitle="Theo dõi tất cả các giấy tờ xe quan trọng của bạn ở một nơi." />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div>
                <PageHeader title="Quản lý Giấy tờ" subtitle="Theo dõi tất cả các giấy tờ xe quan trọng của bạn ở một nơi." />
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Quản lý Giấy tờ" subtitle="Theo dõi tất cả các giấy tờ xe quan trọng của bạn ở một nơi." />
            
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <PlusIcon />
                    Thêm Giấy tờ
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Loại giấy tờ</th>
                            <th className="p-4 font-semibold">Ngày hết hạn</th>
                            <th className="p-4 font-semibold hidden md:table-cell">Ghi chú</th>
                            <th className="p-4 font-semibold">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => (
                            <tr key={doc.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-4 font-medium">{doc.type}</td>
                                <td className="p-4">{doc.expiryDate}</td>
                                <td className="p-4 text-gray-400 hidden md:table-cell">{doc.notes}</td>
                                <td className="p-4">
                                    <div className="flex gap-4">
                                        <button onClick={() => handleOpenModal(doc)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                        <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-400"><DeleteIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {documents.length === 0 && <p className="p-6 text-center text-gray-400">Chưa có giấy tờ nào. Hãy thêm ngay!</p>}
            </div>

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingDocument ? "Chỉnh sửa Giấy tờ" : "Thêm Giấy tờ mới"}>
                <DocumentForm onSave={handleSave} initialData={editingDocument} />
            </Modal>
        </div>
    );
};

export default Documents;