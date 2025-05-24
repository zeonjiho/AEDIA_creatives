import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'
import api from '../../utils/api';

const Login = () => {
    // 로그인/회원가입 모드 상태
    const [isSignupMode, setIsSignupMode] = useState(false);
    
    // 로그인 폼 데이터
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // 회원가입 폼 데이터
    const [signupData, setSignupData] = useState({
        name: '',
        position: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // 직책 목록 정의
    const positions = [
        '직책을 선택해주세요',
        'Producer',
        'Executive Producer',
        'Director',
        'Assistant Director',
        'VFX Supervisor',
        'VFX Artist (General)',
        'VFX Artist (Technical Artist)',
        'VFX Assistant',
        'VFX Producer',
        '기타'
    ];

    // 기타 직책 입력을 위한 상태
    const [showOtherPosition, setShowOtherPosition] = useState(false);
    const [otherPosition, setOtherPosition] = useState('');

    // 대기신청 완료 상태
    const [registrationComplete, setRegistrationComplete] = useState(false);

    // 비밀번호 표시/숨김 상태
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // 컴포넌트 마운트 시에만 랜덤 이미지 선택 (리렌더링 시 변경 안됨)
    const randomImage = useMemo(() => {
        return slideImages[Math.floor(Math.random() * slideImages.length)];
    }, []); // 빈 dependency array로 한 번만 실행

    const navigate = useNavigate();

    // 전화번호 포맷팅 함수
    const formatPhoneNumber = (value) => {
        // 숫자만 추출
        const phoneNumber = value.replace(/[^\d]/g, '');

        // 11자리를 초과하면 자르기
        const limitedPhoneNumber = phoneNumber.slice(0, 11);

        // 포맷팅 적용
        if (limitedPhoneNumber.length <= 3) {
            return limitedPhoneNumber;
        } else if (limitedPhoneNumber.length <= 7) {
            return `${limitedPhoneNumber.slice(0, 3)}-${limitedPhoneNumber.slice(3)}`;
        } else {
            return `${limitedPhoneNumber.slice(0, 3)}-${limitedPhoneNumber.slice(3, 7)}-${limitedPhoneNumber.slice(7)}`;
        }
    };

    // 로그인 폼 변경 처리
    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 회원가입 폼 변경 처리
    const handleSignupChange = (e) => {
        const { name, value } = e.target;

        // 전화번호 입력 처리
        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setSignupData(prev => ({
                ...prev,
                [name]: formattedPhone
            }));
            return;
        }

        // 직책이 '기타'인 경우 처리
        if (name === 'position' && value === '기타') {
            setShowOtherPosition(true);
            setSignupData(prev => ({
                ...prev,
                [name]: value
            }));
        } else if (name === 'position') {
            setShowOtherPosition(false);
            setSignupData(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setSignupData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // 기타 직책 입력 처리
    const handleOtherPositionChange = (e) => {
        setOtherPosition(e.target.value);
    };

    // 비밀번호 표시/숨김 토글
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // 비밀번호 확인 표시/숨김 토글
    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // 로그인 처리
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        console.log('로그인 시도:', loginData);
        try {
            const response = await api.post('/login', loginData);
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

    // 회원가입 처리
    const handleSignupSubmit = async (e) => {
        e.preventDefault();

        // 비밀번호 일치 여부 확인
        if (signupData.password !== signupData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 직책이 기타인 경우 직접 입력한 값으로 대체
        // 전화번호에서 하이픈 제거 (서버 전송용)
        const finalFormData = {
            ...signupData,
            position: signupData.position === '기타' ? otherPosition : signupData.position,
            phone: signupData.phone.replace(/[^\d]/g, '') // 숫자만 추출하여 서버로 전송
        };

        console.log('회원가입 시도:', finalFormData);
        try {
            const response = await api.post('/signup', finalFormData);
            if (response.status === 200) {
                // 대기신청 완료 상태로 변경
                setRegistrationComplete(true);
            }
        } catch (err) {
            if (err.response.status === 401) {
                alert(err.response.data.message);
                return;
            }
            alert('회원가입 도중 오류가 발생하였습니다. 관리자에게 문의하여 주세요.')
            console.log(err);
        }
    };

    // 모드 전환 함수
    const switchToSignup = () => {
        setIsSignupMode(true);
        setRegistrationComplete(false);
    };

    const switchToLogin = () => {
        setIsSignupMode(false);
        setRegistrationComplete(false);
        setShowOtherPosition(false);
        setOtherPosition('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    // 로그인 페이지로 이동 (회원가입 완료 후)
    const goToLogin = () => {
        switchToLogin();
    };

    return (
        <div className={styles.login_wrap}>
            {/* 왼쪽 폼 영역 - 검정색 */}
            <div className={styles.login_container}>
                <div className={styles.login_box}>
                    {!registrationComplete ? (
                        <>
                            {!isSignupMode ? (
                                // 로그인 폼
                                <>
                                    <div className={styles.login_header}>
                                        <h2 className={styles.login_title}>Login</h2>
                                        <p className={styles.login_subtitle}>Login to your account</p>
                                    </div>

                                    <form onSubmit={handleLoginSubmit} className={styles.login_form}>
                                        <div className={styles.input_group}>
                                            <label htmlFor="email">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={loginData.email}
                                                onChange={handleLoginChange}
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
                                                value={loginData.password}
                                                onChange={handleLoginChange}
                                                placeholder="Enter your password"
                                                required
                                            />
                                        </div>

                                        <button type="submit" className={styles.login_button}>
                                            Login
                                        </button>
                                    </form>

                                    <div className={styles.login_footer}>
                                        <p>계정이 없으신가요? <span className={styles.signup_link} onClick={switchToSignup}>회원가입</span></p>
                                        <p className={styles.forgot_password} onClick={() => navigate('/forgot-password')}>비밀번호를 잊으셨나요?</p>
                                    </div>
                                </>
                            ) : (
                                // 회원가입 폼
                                <>
                                    <div className={styles.login_header}>
                                        <h2 className={styles.login_title}>회원가입</h2>
                                        <p className={styles.login_subtitle}>새 계정을 만들어보세요</p>
                                    </div>

                                    <form onSubmit={handleSignupSubmit} className={styles.login_form}>
                                        <div className={styles.input_group}>
                                            <label htmlFor="name">이름</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={signupData.name}
                                                onChange={handleSignupChange}
                                                placeholder="이름을 입력하세요"
                                                required
                                            />
                                        </div>

                                        <div className={styles.input_group}>
                                            <label htmlFor="position">직책</label>
                                            <select
                                                id="position"
                                                name="position"
                                                value={signupData.position}
                                                onChange={handleSignupChange}
                                                className={styles.select_input}
                                                required
                                            >
                                                {positions.map((position, index) => (
                                                    <option
                                                        key={index}
                                                        value={position === '직책을 선택해주세요' ? '' : position}
                                                        disabled={position === '직책을 선택해주세요'}
                                                    >
                                                        {position}
                                                    </option>
                                                ))}
                                            </select>

                                            {showOtherPosition && (
                                                <div className={styles.other_input_container}>
                                                    <input
                                                        type="text"
                                                        id="otherPosition"
                                                        value={otherPosition}
                                                        onChange={handleOtherPositionChange}
                                                        placeholder="직책을 직접 입력해주세요"
                                                        className={styles.other_input}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.input_group}>
                                            <label htmlFor="phone">전화번호</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={signupData.phone}
                                                onChange={handleSignupChange}
                                                placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                                                maxLength="13"
                                                required
                                            />
                                            <span className={styles.input_hint}>형식: 010-1234-5678</span>
                                        </div>

                                        <div className={styles.input_group}>
                                            <label htmlFor="signup_email">이메일</label>
                                            <input
                                                type="email"
                                                id="signup_email"
                                                name="email"
                                                value={signupData.email}
                                                onChange={handleSignupChange}
                                                placeholder="이메일을 입력하세요"
                                                required
                                            />
                                        </div>

                                        <div className={styles.input_group}>
                                            <label htmlFor="signup_password">비밀번호</label>
                                            <div className={styles.password_input_container}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    id="signup_password"
                                                    name="password"
                                                    value={signupData.password}
                                                    onChange={handleSignupChange}
                                                    placeholder="비밀번호를 입력하세요"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.eye_icon}
                                                    onClick={togglePasswordVisibility}
                                                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                                                >
                                                    {showPassword ? (
                                                        <span>👁️</span>
                                                    ) : (
                                                        <span>👁️‍🗨️</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.input_group}>
                                            <label htmlFor="confirmPassword">비밀번호 확인</label>
                                            <div className={styles.password_input_container}>
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    value={signupData.confirmPassword}
                                                    onChange={handleSignupChange}
                                                    placeholder="비밀번호를 다시 입력하세요"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.eye_icon}
                                                    onClick={toggleConfirmPasswordVisibility}
                                                    aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                                                >
                                                    {showConfirmPassword ? (
                                                        <span>👁️</span>
                                                    ) : (
                                                        <span>👁️‍🗨️</span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <button type="submit" className={styles.login_button}>
                                            가입하기
                                        </button>
                                    </form>

                                    <div className={styles.login_footer}>
                                        <p>이미 계정이 있으신가요? <span className={styles.signup_link} onClick={switchToLogin}>로그인</span></p>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        // 회원가입 완료 화면
                        <div className={styles.registration_complete}>
                            <div className={styles.success_icon}>✓</div>
                            <h2 className={styles.complete_title}>대기신청이 완료되었습니다</h2>
                            <p className={styles.english_quote}>
                                "Where creativity meets technology, innovation begins."
                            </p>
                            <p className={styles.complete_message}>
                                관리자 승인 후 서비스 이용이 가능합니다.
                            </p>
                            <button
                                className={styles.login_button}
                                onClick={goToLogin}
                            >
                                로그인 페이지로 이동
                            </button>
                        </div>
                    )}
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