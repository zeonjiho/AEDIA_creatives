import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Settings.module.css'
import { FaSun, FaMoon, FaArrowLeft, FaPalette, FaBell, FaUser, FaLock } from 'react-icons/fa'

const Settings = () => {
    const navigate = useNavigate()

    // 테마 상태 관리
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        return savedTheme || 'light'
    })

    // 테마 변경 함수
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    // 테마 변경 시 HTML 속성 업데이트
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // 설정 메뉴 아이템들
    const settingsSections = [
        {
            title: '개인설정',
            items: [
                {
                    icon: <FaUser />,
                    label: '프로필 관리',
                    description: '프로필 정보를 수정합니다',
                    action: () => navigate('/profile')
                },
                {
                    icon: <FaLock />,
                    label: '비밀번호 변경',
                    description: '계정 비밀번호를 변경합니다',
                    action: () => console.log('비밀번호 변경')
                }
            ]
        },
        {
            title: '화면설정',
            items: [
                {
                    icon: <FaPalette />,
                    label: '테마 설정',
                    description: theme === 'light' ? '다크 모드로 변경' : '라이트 모드로 변경',
                    action: toggleTheme,
                    toggle: true,
                    value: theme
                }
            ]
        },
        {
            title: '알림설정',
            items: [
                {
                    icon: <FaBell />,
                    label: '알림 관리',
                    description: '알림 설정을 관리합니다',
                    action: () => console.log('알림 설정')
                }
            ]
        }
    ]

    return (
        <div className={styles.settings_container}>
            {/* 헤더 */}
            <div className={styles.settings_header}>
                <button 
                    className={styles.back_button}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft />
                </button>
                <h1 className={styles.settings_title}>설정</h1>
            </div>

            {/* 설정 메뉴 */}
            <div className={styles.settings_content}>
                {settingsSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className={styles.settings_section}>
                        <h2 className={styles.section_title}>{section.title}</h2>
                        <div className={styles.settings_list}>
                            {section.items.map((item, itemIndex) => (
                                <div 
                                    key={itemIndex} 
                                    className={styles.settings_item}
                                    onClick={item.action}
                                >
                                    <div className={styles.item_left}>
                                        <div className={styles.item_icon}>
                                            {item.icon}
                                        </div>
                                        <div className={styles.item_content}>
                                            <h3 className={styles.item_label}>{item.label}</h3>
                                            <p className={styles.item_description}>{item.description}</p>
                                        </div>
                                    </div>
                                    {item.toggle && (
                                        <div className={styles.item_right}>
                                            <div className={`${styles.theme_toggle} ${theme === 'dark' ? styles.dark : ''}`}>
                                                <div className={styles.toggle_icon}>
                                                    {theme === 'light' ? <FaSun /> : <FaMoon />}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 앱 정보 */}
            <div className={styles.app_info}>
                <p className={styles.app_version}>AEDIA Studio Creatives v1.0.0</p>
                <p className={styles.copyright}>© 2024 AEDIA STUDIO. All rights reserved.</p>
            </div>
        </div>
    )
}

export default Settings 