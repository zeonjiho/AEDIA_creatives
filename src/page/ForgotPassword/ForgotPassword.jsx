import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ForgotPassword.module.css'
import api from '../../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            alert('유효한 이메일을 입력해주세요.');
            return;
        }

        // 여기에 비밀번호 찾기 로직 추가
        // 예: API 호출 등
        try {
            const response = await api.post('/forgot-password', {
                email: email
            });
            if (response.status === 200) {
                setIsSubmitted(true);
            }
        } catch (err) {
            console.error('비밀번호 찾기 실패:', err);
            alert('알 수 없는 오류가 발생했습니다. 관리자에게 문의해 주세요.');
        }


        // 요청 성공 시 메시지 표시
        setIsSubmitted(true);
    };

    return (
        <div className={styles.forgot_wrap}>
            <div className={styles.forgot_container}>
                <div className={styles.forgot_box}>
                    <h1 className={styles.forgot_title}>비밀번호 찾기</h1>

                    {!isSubmitted ? (
                        <>
                            <p className={styles.forgot_description}>
                                계정에 등록된 슬랙 ID를 통해 임시 비밀번호를 발송합니다.
                                <br />슬랙을 사용하실 수 없는 경우 관리자에게 문의해 주세요.
                            </p>

                            <form onSubmit={handleSubmit} className={styles.forgot_form}>
                                <div className={styles.input_group}>
                                    <label htmlFor="email">이메일</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="이메일을 입력하세요"
                                        required
                                    />
                                </div>

                                <button type="submit" className={styles.forgot_button}>
                                    임시 비밀번호 받기
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className={styles.success_message}>
                            <div className={styles.success_icon}>✓</div>
                            <h2>이메일이 전송되었습니다</h2>
                            <p>
                                임시 비밀번호가 발송되었습니다.<br />
                                슬랙을 통해 확인해주세요.
                            </p>
                            <button
                                className={styles.back_button}
                                onClick={() => navigate('/login')}
                            >
                                로그인 페이지로 돌아가기
                            </button>
                        </div>
                    )}

                    <div className={styles.forgot_footer}>
                        <p><span className={styles.login_link} onClick={() => navigate('/login')}>로그인 페이지로 돌아가기</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 