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

    // 회사 위치 정보 상태
    const [companyLocation, setCompanyLocation] = useState({
        latitude: null,
        longitude: null,
        name: '',
        address: '',
        hasLocation: false,
        radius: 100 // 미터 단위의 허용 반경
    })

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

    // 회사 위치 정보 불러오기
    const loadCompanyLocation = async () => {
        try {
            const response = await api.get('/company/location')
            const locationData = response.data
            
            setCompanyLocation({
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                name: locationData.name,
                address: locationData.address,
                hasLocation: locationData.hasLocation,
                radius: 100 // 기본 반경 100미터
            })
            
            console.log('회사 위치 정보 로드:', locationData)
        } catch (error) {
            console.error('회사 위치 정보 로드 실패:', error)
            // 기본값으로 설정 (서울시청)
            setCompanyLocation({
                latitude: 37.520574,
                longitude: 127.021637,
                name: 'AEDIA STUDIO',
                address: '서울시청 (기본값)',
                hasLocation: false,
                radius: 100
            })
        }
    }

    // 컴포넌트 마운트 시 회사 위치 정보 로드
    useEffect(() => {
        loadCompanyLocation()
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
        // 회사 위치 정보가 로드된 후에만 위치 검증 실행
        if (companyLocation.latitude === null) {
            return
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude
                    const userLng = position.coords.longitude
                    
                    setUserLocation({
                        latitude: userLat,
                        longitude: userLng
                    })
                    
                    // 위치가 유효한지 확인
                    const isValid = checkLocationValidity(userLat, userLng)
                    
                    setIsLocationValid(isValid)
                    
                    if (isValid) {
                        if (companyLocation.hasLocation) {
                            const distance = calculateDistance(
                                userLat, userLng,
                                companyLocation.latitude, companyLocation.longitude
                            )
                            setLocationStatus(`인증된 위치 (${companyLocation.name} 반경 ${Math.round(distance)}m)`)
                        } else {
                            setLocationStatus('위치 인증됨 (회사 위치 미설정)')
                        }
                    } else {
                        const distance = calculateDistance(
                            userLat, userLng,
                            companyLocation.latitude, companyLocation.longitude
                        )
                        setLocationStatus(`위치 인증 실패 (${companyLocation.name}에서 ${Math.round(distance)}m 떨어져 있음)`)
                    }
                },
                (error) => {
                    console.error('위치 정보 가져오기 오류:', error)
                    setLocationStatus('위치 정보를 가져올 수 없습니다')
                    setIsLocationValid(false)
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            )
        } else {
            setLocationStatus('위치 정보를 지원하지 않는 브라우저입니다')
            setIsLocationValid(false)
        }
    }, [companyLocation])

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
        // 회사 위치 정보가 설정되어 있지 않으면 모든 위치 허용
        if (!companyLocation.hasLocation || !companyLocation.latitude || !companyLocation.longitude) {
            console.log('회사 위치 정보가 없어 위치 검증을 우회합니다.')
            return true
        }

        const distance = calculateDistance(
            latitude,
            longitude,
            companyLocation.latitude,
            companyLocation.longitude
        )
        
        const isValid = distance <= companyLocation.radius
        console.log(`위치 검증: 거리 ${Math.round(distance)}m, 허용반경 ${companyLocation.radius}m, 유효성 ${isValid}`)
        
        return isValid
    }

    // 위치 정보 새로고침
    const refreshLocation = () => {
        setLocationStatus('위치 정보 새로고침 중...')
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude
                    const userLng = position.coords.longitude
                    
                    setUserLocation({
                        latitude: userLat,
                        longitude: userLng
                    })
                    
                    // 위치가 유효한지 확인
                    const isValid = checkLocationValidity(userLat, userLng)
                    
                    setIsLocationValid(isValid)
                    
                    if (isValid) {
                        if (companyLocation.hasLocation) {
                            const distance = calculateDistance(
                                userLat, userLng,
                                companyLocation.latitude, companyLocation.longitude
                            )
                            setLocationStatus(`위치 새로고침 완료 (${companyLocation.name} 반경 ${Math.round(distance)}m)`)
                        } else {
                            setLocationStatus('위치 새로고침 완료 (회사 위치 미설정)')
                        }
                    } else {
                        const distance = calculateDistance(
                            userLat, userLng,
                            companyLocation.latitude, companyLocation.longitude
                        )
                        setLocationStatus(`위치 인증 실패 (${companyLocation.name}에서 ${Math.round(distance)}m 떨어져 있음)`)
                    }
                },
                (error) => {
                    console.error('위치 정보 가져오기 오류:', error)
                    setLocationStatus('위치 정보 새로고침 실패')
                    setIsLocationValid(false)
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            )
        } else {
            setLocationStatus('위치 정보를 지원하지 않는 브라우저입니다')
            setIsLocationValid(false)
        }
    }

    // 출근 체크인 함수
    const handleCheckIn = async () => {
        // 위치 검증 (회사 위치가 설정된 경우만)
        if (companyLocation.hasLocation && !isLocationValid) {
            setStatusMessage(`인증된 위치에서만 출근 체크가 가능합니다 (${companyLocation.name} 반경 ${companyLocation.radius}m 이내)`)
            setMessageType('error')
            return
        }

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

        // 위치 검증 (회사 위치가 설정된 경우만)
        if (companyLocation.hasLocation && !isLocationValid) {
            setStatusMessage(`인증된 위치에서만 퇴근 체크가 가능합니다 (${companyLocation.name} 반경 ${companyLocation.radius}m 이내)`)
            setMessageType('error')
            return
        }

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

        // === 논리적 유효성 검사 시작 ===
        
        // 1. 현재 편집 중인 기록 찾기
        const currentRecord = todayRecords.find(record => record._id === editMode.recordId)
        if (!currentRecord) {
            setStatusMessage('편집할 기록을 찾을 수 없습니다')
            setMessageType('error')
            return
        }

        // 2. 오늘 기록들을 시간순으로 정렬 (편집 중인 기록 제외)
        const otherRecords = todayRecords
            .filter(record => record._id !== editMode.recordId)
            .sort((a, b) => new Date(a.time) - new Date(b.time))

        // 3. 새로운 시간으로 전체 기록 목록 생성
        const allRecordsWithEdit = [...otherRecords, { ...currentRecord, time: datetime }]
            .sort((a, b) => new Date(a.time) - new Date(b.time))

        // 4. 출근/퇴근 기록 분리
        const checkInRecords = allRecordsWithEdit.filter(r => r.type === 'checkIn')
        const checkOutRecords = allRecordsWithEdit.filter(r => r.type === 'checkOut')

        // 5. 기본 유효성 검사
        
        // 5-1. 시간 충돌 검사 (같은 시간에 다른 기록이 있는지)
        const timeConflict = otherRecords.find(record => {
            const recordTime = new Date(record.time)
            return Math.abs(datetime - recordTime) < 60000 // 1분 이내 차이
        })
        
        if (timeConflict) {
            const conflictTime = new Date(timeConflict.time).toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
            setStatusMessage(`${conflictTime}에 이미 다른 기록이 있습니다`)
            setMessageType('error')
            return
        }

        // 5-2. 연속된 같은 타입 기록 검사 (출근-출근 또는 퇴근-퇴근)
        let hasConsecutiveSameType = false
        let consecutiveMessage = ''
        
        for (let i = 0; i < allRecordsWithEdit.length - 1; i++) {
            const current = allRecordsWithEdit[i]
            const next = allRecordsWithEdit[i + 1]
            
            if (current.type === next.type) {
                const currentTime = new Date(current.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                const nextTime = new Date(next.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                const typeText = current.type === 'checkIn' ? '출근' : '퇴근'
                hasConsecutiveSameType = true
                consecutiveMessage = `${currentTime}과 ${nextTime}에 연속된 ${typeText} 기록이 있습니다`
                break
            }
        }

        if (hasConsecutiveSameType) {
            if (!window.confirm(`⚠️ 연속된 같은 기록 타입\n\n${consecutiveMessage}\n\n이로 인해 work hours 계산이 부정확할 수 있습니다.\n\n계속 진행하시겠습니까?`)) {
                return
            }
        }

        // 5-3. 페어링 후 시간 역순 검사 (출근 > 퇴근)
        let hasInvalidPairing = false
        let invalidPairingMessage = ''
        
        for (let i = 0; i < Math.min(checkInRecords.length, checkOutRecords.length); i++) {
            const checkInTime = new Date(checkInRecords[i].time)
            const checkOutTime = new Date(checkOutRecords[i].time)
            
            if (checkInTime >= checkOutTime) {
                const checkInStr = checkInTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                const checkOutStr = checkOutTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                hasInvalidPairing = true
                invalidPairingMessage = `출근 시간(${checkInStr})이 퇴근 시간(${checkOutStr})보다 늦습니다`
                break
            }
        }

        if (hasInvalidPairing) {
            if (!window.confirm(`⚠️ 시간 순서 오류\n\n${invalidPairingMessage}\n\n계속 진행하시겠습니까?`)) {
                return
            }
        }

        // 5-4. 너무 긴 근무시간 경고 (12시간 이상)
        let totalWorkMinutes = 0
        for (let i = 0; i < Math.min(checkInRecords.length, checkOutRecords.length); i++) {
            const checkInTime = new Date(checkInRecords[i].time)
            const checkOutTime = new Date(checkOutRecords[i].time)
            if (checkOutTime > checkInTime) {
                totalWorkMinutes += Math.floor((checkOutTime - checkInTime) / (1000 * 60))
            }
        }

        if (totalWorkMinutes > 12 * 60) { // 12시간 = 720분
            const hours = Math.floor(totalWorkMinutes / 60)
            const minutes = totalWorkMinutes % 60
            if (!window.confirm(`⚠️ 긴 근무시간 경고\n\n총 근무시간이 ${hours}시간 ${minutes}분입니다.\n\n계속 진행하시겠습니까?`)) {
                return
            }
        }

        // 5-5. 미래 시간 편집 경고
        const now = new Date()
        if (datetime > now) {
            if (!window.confirm(`⚠️ 미래 시간 편집\n\n현재 시간보다 늦은 시간으로 편집하고 있습니다.\n\n계속 진행하시겠습니까?`)) {
                return
            }
        }

        // 5-6. 불완전한 사이클 경고
        if (checkInRecords.length !== checkOutRecords.length) {
            const difference = Math.abs(checkInRecords.length - checkOutRecords.length)
            const moreType = checkInRecords.length > checkOutRecords.length ? '출근' : '퇴근'
            if (!window.confirm(`⚠️ 불완전한 출퇴근 사이클\n\n${moreType} 기록이 ${difference}개 더 많습니다.\n일부 기록이 근무시간 계산에서 제외될 수 있습니다.\n\n계속 진행하시겠습니까?`)) {
                return
            }
        }

        // === 유효성 검사 완료 ===

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