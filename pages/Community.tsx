import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { db, firebase } from '../services/firebase';
import { CommunityPost, PostComment, User } from '../types';
import { HeartIcon, SolidHeartIcon, ChatBubbleLeftIcon, ShareIcon, UserIcon, PlusIcon, PaperAirplaneIcon, EllipsisVerticalIcon, DeleteIcon, EditIcon } from '../components/Icons';
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

const Comment: React.FC<{ comment: PostComment; postId: string; currentUser: User; postAuthorId: string; }> = ({ comment, postId, currentUser, postAuthorId }) => {
    const [isLiked, setIsLiked] = useState(comment.likes.includes(currentUser.uid));
    const [likeCount, setLikeCount] = useState(comment.likes.length);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [menuOpen, setMenuOpen] = useState(false);

    const isCommentAuthor = comment.authorId === currentUser.uid;
    const isPostAuthor = postAuthorId === currentUser.uid;
    const canManage = isCommentAuthor || isPostAuthor;

    useEffect(() => {
        setIsLiked(comment.likes.includes(currentUser.uid));
        setLikeCount(comment.likes.length);
    }, [comment.likes, currentUser.uid]);

    const handleToggleCommentLike = async () => {
        const commentRef = db.collection('communityPosts').doc(postId).collection('comments').doc(comment.id);
        const newLikeStatus = !isLiked;
        setIsLiked(newLikeStatus);
        setLikeCount(prev => newLikeStatus ? prev + 1 : prev - 1);
        try {
            await commentRef.update({
                likes: newLikeStatus
                    ? firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                    : firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
        } catch (error) {
            console.error("Failed to update comment like:", error);
            setIsLiked(!newLikeStatus);
            setLikeCount(prev => newLikeStatus ? prev - 1 : prev + 1);
        }
    };

    const handleDeleteComment = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
        const postRef = db.collection('communityPosts').doc(postId);
        const commentRef = postRef.collection('comments').doc(comment.id);
        try {
            await db.runTransaction(async (transaction) => {
                transaction.delete(commentRef);
                transaction.update(postRef, { commentCount: firebase.firestore.FieldValue.increment(-1) });
            });
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    const handleSaveEdit = async () => {
        if (!editText.trim() || editText.trim() === comment.text) {
            setIsEditing(false);
            return;
        }
        const commentRef = db.collection('communityPosts').doc(postId).collection('comments').doc(comment.id);
        try {
            await commentRef.update({ text: editText.trim() });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to edit comment:", error);
        }
    };

    return (
        <div key={comment.id} className="flex items-start space-x-3 group">
            {comment.authorPhotoURL ? (
                <img src={comment.authorPhotoURL} alt={comment.authorDisplayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gray-400" /></div>
            )}
            <div className="flex-grow">
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-gray-600 border-gray-500 text-white rounded-md p-2 text-sm" rows={2} />
                        <div className="flex gap-2">
                            <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md">Lưu</button>
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-500 text-white text-xs font-semibold rounded-md">Hủy</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-700 rounded-lg px-3 py-2 relative">
                             <div className="flex justify-between items-center">
                                <p className="text-sm font-semibold text-white">{comment.authorDisplayName}</p>
                                {canManage && (
                                    <div className="relative">
                                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 rounded-full hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <EllipsisVerticalIcon className="w-4 h-4" />
                                        </button>
                                        {menuOpen && (
                                            <div className="absolute right-0 mt-2 w-32 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10">
                                                {isCommentAuthor && <button onClick={() => { setIsEditing(true); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"><EditIcon className="w-4 h-4"/> Sửa</button>}
                                                <button onClick={handleDeleteComment} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"><DeleteIcon className="w-4 h-4"/> Xóa</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">{comment.createdAt ? timeSince(comment.createdAt.toDate()) : ''}</p>
                            <button onClick={handleToggleCommentLike} className={`text-xs font-semibold ${isLiked ? 'text-red-500' : 'text-gray-400 hover:underline'}`}>Thích</button>
                            {likeCount > 0 && (
                                <div className="flex items-center space-x-1">
                                    <SolidHeartIcon className="w-3 h-3 text-red-500" />
                                    <span className="text-xs text-gray-400">{likeCount}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const PostComments: React.FC<{ post: CommunityPost, currentUser: User, postAuthorId: string }> = ({ post, currentUser, postAuthorId }) => {
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
        const tempNewComment = newComment;
        setNewComment('');

        const commentData: Omit<PostComment, 'id'> = {
            authorId: currentUser.uid,
            authorDisplayName: currentUser.displayName || currentUser.email.split('@')[0],
            authorPhotoURL: currentUser.photoURL || null,
            text: tempNewComment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            likes: [],
        };
        
        try {
            const postRef = db.collection('communityPosts').doc(post.id);
            const commentRef = postRef.collection('comments').doc();
            await db.runTransaction(async (transaction) => {
                transaction.set(commentRef, commentData);
                transaction.update(postRef, { commentCount: firebase.firestore.FieldValue.increment(1) });
            });
        } catch (error) {
            console.error("Failed to add comment:", error);
            setNewComment(tempNewComment);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-700">
            {isLoading && <p className="text-sm text-gray-400">Đang tải bình luận...</p>}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {comments.map(comment => <Comment key={comment.id} comment={comment} postId={post.id} currentUser={currentUser} postAuthorId={postAuthorId} />)}
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


const PostCard: React.FC<{ post: CommunityPost, currentUser: User, onEdit: (post: CommunityPost) => void }> = ({ post, currentUser, onEdit }) => {
    const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser.uid));
    const [likeCount, setLikeCount] = useState(post.likes.length);
    const [commentsVisible, setCommentsVisible] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const isAuthor = post.authorId === currentUser.uid;

    useEffect(() => {
        setIsLiked(post.likes.includes(currentUser.uid));
        setLikeCount(post.likes.length);
    }, [post.likes, currentUser.uid]);

    const handleToggleLike = async () => {
        const postRef = db.collection('communityPosts').doc(post.id);
        const newLikeStatus = !isLiked;
        setIsLiked(newLikeStatus);
        setLikeCount(prev => newLikeStatus ? prev + 1 : prev - 1);
        try {
            await postRef.update({
                likes: newLikeStatus
                    ? firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                    : firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
        } catch (error) {
            console.error("Failed to update like:", error);
            setIsLiked(!newLikeStatus);
            setLikeCount(prev => newLikeStatus ? prev - 1 : prev + 1);
        }
    };

    const handleDeletePost = async () => {
        if (!isAuthor) return;
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này? Thao tác này không thể hoàn tác.')) {
            try {
                await db.collection('communityPosts').doc(post.id).delete();
            } catch (error) {
                console.error("Failed to delete post:", error);
            }
        }
        setMenuOpen(false);
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
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
                {isAuthor && (
                    <div className="relative">
                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400 rounded-full hover:bg-gray-700">
                            <EllipsisVerticalIcon />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10">
                                <button onClick={() => { onEdit(post); setMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">
                                    <EditIcon className="w-4 h-4" />
                                    Chỉnh sửa
                                </button>
                                <button onClick={handleDeletePost} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                                    <DeleteIcon className="w-4 h-4" />
                                    Xóa bài viết
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-gray-300 mb-2">Hôm nay tôi biết ơn vì:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-200 whitespace-pre-wrap">
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
            {commentsVisible && <PostComments post={post} currentUser={currentUser} postAuthorId={post.authorId} />}
        </div>
    );
};

const PostForm: React.FC<{ onSave: (content: string, id?: string) => Promise<void>; onClose: () => void; existingPost: CommunityPost | null }> = ({ onSave, onClose, existingPost }) => {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (existingPost) {
            setContent(existingPost.content.join('\n'));
        } else {
            setContent('');
        }
    }, [existingPost]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await onSave(content, existingPost?.id);
        } catch (err) {
            console.error("Post submission error:", err);
            setError("Không thể đăng bài. Lỗi này thường do chưa cấu hình quyền truy cập trên máy chủ.");
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
                     {isSaving ? 'Đang lưu...' : 'Lưu'}
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
    const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

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

    const handleOpenPostModal = (post: CommunityPost | null = null) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };
    const handleClosePostModal = () => {
        setEditingPost(null);
        setIsModalOpen(false);
    };
    
    const handleSavePost = async (content: string, id?: string) => {
        if (!currentUser) throw new Error("User not authenticated");
        
        const contentArray = content.split('\n').filter(line => line.trim() !== '');
        if(contentArray.length === 0) return;

        if (id) { // Editing existing post
            const postRef = db.collection('communityPosts').doc(id);
            await postRef.update({ content: contentArray });
        } else { // Creating new post
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
        }
        handleClosePostModal();
    };

    if (!currentUser) return null;

    return (
        <div>
            <PageHeader title="Cộng đồng Biết ơn" subtitle="Cùng nhau lan tỏa những điều tích cực trong cuộc sống." />
             <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenPostModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
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
                    posts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser} onEdit={handleOpenPostModal} />)
                )}
            </div>

             <Modal isOpen={isModalOpen} onClose={handleClosePostModal} title={editingPost ? "Chỉnh sửa bài viết" : "Chia sẻ điều bạn biết ơn"}>
                <PostForm onSave={handleSavePost} onClose={handleClosePostModal} existingPost={editingPost} />
            </Modal>
        </div>
    );
};

export default Community;