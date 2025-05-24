import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'
import api from '../../utils/api';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // 랜덤 이미지 선택 - 새로고침할 때마다 다른 이미지
    const slideImages = [
        '/Images/videoframe_6264.png',
        '/Images/videoframe_11841.png',
        '/Images/videoframe_64593.png',
        '/Images/videoframe_140956.png',
        '/Images/videoframe_63043.png',
        '/Images/videoframe_78640.png',
        '/Images/videoframe_58692.png',
        '/Images/videoframe_163638.png',
        '/Images/videoframe_95434.png'
    ];

    // 새로고침할 때마다 랜덤 이미지 선택
    const randomImage = slideImages[Math.floor(Math.random() * slideImages.length)];

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('로그인 시도:', formData);
        // 여기에 로그인 로직 추가
        try {
            const response = await api.post('/login', formData);
            if (response.status === 200) {
                if (response.data.user.status === 'waiting') {
                    alert('대기 상태입니다. 관리자 승인 후 로그인 가능합니다.');
                    return;
                } else {
                    localStorage.setItem('token', response.data.token);
                    window.location.href = '/';
                }
            }
        } catch (err) {
            if (err.response.status === 401) {
                alert(err.response.data.message);
                return;
            }
            console.log(err)
            alert('로그인 도중 오류가 발생하였습니다. 관리자에게 문의하여 주세요.')
        }
    };

    return (
        <div className={styles.login_wrap}>
            {/* 왼쪽 로그인 폼 영역 - 검정색 */}
            <div className={styles.login_container}>
                <div className={styles.login_box}>
                    <div className={styles.login_header}>
                        <h2 className={styles.login_title}>Login</h2>
                        <p className={styles.login_subtitle}>Login to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.login_form}>
                        <div className={styles.input_group}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
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
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button type="submit" className={styles.login_button}>
                            Login
                        </button>
                    </form>

                    <div className={styles.login_footer}>
                        <p>계정이 없으신가요? <span className={styles.signup_link} onClick={() => navigate('/signup')}>회원가입</span></p>
                        <p className={styles.forgot_password} onClick={() => navigate('/forgot-password')}>비밀번호를 잊으셨나요?</p>
                    </div>
                </div>
            </div>

            {/* 오른쪽 이미지 영역 */}
            <div className={styles.brand_sidebar}>
                <div className={styles.image_container}>
                    <img 
                        src={randomImage} 
                        alt="Random Background"
                        className={styles.background_image}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    
                    {/* 중앙 텍스트 */}
                    <div className={styles.center_text}>
                        <p>© {new Date().getFullYear()} AEDIASTUDIO. All rights reserved.</p>
                    </div>
                    
                    <div className={styles.image_placeholder}>
                        <div className={styles.placeholder_content}>
                            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100" height="100" rx="20" fill="#f0f0f0"/>
                                <path d="M30 70V30H40V55H60V30H70V70H60V45H40V70H30Z" fill="#999999"/>
                            </svg>
                            <p>이미지 로딩 중...</p>
                            <small>잠시만 기다려주세요</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;