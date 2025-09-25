import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { db, firebase } from '../services/firebase';
import { CommunityPost, PostComment, User } from '../types';
import { HeartIcon, SolidHeartIcon, ChatBubbleLeftIcon, ShareIcon, UserIcon, PlusIcon, PaperAirplaneIcon } from '../components/Icons';
import Modal from '../components/Modal';

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút";
    return "vài giây trước";
};

const PostComments: React.FC<{ post: CommunityPost, currentUser: User }> = ({ post, currentUser }) => {
    const [comments, setComments] = useState<PostComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = db.collection('communityPosts').doc(post.id).collection('comments')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostComment));
                setComments(fetchedComments);
                setIsLoading(false);
            });
        return () => unsubscribe();
    }, [post.id]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const commentData: Omit<PostComment, 'id'> = {
            authorId: currentUser.uid,
            authorDisplayName: currentUser.displayName || currentUser.email.split('@')[0],
            authorPhotoURL: currentUser.photoURL || null,
            text: newComment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };
        
        const originalComments = comments;
        const optimisticComment: PostComment = { ...commentData, id: `temp-${Date.now()}`, createdAt: { toDate: () => new Date() }};
        setComments(prev => [...prev, optimisticComment]);
        setNewComment('');

        try {
            const postRef = db.collection('communityPosts').doc(post.id);
            const commentRef = postRef.collection('comments').doc();

            await db.runTransaction(async (transaction) => {
                transaction.set(commentRef, commentData);
                transaction.update(postRef, { commentCount: firebase.firestore.FieldValue.increment(1) });
            });
        } catch (error) {
            console.error("Failed to add comment:", error);
            setComments(originalComments); // Revert on error
            // Optionally show an error message
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-700">
            {isLoading && <p className="text-sm text-gray-400">Đang tải bình luận...</p>}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3">
                        {comment.authorPhotoURL ? (
                            <img src={comment.authorPhotoURL} alt={comment.authorDisplayName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gray-400" /></div>
                        )}
                        <div>
                            <div className="bg-gray-700 rounded-lg px-3 py-2">
                                <p className="text-sm font-semibold text-white">{comment.authorDisplayName}</p>
                                <p className="text-sm text-gray-200">{comment.text}</p>
                            </div>
                             <p className="text-xs text-gray-500 mt-1">{comment.createdAt ? timeSince(comment.createdAt.toDate()) : ''}</p>
                        </div>
                    </div>
                ))}
            </div>
             <form onSubmit={handleAddComment} className="mt-4 flex items-center space-x-2">
                {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Bạn" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-gray-400" /></div>
                )}
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-grow bg-gray-700 border-gray-600 text-white rounded-full p-2 px-4 text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                 <button type="submit" className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500"><PaperAirplaneIcon /></button>
            </form>
        </div>
    );
};


