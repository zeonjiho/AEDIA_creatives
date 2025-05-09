import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ForgotPassword.module.css'

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const navigate = useNavigate();
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // 이메일 유효성 검사
        if (!email || !email.includes('@')) {
            alert('유효한 이메일을 입력해주세요.');
            return;
        }
        
        console.log('비밀번호 찾기 요청:', email);
        // 여기에 비밀번호 찾기 로직 추가
        // 예: API 호출 등
        
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
                                가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
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
                                    비밀번호 재설정 링크 받기
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className={styles.success_message}>
                            <div className={styles.success_icon}>✓</div>
                            <h2>이메일이 전송되었습니다</h2>
                            <p>
                                {email}로 비밀번호 재설정 링크가 발송되었습니다.<br />
                                이메일을 확인해주세요.
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