import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { VehicleLogEntry } from '../types';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';


const VehicleLog: React.FC = () => {
    const { getUserData, updateUserData, currentUser } = useAuth();
    const [logs, setLogs] = useState<VehicleLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<VehicleLogEntry | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserData();
            setLogs(data.vehicleLog || []);
        } catch (err) {
            console.error("Failed to fetch vehicle log:", err);
            setError("Không thể tải nhật ký bảo dưỡng. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getUserData]);

    useEffect(() => {
        if(currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    const handleOpenModal = (log?: VehicleLogEntry) => {
        setEditingLog(log || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLog(null);
    };

    const handleSave = async (log: Omit<VehicleLogEntry, 'id'>) => {
        let updatedLogs;
        if (editingLog) {
            updatedLogs = logs.map(l => l.id === editingLog.id ? { ...log, id: editingLog.id } : l).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else {
            updatedLogs = [...logs, { ...log, id: Date.now().toString() }].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        await updateUserData({ vehicleLog: updatedLogs });
        setLogs(updatedLogs);
        handleCloseModal();
    };

    const handleDelete = async (id: string) => {
        const updatedLogs = logs.filter(l => l.id !== id);
        await updateUserData({ vehicleLog: updatedLogs });
        setLogs(updatedLogs);
    };
    
    const LogForm: React.FC<{ onSave: (log: Omit<VehicleLogEntry, 'id'>) => Promise<void>, initialData: VehicleLogEntry | null }> = ({ onSave, initialData }) => {
        const [formData, setFormData] = useState<Partial<VehicleLogEntry>>(initialData || {
            date: new Date().toISOString().split('T')[0],
            mileage: 0,
            service: '',
            cost: 0
        });
        const [isSaving, setIsSaving] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSaving(true);
            try {
                await onSave(formData as Omit<VehicleLogEntry, 'id'>);
            } catch (error) {
                console.error("Failed to save log entry:", error);
            } finally {
                setIsSaving(false);
            }
        };
        
        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Ngày thực hiện</label>
                    <input type="date" id="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
                </div>
                 <div>
                    <label htmlFor="mileage" className="block text-sm font-medium text-gray-300 mb-1">Số Km</label>
                    <input type="number" id="mileage" value={formData.mileage} onChange={e => setFormData({...formData, mileage: Number(e.target.value)})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
                </div>
                 <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-1">Dịch vụ/Sửa chữa</label>
                    <input type="text" id="service" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
                </div>
                <div>
                    <label htmlFor="cost" className="block text-sm font-medium text-gray-300 mb-1">Chi phí (VNĐ)</label>
                    <input type="number" id="cost" value={formData.cost} onChange={e => setFormData({...formData, cost: Number(e.target.value)})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
                </div>
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label>
                    <textarea id="notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" rows={3}></textarea>
                </div>
                 <div>
                    <label htmlFor="invoice" className="block text-sm font-medium text-gray-300 mb-1">Ảnh hóa đơn (tùy chọn)</label>
                    <input type="file" id="invoice" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                </div>
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
                <PageHeader title="Sổ tay Sức khỏe Xe" subtitle="Ghi chép và theo dõi toàn bộ lịch sử bảo dưỡng, sửa chữa của xe." />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
             <div>
                <PageHeader title="Sổ tay Sức khỏe Xe" subtitle="Ghi chép và theo dõi toàn bộ lịch sử bảo dưỡng, sửa chữa của xe." />
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Sổ tay Sức khỏe Xe" subtitle="Ghi chép và theo dõi toàn bộ lịch sử bảo dưỡng, sửa chữa của xe." />
            
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <PlusIcon />
                    Thêm Nhật ký
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
                <table className="w-full min-w-max text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Ngày</th>
                            <th className="p-4 font-semibold">Số Km</th>
                            <th className="p-4 font-semibold">Dịch vụ</th>
                            <th className="p-4 font-semibold">Chi phí</th>
                            <th className="p-4 font-semibold">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-4">{log.date}</td>
                                <td className="p-4">{log.mileage.toLocaleString('vi-VN')} km</td>
                                <td className="p-4 font-medium">{log.service}</td>
                                <td className="p-4 text-green-400">{log.cost.toLocaleString('vi-VN')}đ</td>
                                <td className="p-4">
                                    <div className="flex gap-4">
                                        <button onClick={() => handleOpenModal(log)} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                        <button onClick={() => handleDelete(log.id)} className="text-red-500 hover:text-red-400"><DeleteIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {logs.length === 0 && <p className="p-6 text-center text-gray-400">Chưa có nhật ký bảo dưỡng nào.</p>}
            </div>

             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingLog ? "Chỉnh sửa Nhật ký" : "Thêm Nhật ký Bảo dưỡng"}>
                <LogForm onSave={handleSave} initialData={editingLog} />
            </Modal>
        </div>
    );
};

export default VehicleLog;