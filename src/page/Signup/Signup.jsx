import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Signup.module.css'
import api from '../../utils/api';

const Signup = () => {
    const [formData, setFormData] = useState({
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        // 전화번호 입력 처리
        if (name === 'phone') {
            const formattedPhone = formatPhoneNumber(value);
            setFormData(prev => ({
                ...prev,
                [name]: formattedPhone
            }));
            return;
        }

        // 직책이 '기타'인 경우 처리
        if (name === 'position' && value === '기타') {
            setShowOtherPosition(true);
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        } else if (name === 'position') {
            setShowOtherPosition(false);
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setFormData(prev => ({
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 비밀번호 일치 여부 확인
        if (formData.password !== formData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 직책이 기타인 경우 직접 입력한 값으로 대체
        // 전화번호에서 하이픈 제거 (서버 전송용)
        const finalFormData = {
            ...formData,
            position: formData.position === '기타' ? otherPosition : formData.position,
            phone: formData.phone.replace(/[^\d]/g, '') // 숫자만 추출하여 서버로 전송
        };

        console.log('회원가입 시도:', finalFormData);
        // 여기에 회원가입 로직 추가
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

        // 일정 시간 후 로그인 페이지로 이동 (선택사항)
        // setTimeout(() => {
        //     navigate('/login');
        // }, 5000);
    };

    // 로그인 페이지로 이동
    const goToLogin = () => {
        navigate('/login');
    };

    return (
        <div className={styles.signup_wrap}>
            <div className={styles.signup_container}>
                <div className={styles.signup_box}>
                    {!registrationComplete ? (
                        <>
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
                                    <label htmlFor="position">직책</label>
                                    <select
                                        id="position"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
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
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                                        maxLength="13"
                                        required
                                    />
                                    <span className={styles.input_hint}>형식: 010-1234-5678</span>
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
                                    <div className={styles.password_input_container}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
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
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
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

                                <button type="submit" className={styles.signup_button}>
                                    가입하기
                                </button>
                            </form>

                            <div className={styles.signup_footer}>
                                <p>이미 계정이 있으신가요? <span className={styles.login_link} onClick={() => navigate('/login')}>로그인</span></p>
                            </div>
                        </>
                    ) : (
                        <div className={styles.registration_complete}>
                            <div className={styles.success_icon}>✓</div>
                            <h2 className={styles.complete_title}>대기신청이 완료되었습니다</h2>
                            <p className={styles.english_quote}>
                                "Where creativity meets technology, innovation begins."
                            </p>
                            <p className={styles.complete_message}>
                                관리자 승인 후 서비스 이용이 가능합니다.
                                {/* <br />승인 완료 시 입력하신 이메일로 알림이 발송됩니다. */}
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
        </div>
    );
};

export default Signup; 