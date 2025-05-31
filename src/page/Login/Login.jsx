import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'
import api from '../../utils/api';

const Login = () => {
    // 로그인/회원가입 모드 상태
    const [isSignupMode, setIsSignupMode] = useState(false);
    
    // 회원가입 단계 상태 (1단계: 계정정보, 2단계: 슬랙인증, 3단계: 개인정보)
    const [signupStep, setSignupStep] = useState(1);
    
    // 로그인 폼 데이터
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // 회원가입 폼 데이터
    const [signupData, setSignupData] = useState({
        name: '',
        slackId: '',
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

    // 슬랙 가이드 모달 상태
    const [showSlackGuide, setShowSlackGuide] = useState(false);
    const [guideStep, setGuideStep] = useState(1);

    // 슬랙 연결 상태
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

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

    // signupStep 상태 변경 추적
    useEffect(() => {
        console.log('signupStep 상태 변경됨:', signupStep);
    }, [signupStep]);

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

    // 슬랙 ID 유효성 검사
    const isValidSlackId = (slackId) => {
        return slackId.startsWith('U') && slackId.length === 11;
    };

    // 슬랙 연결 처리
    const handleSlackConnect = (e) => {
        e.preventDefault();
        
        if (!signupData.slackId) {
            alert('슬랙 멤버 ID를 입력해주세요.');
            return;
        }
        
        if (!isValidSlackId(signupData.slackId)) {
            alert('올바른 슬랙 멤버 ID 형식이 아닙니다. (예: U062BR8GUTW)');
            return;
        }
        
        // OTP 입력창 표시
        setShowOtpInput(true);
    };

    // OTP 입력 처리
    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
        if (value.length <= 6) {
            setOtpCode(value);
        }
    };

    // OTP 개별 필드 입력 처리
    const handleOtpDigitChange = (index, value) => {
        // 숫자만 허용
        const numericValue = value.replace(/[^0-9]/g, '');
        
        if (numericValue.length <= 1) {
            const newDigits = [...otpDigits];
            newDigits[index] = numericValue;
            setOtpDigits(newDigits);
            
            // 전체 OTP 코드 업데이트
            const fullCode = newDigits.join('');
            setOtpCode(fullCode);
            
            // 다음 필드로 자동 포커스 이동
            if (numericValue && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                if (nextInput) {
                    nextInput.focus();
                }
            }
        }
    };

    // OTP 필드 키 입력 처리 (백스페이스 등)
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            // 현재 필드가 비어있고 백스페이스를 누르면 이전 필드로 이동
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            // 왼쪽 화살표로 이전 필드 이동
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
            }
        } else if (e.key === 'ArrowRight' && index < 5) {
            // 오른쪽 화살표로 다음 필드 이동
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    // OTP 검증 및 다음 단계
    const handleOtpSubmit = (e) => {
        console.log('handleOtpSubmit 호출됨, OTP 길이:', otpCode.length);
        e.preventDefault();
        
        if (otpCode.length !== 6) {
            alert('6자리 OTP 코드를 입력해주세요.');
            return;
        }
        
        // 실제로는 서버에서 OTP 검증
        // 임시로 모든 6자리 숫자를 허용
        console.log('OTP 검증 완료, 3단계로 이동');
        setSignupStep(3);
        setShowOtpInput(false);
        setOtpCode('');
    };

    // 다음 단계로 이동
    const goToNextStep = (e) => {
        e.preventDefault();
        
        if (signupStep === 1) {
            // 1단계 유효성 검사
            if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
                alert('모든 필드를 입력해주세요.');
                return;
            }
            
            // 비밀번호 일치 여부 확인
            if (signupData.password !== signupData.confirmPassword) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }
            
            setSignupStep(2);
        } else if (signupStep === 2) {
            // 2단계 유효성 검사 (슬랙 ID)
            if (!signupData.slackId) {
                alert('슬랙 멤버 ID를 입력해주세요.');
                return;
            }
            
            setSignupStep(3);
        }
    };

    // 이전 단계로 이동
    const goToPreviousStep = (e) => {
        console.log('goToPreviousStep 호출됨, 현재 단계:', signupStep);
        
        // 이벤트 전파 방지
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // OTP 관련 상태 초기화
        if (signupStep === 2) {
            console.log('OTP 상태 초기화 중...');
            setShowOtpInput(false);
            setOtpCode('');
            setOtpDigits(['', '', '', '', '', '']);
        }
        
        // 단계 감소
        if (signupStep === 2) {
            console.log('2단계에서 1단계로 이동 시도');
            setSignupStep(1);
        } else if (signupStep === 3) {
            console.log('3단계에서 2단계로 이동 시도');
            setSignupStep(2);
        }
        
        console.log('이전 단계로 이동 완료');
    };

    // 회원가입 처리
    const handleSignupSubmit = async (e) => {
        e.preventDefault();

        // 3단계 유효성 검사
        if (!signupData.name || !signupData.position || !signupData.phone) {
            alert('모든 필드를 입력해주세요.');
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
        setSignupStep(1);
        setRegistrationComplete(false);
        // OTP 관련 상태 초기화
        setShowOtpInput(false);
        setOtpCode('');
        setOtpDigits(['', '', '', '', '', '']);
    };

    const switchToLogin = () => {
        setIsSignupMode(false);
        setSignupStep(1);
        setRegistrationComplete(false);
        setShowOtherPosition(false);
        setOtherPosition('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        // OTP 관련 상태 초기화
        setShowOtpInput(false);
        setOtpCode('');
        setOtpDigits(['', '', '', '', '', '']);
        // 회원가입 데이터 초기화
        setSignupData({
            name: '',
            slackId: '',
            position: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
    };

    // 로그인 페이지로 이동 (회원가입 완료 후)
    const goToLogin = () => {
        switchToLogin();
    };

    // 슬랙 가이드 모달 열기/닫기
    const openSlackGuide = () => {
        setShowSlackGuide(true);
        setGuideStep(1);
    };

    const closeSlackGuide = () => {
        setShowSlackGuide(false);
        setGuideStep(1);
    };

    // 가이드 단계 변경
    const nextGuideStep = () => {
        if (guideStep < 2) {
            setGuideStep(guideStep + 1);
        }
    };

    const prevGuideStep = () => {
        if (guideStep > 1) {
            setGuideStep(guideStep - 1);
        }
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
                                        <p className={styles.login_subtitle}>
                                            {signupStep === 1 ? '계정 정보를 입력해주세요' : 
                                             signupStep === 2 ? '슬랙 멤버 인증을 진행해주세요' : 
                                             '개인 정보를 입력해주세요'}
                                        </p>
                                        <div className={styles.step_indicator}>
                                            <div className={`${styles.step} ${signupStep >= 1 ? styles.active : ''}`}>1</div>
                                            <div className={styles.step_line}></div>
                                            <div className={`${styles.step} ${signupStep >= 2 ? styles.active : ''}`}>2</div>
                                            <div className={styles.step_line}></div>
                                            <div className={`${styles.step} ${signupStep >= 3 ? styles.active : ''}`}>3</div>
                                        </div>
                                    </div>

                                    {signupStep === 1 ? (
                                        // 1단계: 계정 정보
                                        <form onSubmit={goToNextStep} className={styles.login_form}>
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

                                            <div className={styles.form_buttons}>
                                                <button type="submit" className={styles.login_button}>
                                                    다음 단계
                                                </button>
                                            </div>
                                        </form>
                                    ) : signupStep === 2 ? (
                                        // 2단계: 슬랙 멤버 인증
                                        <form onSubmit={showOtpInput ? handleOtpSubmit : handleSlackConnect} className={styles.login_form}>
                                            <button 
                                                type="button"
                                                className={styles.slack_guide_button}
                                                onClick={openSlackGuide}
                                            >
                                                <div className={styles.slack_button_content}>
                                                    <div className={styles.slack_icon}>🔗</div>
                                                    <div className={styles.slack_button_text}>
                                                        <h3>슬랙 워크스페이스 연동</h3>
                                                        <p>멤버 ID 찾는 방법 보기</p>
                                                    </div>
                                                    <div className={styles.slack_arrow}>→</div>
                                                </div>
                                            </button>

                                            <div className={styles.input_group}>
                                                <label htmlFor="slackId">슬랙 멤버 ID</label>
                                                <input
                                                    type="text"
                                                    id="slackId"
                                                    name="slackId"
                                                    value={signupData.slackId}
                                                    onChange={handleSignupChange}
                                                    placeholder="슬랙 멤버 ID (예: U062BR8GUTW)"
                                                    required
                                                    className={!isValidSlackId(signupData.slackId) && signupData.slackId ? styles.invalid_input : ''}
                                                />
                                                <span className={styles.input_hint}>
                                                    {signupData.slackId && !isValidSlackId(signupData.slackId) 
                                                        ? '❌ U로 시작하는 11자리 ID를 입력하세요' 
                                                        : signupData.slackId && isValidSlackId(signupData.slackId)
                                                        ? '✅ 올바른 형식입니다'
                                                        : '위 버튼을 클릭하여 멤버 ID 찾는 방법을 확인하세요.'
                                                    }
                                                </span>
                                            </div>

                                            {showOtpInput && (
                                                <div className={styles.otp_section}>
                                                    <div className={styles.otp_info}>
                                                        <div className={styles.otp_icon}>🔐</div>
                                                        <p>슬랙으로 전송된 6자리 인증코드를 입력해주세요.</p>
                                                    </div>
                                                    <div className={styles.input_group}>
                                                        <label>인증코드 (6자리)</label>
                                                        <div className={styles.otp_inputs_container}>
                                                            {otpDigits.map((digit, index) => (
                                                                <input
                                                                    key={index}
                                                                    id={`otp-${index}`}
                                                                    type="text"
                                                                    value={digit}
                                                                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                                    className={styles.otp_digit_input}
                                                                    maxLength="1"
                                                                    autoComplete="off"
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className={styles.input_hint}>
                                                            {otpCode.length === 6 ? '✅ 인증코드가 입력되었습니다' : `${otpCode.length}/6자리 입력됨`}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={styles.form_buttons}>
                                                <button 
                                                    type="button" 
                                                    className={styles.back_button}
                                                    onClick={goToPreviousStep}
                                                >
                                                    이전 단계
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className={styles.login_button}
                                                    disabled={!isValidSlackId(signupData.slackId) || (showOtpInput && otpCode.length !== 6)}
                                                >
                                                    {showOtpInput ? '인증 완료' : 'Slack Connect'}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        // 3단계: 개인 정보
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

                                            <div className={styles.form_buttons}>
                                                <button 
                                                    type="button" 
                                                    className={styles.back_button}
                                                    onClick={goToPreviousStep}
                                                >
                                                    이전 단계
                                                </button>
                                                <button type="submit" className={styles.login_button}>
                                                    가입하기
                                                </button>
                                            </div>
                                        </form>
                                    )}

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

            {/* 슬랙 가이드 모달 */}
            {showSlackGuide && (
                <div className={styles.modal_overlay} onClick={closeSlackGuide}>
                    <div className={styles.modal_content} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modal_header}>
                            <h2>슬랙 멤버 ID 찾기</h2>
                            <button className={styles.modal_close} onClick={closeSlackGuide}>✕</button>
                        </div>
                        
                        <div className={styles.modal_body}>
                            <div className={styles.guide_step_indicator}>
                                <span className={styles.guide_current_step}>{guideStep}</span>
                                <span className={styles.guide_total_step}>/ 2</span>
                            </div>
                            
                            {guideStep === 1 ? (
                                <div className={styles.guide_step}>
                                    <h3>1단계: 프로필 메뉴 열기</h3>
                                    <div className={styles.guide_image_container}>
                                        <img 
                                            src={`${process.env.PUBLIC_URL}/Images/Guide_01.png`}
                                            alt="슬랙 프로필 메뉴 열기"
                                            className={styles.guide_image}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div className={styles.image_fallback} style={{display: 'none'}}>
                                            <div className={styles.fallback_icon}>📱</div>
                                            <p>이미지를 불러올 수 없습니다</p>
                                        </div>
                                    </div>
                                    <p>슬랙에서 본인의 프로필을 클릭하여 메뉴를 열어주세요.</p>
                                </div>
                            ) : (
                                <div className={styles.guide_step}>
                                    <h3>2단계: 멤버 ID 복사</h3>
                                    <div className={styles.guide_image_container}>
                                        <img 
                                            src={`${process.env.PUBLIC_URL}/Images/Guide_02.png`}
                                            alt="슬랙 멤버 ID 복사"
                                            className={styles.guide_image}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <div className={styles.image_fallback} style={{display: 'none'}}>
                                            <div className={styles.fallback_icon}>📋</div>
                                            <p>이미지를 불러올 수 없습니다</p>
                                        </div>
                                    </div>
                                    <p>"멤버 ID 복사" 버튼을 클릭하여 본인의 슬랙 멤버 ID를 복사하세요.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.modal_footer}>
                            <button 
                                className={styles.modal_prev_btn}
                                onClick={prevGuideStep}
                                disabled={guideStep === 1}
                            >
                                이전
                            </button>
                            <button 
                                className={styles.modal_next_btn}
                                onClick={guideStep === 2 ? closeSlackGuide : nextGuideStep}
                            >
                                {guideStep === 2 ? '완료' : '다음'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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