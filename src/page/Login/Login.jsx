import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const navigate = useNavigate();
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('로그인 시도:', formData);
        // 여기에 로그인 로직 추가
        // 로그인 성공 시 홈으로 이동
        navigate('/');
    };

    return (
        <div className={styles.login_wrap}>
            <div className={styles.login_container}>
                <div className={styles.login_box}>
                    <h1 className={styles.login_title}>Login</h1>
                    
                    <form onSubmit={handleSubmit} className={styles.login_form}>
                        <div className={styles.input_group}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="이메일을 입력하세요"
                                required
                            />
                        </div>
                        
                        <div className={styles.input_group}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="비밀번호를 입력하세요"
                                required
                            />
                        </div>
                        
                        <button type="submit" className={styles.login_button}>
                            로그인
                        </button>
                    </form>
                    
                    <div className={styles.login_footer}>
                        <p>계정이 없으신가요? <span className={styles.signup_link} onClick={() => navigate('/signup')}>회원가입</span></p>
                        <p className={styles.forgot_password} onClick={() => navigate('/forgot-password')}>비밀번호를 잊으셨나요?</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;