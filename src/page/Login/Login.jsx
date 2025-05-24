import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'
import api from '../../utils/api';

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