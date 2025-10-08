import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { Vehicle, VehicleLogEntry } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, CarIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- Form for adding/editing a Vehicle ---
const VehicleForm: React.FC<{ onSave: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>, initialData: Vehicle | null, onClose: () => void }> = ({ onSave, initialData, onClose }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        plateNumber: initialData?.plateNumber || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="vehicleName" className="block text-sm font-medium text-gray-300 mb-1">Tên xe</label>
                <input type="text" id="vehicleName" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" placeholder="VD: Vinfast VF8" required />
            </div>
            <div>
                <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-300 mb-1">Biển số xe (tùy chọn)</label>
                <input type="text" id="plateNumber" value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" placeholder="VD: 51K-888.88" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
            </div>
        </form>
    );
};


// --- Form for adding/editing a Log Entry ---
const LogForm: React.FC<{ onSave: (log: Omit<VehicleLogEntry, 'id' | 'vehicleId'>) => Promise<void>, initialData: VehicleLogEntry | null, onClose: () => void }> = ({ onSave, initialData, onClose }) => {
    const [formData, setFormData] = useState<Partial<Omit<VehicleLogEntry, 'id' | 'vehicleId'>>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [nextMileageManuallySet, setNextMileageManuallySet] = useState(false);
    
    useEffect(() => {
        setFormData(initialData || {
            date: new Date().toISOString().split('T')[0],
            mileage: 0,
            service: '',
            cost: 0
        });
        setNextMileageManuallySet(!!initialData?.nextMileage);
    }, [initialData]);

    const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMileage = Number(e.target.value);
        setFormData(prev => ({
            ...prev,
            mileage: newMileage,
            nextMileage: nextMileageManuallySet ? prev.nextMileage : newMileage + 5000
        }));
    };

    const handleNextMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNextMileageManuallySet(true);
        setFormData(prev => ({ ...prev, nextMileage: Number(e.target.value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData as Omit<VehicleLogEntry, 'id' | 'vehicleId'>);
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
                <input type="date" id="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="mileage" className="block text-sm font-medium text-gray-300 mb-1">Số Km hiện tại</label>
                    <input type="number" id="mileage" value={formData.mileage} onChange={handleMileageChange} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
                </div>
                 <div>
                    <label htmlFor="nextMileage" className="block text-sm font-medium text-gray-300 mb-1">Số Km bảo dưỡng tiếp theo</label>
                    <input type="number" id="nextMileage" value={formData.nextMileage || ''} onChange={handleNextMileageChange} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" placeholder="Tự động +5000km" />
                </div>
            </div>
            <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-1">Dịch vụ/Sửa chữa</label>
                <input type="text" id="service" value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
            </div>
            <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-300 mb-1">Chi phí (VNĐ)</label>
                <input type="number" id="cost" value={formData.cost} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required />
            </div>
             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label>
                <textarea id="notes" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" rows={2}></textarea>
            </div>
             <div>
                <label htmlFor="nextNotes" className="block text-sm font-medium text-gray-300 mb-1">Lưu ý cho lần bảo dưỡng tới</label>
                <textarea id="nextNotes" value={formData.nextMaintenanceNotes || ''} onChange={e => setFormData({ ...formData, nextMaintenanceNotes: e.target.value })} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" rows={2}></textarea>
            </div>
            <div>
                <label htmlFor="invoice" className="block text-sm font-medium text-gray-300 mb-1">Ảnh hóa đơn (tùy chọn)</label>
                <input type="file" id="invoice" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
            </div>
        </form>
    )
}

// --- Main Page Component ---
const VehicleLog: React.FC = () => {
    const { getUserData, updateUserData, currentUser } = useAuth();
    
    // Data state
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [logs, setLogs] = useState<VehicleLogEntry[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<VehicleLogEntry | null>(null);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // --- Data Fetching & One-time Migration ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserData();
            
            // One-time migration for users with old log structure
            if ((data.vehicles || []).length === 0 && (data.vehicleLog || []).length > 0) {
                const needsMigration = data.vehicleLog.some(log => !log.vehicleId);
                if (needsMigration) {
                    const newVehicle: Vehicle = { id: `v${Date.now()}`, name: 'Xe Mặc định' };
                    const migratedLogs: VehicleLogEntry[] = data.vehicleLog.map(log => ({
                        ...log,
                        vehicleId: newVehicle.id,
                    }));
                    
                    await updateUserData({ vehicles: [newVehicle], vehicleLog: migratedLogs });
                    
                    setVehicles([newVehicle]);
                    setLogs(migratedLogs);
                    setSelectedVehicleId(newVehicle.id);
                } else {
                    // Data is inconsistent but migrated, just load it
                    setVehicles(data.vehicles || []);
                    setLogs(data.vehicleLog || []);
                    setSelectedVehicleId(currentId => currentId || data.vehicles?.[0]?.id || null);
                }
            } else {
                setVehicles(data.vehicles || []);
                setLogs(data.vehicleLog || []);
                setSelectedVehicleId(currentId => currentId || data.vehicles?.[0]?.id || null);
            }
        } catch (err) {
            console.error("Failed to fetch vehicle data:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getUserData, updateUserData]);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    // --- Derived State ---
    const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);
    const filteredLogs = useMemo(() => {
        if (!selectedVehicleId) return [];
        return logs.filter(log => log.vehicleId === selectedVehicleId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [logs, selectedVehicleId]);
    const latestLog = useMemo(() => filteredLogs[0], [filteredLogs]);

    // --- Handlers ---
    const handleSaveVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
        let updatedVehicles;
        if (editingVehicle) {
            updatedVehicles = vehicles.map(v => v.id === editingVehicle.id ? { ...vehicleData, id: editingVehicle.id } : v);
        } else {
            const newId = `v${Date.now()}`;
            updatedVehicles = [...vehicles, { ...vehicleData, id: newId }];
            setSelectedVehicleId(newId);
        }
        await updateUserData({ vehicles: updatedVehicles });
        setVehicles(updatedVehicles);
        setIsVehicleModalOpen(false);
        setEditingVehicle(null);
    };

    const handleDeleteVehicle = async (id: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa xe này? Tất cả nhật ký bảo dưỡng liên quan cũng sẽ bị xóa.")) return;
        const updatedVehicles = vehicles.filter(v => v.id !== id);
        const updatedLogs = logs.filter(l => l.vehicleId !== id);
        await updateUserData({ vehicles: updatedVehicles, vehicleLog: updatedLogs });
        setVehicles(updatedVehicles);
        setLogs(updatedLogs);
        if (selectedVehicleId === id) {
            setSelectedVehicleId(updatedVehicles[0]?.id || null);
        }
    };
    
    const handleSaveLog = async (logData: Omit<VehicleLogEntry, 'id' | 'vehicleId'>) => {
        if (!selectedVehicleId) return;
        let updatedLogs;
        if (editingLog) {
            updatedLogs = logs.map(l => l.id === editingLog.id ? { ...logData, id: editingLog.id, vehicleId: selectedVehicleId } : l);
        } else {
            updatedLogs = [...logs, { ...logData, id: `l${Date.now()}`, vehicleId: selectedVehicleId }];
        }
        await updateUserData({ vehicleLog: updatedLogs });
        setLogs(updatedLogs);
        setIsLogModalOpen(false);
        setEditingLog(null);
    };

    const handleDeleteLog = async (id: string) => {
        const updatedLogs = logs.filter(l => l.id !== id);
        await updateUserData({ vehicleLog: updatedLogs });
        setLogs(updatedLogs);
    };

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

            <div className="flex items-center gap-2 mb-6 flex-wrap">
                {vehicles.map(vehicle => (
                    <button key={vehicle.id} onClick={() => setSelectedVehicleId(vehicle.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border-2 ${selectedVehicleId === vehicle.id ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'bg-gray-700 border-gray-700 hover:border-gray-500 text-gray-300'}`}>
                        <CarIcon className="w-5 h-5"/> {vehicle.name}
                    </button>
                ))}
                <button onClick={() => { setEditingVehicle(null); setIsVehicleModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500">
                    <PlusIcon className="w-5 h-5"/> Thêm xe
                </button>
            </div>
            
            {!selectedVehicle ? (
                <div className="text-center bg-gray-800 p-8 rounded-lg">
                    <h3 className="text-xl font-bold text-white">Chào mừng bạn!</h3>
                    <p className="text-gray-400 mt-2">Hãy bắt đầu bằng cách thêm chiếc xe đầu tiên của bạn để quản lý.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold text-white">{selectedVehicle.name}</h2>
                                <p className="text-gray-400">{selectedVehicle.plateNumber}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingVehicle(selectedVehicle); setIsVehicleModalOpen(true); }} className="p-2 text-gray-400 hover:text-white"><EditIcon/></button>
                                <button onClick={() => handleDeleteVehicle(selectedVehicle.id)} className="p-2 text-gray-400 hover:text-red-500"><DeleteIcon/></button>
                            </div>
                        </div>
                        {latestLog && (
                             <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-400">Bảo dưỡng tiếp theo tại</h4>
                                    <p className="text-2xl font-bold text-white">{latestLog.nextMileage?.toLocaleString('vi-VN')} km</p>
                                </div>
                                {latestLog.nextMaintenanceNotes && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-400">Lưu ý cho lần tới</h4>
                                        <p className="text-gray-300 italic">"{latestLog.nextMaintenanceNotes}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button onClick={() => { setEditingLog(null); setIsLogModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                            <PlusIcon /> Thêm Nhật ký cho xe này
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
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-4">{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4">{log.mileage.toLocaleString('vi-VN')} km</td>
                                        <td className="p-4 font-medium">{log.service}</td>
                                        <td className="p-4 text-green-400">{formatCurrency(log.cost)}</td>
                                        <td className="p-4">
                                            <div className="flex gap-4">
                                                <button onClick={() => { setEditingLog(log); setIsLogModalOpen(true); }} className="text-blue-400 hover:text-blue-300"><EditIcon /></button>
                                                <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 hover:text-red-400"><DeleteIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredLogs.length === 0 && <p className="p-6 text-center text-gray-400">Chưa có nhật ký bảo dưỡng nào cho xe này.</p>}
                    </div>
                </div>
            )}
            
            <Modal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title={editingVehicle ? "Chỉnh sửa Thông tin Xe" : "Thêm Xe mới"}>
                <VehicleForm onSave={handleSaveVehicle} initialData={editingVehicle} onClose={() => setIsVehicleModalOpen(false)} />
            </Modal>
             <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={editingLog ? "Chỉnh sửa Nhật ký" : "Thêm Nhật ký Bảo dưỡng"}>
                <LogForm onSave={handleSaveLog} initialData={editingLog} onClose={() => setIsLogModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default VehicleLog;