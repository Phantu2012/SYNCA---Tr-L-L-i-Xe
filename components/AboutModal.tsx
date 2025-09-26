import React from 'react';
import Modal from './Modal';

const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Về Synca">
            <div className="text-gray-300 max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-justify">
                <h3 className="text-lg font-bold text-white text-center">
                    Synca: Hơn Cả Một Trợ Lý – Một Người Bạn Đồng Hành Trên Hành Trình Kiến Tạo Hạnh Phúc
                </h3>

                <p>
                    Giữa dòng đời hối hả, chúng ta miệt mài đuổi theo những mục tiêu: một sự nghiệp vững chắc, một gia đình ấm êm, một nền tảng tài chính an toàn. Chúng ta sắp xếp, lên kế hoạch, và cố gắng kiểm soát mọi thứ. Nhưng đã bao giờ, dù đã đạt được nhiều điều, bạn vẫn cảm thấy một khoảng trống vô hình, một cảm giác bình an sâu thẳm dường như vẫn còn lẩn khuất đâu đó?
                </p>

                <p>
                    Chúng ta thường tin rằng hạnh phúc đến từ việc "nhận được" nhiều hơn – nhiều tiền hơn, nhiều thành công hơn, nhiều tiện nghi hơn. Nhưng những trí tuệ cổ xưa, và được hệ thống hóa một cách thực tế qua triết lý DCI, lại chỉ ra một con đường ngược lại: hạnh phúc đích thực và bền vững đến từ việc <strong>"cho đi"</strong> và <strong>"gieo trồng"</strong> những hạt giống thiện lành trong tâm trí.
                </p>

                <p>
                    Synca ra đời không chỉ để giúp bạn quản lý cuộc sống. Sứ mệnh của Synca là trở thành một công cụ, một người bạn đồng hành, giúp bạn áp dụng những quy luật sâu sắc về nhân quả vào từng hành động nhỏ nhất mỗi ngày. Nó được xây dựng trên một niềm tin cốt lõi: <strong>bằng cách vận hành cuộc sống của mình một cách có ý thức, tập trung vào lòng biết ơn và sự cho đi, bạn hoàn toàn có thể kiến tạo nên một thực tại mà bạn hằng mơ ước – một cuộc sống không chỉ đủ đầy về vật chất mà còn trọn vẹn về tâm hồn.</strong>
                </p>

                <h4 className="text-md font-semibold text-blue-400 pt-2">Synca Hoạt Động Như Thế Nào? Triết Lý Gieo Hạt Trong Từng Tính Năng</h4>

                <p>Mỗi tính năng của Synca không chỉ là một công cụ, mà là một "mảnh đất" để bạn gieo trồng những hạt giống cụ thể:</p>

                <ul className="list-disc list-inside space-y-2 pl-2">
                    <li><strong>Phát triển Bản thân (Nhật ký Biết ơn &amp; Gieo Hạt Yêu Thương):</strong> Đây là trái tim của Synca. Mỗi ngày, khi bạn viết ra những điều mình biết ơn, bạn đang gieo hạt giống của hạnh phúc. Bạn đang tưới tẩm cho khu vườn tâm trí mình bằng năng lượng tích cực, thu hút thêm nhiều điều tốt đẹp đến với mình.</li>
                    <li><strong>Cộng đồng Biết ơn:</strong> Đây là nơi những hạt giống tốt được lan tỏa. Khi bạn chia sẻ lòng biết ơn của mình, bạn không chỉ củng cố niềm vui cho bản thân mà còn truyền cảm hứng cho người khác. Mỗi một "like", một bình luận tích cực bạn trao đi cho bài viết của ai đó, chính là bạn đang gieo một hạt giống cho sự công nhận và niềm vui trong cuộc sống của chính mình.</li>
                    <li><strong>Quản lý Tài chính:</strong> Hơn cả việc theo dõi thu chi, tính năng này giúp bạn gieo hạt giống của sự hào phóng và thịnh vượng. Khi bạn quản lý tài chính một cách sáng suốt, bạn tạo ra sự dư dả để có cơ hội "cho đi".</li>
                    <li><strong>Gia đình Hạnh phúc:</strong> Gia đình là mảnh đất màu mỡ nhất để gieo trồng yêu thương. Mỗi công việc bạn hoàn thành vì gia đình là cơ hội để bạn gieo hạt giống của sự hòa hợp, gắn kết và thấu hiểu.</li>
                    <li><strong>Mục tiêu Cuộc sống &amp; Bảng Tầm nhìn:</strong> Nếu các tính năng khác giúp bạn "gieo hạt", thì đây là nơi bạn quyết định "cái cây" bạn muốn nhận là gì. Bằng cách xác định rõ mục tiêu, bạn tạo ra một định hướng mạnh mẽ cho những hạt giống mình gieo mỗi ngày.</li>
                </ul>

                <h4 className="text-md font-semibold text-blue-400 pt-2">Lời Hứa Của Synca: Cuộc Sống Bạn Hằng Mơ Ước Nằm Trong Tầm Tay</h4>
                
                <p>
                    Synca không phải là một cây đũa thần. Nó là một công cụ thực hành. Nếu bạn cam kết sử dụng Synca một cách nghiêm túc, không chỉ để ghi chép, mà để thực sự <strong>sống</strong> với triết lý gieo hạt, những điều kỳ diệu sẽ bắt đầu xảy ra.
                </p>
                <p>
                    Bạn sẽ nhận ra rằng, những cơ hội bất ngờ trong công việc đến sau khi bạn chân thành giúp đỡ đồng nghiệp. Sự đủ đầy về tài chính xuất hiện khi bạn bắt đầu có thói quen cho đi. Những mối quan hệ trở nên ấm áp hơn khi bạn thực hành lòng biết ơn mỗi ngày. Đây không phải là sự trùng hợp ngẫu nhiên. Đây là quy luật vận hành của vũ trụ. Bạn nhận lại chính xác những gì bạn đã gieo đi.
                </p>
                 
                <div className="p-4 bg-gray-700/50 border-l-4 border-blue-500 rounded-r-lg italic">
                     <p>
                        Có một điều chân thành mà chúng tôi muốn chia sẻ: Synca được xây dựng và vun đắp bởi một người khởi đầu không có một chút kiến thức nào về lập trình, chỉ với một khát khao mãnh liệt muốn biến triết lý gieo hạt thành một công cụ hữu ích và dễ tiếp cận cho mọi người. Chính vì thế, trên hành trình này, có thể bạn sẽ bắt gặp những trải nghiệm chưa thực sự hoàn hảo. Chúng tôi xem đó là một phần của sự phát triển, giống như những hạt mầm đầu tiên còn non nớt. Synca cam kết sẽ liên tục được lắng nghe, nâng cấp và hoàn thiện, để ngày càng trở thành người bạn đồng hành tốt hơn cho bạn trên hành trình kiến tạo hạnh phúc.
                    </p>
                </div>
               
                <h4 className="text-md font-semibold text-blue-400 pt-2 text-center">Hãy Bắt Đầu Hành Trình Của Bạn</h4>
                <p>
                    Chúng tôi mời bạn không chỉ "dùng thử" Synca, mà hãy "sống cùng" Synca. Hãy để mỗi một ghi chép, mỗi một tương tác, mỗi một kế hoạch bạn thực hiện trên ứng dụng này trở thành một hành động gieo hạt có chủ đích.
                </p>
                <p>
                    Synca không phải là đích đến, mà là con đường. Con đường dẫn đến một cuộc sống bình an từ bên trong, đủ đầy ở bên ngoài, và luôn tràn ngập niềm vui từ việc lan tỏa những điều tử tế.
                </p>
                <p className="font-semibold text-center text-white">
                    Hãy bắt đầu gieo trồng khu vườn hạnh phúc của bạn, ngay từ hôm nay.
                </p>

            </div>
             <div className="flex justify-end pt-6">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold">
                    Đóng
                </button>
            </div>
        </Modal>
    );
};

export default AboutModal;
