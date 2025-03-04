import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ss from './ResetPassword.module.css';
import api from '../../../util/api';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const token = searchParams.get('token');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 비밀번호 유효성 검사
        if (password.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await api.post('/auth/reset-password', {
                token,
                newPassword: password
            });

            if (response.status === 200) {
                setIsSubmitted(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            setError('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className={ss.container}>
            <div className={ss.wrap}>
                <h1 className={ss.title}>비밀번호 재설정</h1>
                <p className={ss.description}>
                    새로운 비밀번호를 입력해주세요.
                </p>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className={ss.form}>
                        <div className={ss.input_group}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="새 비밀번호"
                                className={ss.input}
                                required
                            />
                        </div>

                        <div className={ss.input_group}>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="새 비밀번호 확인"
                                className={ss.input}
                                required
                            />
                        </div>

                        {error && <div className={ss.error}>{error}</div>}

                        <button type="submit" className={ss.submit_btn}>
                            비밀번호 변경하기
                        </button>
                    </form>
                ) : (
                    <div className={ss.success}>
                        <div className={ss.success_icon}>✓</div>
                        <h2 className={ss.success_title}>비밀번호가 변경되었습니다</h2>
                        <p className={ss.success_message}>
                            새로운 비밀번호로 변경이 완료되었습니다.<br />
                            잠시 후 로그인 페이지로 이동합니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword; 