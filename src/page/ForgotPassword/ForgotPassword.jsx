import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ss from './ForgotPassword.module.css';
import api from '../../../util/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 이메일 유효성 검사
            if (!email.includes('@')) {
                setError('유효한 이메일 주소를 입력해주세요.');
                return;
            }

            // API 호출
            const response = await api.post('/auth/forgot-password', { email });
            
            if (response.status === 200) {
                setIsSubmitted(true);
            }
        } catch (error) {
            setError('비밀번호 재설정 이메일 전송에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className={ss.container}>
            <div className={ss.wrap}>
                <h1 className={ss.title}>비밀번호 찾기</h1>
                <p className={ss.description}>
                    가입하신 이메일 주소를 입력하시면,<br />
                    비밀번호 재설정 링크를 보내드립니다.
                </p>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className={ss.form}>
                        <div className={ss.input_group}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="이메일 주소"
                                className={ss.input}
                                required
                            />
                        </div>

                        {error && <div className={ss.error}>{error}</div>}

                        <button type="submit" className={ss.submit_btn}>
                            재설정 링크 받기
                        </button>

                        <Link to="/login" className={ss.back_link}>
                            로그인으로 돌아가기
                        </Link>
                    </form>
                ) : (
                    <div className={ss.success}>
                        <div className={ss.success_icon}>✓</div>
                        <h2 className={ss.success_title}>이메일이 전송되었습니다</h2>
                        <p className={ss.success_message}>
                            입력하신 이메일 주소로 비밀번호 재설정 링크를 보내드렸습니다.<br />
                            이메일을 확인해주세요.
                        </p>
                        <Link to="/login" className={ss.back_btn}>
                            로그인으로 돌아가기
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword; 