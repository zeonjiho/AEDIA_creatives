import React, { useState, useEffect } from 'react'
import ss from './AttendanceExtend.module.css'
import { FaClock, FaSignOutAlt, FaHourglassHalf, FaUser } from 'react-icons/fa'
import api from '../../utils/api'
import { jwtDecode } from 'jwt-decode'
import { useNavigate, useSearchParams } from 'react-router-dom'

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
                const code = searchParams.get('code')
                
                // URL 파라미터가 없는 경우 홈으로 리다이렉트
                if (!urlUserId || !code) {
                    console.log('URL 파라미터가 없습니다. 홈으로 리다이렉트합니다.')
                    navigate('/')
                    return
                }
                
                // 서버에 검증 요청 (추후 서버 API 구현 예정)
                try {
                    const response = await api.post('/attendance/validate-extend', {
                        userId: urlUserId,
                        code: code
                    })
                    
                    if (response.data.valid) {
                        setUserId(urlUserId)
                        setUserName(response.data.userName || '사용자')
                        setIsValidated(true)
                    } else {
                        console.log('유효하지 않은 코드입니다. 홈으로 리다이렉트합니다.')
                        navigate('/')
                    }
                } catch (error) {
                    console.error('검증 요청 실패:', error)
                    // 서버 API가 아직 구현되지 않은 경우를 위한 임시 처리
                    // 실제로는 이 부분을 제거하고 서버 응답만 사용해야 함
                    console.log('서버 API 미구현으로 인한 임시 처리')
                    setUserId(urlUserId)
                    setUserName('사용자')
                    setIsValidated(true)
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
    const handleCheckOut = async () => {
        if (!userId) {
            setStatusMessage('사용자 정보를 찾을 수 없습니다.')
            setMessageType('error')
            return
        }

        setLoading(true)
        setStatusMessage('퇴근 처리 중...')
        
        try {
            const response = await api.post(`/attendance/check-out?userId=${userId}`, {
                location: null,
                method: 'manual',
                isOffSite: false
            })
            
            setStatusMessage('퇴근 처리되었습니다.')
            setMessageType('success')
            
            // 3초 후 메시지 숨기기
            setTimeout(() => {
                setStatusMessage('')
                setMessageType('')
            }, 3000)
            
        } catch (error) {
            console.error('퇴근 처리 실패:', error)
            setStatusMessage(error.response?.data?.message || '퇴근 처리 중 오류가 발생했습니다')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
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
            // 연장 API 호출 (서버에 연장 API가 있다고 가정)
            const response = await api.post(`/attendance/extend?userId=${userId}`, {
                reason: '사용자 요청 연장'
            })
            
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
                            현재 시간이 늦어졌습니다.<br />
                            어떻게 하시겠습니까?
                        </p>
                    </div>

                    {/* 현재 시간 표시 */}
                    <div className={ss.status_time}>
                        <div className={ss.current_date}>{formatDate(currentTime)}</div>
                        <div className={ss.current_time}>{formatTime(currentTime)}</div>
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