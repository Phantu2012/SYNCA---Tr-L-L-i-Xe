import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon, GoogleIcon } from '../components/Icons';

interface LoginProps {
    onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [view, setView] = useState<'login' | 'reset'>('login');
    const { login, signInWithGoogle, sendPasswordResetEmail } = useAuth();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            const user = await login(email, password);
            if (!user) {
                setError('Email hoặc mật khẩu không chính xác.');
            }
        } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Email hoặc mật khẩu không chính xác.');
            } else {
                setError('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            setError('Không thể đăng nhập với Google. Vui lòng thử lại.');
            console.error("Google Sign-In Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            await sendPasswordResetEmail(email);
            setSuccess('Nếu email tồn tại, một liên kết khôi phục đã được gửi. Vui lòng kiểm tra hộp thư của bạn (cả mục spam).');
        } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                // For security, show the same success message even if the user doesn't exist
                setSuccess('Nếu email tồn tại, một liên kết khôi phục đã được gửi. Vui lòng kiểm tra hộp thư của bạn (cả mục spam).');
            } else {
                setError('Đã xảy ra lỗi khi gửi email. Vui lòng thử lại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSwitchView = (newView: 'login' | 'reset') => {
        setView(newView);
        setError('');
        setSuccess('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <LogoIcon />
                    {view === 'login' ? (
                        <>
                            <h2 className="mt-6 text-3xl font-extrabold">Đăng nhập vào Synca</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                hoặc{' '}
                                <button onClick={onSwitchToRegister} className="font-medium text-blue-400 hover:text-blue-300">
                                    tạo tài khoản mới
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="mt-6 text-3xl font-extrabold">Khôi phục Mật khẩu</h2>
                            <p className="mt-2 text-sm text-gray-400">
                                hoặc{' '}
                                <button onClick={() => handleSwitchView('login')} className="font-medium text-blue-400 hover:text-blue-300">
                                    quay lại đăng nhập
                                </button>
                            </p>
                        </>
                    )}
                </div>

                {view === 'login' ? (
                    <>
                        <div className="space-y-4">
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <GoogleIcon />
                                Đăng nhập với Google
                            </button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-800 text-gray-500">Hoặc tiếp tục với email</span>
                                </div>
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={handleLoginSubmit}>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <label htmlFor="email-address" className="sr-only">Địa chỉ email</label>
                                    <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-t-md" placeholder="Địa chỉ email" />
                                </div>
                                <div>
                                    <label htmlFor="password-login" className="sr-only">Mật khẩu</label>
                                    <input id="password-login" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-b-md" placeholder="Mật khẩu" />
                                </div>
                            </div>

                            <div className="text-right text-sm">
                                <button type="button" onClick={() => handleSwitchView('reset')} className="font-medium text-blue-400 hover:text-blue-300">
                                    Quên mật khẩu?
                                </button>
                            </div>

                            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                            <div>
                                <button type="submit" disabled={isSubmitting} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed">
                                    {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <form className="space-y-6" onSubmit={handlePasswordReset}>
                        <p className="text-center text-sm text-gray-400">Nhập địa chỉ email của bạn, chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.</p>
                        <div className="rounded-md shadow-sm">
                            <div>
                                <label htmlFor="email-address-reset" className="sr-only">Địa chỉ email</label>
                                <input id="email-address-reset" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" placeholder="Địa chỉ email" />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        {success && <p className="text-sm text-green-400 text-center">{success}</p>}

                        <div>
                            <button type="submit" disabled={isSubmitting} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Đang gửi...' : 'Gửi email khôi phục'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;