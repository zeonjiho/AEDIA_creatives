import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ss from './Login.module.css'
import api from '../../util/api';
import handleEnterKey from '../../util/handleEnterKey';
import { FcGoogle } from 'react-icons/fc'
import { FaApple } from 'react-icons/fa'

const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [identifierType, setIdentifierType] = useState('');
    const [isIdentifierValid, setIsIdentifierValid] = useState(null);
    const [isPasswordValid, setIsPasswordValid] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            window.location.href = '/'
        }
    }, [])

    // Check identifier type (email/username/phone)
    const checkIdentifierType = (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{10,11}$/;
        const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;  // Added username regex
        
        if (emailRegex.test(value)) return 'email';
        if (phoneRegex.test(value)) return 'phone';
        if (usernameRegex.test(value)) return 'userName';  // Check username before defaulting
        return '';  // Return empty if no match
    }

    const handleIdentifierChange = (e) => {
        const value = e.target.value;
        // 한글이 포함되어 있으면 이전 값을 유지
        if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g.test(value)) {
            e.target.value = identifier;  // 이전 값으로 복원
            return;
        }
        // 소문자로 변환
        const lowerValue = value.toLowerCase();
        setIdentifier(lowerValue);
        const type = checkIdentifierType(lowerValue);
        setIdentifierType(type);
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        // 한글이 포함되어 있으면 이전 값을 유지
        if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g.test(value)) {
            e.target.value = password;  // 이전 값으로 복원
            return;
        }
        setPassword(value); // 소문자 변환 제거
        setIsPasswordValid(null);
    };

    const validateIdentifier = (value) => {
        const type = checkIdentifierType(value);
        setIsIdentifierValid(!!type);
        return !!type;
    };

    const validatePassword = (value) => {
        const isValid = value.length >= 6; // 비밀번호 최소 길이 체크
        setIsPasswordValid(isValid);
        return isValid;
    };

    const handleLogin = async () => {
        setErrorMessage(''); // 로그인 시도할 때마다 에러 메시지 초기화
        const isIdValid = validateIdentifier(identifier);
        const isPwValid = validatePassword(password);

        if (!isIdValid || !isPwValid) {
            setErrorMessage('Please check your input values.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/user/login', { 
                [identifierType]: identifier, 
                password 
            });
            
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token)
                window.location.href = '/'
            } else if (response.status === 201) {
                setIsIdentifierValid(false);
                setIsPasswordValid(false);
                setErrorMessage('Invalid identifier or password.');
            }
        } catch (err) {
            setIsIdentifierValid(false);
            setIsPasswordValid(false);
            setErrorMessage('An unknown error occurred during login.');
        }
        setIsLoading(false);
    };

    const handleSocialLogin = (provider) => {
        // 소셜 로그인 구현
        console.log(`Login with ${provider}`);
    };

    return (
        <div className={ss.container}>
            <div className={ss.wrap}>
                <h2 className={ss.title}>Welcome to HYPER</h2>
                <p className={ss.subtitle}>Sign in to access various services</p>

                {errorMessage && (
                    <div className={ss.error_message}>
                        {errorMessage}
                    </div>
                )}

                <div className={ss.form}>
                    <input 
                        type='text' 
                        placeholder='Username or Email or Phone' 
                        className={ss.input}
                        value={identifier} 
                        onChange={handleIdentifierChange}
                        onKeyDown={(e) => handleEnterKey(e, handleLogin)} 
                    />
                    <div className={ss.password_input}>
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Password' 
                            className={ss.input}
                            value={password} 
                            onChange={handlePasswordChange}
                            onKeyDown={(e) => handleEnterKey(e, handleLogin)} 
                        />
                        <button
                            type="button"
                            className={ss.show_password}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    <button
                        className={`${ss.login_btn} ${isLoading ? ss.loading : ''}`}
                        onClick={handleLogin}
                        disabled={isLoading}
                    >
                        Sign in
                        {isLoading && <div className={ss.spinner}></div>}
                    </button>

                    <div className={ss.forgot_password}>
                        <Link to='/forgot-password'>
                            Forgot password?
                        </Link>
                    </div>

                    <div className={ss.divider}>
                        <span>OR</span>
                    </div>

                    <button 
                        className={ss.social_btn} 
                        onClick={() => handleSocialLogin('google')}
                    >
                        <FcGoogle className={ss.social_icon} />
                        Continue with Google
                    </button>

                    <button 
                        className={ss.social_btn} 
                        onClick={() => handleSocialLogin('apple')}
                    >
                        <FaApple className={ss.social_icon} />
                        Continue with Apple
                    </button>

                    <p className={ss.signup_text}>
                        Don't have an account?
                        <span onClick={() => navigate('/signup')} className={ss.signup_link}>
                            Sign up
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login