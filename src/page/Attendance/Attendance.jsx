import React, { useState, useEffect } from 'react'
import ss from './Attendance.module.css'
import { FaCalendarCheck, FaUserClock, FaHistory, FaCheckCircle, FaRegListAlt, FaMapMarkerAlt, FaEdit, FaTrash, FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa'
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
    
    // 상세 위치 정보 상태 추가
    const [locationDetails, setLocationDetails] = useState({
        distance: null,
        companyName: '',
        showDetails: false
    })

    // 수정 모드 상태
    const [editMode, setEditMode] = useState({ active: false, recordId: null })
    const [editTime, setEditTime] = useState('')
    const [editReason, setEditReason] = useState('')

    // 외부 위치 체크인/아웃 모달 상태 추가
    const [showOffSiteModal, setShowOffSiteModal] = useState(false)
    const [offSiteReason, setOffSiteReason] = useState('')
    const [offSiteDistance, setOffSiteDistance] = useState(0)
    const [pendingLocation, setPendingLocation] = useState(null)
    const [offSiteMode, setOffSiteMode] = useState('') // 'checkin' 또는 'checkout'

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
            console.log('🏢 회사 위치 정보 요청 중...')
            const response = await api.get('/company/location')
            const locationData = response.data
            
            console.log('🏢 서버에서 받은 회사 위치 데이터:', {
                hasLocation: locationData.hasLocation,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                name: locationData.name,
                address: locationData.address,
                radius: locationData.radius
            })
            
            const newCompanyLocation = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                name: locationData.name,
                address: locationData.address,
                hasLocation: locationData.hasLocation,
                radius: locationData.radius || 100 // 기본 반경 100미터
            }
            
            setCompanyLocation(newCompanyLocation)
            
            console.log('🏢 설정된 회사 위치 정보:', newCompanyLocation)
            return newCompanyLocation
        } catch (error) {
            console.error('❌ 회사 위치 정보 로드 실패:', error)
            // 기본값으로 설정 (서울시청)
            const defaultLocation = {
                latitude: 37.520574,
                longitude: 127.021637,
                name: 'AEDIA STUDIO',
                address: '서울시청 (기본값)',
                hasLocation: false,
                radius: 100
            }
            console.log('🏢 기본 위치로 설정:', defaultLocation)
            setCompanyLocation(defaultLocation)
            return defaultLocation
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

    // 위치 정보 가져오기 (초기 로드 시만 - 참고용)
    useEffect(() => {
        // 회사 위치 정보가 로드된 후에만 위치 검증 실행
        if (companyLocation.latitude === null) {
            return
        }

        const loadInitialLocation = async () => {
            setLocationStatus('위치 정보 로드 중...')
            
            try {
                const currentLocation = await getCurrentLocationAsync()
                
                setUserLocation(currentLocation)
                
                // 위치가 유효한지 확인
                const isValid = checkLocationValidity(currentLocation.latitude, currentLocation.longitude)
                
                setIsLocationValid(isValid)
                
                // 거리 계산 및 상세 정보 저장
                if (companyLocation.hasLocation) {
                    const distance = calculateDistance(
                        currentLocation.latitude, currentLocation.longitude,
                        companyLocation.latitude, companyLocation.longitude
                    )
                    setLocationDetails({
                        distance: Math.round(distance),
                        companyName: companyLocation.name,
                        showDetails: true
                    })
                } else {
                    setLocationDetails({
                        distance: null,
                        companyName: '',
                        showDetails: false
                    })
                }
                
                // 간단한 상태 메시지만 표시
                if (isValid) {
                    setLocationStatus('위치 활성화')
                } else {
                    setLocationStatus('위치 비활성화')
                }
            } catch (error) {
                console.error('위치 정보 가져오기 오류:', error)
                setLocationStatus('위치 정보 없음')
                setIsLocationValid(false)
                setLocationDetails({
                    distance: null,
                    companyName: '',
                    showDetails: false
                })
            }
        }

        loadInitialLocation()
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

    // 실시간 위치 정보 가져오기 (Promise 기반)
    const getCurrentLocationAsync = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('LOCATION_ERROR'))
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                },
                (error) => {
                    console.error('위치 정보 가져오기 오류:', error)
                    reject(new Error('LOCATION_ERROR'))
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 15000, 
                    maximumAge: 0 // 캐시된 위치 정보 사용 안함 (항상 새로운 위치 정보 요청)
                }
            )
        })
    }

    // 위치 유효성 검사
    const checkLocationValidity = (latitude, longitude, companyLocationData = companyLocation) => {
        console.log('📍 위치 검증 시작:', {
            사용자위치: { latitude, longitude },
            회사위치: {
                latitude: companyLocationData.latitude,
                longitude: companyLocationData.longitude,
                hasLocation: companyLocationData.hasLocation,
                radius: companyLocationData.radius
            }
        })
        
        // 회사 위치 정보가 설정되어 있지 않으면 모든 위치 허용
        if (!companyLocationData.hasLocation || !companyLocationData.latitude || !companyLocationData.longitude) {
            console.log('📍 ⚠️ 회사 위치 정보가 없어 위치 검증을 우회합니다. (모든 위치 허용)')
            console.log('📍 ⚠️ 이 경우 외부 위치 모달이 나타나지 않습니다!')
            return true
        }

        const distance = calculateDistance(
            latitude,
            longitude,
            companyLocationData.latitude,
            companyLocationData.longitude
        )
        
        const isValid = distance <= companyLocationData.radius
        console.log(`📍 위치 검증 결과: 거리 ${Math.round(distance)}m, 허용반경 ${companyLocationData.radius}m, 유효성 ${isValid}`)
        
        if (!isValid) {
            console.log('📍 ✅ 외부 위치 감지! 외부 위치 모달이 표시되어야 합니다.')
            console.log('📍 ✅ 모달 표시 후 사유 입력하고 확인을 눌러야 외부 위치로 저장됩니다.')
        } else {
            console.log('📍 ❌ 회사 내부 위치로 판단됨. 외부 위치 모달이 나타나지 않습니다.')
        }
        
        return isValid
    }

    // 위치 정보 새로고침
    const refreshLocation = async () => {
        setLocationStatus('새로고침 중...')
        
        try {
            const currentLocation = await getCurrentLocationAsync()
            
            setUserLocation(currentLocation)
            
            // 위치가 유효한지 확인
            const isValid = checkLocationValidity(currentLocation.latitude, currentLocation.longitude)
            
            setIsLocationValid(isValid)
            
            // 거리 계산 및 상세 정보 저장
            if (companyLocation.hasLocation) {
                const distance = calculateDistance(
                    currentLocation.latitude, currentLocation.longitude,
                    companyLocation.latitude, companyLocation.longitude
                )
                setLocationDetails({
                    distance: Math.round(distance),
                    companyName: companyLocation.name,
                    showDetails: true
                })
            } else {
                setLocationDetails({
                    distance: null,
                    companyName: '',
                    showDetails: false
                })
            }
            
            // 간단한 상태 메시지만 표시
            if (isValid) {
                setLocationStatus('위치 활성화')
            } else {
                setLocationStatus('위치 비활성화')
            }
        } catch (error) {
            console.error('위치 정보 가져오기 오류:', error)
            setLocationStatus('위치 정보 없음')
            setIsLocationValid(false)
            setLocationDetails({
                distance: null,
                companyName: '',
                showDetails: false
            })
        }
    }

    // 출근 체크인 함수
    const handleCheckIn = async () => {
        console.log('🔵 체크인 시작:', { userId, canCheckIn })
        
        setLoading(true)
        setStatusMessage('회사 위치 정보 및 현재 위치 확인 중...')
        setMessageType('')

        try {
            // 1. 회사 위치 정보 먼저 로드
            console.log('🔵 회사 위치 정보 로드 중...')
            const currentCompanyLocation = await loadCompanyLocation()
            console.log('🔵 회사 위치 정보:', currentCompanyLocation)
            
            // 2. 체크인 시 실시간 위치 확인
            console.log('🔵 현재 위치 확인 중...')
            setStatusMessage('현재 위치 확인 중...')
            const currentLocation = await getCurrentLocationAsync()
            console.log('🔵 현재 위치:', currentLocation)
            
            // 3. 위치 검증 (회사 위치가 설정된 경우만)
            if (currentCompanyLocation.hasLocation) {
                console.log('🔵 위치 검증 중...')
                const isValid = checkLocationValidity(currentLocation.latitude, currentLocation.longitude, currentCompanyLocation)
                
                if (!isValid) {
                    // 위치가 유효하지 않은 경우 모달 표시
                    const distance = calculateDistance(
                        currentLocation.latitude, currentLocation.longitude,
                        currentCompanyLocation.latitude, currentCompanyLocation.longitude
                    )
                    console.log('❌ 체크인 위치 검증 실패:', { distance, isValid })
                    console.log('🔵 외부 위치 체크인 모달 표시 설정:', {
                        distance: Math.round(distance),
                        location: currentLocation,
                        mode: 'checkin'
                    })
                    
                    setOffSiteDistance(Math.round(distance))
                    setPendingLocation(currentLocation)
                    setOffSiteReason('')
                    setOffSiteMode('checkin')
                    setShowOffSiteModal(true)
                    setLoading(false)
                    setStatusMessage('')
                    return
                }
                console.log('✅ 위치 검증 성공')
            } else {
                console.log('🔵 회사 위치 설정이 없어 위치 검증 우회')
            }

            // 4. 위치 인증 성공 시 체크인 진행
            await performCheckIn(currentLocation)
            
        } catch (error) {
            console.error('❌ 출근 처리 실패:', error)
            console.log('❌ 에러 상세:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            
            if (error.message === 'LOCATION_ERROR') {
                setStatusMessage('위치 정보를 가져올 수 없습니다. GPS를 활성화하고 다시 시도해주세요.')
            } else if (error.response?.status === 400) {
                setStatusMessage(error.response?.data?.message || '잘못된 요청입니다.')
            } else if (error.response?.status === 500) {
                setStatusMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
            } else if (error.code === 'NETWORK_ERROR') {
                setStatusMessage('네트워크 연결을 확인해주세요.')
            } else {
                setStatusMessage(error.response?.data?.message || '출근 처리 중 오류가 발생했습니다')
            }
            setMessageType('error')
        } finally {
            setLoading(false)
            console.log('🔵 체크인 프로세스 종료')
        }
    }

    // 퇴근 체크아웃 함수
    const handleCheckOut = async () => {
        if (!window.confirm('퇴근 처리하시겠습니까?')) {
            return
        }

        if (!canCheckOut) {
            setStatusMessage('출근 기록이 없거나 이미 퇴근 처리되었습니다')
            setMessageType('error')
            return
        }

        setLoading(true)
        setStatusMessage('회사 위치 정보 및 현재 위치 확인 중...')
        setMessageType('')
        
        try {
            // 1. 회사 위치 정보 먼저 로드
            const currentCompanyLocation = await loadCompanyLocation()
            
            // 2. 체크아웃 시 실시간 위치 확인
            const currentLocation = await getCurrentLocationAsync()
            
            // 3. 위치 검증 (회사 위치가 설정된 경우만)
            if (currentCompanyLocation.hasLocation) {
                const isValid = checkLocationValidity(currentLocation.latitude, currentLocation.longitude, currentCompanyLocation)
                
                if (!isValid) {
                    // 위치가 유효하지 않은 경우 모달 표시
                    const distance = calculateDistance(
                        currentLocation.latitude, currentLocation.longitude,
                        currentCompanyLocation.latitude, currentCompanyLocation.longitude
                    )
                    
                    console.log('❌ 체크아웃 위치 검증 실패:', { distance, isValid })
                    console.log('🔴 외부 위치 체크아웃 모달 표시 설정:', {
                        distance: Math.round(distance),
                        location: currentLocation,
                        mode: 'checkout'
                    })
                    
                    setOffSiteDistance(Math.round(distance))
                    setPendingLocation(currentLocation)
                    setOffSiteReason('')
                    setOffSiteMode('checkout')
                    setShowOffSiteModal(true)
                    setLoading(false)
                    setStatusMessage('')
                    return
                }
            }

            // 4. 위치 인증 성공 시 체크아웃 진행
            await performCheckOut(currentLocation)
            
        } catch (error) {
            console.error('퇴근 처리 실패:', error)
            if (error.message === 'LOCATION_ERROR') {
                setStatusMessage('위치 정보를 가져올 수 없습니다. GPS를 활성화하고 다시 시도해주세요.')
            } else {
                setStatusMessage(error.response?.data?.message || '퇴근 처리 중 오류가 발생했습니다')
            }
            setMessageType('error')
            setLoading(false)
        }
    }

    // 실제 체크인 처리 함수
    const performCheckIn = async (location, isOffSite = false, reason = '') => {
        console.log('🔵 API 요청 시작...')
        setLoading(true)
        setStatusMessage('출근 처리 중...')
        
        try {
            const requestData = {
                location,
                method: 'manual',
                isOffSite,
                offSiteReason: reason
            }
            console.log('🔵 API 요청 데이터:', requestData)
            
            const response = await api.post(`/attendance/check-in?userId=${userId}`, requestData)
            console.log('✅ API 응답:', response.data)
            
            const data = response.data
            setStatusMessage(`${data.message} (${data.status})`)
            setMessageType('success')
            
            // 현재 위치 정보 업데이트
            setUserLocation(location)
            
            // 상태를 즉시 업데이트하기 위해 await 사용
            console.log('🔵 상태 업데이트 중...')
            await loadTodayAttendance()
            await loadAttendanceHistory()
            console.log('✅ 체크인 완료')
            
        } catch (error) {
            console.error('❌ 출근 처리 실패:', error)
            setStatusMessage(error.response?.data?.message || '출근 처리 중 오류가 발생했습니다')
            setMessageType('error')
        } finally {
            setLoading(false)
        }
    }

    // 실제 체크아웃 처리 함수
    const performCheckOut = async (location, isOffSite = false, reason = '') => {
        setLoading(true)
        setStatusMessage('퇴근 처리 중...')
        
        try {
            const response = await api.post(`/attendance/check-out?userId=${userId}`, {
                location,
                method: 'manual',
                isOffSite,
                offSiteReason: reason
            })
            
            const data = response.data
            setStatusMessage(`${data.message} (근무시간: ${data.workHoursFormatted})`)
            setMessageType('success')
            
            // 현재 위치 정보 업데이트
            setUserLocation(location)
            
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

    // 외부 위치 체크인/아웃 확인
    const handleOffSiteAction = async () => {
        console.log('🔵 외부 위치 액션 시작:', { offSiteMode, offSiteReason, pendingLocation })
        
        if (!offSiteReason.trim()) {
            setStatusMessage(`외부 위치 ${offSiteMode === 'checkin' ? '출근' : '퇴근'} 사유를 입력해주세요`)
            setMessageType('error')
            return
        }

        if (offSiteReason.trim().length < 10) {
            setStatusMessage('사유를 10자 이상 입력해주세요')
            setMessageType('error')
            return
        }

        console.log('🔵 외부 위치 모달 닫기')
        setShowOffSiteModal(false)
        
        console.log('🔵 외부 위치 체크인/체크아웃 시작:', { 
            mode: offSiteMode, 
            isOffSite: true, 
            reason: offSiteReason.trim(),
            location: pendingLocation 
        })
        
        if (offSiteMode === 'checkin') {
            await performCheckIn(pendingLocation, true, offSiteReason.trim())
        } else {
            await performCheckOut(pendingLocation, true, offSiteReason.trim())
        }
        
        console.log('🔵 외부 위치 체크인/체크아웃 완료')
        
        // 상태 초기화
        setPendingLocation(null)
        setOffSiteReason('')
        setOffSiteDistance(0)
        setOffSiteMode('')
    }

    // 외부 위치 모달 닫기
    const closeOffSiteModal = () => {
        setShowOffSiteModal(false)
        setPendingLocation(null)
        setOffSiteReason('')
        setOffSiteDistance(0)
        setOffSiteMode('')
        setLoading(false)
        setStatusMessage('')
    }

    // 출퇴근 시간 수정
    const handleEditTime = async () => {
        if (!editTime) {
            setStatusMessage('수정할 시간을 입력해주세요')
            setMessageType('error')
            return
        }

        if (!editReason.trim()) {
            setStatusMessage('수정 사유를 입력해주세요')
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
                time: datetime.toISOString(),
                reason: editReason.trim()
            })
            
            setStatusMessage('출석 기록이 수정되었습니다')
            setMessageType('success')
            setEditMode({ active: false, recordId: null })
            setEditTime('')
            setEditReason('')
            
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
            // API 요청 방식을 수정
            const response = await api.delete(`/attendance/record/${recordId}?userId=${userId}`)
            
            setStatusMessage('출석 기록이 삭제되었습니다')
            setMessageType('success')
            
            // 상태를 즉시 업데이트하기 위해 await 사용
            await loadTodayAttendance()
            await loadAttendanceHistory()
            
        } catch (error) {
            console.error('출석 기록 삭제 실패:', error)
            
            // 대안적인 API 호출 시도
            try {
                await api.delete(`/attendance/delete/${userId}`, {
                    data: {
                        recordId: recordId
                    }
                })
                
                setStatusMessage('출석 기록이 삭제되었습니다')
                setMessageType('success')
                
                await loadTodayAttendance()
                await loadAttendanceHistory()
                
            } catch (secondError) {
                console.error('대안 삭제 방식도 실패:', secondError)
                setStatusMessage(error.response?.data?.message || secondError.response?.data?.message || '출석 기록 삭제 중 오류가 발생했습니다')
                setMessageType('error')
            }
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
                    <h1 className={ss.attendance_title}>Attendance</h1>
                    {/* <p className={ss.dashboard_date}>
                        {formattedDate} {formattedTime}
                    </p> */}
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
                    
                    {/* 위치 상세 정보 표시 */}
                    {locationDetails.showDetails && (
                        <div className={ss.location_info_content}>
                            <span className={ss.location_info_text}>
                                {locationDetails.companyName}에서 {locationDetails.distance}m
                            </span>
                        </div>
                    )}
                    
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
                                <textarea
                                    placeholder="수정 사유를 입력하세요 (필수)"
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className={ss.time_input}
                                    style={{
                                        minHeight: '60px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                    required
                                />
                                <div className={ss.edit_buttons}>
                                    <button 
                                        className={ss.save_button}
                                        onClick={handleEditTime}
                                        disabled={loading || !editReason.trim()}
                                    >
                                        저장
                                    </button>
                                    <button 
                                        className={ss.cancel_button}
                                        onClick={() => {
                                            setEditMode({ active: false, recordId: null })
                                            setEditTime('')
                                            setEditReason('')
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
                                            setEditReason('')
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

            {/* 외부 위치 체크아웃 모달 */}
            {showOffSiteModal && (
                <div className={ss.modal_overlay} onClick={closeOffSiteModal}>
                    <div className={ss.offsite_modal} onClick={(e) => e.stopPropagation()}>
                        <div className={ss.offsite_modal_header}>
                            <div className={ss.warning_icon}>
                                <FaExclamationTriangle />
                            </div>
                            <h3>외부 위치에서 {offSiteMode === 'checkin' ? '출근' : '퇴근'}</h3>
                            <button className={ss.close_button} onClick={closeOffSiteModal}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className={ss.offsite_modal_body}>
                            <div className={ss.warning_message}>
                                <p className={ss.location_info}>
                                    현재 위치가 회사에서 <strong>{offSiteDistance}m</strong> 떨어져 있습니다.
                                </p>
                                
                                                                 <div className={ss.penalty_warning}>
                                     <h4>⚠️ 중요 안내사항</h4>
                                     <ul>
                                         <li>외부 위치에서의 {offSiteMode === 'checkin' ? '출근' : '퇴근'}은 근태 관리 정책에 따라 <strong>불이익을 받을 수 있습니다</strong></li>
                                         <li>정당한 사유 없는 외부 {offSiteMode === 'checkin' ? '출근' : '퇴근'}은 <strong>근무 태도 평가에 반영</strong>됩니다</li>
                                         <li>반복적인 외부 {offSiteMode === 'checkin' ? '출근' : '퇴근'} 시 <strong>인사상 조치</strong>가 취해질 수 있습니다</li>
                                         <li>모든 외부 {offSiteMode === 'checkin' ? '출근' : '퇴근'} 기록은 <strong>관리자에게 자동 보고</strong>됩니다</li>
                                     </ul>
                                 </div>
                                
                                <div className={ss.contact_info}>
                                    <p>문의사항이 있으시면 <strong>관리자에게 연락</strong>해 주시기 바랍니다.</p>
                                </div>
                            </div>
                            
                                                         <div className={ss.reason_input_section}>
                                 <label htmlFor="offsite-reason">{offSiteMode === 'checkin' ? '출근' : '퇴근'} 사유 (필수, 10자 이상)</label>
                                 <textarea
                                     id="offsite-reason"
                                     placeholder={offSiteMode === 'checkin' 
                                         ? "외부 위치에서 출근하는 상세한 사유를 입력해주세요 (예: 고객사 미팅으로 직접 출근, 출장지에서 업무 시작 등)"
                                         : "외부 위치에서 퇴근하는 상세한 사유를 입력해주세요 (예: 고객사 미팅 후 직접 퇴근, 출장 업무 종료 등)"
                                     }
                                     value={offSiteReason}
                                     onChange={(e) => setOffSiteReason(e.target.value)}
                                     className={ss.reason_textarea}
                                     rows={4}
                                     maxLength={500}
                                 />
                                 <div className={ss.char_count}>
                                     {offSiteReason.length}/500자 (최소 10자 필요)
                                 </div>
                             </div>
                        </div>
                        
                        <div className={ss.offsite_modal_actions}>
                            <button 
                                className={ss.cancel_button}
                                onClick={closeOffSiteModal}
                            >
                                취소
                            </button>
                            <button 
                                className={ss.confirm_button}
                                onClick={handleOffSiteAction}
                                disabled={!offSiteReason.trim() || offSiteReason.trim().length < 10}
                            >
                                {offSiteMode === 'checkin' ? '출근' : '퇴근'} 처리
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Attendance