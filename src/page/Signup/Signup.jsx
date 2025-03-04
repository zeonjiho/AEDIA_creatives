import React, { useEffect, useState } from 'react'
import ss from './Signup.module.css'
import { use } from 'react'
import api from '../../util/api'
import TermsPrivacy from '../../common/TermsPrivacy/TermsPrivacy'
import { signupLang } from '../../lang/signup'

const Signup = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        language: 'en',
    });
    const [usernameError, setUsernameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordCheckError, setPasswordCheckError] = useState('');
    const [stepError, setStepError] = useState('');
    const lang = signupLang[formData.language];

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'email') {
            if (value.trim() === '') {
                setEmailError('');  // No error message when empty
            } else {
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
                if (!emailRegex.test(value)) {
                    setEmailError('Please enter a valid email address');
                } else {
                    setEmailError('');
                }
            }
            setFormData({ ...formData, [name]: value });
        } else if (name === 'userName') {
            // 모든 입력을 소문자로 변환
            let value = e.target.value.toLowerCase();

            // 30자로 제한
            value = value.slice(0, 30);

            // 특수문자 필터링 (영문 소문자, 숫자, 하이픈, 언더스코어만 허용)
            value = value.replace(/[^a-z0-9_-]/g, '');

            // 시작 문자가 하이픈이나 언더스코어인 경우 제거
            value = value.replace(/^[-_]+/, '');

            // 이전 값의 마지막 문자가 특수문자인 경우, 새로운 특수문자 입력 방지
            const prevValue = formData.userName || '';
            const lastChar = prevValue[prevValue.length - 1];
            const newChar = value[value.length - 1];

            if ((lastChar === '-' || lastChar === '_') && (newChar === '-' || newChar === '_')) {
                value = prevValue;
            }

            setFormData({ ...formData, userName: value });
        } else if (name === 'birthday') {
            const today = new Date();
            const minAge = 7;
            const maxDate = new Date(
                today.getFullYear() - minAge,
                today.getMonth(),
                today.getDate()
            );
            const selectedDate = new Date(value);

            if (selectedDate > maxDate) {
                alert('You must be at least 7 years old to sign up.');
                return;
            }
            setFormData({ ...formData, [name]: value });
        } else if (name === 'password') {
            // Password validation
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
            const hasLetter = /[a-zA-Z]/.test(value);
            const isLongEnough = value.length >= 8;

            if (!value) {
                setPasswordError('');
            } else if (!isLongEnough) {
                setPasswordError('Password must be at least 8 characters long');
            } else if (!(hasNumber && hasSpecial && hasLetter)) {
                setPasswordError('Password must include letters, numbers, and special characters');
            } else {
                setPasswordError('');
            }

            // Check if passwords match
            if (formData.passwordCheck) {
                if (value !== formData.passwordCheck) {
                    setPasswordCheckError('Passwords do not match');
                } else {
                    setPasswordCheckError('');
                }
            }
            setFormData({ ...formData, [name]: value });
        } else if (name === 'passwordCheck') {
            // Only check if passwords match for the confirm password field
            if (!value) {
                setPasswordCheckError('');
            } else if (value !== formData.password) {
                setPasswordCheckError('Passwords do not match');
            } else {
                setPasswordCheckError('');
            }
            setFormData({ ...formData, [name]: value });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    }

    const handleSignup = async () => {
        try {
            const response = await api.post('/user/signup', formData);
            if (response.status === 201) {
                if (response.data.message === 'email') {
                    setStepError('Email already exists.');
                } else if (response.data.message === 'userName') {
                    setStepError('Username already exists.');
                } else if (response.data.message === 'error') {
                    setStepError('An error occurred during signup.');
                }
            } else if (response.status === 200) {
                window.location.href = '/login';
            }
        } catch (err) {
            setStepError('An error occurred during signup.');
        }
    };

    const validateStep = () => {
        switch (step) {
            case 1:
                if (!formData.termsAgree) {
                    setStepError('Please agree to the terms and privacy policy.');
                    return false;
                }
                break;
            case 2:
                if (!formData.userName) {
                    setStepError('Username is required.');
                    return false;
                }
                if (formData.userName.length < 3) {
                    setStepError('Username must be at least 3 characters long.');
                    return false;
                }
                if (usernameError) {
                    setStepError(usernameError);
                    return false;
                }
                if (formData.email && emailError) {
                    setStepError(emailError);
                    return false;
                }
                break;
            case 3:
                if (!formData.password) {
                    setStepError('Password is required.');
                    return false;
                }
                if (passwordError) {
                    setStepError(passwordError);
                    return false;
                }
                if (!formData.passwordCheck) {
                    setStepError('Please confirm your password.');
                    return false;
                }
                if (passwordCheckError) {
                    setStepError(passwordCheckError);
                    return false;
                }
                break;
            case 4:
                if (!formData.birthday) {
                    setStepError('Please enter your birthday.');
                    return false;
                }
                if (!formData.gender) {
                    setStepError('Please select your gender.');
                    return false;
                }
                if (!formData.occupation) {
                    setStepError('Please select your occupation.');
                    return false;
                }
                break;
        }
        setStepError('');
        return true;
    };

    const nextStep = () => {
        // 현재 스텝의 유효성 검사
        switch (step) {
            case 1:
                if (!formData.termsAgree) {
                    setStepError('Please agree to the terms and privacy policy.');
                    return;
                }
                break;
            case 2:
                if (!formData.userName) {
                    setStepError('Username is required.');
                    return;
                }
                if (formData.userName.length < 3) {
                    setStepError('Username must be at least 3 characters long.');
                    return;
                }
                if (usernameError) {
                    setStepError(usernameError);
                    return;
                }
                if (formData.email && emailError) {
                    setStepError(emailError);
                    return;
                }
                break;
            case 3:
                if (!formData.password) {
                    setStepError('Password is required.');
                    return;
                }
                if (passwordError) {
                    setStepError(passwordError);
                    return;
                }
                if (!formData.passwordCheck) {
                    setStepError('Please confirm your password.');
                    return;
                }
                if (passwordCheckError) {
                    setStepError(passwordCheckError);
                    return;
                }
                break;
            case 4:
                if (!formData.birthday) {
                    setStepError('Please enter your birthday.');
                    return;
                }
                if (!formData.gender) {
                    setStepError('Please select your gender.');
                    return;
                }
                if (!formData.occupation) {
                    setStepError('Please select your occupation.');
                    return;
                }
                break;
        }

        // 유효성 검사를 통과하면 다음 스텝으로 이동
        setStepError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setStepError('');
        setStep(step - 1);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className={ss.form_container}>
                        <div className={ss.input_group}>
                            <h2 className={ss.welcome_title}>
                                {lang.welcome} <span className={ss.hyper_text}>HYPER</span>™
                            </h2>
                            <p className={ss.welcome_desc}>
                                {lang.welcomeDesc}
                            </p>
                            <div className={ss.language_select}>
                                <select
                                    name='language'
                                    value={formData.language}
                                    onChange={(e) => { setFormData({ ...formData, language: e.target.value }) }}
                                    className={ss.lang_select}
                                >
                                    <option value="en">English</option>
                                    <option value="ko">한국어</option>
                                </select>
                            </div>
                            <div className={ss.terms_container}>
                                <div className={ss.terms_group}>
                                    <input
                                        type="checkbox"
                                        id="termsAgree"
                                        checked={formData.termsAgree}
                                        onChange={(e) => setFormData({ ...formData, termsAgree: e.target.checked })}
                                    />
                                    <label htmlFor="termsAgree">
                                        {lang.termsAgree.split('Terms')[0]}
                                        <span className={ss.terms_link} onClick={() => setShowTerms(true)}>
                                            {lang.terms}
                                        </span>
                                        {lang.termsAgree.includes('and') ? ' and ' : ' 및 '}
                                        <span className={ss.terms_link} onClick={() => setShowPrivacy(true)}>
                                            {lang.privacy}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className={ss.button_container}>
                            <button
                                className={`${ss.nav_button} ${ss.next} ${formData.termsAgree ? ss.valid : ''}`}
                                onClick={nextStep}
                                disabled={!formData.termsAgree}
                                aria-label="Next step"
                            >
                                →
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className={ss.form_container}>
                        <div className={ss.input_group}>
                            <div className={ss.input_wrap}>
                                <p>Username </p>
                                <div className={ss.username_input}>
                                    <input
                                        type="text"
                                        name="userName"
                                        value={formData.userName || ''}
                                        onChange={(e) => {
                                            // 모든 입력을 소문자로 변환
                                            let value = e.target.value.toLowerCase();

                                            // 30자로 제한
                                            value = value.slice(0, 30);

                                            // 특수문자 필터링 (영문 소문자, 숫자, 하이픈, 언더스코어만 허용)
                                            value = value.replace(/[^a-z0-9_-]/g, '');

                                            // 시작 문자가 하이픈이나 언더스코어인 경우 제거
                                            value = value.replace(/^[-_]+/, '');

                                            // 이전 값의 마지막 문자가 특수문자인 경우, 새로운 특수문자 입력 방지
                                            const prevValue = formData.userName || '';
                                            const lastChar = prevValue[prevValue.length - 1];
                                            const newChar = value[value.length - 1];

                                            if ((lastChar === '-' || lastChar === '_') && (newChar === '-' || newChar === '_')) {
                                                value = prevValue;
                                            }

                                            setFormData({ ...formData, userName: value });
                                        }}
                                        placeholder="3-30 chars (a-z, 0-9, - or _)"
                                        minLength={3}
                                        maxLength={30}
                                        className={
                                            formData.userName
                                                ? (usernameError || formData.userName.length < 3
                                                    ? ss.invalid
                                                    : ss.valid)
                                                : ''
                                        }
                                    />
                                    <span className={ss.at_symbol}>@</span>
                                </div>
                                {/* <p className={ss.input_requirements}>
                                    * 3-30 chars (a-z, 0-9, - or _)
                                </p> */}
                                {(usernameError || stepError) && (
                                    <p className={ss.error_message}>
                                        {usernameError || stepError}
                                    </p>
                                )}
                            </div>
                            <div className={ss.input_wrap}>
                                <p>Email (For account recovery)</p>
                                <div className={ss.email_input}>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        placeholder="Enter email (Optional)"
                                        className={
                                            formData.email
                                                ? (emailError
                                                    ? ss.invalid
                                                    : ss.valid)
                                                : ''
                                        }
                                    />
                                    {formData.email && (
                                        <button
                                            type="button"
                                            className={ss.clear_button}
                                            onClick={() => {
                                                setFormData({ ...formData, email: '' });
                                                setEmailError('');
                                            }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                {emailError && <p className={ss.error_message}>{emailError}</p>}
                            </div>
                            <div className={ss.input_wrap}>
                                <p>Phone (Optional)</p>
                                <div className={ss.phone_input}>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        className={formData.phone ? ss.valid : ''}
                                    />
                                    {formData.phone && (
                                        <button
                                            type="button"
                                            className={ss.clear_button}
                                            onClick={() => setFormData({ ...formData, phone: '' })}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={ss.button_container}>
                            <button
                                className={`${ss.nav_button} ${ss.prev}`}
                                onClick={prevStep}
                                aria-label="Previous step"
                            >
                                ←
                            </button>
                            <button
                                className={`${ss.nav_button} ${ss.next} ${formData.userName &&
                                        formData.userName.length >= 3 &&
                                        !usernameError &&
                                        (!formData.email || !emailError) ? ss.valid : ''
                                    }`}
                                onClick={nextStep}
                                disabled={!formData.userName ||
                                    formData.userName.length < 3 ||
                                    usernameError ||
                                    (formData.email && emailError)}
                                aria-label="Next step"
                            >
                                →
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className={ss.form_container}>
                        <div className={ss.input_group}>
                            <div className={ss.input_wrap}>
                                <p>Password</p>
                                <div className={ss.password_input}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name='password'
                                        value={formData.password || ''}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        className={
                                            formData.password
                                                ? (passwordError ? ss.invalid : ss.valid)
                                                : ''
                                        }
                                    />
                                    <button
                                        type="button"
                                        className={ss.show_password}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {formData.password && (
                                    <p className={ss.password_requirements}>
                                        * Must include letters, numbers, and special characters (8+ characters)
                                    </p>
                                )}

                                <p>Confirm Password</p>
                                <div className={ss.password_input}>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name='passwordCheck'
                                        value={formData.passwordCheck || ''}
                                        onChange={handleChange}
                                        placeholder="Enter password again"
                                        className={
                                            formData.passwordCheck
                                                ? (passwordCheckError ? ss.invalid : ss.valid)
                                                : ''
                                        }
                                    />
                                    <button
                                        type="button"
                                        className={ss.show_password}
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {passwordCheckError && <p className={ss.error_message}>{passwordCheckError}</p>}
                            </div>
                        </div>
                        <div className={ss.button_container}>
                            <button
                                className={`${ss.nav_button} ${ss.prev}`}
                                onClick={prevStep}
                                aria-label="Previous step"
                            >
                                ←
                            </button>
                            <button
                                className={`${ss.nav_button} ${ss.next} ${isStepValid() ? ss.valid : ''}`}
                                onClick={step === 4 ? handleSignup : nextStep}
                                disabled={!isStepValid()}
                                aria-label={step === 4 ? "Sign up" : "Next step"}
                            >
                                {step === 4 ? "Sign up" : "→"}
                            </button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className={ss.form_container}>
                        <div className={ss.input_group}>
                            <div className={ss.input_wrap}>
                                <p>Birthday</p>
                                <input
                                    type='date'
                                    name='birthday'
                                    value={formData.birthday || ''}
                                    onChange={handleChange}
                                    max={(() => {
                                        const today = new Date();
                                        const minAge = 7;
                                        const maxDate = new Date(
                                            today.getFullYear() - minAge,
                                            today.getMonth(),
                                            today.getDate()
                                        );
                                        return maxDate.toISOString().split('T')[0];
                                    })()}
                                    min="1900-01-01"
                                    placeholder="DD/MM/YYYY"
                                />
                                <p>Gender</p>
                                <select name='gender' value={formData.gender} onChange={handleChange}>
                                    <option value=''>Select gender</option>
                                    <option value='0'>Male</option>
                                    <option value='1'>Female</option>
                                    <option value='2'>Other</option>
                                </select>
                                <p>Occupation(Job)</p>
                                <select name='occupation' value={formData.occupation} onChange={handleChange}>
                                    <option value="">Select your occupation</option>
                                    <option value="developer">Developer</option>
                                    <option value="designer">Designer</option>
                                    <option value="artist">Artist</option>
                                    <option value="marketer">Marketer</option>
                                    <option value="business">Business Owner</option>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="engineer">Engineer</option>
                                    <option value="researcher">Researcher</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className={ss.button_container}>
                            <button
                                className={`${ss.nav_button} ${ss.prev}`}
                                onClick={prevStep}
                                aria-label="Previous step"
                            >
                                ←
                            </button>
                            <button
                                className={`${ss.nav_button} ${ss.next} ${isStepValid() ? ss.valid : ''} ${step === 4 ? ss.signup : ''}`}
                                onClick={step === 4 ? handleSignup : nextStep}
                                disabled={!isStepValid()}
                                aria-label={step === 4 ? "Sign up" : "Next step"}
                            >
                                {step === 4 ? "Sign up" : "→"}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return formData.termsAgree;
            case 2:
                return formData.userName &&
                    formData.userName.length >= 3 &&
                    !usernameError &&
                    (!formData.email || !emailError);
            case 3:
                return formData.password &&
                    formData.passwordCheck &&
                    !passwordError &&
                    !passwordCheckError;
            case 4:
                return formData.birthday && formData.gender && formData.occupation;
            default:
                return false;
        }
    };

    return (
        <>
            <div className={ss.container}>
                <div className={ss.wrap}>
                    <div className={ss.steps}>
                        <div className={ss.step_labels}>
                            <span className={`${ss.step_label} ${step >= 1 ? ss.active : ''}`}>1</span>
                            <span className={`${ss.step_label} ${step >= 2 ? ss.active : ''}`}>2</span>
                            <span className={`${ss.step_label} ${step >= 3 ? ss.active : ''}`}>3</span>
                            <span className={`${ss.step_label} ${step >= 4 ? ss.active : ''}`}>4</span>
                        </div>
                        <div className={ss.step_line} data-step={step} />
                        <div className={ss.step_titles}>
                            <span className={`${ss.step_title} ${step >= 1 ? ss.active : ''}`}>Welcome</span>
                            <span className={`${ss.step_title} ${step >= 2 ? ss.active : ''}`}>User</span>
                            <span className={`${ss.step_title} ${step >= 3 ? ss.active : ''}`}>Password</span>
                            <span className={`${ss.step_title} ${step >= 4 ? ss.active : ''}`}>Details</span>
                        </div>
                    </div>
                    {stepError && <p className={ss.step_error}>{stepError}</p>}
                    {renderStep()}
                </div>
            </div>
            {showTerms && <TermsPrivacy type="terms" onClose={() => setShowTerms(false)} />}
            {showPrivacy && <TermsPrivacy type="privacy" onClose={() => setShowPrivacy(false)} />}
        </>
    );
}

export default Signup