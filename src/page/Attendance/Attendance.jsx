import React, { useState, useEffect } from 'react'
import ss from './Attendance.module.css'
import { FaCalendarCheck, FaUserClock, FaHistory, FaCheckCircle, FaRegListAlt, FaMapMarkerAlt } from 'react-icons/fa'
import AttendanceModal from './AttendanceModal'

const Attendance = () => {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [attendanceStatus, setAttendanceStatus] = useState('미출근')
    const [showModal, setShowModal] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' 또는 'error'
    const [attendanceHistory, setAttendanceHistory] = useState([
        { date: '2023-10-01', checkIn: '09:05', checkOut: '18:10', status: '정상' },
        { date: '2023-10-02', checkIn: '08:55', checkOut: '18:05', status: '정상' },
        { date: '2023-10-03', checkIn: '09:15', checkOut: '18:20', status: '지각' },
    ])
    // 위치 관련 상태 추가
    const [userLocation, setUserLocation] = useState(null)
    const [locationStatus, setLocationStatus] = useState('')
    const [isLocationValid, setIsLocationValid] = useState(false)

    // 허용된 위치 좌표 (예: 회사 위치)
    const ALLOWED_LOCATION = {
        // latitude: 37.708305, // 와석순환로 15 좌표
        // longitude: 126.756299,
        // radius: 100 // 미터 단위의 허용 반경
        latitude: 37.520574, // 서울시청 좌표
        longitude: 127.021637,
        radius: 50 // 미터 단위의 허용 반경
    }

    // 현재 시간 업데이트ㄴ
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // 상태 메시지 자동 제거
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage('')
                setMessageType('')
            }, 5000)
            
            return () => clearTimeout(timer)
        }
    }, [statusMessage])

    // 위치 정보 가져오기
    useEffect(() => {
        if (navigator.geolocation) {
            setLocationStatus('위치 정보를 가져오는 중...')
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                    
                    // 위치가 유효한지 확인
                    const isValid = checkLocationValidity(
                        position.coords.latitude,
                        position.coords.longitude
                    )
                    
                    setIsLocationValid(isValid)
                    setLocationStatus(isValid ? '인증된 위치' : '인증되지 않은 위치')
                },
                (error) => {
                    console.error('위치 정보 가져오기 오류:', error)
                    setLocationStatus('위치 정보를 가져올 수 없습니다')
                    setIsLocationValid(false)
                },
                { enableHighAccuracy: true }
            )
        } else {
            setLocationStatus('브라우저가 위치 정보를 지원하지 않습니다')
            setIsLocationValid(false)
        }
    }, [])

    // 두 지점 사이의 거리 계산 (Haversine 공식)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3 // 지구 반지름 (미터)
        const φ1 = lat1 * Math.PI / 180
        const φ2 = lat2 * Math.PI / 180
        const Δφ = (lat2 - lat1) * Math.PI / 180
        const Δλ = (lon2 - lon1) * Math.PI / 180

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return distance // 미터 단위
    }

    // 위치 유효성 검사
    const checkLocationValidity = (latitude, longitude) => {
        const distance = calculateDistance(
            latitude,
            longitude,
            ALLOWED_LOCATION.latitude,
            ALLOWED_LOCATION.longitude
        )
        
        return distance <= ALLOWED_LOCATION.radius
    }

    // 위치 정보 새로고침
    const refreshLocation = () => {
        if (navigator.geolocation) {
            setLocationStatus('위치 정보를 가져오는 중...')
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                    
                    // 위치가 유효한지 확인
                    const isValid = checkLocationValidity(
                        position.coords.latitude,
                        position.coords.longitude
                    )
                    
                    setIsLocationValid(isValid)
                    setLocationStatus(isValid ? '인증된 위치' : '인증되지 않은 위치')
                },
                (error) => {
                    console.error('위치 정보 가져오기 오류:', error)
                    setLocationStatus('위치 정보를 가져올 수 없습니다')
                    setIsLocationValid(false)
                },
                { enableHighAccuracy: true }
            )
        }
    }

    // 출근 체크인 함수
    const handleCheckIn = () => {
        // 위치 유효성 검사
        if (!isLocationValid) {
            setStatusMessage('인증된 위치에서만 출근 체크가 가능합니다')
            setMessageType('error')
            return
        }

        const now = new Date()
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        
        // 9시 이후면 지각
        const isLate = now.getHours() >= 9 && now.getMinutes() > 0
        
        setAttendanceStatus('출근')
        
        // 로컬 스토리지에 출근 시간 저장
        localStorage.setItem('checkInTime', formattedTime)
        localStorage.setItem('checkInDate', now.toISOString().split('T')[0])
        
        // 위치 정보도 저장
        if (userLocation) {
            localStorage.setItem('checkInLocation', JSON.stringify(userLocation))
        }
        
        // 상태 메시지 설정
        setStatusMessage(`출근 완료: ${formattedTime} (${isLate ? '지각' : '정시'})`)
        setMessageType('success')
    }

    // 퇴근 체크아웃 함수
    const handleCheckOut = () => {
        // 위치 유효성 검사
        if (!isLocationValid) {
            setStatusMessage('인증된 위치에서만 퇴근 체크가 가능합니다')
            setMessageType('error')
            return
        }

        const now = new Date()
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const checkInTime = localStorage.getItem('checkInTime')
        const checkInDate = localStorage.getItem('checkInDate')
        
        if (!checkInTime || !checkInDate) {
            setStatusMessage('출근 기록이 없습니다')
            setMessageType('error')
            return
        }
        
        // 출근 시간 기준으로 지각 여부 확인
        const isLate = checkInTime > '09:00'
        
        // 새로운 출퇴근 기록 추가
        const newRecord = {
            date: checkInDate,
            checkIn: checkInTime,
            checkOut: formattedTime,
            status: isLate ? '지각' : '정상'
        }
        
        setAttendanceHistory([newRecord, ...attendanceHistory])
        setAttendanceStatus('퇴근')
        
        // 로컬 스토리지 초기화
        localStorage.removeItem('checkInTime')
        localStorage.removeItem('checkInDate')
        localStorage.removeItem('checkInLocation')
        
        // 상태 메시지 설정
        setStatusMessage(`퇴근 완료: ${formattedTime}`)
        setMessageType('success')
    }

    // 모달 열기 함수
    const openModal = () => {
        setShowModal(true)
    }

    // 모달 닫기 함수
    const closeModal = () => {
        setShowModal(false)
    }

    // 날짜 포맷팅 함수
    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        return date.toLocaleDateString('en-US', options)
    }

    // 시간 포맷팅 함수
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    }

    // 간단한 날짜 포맷팅 (Home 페이지 스타일)
    const formattedDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        weekday: 'long' 
    })
    
    // 간단한 시간 포맷팅 (Home 페이지 스타일)
    const formattedTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    })

    return (
        <div className={ss.attendance_wrap}>
            {/* 출근 인증 헤더 */}
            <div className={ss.attendance_header}>
                <div>
                    <h1 className={ss.attendance_title}>Attendance</h1>
                </div>
                
                {/* 출근 기록 버튼 */}
                <button 
                    className={`${ss.attendance_btn} ${ss.record_btn}`} 
                    onClick={openModal}
                >
                    <FaRegListAlt />
                    Attendance Records
                </button>
            </div>
            
            {/* 중앙 상태 표시 및 버튼 */}
            <div className={ss.attendance_center}>
                <div className={ss.status_card}>
                    <div className={ss.status_icon}>
                        <FaUserClock />
                    </div>
                    <div className={ss.status_time}>
                        <div className={ss.current_date}>{formatDate(currentTime)}</div>
                        <div className={ss.current_time}>{formatTime(currentTime)}</div>
                    </div>
                    <div className={ss.status_display}>
                        <div className={`${ss.status_badge} ${
                            attendanceStatus === '미출근' ? ss.status_not_checked :
                            attendanceStatus === '출근' ? ss.status_checked_in :
                            ss.status_checked_out
                        }`}>
                            {attendanceStatus === '미출근' ? 'Not Checked In' : 
                             attendanceStatus === '출근' ? 'Checked In' : 'Checked Out'}
                        </div>
                    </div>
                    
                    {/* 위치 상태 표시 */}
                    <div className={ss.location_status}>
                        <div className={ss.location_icon}>
                            <FaMapMarkerAlt />
                        </div>
                        <div className={`${ss.location_text} ${isLocationValid ? ss.location_valid : ss.location_invalid}`}>
                            {locationStatus}
                        </div>
                        <button 
                            className={ss.refresh_location_btn}
                            onClick={refreshLocation}
                            title="위치 새로고침"
                        >
                            새로고침
                        </button>
                    </div>
                    
                    <div className={ss.attendance_action}>
                        {attendanceStatus !== '출근' ? (
                            <button 
                                className={ss.check_in_button} 
                                onClick={handleCheckIn}
                                disabled={attendanceStatus === '출근' || !isLocationValid}
                            >
                                Check In
                            </button>
                        ) : (
                            <button 
                                className={ss.check_out_button} 
                                onClick={handleCheckOut}
                                disabled={!isLocationValid}
                            >
                                Check Out
                            </button>
                        )}
                    </div>
                    
                    {/* 상태 메시지 표시 */}
                    {statusMessage && (
                        <div className={`${ss.status_message} ${ss[messageType]}`}>
                            {statusMessage}
                        </div>
                    )}
                </div>
            </div>
            
            {/* 출근 기록 모달 */}
            {showModal && (
                <AttendanceModal 
                    onClose={closeModal} 
                    attendanceHistory={attendanceHistory} 
                />
            )}
        </div>
    )
}

export default Attendance 