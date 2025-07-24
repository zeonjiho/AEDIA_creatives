import React, { useState, useEffect } from 'react'
import ss from './AttendanceExtend.module.css'
import { FaClock, FaSignOutAlt, FaHourglassHalf, FaUser } from 'react-icons/fa'
import api from '../../utils/api'
import { jwtDecode } from 'jwt-decode'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

const AttendanceExtend = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    
    const [currentTime, setCurrentTime] = useState(new Date())
    const [userName, setUserName] = useState('')
    const [loading, setLoading] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [messageType, setMessageType] = useState('')
    const [userId, setUserId] = useState(null)
    const [isValidated, setIsValidated] = useState(false)
    const [isValidating, setIsValidating] = useState(true)

    // 현재 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // URL 파라미터 검증 및 사용자 정보 로드
    useEffect(() => {
        const validateAndLoadUser = async () => {
            try {
                const urlUserId = searchParams.get('userId')
                
                // URL 파라미터가 없는 경우 홈으로 리다이렉트
                if (!urlUserId) {
                    console.log('userId 파라미터가 없습니다. 홈으로 리다이렉트합니다.')
                    navigate('/')
                    return
                }
                
                // 사용자 정보 조회
                try {
                    const response = await api.get(`/attendance-extend/users/${urlUserId}`)
                    setUserId(urlUserId)
                    setUserName(response.data.name || '사용자')
                    setIsValidated(true)
                } catch (error) {
                    console.error('사용자 정보 조회 실패:', error)
                    console.log('유효하지 않은 사용자입니다. 홈으로 리다이렉트합니다.')
                    navigate('/')
                }
                
            } catch (error) {
                console.error('검증 중 오류 발생:', error)
                navigate('/')
            } finally {
                setIsValidating(false)
            }
        }

        validateAndLoadUser()
    }, [searchParams, navigate])



    // 지금 퇴근하기 처리
    const handleCheckOut = () => {
        // /attendance 페이지로 이동
        navigate('/attendance')
    }

    // 연장하기 처리
    const handleExtend = async () => {
        if (!userId) {
            setStatusMessage('사용자 정보를 찾을 수 없습니다.')
            setMessageType('error')
            return
        }

        setLoading(true)
        setStatusMessage('연장 처리 중...')
        
        try {
            // 연장 API 호출
            const response = await api.post(`/attendance/extend?userId=${userId}`)
            
            setStatusMessage('연장이 처리되었습니다.')
            setMessageType('success')
            
            // 3초 후 메시지 숨기기
            setTimeout(() => {
                setStatusMessage('')
                setMessageType('')
            }, 3000)
            
        } catch (error) {
            console.error('연장 처리 실패:', error)
            setStatusMessage(error.response?.data?.message || '연장 처리 중 오류가 발생했습니다')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    // 시간 포맷팅
    const formatTime = (date) => {
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        })
    }

    // 날짜 포맷팅
    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        })
    }

    // 검증 중이거나 검증되지 않은 경우 로딩 표시
    if (isValidating) {
        return (
            <div className={ss.attendance_extend_wrap}>
                <div className={ss.attendance_center}>
                    <div className={ss.status_card}>
                        <div className={ss.loading_message}>
                            <div className={ss.loading_icon}>⏳</div>
                            <p>검증 중입니다...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 검증되지 않은 경우 아무것도 렌더링하지 않음 (이미 홈으로 리다이렉트됨)
    if (!isValidated) {
        return null
    }

    return (
        <div className={ss.attendance_extend_wrap}>
            {/* 중앙 콘텐츠 */}
            <div className={ss.attendance_center}>
                <div className={ss.status_card}>
                    {/* 사용자 인사말 */}
                    <div className={ss.user_greeting}>
                        <div className={ss.user_icon}>
                            <FaUser />
                        </div>
                        <h2 className={ss.greeting_text}>
                            {userName}님 안녕하세요!
                        </h2>
                        <p className={ss.greeting_subtext}>
                            지금 퇴근하시겠습니까?
                        </p>
                    </div>

                    {/* 현재 날짜 표시 */}
                    <div className={ss.status_time}>
                        <div className={ss.current_date}>{formatDate(currentTime)}</div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className={ss.attendance_buttons}>
                        <button 
                            className={ss.check_out_button}
                            onClick={handleCheckOut}
                            disabled={loading}
                        >
                            <FaSignOutAlt />
                            지금 퇴근하기
                        </button>
                        
                        <button 
                            className={ss.extend_button}
                            onClick={handleExtend}
                            disabled={loading}
                        >
                            <FaHourglassHalf />
                            연장하기
                        </button>
                    </div>

                    {/* 상태 메시지 */}
                    {statusMessage && (
                        <div className={`${ss.status_message} ${ss[messageType]}`}>
                            {statusMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AttendanceExtend