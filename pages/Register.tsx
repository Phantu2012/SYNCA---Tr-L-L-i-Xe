import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogoIcon } from '../components/Icons';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        if (password.length < 6) {
            setIsSubmitting(false);
            return setError('Mật khẩu phải có ít nhất 6 ký tự.');
        }

        if (password !== confirmPassword) {
            setIsSubmitting(false);
            return setError('Mật khẩu không khớp.');
        }

        try {
            const newUser = await register(email, password);
            if (newUser) {
                setSuccess('Đăng ký thành công! Vui lòng chờ quản trị viên kích hoạt tài khoản của bạn.');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                 setError('Email này đã được sử dụng.');
            } else {
                 setError('Không thể đăng ký. Vui lòng thử lại.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <LogoIcon />
                    <h2 className="mt-6 text-3xl font-extrabold">Tạo tài khoản Synca mới</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        hoặc{' '}
                        <button onClick={onSwitchToLogin} className="font-medium text-blue-400 hover:text-blue-300">
                            đăng nhập vào tài khoản của bạn
                        </button>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm">
                        <div className="mb-4">
                            <label htmlFor="email-register" className="sr-only">Địa chỉ email</label>
                            <input
                                id="email-register"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="Địa chỉ email"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password-register" className="sr-only">Mật khẩu</label>
                            <input
                                id="password-register"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="Mật khẩu (ít nhất 6 ký tự)"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">Xác nhận mật khẩu</label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="Xác nhận mật khẩu"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    {success && <p className="text-sm text-green-400 text-center">{success}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                             {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;