const PostCard: React.FC<{ post: CommunityPost, currentUser: User }> = ({ post, currentUser }) => {
    const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser.uid));
    const [likeCount, setLikeCount] = useState(post.likes.length);
    const [commentsVisible, setCommentsVisible] = useState(false);

    const handleToggleLike = async () => {
        const postRef = db.collection('communityPosts').doc(post.id);
        
        // Optimistic UI update
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            if (isLiked) {
                await postRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) });
            } else {
                await postRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
            }
        } catch (error) {
            console.error("Failed to update like:", error);
            // Revert UI on error
            setIsLiked(isLiked);
            setLikeCount(likeCount);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
                {post.authorPhotoURL ? (
                    <img src={post.authorPhotoURL} alt={post.authorDisplayName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><UserIcon className="w-6 h-6 text-gray-400" /></div>
                )}
                <div>
                    <p className="font-semibold text-white">{post.authorDisplayName}</p>
                    <p className="text-xs text-gray-400">{post.createdAt ? timeSince(post.createdAt.toDate()) : 'Vừa xong'}</p>
                </div>
            </div>
            <div className="mt-4">
                <p className="text-gray-300 mb-2">Hôm nay tôi biết ơn vì:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-200">
                    {post.content.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            </div>
            <div className="mt-4 flex items-center justify-between text-gray-400">
                 <div className="flex items-center space-x-1">
                    <SolidHeartIcon className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{likeCount}</span>
                </div>
                 <button onClick={() => setCommentsVisible(!commentsVisible)} className="text-sm hover:underline">{post.commentCount} bình luận</button>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700 flex justify-around">
                <button onClick={handleToggleLike} className={`flex items-center space-x-2 py-2 px-4 rounded-lg w-full justify-center hover:bg-gray-700 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400'}`}>
                    {isLiked ? <SolidHeartIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                    <span className="text-sm font-semibold">Thích</span>
                </button>
                <button onClick={() => setCommentsVisible(!commentsVisible)} className="flex items-center space-x-2 py-2 px-4 rounded-lg w-full justify-center text-gray-400 hover:bg-gray-700 transition-colors">
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">Bình luận</span>
                </button>
                <button className="flex items-center space-x-2 py-2 px-4 rounded-lg w-full justify-center text-gray-400 hover:bg-gray-700 transition-colors">
                    <ShareIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">Chia sẻ</span>
                </button>
            </div>
            {commentsVisible && <PostComments post={post} currentUser={currentUser} />}
        </div>
    );
};

const PostForm: React.FC<{ onSave: (content: string) => Promise<void>; onClose: () => void }> = ({ onSave, onClose }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await onSave(content);
        } catch (err) {
            console.error("Post submission error:", err);
            setError("Không thể đăng bài. Lỗi này thường do chưa cấu hình quyền truy cập trên máy chủ. Vui lòng liên hệ quản trị viên.");
        } finally {
            setIsSaving(false);
        }
    };
    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">Chia sẻ những điều bạn cảm thấy biết ơn, mỗi điều một dòng.</p>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" placeholder="VD: Một ngày nắng đẹp..." required />
            {error && <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-300">{error}</div>}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                     {isSaving ? 'Đang đăng...' : 'Đăng bài'}
                </button>
            </div>
        </form>
    )
}

const Community: React.FC = () => {
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = db.collection('communityPosts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .onSnapshot(snapshot => {
                const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost));
                setPosts(fetchedPosts);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching posts:", error);
                setLoading(false);
            });
        return () => unsubscribe();
    }, []);
    
    const handleSavePost = async (content: string) => {
        if (!currentUser) {
            throw new Error("User not authenticated");
        }
        const contentArray = content.split('\n').filter(line => line.trim() !== '');
        if(contentArray.length === 0) return;

        const newPost: Omit<CommunityPost, 'id'> = {
            authorId: currentUser.uid,
            authorDisplayName: currentUser.displayName || currentUser.email.split('@')[0],
            authorPhotoURL: currentUser.photoURL || null,
            content: contentArray,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            likes: [],
            commentCount: 0,
        };
        await db.collection('communityPosts').add(newPost);
        setIsModalOpen(false); // Close modal only on success
    };

    if (!currentUser) return null;

    return (
        <div>
            <PageHeader title="Cộng đồng Biết ơn" subtitle="Cùng nhau lan tỏa những điều tích cực trong cuộc sống." />
             <div className="flex justify-end mb-6">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <PlusIcon /> Chia sẻ lòng biết ơn
                </button>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
                {loading ? (
                     <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center bg-gray-800 p-8 rounded-lg">
                        <p className="text-gray-400">Chưa có bài viết nào.</p>
                        <p className="mt-2 text-sm text-gray-500">Hãy là người đầu tiên chia sẻ lòng biết ơn của bạn!</p>
                    </div>
                ) : (
                    posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} />)
                )}
            </div>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Chia sẻ điều bạn biết ơn">
                <PostForm onSave={handleSavePost} onClose={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default Community;