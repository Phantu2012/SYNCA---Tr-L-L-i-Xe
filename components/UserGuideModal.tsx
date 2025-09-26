import React from 'react';
import Modal from './Modal';

const GuideSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="text-md font-semibold text-blue-400 pt-2 border-t border-gray-700 mt-4">{title}</h4>
        <div className="text-sm space-y-2 mt-2">
            {children}
        </div>
    </div>
);

const UserGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Hướng dẫn Sử dụng Synca">
            <div className="text-gray-300 max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-justify">
                <GuideSection title="Cài đặt Synca lên Màn hình chính">
                    <p>Để có trải nghiệm tốt nhất và truy cập nhanh chóng, bạn nên cài đặt Synca vào màn hình chính của thiết bị. Thao tác này giống như cài một ứng dụng thông thường.</p>
                    <ul className="list-disc list-inside space-y-2 pl-2">
                        <li>
                            <strong>Trên iOS (iPhone/iPad):</strong> Mở Synca bằng trình duyệt Safari, nhấn vào nút "Chia sẻ" (biểu tượng hình vuông có mũi tên hướng lên), sau đó cuộn xuống và chọn "Thêm vào MH chính".
                        </li>
                        <li>
                            <strong>Trên Android:</strong> Mở Synca bằng trình duyệt Chrome, nhấn vào menu (biểu tượng ba chấm) ở góc trên bên phải, sau đó chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính".
                        </li>
                        <li>
                            <strong>Trên Máy tính (Chrome/Edge):</strong> Ở thanh địa chỉ của trình duyệt, bạn sẽ thấy một biểu tượng cài đặt (thường là hình màn hình với mũi tên tải xuống). Nhấn vào đó và xác nhận cài đặt.
                        </li>
                    </ul>
                </GuideSection>

                <GuideSection title="Triết lý Cốt lõi: Gieo Hạt">
                    <p>Synca được xây dựng dựa trên triết lý Nhân Quả (Gieo Hạt). Mọi điều bạn nhận được trong cuộc sống đều đến từ những "hạt giống" bạn đã gieo trước đó. Bằng cách thực hành lòng biết ơn, làm việc tốt, và quản lý cuộc sống có chủ đích, bạn đang gieo những hạt giống cho hạnh phúc và thành công trong tương lai.</p>
                </GuideSection>

                <GuideSection title="Hướng dẫn Nhanh các Tính năng">
                    <ul className="list-disc list-inside space-y-2 pl-2">
                        <li><strong>Phát triển Bản thân:</strong> Nơi bạn thực hành "gieo hạt" mỗi ngày. Ghi lại lòng biết ơn và những việc tốt đã làm để vun trồng tâm hồn.</li>
                        <li><strong>Gia đình Hạnh phúc:</strong> Không gian chung để phân công công việc, ghi nhận thành tích của con, và xây dựng thói quen tốt cùng nhau.</li>
                        <li><strong>Quản lý Tài chính:</strong> Gieo hạt giống của sự hào phóng bằng cách quản lý tài chính thông minh, tạo ra sự dư dả để có thể cho đi.</li>
                         <li><strong>Cộng đồng:</strong> Lan tỏa những hạt giống tốt đẹp bằng cách chia sẻ lòng biết ơn và truyền cảm hứng cho mọi người.</li>
                    </ul>
                </GuideSection>

            </div>
            <div className="flex justify-end pt-6">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold">
                    Đã hiểu
                </button>
            </div>
        </Modal>
    );
};

export default UserGuideModal;
