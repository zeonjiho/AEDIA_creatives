import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Signup.module.css'

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
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
        
        // 비밀번호 일치 여부 확인
        if (formData.password !== formData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        console.log('회원가입 시도:', formData);
        // 여기에 회원가입 로직 추가
        // 회원가입 성공 시 로그인 페이지로 이동
        navigate('/login');
    };

    return (
        <div className={styles.signup_wrap}>
            <div className={styles.signup_container}>
                <div className={styles.signup_box}>
                    <h1 className={styles.signup_title}>회원가입</h1>
                    
                    <form onSubmit={handleSubmit} className={styles.signup_form}>
                        <div className={styles.input_group}>
                            <label htmlFor="name">이름</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="이름을 입력하세요"
                                required
                            />
                        </div>
                        
                        <div className={styles.input_group}>
                            <label htmlFor="email">이메일</label>
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
                            <label htmlFor="password">비밀번호</label>
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
                        
                        <div className={styles.input_group}>
                            <label htmlFor="confirmPassword">비밀번호 확인</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="비밀번호를 다시 입력하세요"
                                required
                            />
                        </div>
                        
                        <button type="submit" className={styles.signup_button}>
                            가입하기
                        </button>
                    </form>
                    
                    <div className={styles.signup_footer}>
                        <p>이미 계정이 있으신가요? <span className={styles.login_link} onClick={() => navigate('/login')}>로그인</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup; 