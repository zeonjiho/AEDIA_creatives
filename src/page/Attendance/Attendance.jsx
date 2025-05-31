import React, { useState, useEffect } from 'react'
import ss from './Attendance.module.css'
import { FaCalendarCheck, FaUserClock, FaHistory, FaCheckCircle, FaRegListAlt, FaMapMarkerAlt, FaEdit, FaTrash, FaPlus } from 'react-icons/fa'
import AttendanceModal from './AttendanceModal'
import api from '../../utils/api'
import { jwtDecode } from 'jwt-decode'

const Attendance = () => {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [attendanceStatus, setAttendanceStatus] = useState('미출근')
    const [showModal, setShowModal] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' 또는 'error'
    const [attendanceHistory, setAttendanceHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [todayRecord, setTodayRecord] = useState(null)
    const [todayRecords, setTodayRecords] = useState([])

    const [userId, setUserId] = useState(null)
    
    // 위치 관련 상태 추가
    const [userLocation, setUserLocation] = useState(null)
    const [locationStatus, setLocationStatus] = useState('')
    const [isLocationValid, setIsLocationValid] = useState(false)
    const [canCheckIn, setCanCheckIn] = useState(true)
    const [canCheckOut, setCanCheckOut] = useState(false)

    // 수정 모드 상태
    const [editMode, setEditMode] = useState({ active: false, recordId: null })
    const [editTime, setEditTime] = useState('')

    // 허용된 위치 좌표 (예: 회사 위치)
    const ALLOWED_LOCATION = {
        latitude: 37.520574, // 서울시청 좌표
        longitude: 127.021637,
        radius: 50 // 미터 단위의 허용 반경
    }

    // 현재 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // 컴포넌트 마운트 시 오늘 출석 상태 및 히스토리 로드
    useEffect(() => {
        if (userId) {
            loadTodayAttendance()
            loadAttendanceHistory()
        }
    }, [userId])

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            return
        }
        setUserId(jwtDecode(localStorage.getItem('token')).userId)
    }, [])

    // 오늘 출석 상태 로드
    const loadTodayAttendance = async () => {
        try {
            const response = await api.get(`/attendance/today?userId=${userId}`)
            const data = response.data
            
            setAttendanceStatus(data.status)
            setCanCheckIn(data.canCheckIn)
            setCanCheckOut(data.canCheckOut)
            setTodayRecord(data.attendanceRecord)
            setTodayRecords(data.records || [])
            
        } catch (error) {
            console.error('오늘 출석 상태 로드 실패:', error)
        }
    }

    // 출석 기록 로드
    const loadAttendanceHistory = async () => {
        try {
            const response = await api.get(`/attendance/history?userId=${userId}&limit=10`)
            setAttendanceHistory(response.data)
        } catch (error) {
            console.error('출석 기록 로드 실패:', error)
        }
    }

    // 상태 메시지 자동 제거
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => {
                setStatusMessage('')
                setMessageType('')
            }, 3000) // 3초로 단축
            
            return () => clearTimeout(timer)
        }
    }, [statusMessage])

    // 위치 정보 가져오기
    useEffect(() => {
        // 개발 단계에서는 위치 검증을 우회
        setIsLocationValid(true)
        setLocationStatus('개발 모드 - 위치 검증 우회')
        
        if (navigator.geolocation) {
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
                    
                    setIsLocationValid(true) // 개발 단계에서는 항상 true
                    setLocationStatus('인증된 위치 (개발 모드)')
                },
                (error) => {
                    console.error('위치 정보 가져오기 오류:', error)
                    setLocationStatus('위치 정보 없음 (개발 모드)')
                    setIsLocationValid(true) // 개발 단계에서는 오류가 있어도 true
                },
                { enableHighAccuracy: true }
            )
        } else {
            setLocationStatus('위치 정보 지원 안함 (개발 모드)')
            setIsLocationValid(true) // 개발 단계에서는 지원하지 않아도 true
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
        
        // return distance <= ALLOWED_LOCATION.radius
        // 개발 단계에서 임시로 모든 위치를 허용함
        return true
    }

    // 위치 정보 새로고침
    const refreshLocation = () => {
        // 개발 단계에서는 위치 검증을 우회
        setIsLocationValid(true)
        setLocationStatus('위치 새로고침됨 (개발 모드)')
        
        if (navigator.geolocation) {
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
                    
                    setIsLocationValid(true) // 개발 단계에서는 항상 true
                    setLocationStatus('인증된 위치 (개발 모드)')
                },
                (error) => {
                    console.error('위치 정보 가져오기 오류:', error)
                    setLocationStatus('위치 정보 없음 (개발 모드)')
                    setIsLocationValid(true) // 개발 단계에서는 오류가 있어도 true
                },
                { enableHighAccuracy: true }
            )
        }
    }

    // 출근 체크인 함수
    const handleCheckIn = async () => {
        setLoading(true)
        
        try {
            const response = await api.post(`/attendance/check-in?userId=${userId}`, {
                location: userLocation || { latitude: 0, longitude: 0 },
                method: 'manual'
            })
            
            const data = response.data
            setStatusMessage(`${data.message} (${data.status})`)
            setMessageType('success')
            
            // 상태를 즉시 업데이트하기 위해 await 사용
            await loadTodayAttendance()
            await loadAttendanceHistory()
            
        } catch (error) {
            console.error('출근 처리 실패:', error)
            setStatusMessage(error.response?.data?.message || '출근 처리 중 오류가 발생했습니다')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    // 퇴근 체크아웃 함수
    const handleCheckOut = async () => {
        if (!window.confirm('퇴근 처리하시겠습니까?')) {
            return
        }

        // 개발 단계에서는 위치 검증 우회
        // if (!isLocationValid) {
        //     setStatusMessage('인증된 위치에서만 퇴근 체크가 가능합니다')
        //     setMessageType('error')
        //     return
        // }

        if (!canCheckOut) {
            setStatusMessage('출근 기록이 없거나 이미 퇴근 처리되었습니다')
            setMessageType('error')
            return
        }

        setLoading(true)
        
        try {
            const response = await api.post(`/attendance/check-out?userId=${userId}`, {
                location: userLocation || { latitude: 0, longitude: 0 },
                method: 'manual'
            })
            
            const data = response.data
            setStatusMessage(`${data.message} (근무시간: ${data.workHoursFormatted})`)
            setMessageType('success')
            
            // 상태를 즉시 업데이트하기 위해 await 사용
            await loadTodayAttendance()
            await loadAttendanceHistory()
            
        } catch (error) {
            console.error('퇴근 처리 실패:', error)
            setStatusMessage(error.response?.data?.message || '퇴근 처리 중 오류가 발생했습니다')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    // 출퇴근 시간 수정
    const handleEditTime = async () => {
        if (!editTime) {
            setStatusMessage('수정할 시간을 입력해주세요')
            setMessageType('error')
            return
        }

        const today = new Date()
        const [hours, minutes] = editTime.split(':')
        
        // 로컬 시간대로 날짜 객체 생성 (한국 시간 적용)
        const datetime = new Date(
            today.getFullYear(), 
            today.getMonth(), 
            today.getDate(), 
            parseInt(hours), 
            parseInt(minutes), 
            0, 
            0
        )

        setLoading(true)
        
        try {
            const response = await api.patch(`/attendance/update/${userId}`, {
                recordId: editMode.recordId,
                time: datetime.toISOString()
            })
            
            setStatusMessage('출석 기록이 수정되었습니다')
            setMessageType('success')
            setEditMode({ active: false, recordId: null })
            setEditTime('')
            
            // 상태를 즉시 업데이트하기 위해 await 사용
            await loadTodayAttendance()
            await loadAttendanceHistory()
            
        } catch (error) {
            console.error('출석 기록 수정 실패:', error)
            setStatusMessage(error.response?.data?.message || '출석 기록 수정 중 오류가 발생했습니다')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    // 출퇴근 기록 삭제
    const handleDeleteRecord = async (recordId) => {
        if (!window.confirm('이 기록을 삭제하시겠습니까?')) {
            return
        }

        setLoading(true)
        
        try {
            await api.delete(`/attendance/delete/${userId}`, {
                data: {
                    recordId: recordId
                }
            })
            
            setStatusMessage('출석 기록이 삭제되었습니다')
            setMessageType('success')
            
            // 상태를 즉시 업데이트하기 위해 await 사용
            await loadTodayAttendance()
            await loadAttendanceHistory()
            
        } catch (error) {
            console.error('출석 기록 삭제 실패:', error)
            setStatusMessage(error.response?.data?.message || '출석 기록 삭제 중 오류가 발생했습니다')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
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
            <header className={ss.dashboard_header}>
                <div className={ss.header_content}>
                    <h1 className={ss.dashboard_title}>Attendance</h1>
                    <p className={ss.dashboard_date}>
                        {formattedDate} {formattedTime}
                    </p>
                </div>
                
                <div className={ss.header_controls}>
                    <button 
                        className={`${ss.customize_btn} ${ss.save_btn}`} 
                        onClick={openModal}
                    >
                        <FaRegListAlt />
                        Attendance Records
                    </button>
                </div>
            </header>
            
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
                        {editMode.active ? (
                            <div className={ss.edit_mode}>
                                <h4>시간 수정</h4>
                                <input 
                                    type="time" 
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    className={ss.time_input}
                                />
                                <div className={ss.edit_buttons}>
                                    <button 
                                        className={ss.save_button}
                                        onClick={handleEditTime}
                                        disabled={loading}
                                    >
                                        저장
                                    </button>
                                    <button 
                                        className={ss.cancel_button}
                                        onClick={() => {
                                            setEditMode({ active: false, recordId: null })
                                            setEditTime('')
                                        }}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={ss.attendance_buttons}>
                                <button 
                                    className={canCheckOut ? ss.check_out_button : ss.check_in_button} 
                                    onClick={canCheckOut ? handleCheckOut : handleCheckIn}
                                    disabled={loading}
                                >
                                    {loading ? '처리 중...' : canCheckOut ? 'Check Out' : 'Check In'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 오늘 출퇴근 기록 표시 및 수정/삭제 버튼 */}
                    {todayRecords && todayRecords.length > 0 && (
                        <div className={ss.today_record}>
                            <h4>오늘의 기록</h4>
                            
                            {todayRecords.map((record, index) => (
                                <div key={index} className={ss.record_item}>
                                    <div className={ss.record_info}>
                                        <span className={ss.record_label}>
                                            {record.type === 'checkIn' ? '출근:' : '퇴근:'}
                                        </span>
                                        <span className={ss.record_time}>
                                            {new Date(record.time).toLocaleTimeString('ko-KR', { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </span>
                                    </div>
                                    <div className={ss.record_actions}>
                                        <button 
                                            className={ss.edit_btn}
                                            onClick={() => {
                                                const time = new Date(record.time)
                                                const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
                                                setEditMode({ active: true, recordId: record._id })
                                                setEditTime(timeString)
                                            }}
                                            title="시간 수정"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            className={ss.delete_btn}
                                            onClick={() => handleDeleteRecord(record._id)}
                                            title="기록 삭제"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
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