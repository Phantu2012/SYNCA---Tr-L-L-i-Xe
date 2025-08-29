import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { VehicleDocument, DocumentType } from '../types';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/Icons';
import Modal from '../components/Modal';

const sampleDocuments: VehicleDocument[] = [
    { id: '1', type: DocumentType.REGISTRATION, expiryDate: '2024-08-20', notes: 'Đăng kiểm lần đầu' },
    { id: '2', type: DocumentType.INSURANCE, expiryDate: '2024-09-05' },
    { id: '3', type: DocumentType.ROAD_FEE, expiryDate: '2025-01-15' },
];

const Documents: React.FC = () => {
    const [documents, setDocuments] = useState<VehicleDocument[]>(sampleDocuments);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);

    const handleOpenModal = (doc?: VehicleDocument) => {
        setEditingDocument(doc || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDocument(null);
    };

    const handleSave = (doc: VehicleDocument) => {
        if (editingDocument) {
            setDocuments(documents.map(d => d.id === editingDocument.id ? { ...doc, id: editingDocument.id } : d));
        } else {
            setDocuments([...documents, { ...doc, id: Date.now().toString() }]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Bạn có chắc muốn xóa giấy tờ này không?')) {
            setDocuments(documents.filter(d => d.id !== id));
        }
    };
    
    const DocumentForm: React.FC = () => {
        const [formData, setFormData] = useState<Partial<VehicleDocument>>(editingDocument || {
            type: DocumentType.REGISTRATION,
            expiryDate: ''
        });

        const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setFormData({ ...formData, image: event.target?.result as string });
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleSave(formData as VehicleDocument);
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
                    <label htmlFor="docImage" className="block text-sm font-medium text-gray-300 mb-1">Ảnh chụp giấy tờ</label>
                    <input type="file" id="docImage" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
                    <p className="text-xs text-gray-500 mt-1">Synca sẽ xin quyền truy cập máy ảnh và thư viện để bạn có thể lưu ảnh chụp.</p>
                    {formData.image && <img src={formData.image} alt="Xem trước" className="mt-4 rounded-md max-h-40" />}
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
                <DocumentForm />
            </Modal>
        </div>
    );
};

export default Documents;
