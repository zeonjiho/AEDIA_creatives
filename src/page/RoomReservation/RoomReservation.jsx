import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './RoomReservation.module.css'
import { 
    HiPlus, HiPencil, HiTrash, HiX, 
    HiCalendar, HiOfficeBuilding, HiClock, HiUserGroup,
    HiChevronLeft, HiChevronRight, HiFilter, HiSearch,
    HiDocumentText, HiCheckCircle, HiSave, HiBookmark
} from 'react-icons/hi'
import ReservationModal from './ReservationModal'
import api from '../../utils/api'
import { jwtDecode } from 'jwt-decode'

const RoomReservation = () => {
    const navigate = useNavigate()
    
    // 상태 관리
    const [rooms, setRooms] = useState([])
    const [reservations, setReservations] = useState([])
    const [users, setUsers] = useState([]) // 실제 사용자 목록
    const [projects, setProjects] = useState([]) // 서버에서 가져올 프로젝트 목록
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date()) // 현재 날짜로 설정
    const [showReservationForm, setShowReservationForm] = useState(false)
    const [selectedReservation, setSelectedReservation] = useState(null)
    const [reservationFormData, setReservationFormData] = useState({
        title: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        participants: [],
        project: '',
        projectId: '', // 프로젝트 ID 추가
        description: ''
    })
    const [statusMessage, setStatusMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' 또는 'error'
    const [projectsList, setProjectsList] = useState([])
    const [projectSearchTerm, setProjectSearchTerm] = useState('')
    const [editingRoomDetails, setEditingRoomDetails] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [projectsLoading, setProjectsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState(null) // 현재 사용자 정보
    
    // 현재 사용자 정보 불러오기
    const loadCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) return
            
            const userId = jwtDecode(token).userId
            const response = await api.get(`/get-user-info?userId=${userId}`)
            setCurrentUser(response.data)
        } catch (error) {
            console.error('현재 사용자 정보를 불러오는데 실패했습니다:', error)
        }
    }
    
    // 회의실 목록 불러오기
    const loadRooms = async () => {
        try {
            const response = await api.get('/rooms')
            setRooms(response.data)
        } catch (error) {
            console.error('회의실 목록을 불러오는데 실패했습니다:', error)
            setStatusMessage('회의실 목록을 불러오는데 실패했습니다.')
            setMessageType('error')
        }
    }
    
    // 사용자 목록 불러오기
    const loadUsers = async () => {
        try {
            const response = await api.get('/get-user-list?userType=all')
            
            // status가 'active'인 사용자만 필터링하고 userType별로 정렬
            const activeUsers = response.data.filter(user => user.status === 'active')
            
            // internal 사용자를 먼저, external 사용자를 나중에 정렬
            const sortedUsers = activeUsers.sort((a, b) => {
                // userType별 우선순위 (internal이 먼저)
                const typeOrder = { 'internal': 0, 'external': 1 }
                if (typeOrder[a.userType] !== typeOrder[b.userType]) {
                    return typeOrder[a.userType] - typeOrder[b.userType]
                }
                
                // 같은 userType 내에서는 이름순 정렬
                return a.name.localeCompare(b.name)
            })
            
            // ReservationModal에서 사용할 수 있도록 데이터 구조 변환
            const formattedUsers = sortedUsers.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || '/default-avatar.png',
                role: user.roles && user.roles.length > 0 ? user.roles[0] : '직책 없음',
                userType: user.userType
            }))
            
            setUsers(formattedUsers)
        } catch (error) {
            console.error('사용자 목록을 불러오는데 실패했습니다:', error)
            setStatusMessage('사용자 목록을 불러오는데 실패했습니다.')
            setMessageType('error')
        }
    }
    
    // 프로젝트 목록 불러오기
    const loadProjects = async () => {
        setProjectsLoading(true)
        try {
            console.log('프로젝트 목록 조회 시작')
            const response = await api.get('/projects')
            console.log('프로젝트 목록 조회 성공:', response.data.length, '개')
            
            // 프로젝트 데이터를 모달에서 사용할 수 있는 형태로 변환
            const formattedProjects = response.data.map(project => ({
                id: project._id || project.id,
                title: project.title,
                description: project.description || '',
                status: project.status,
                deadline: project.deadline,
                client: project.client || '', // 클라이언트 정보가 있다면
                thumbnail: project.thumbnail
            }))
            
            setProjects(formattedProjects)
            setProjectsList(formattedProjects) // 검색용 목록도 업데이트
        } catch (error) {
            console.error('프로젝트 목록을 불러오는데 실패했습니다:', error)
            setStatusMessage('프로젝트 목록을 불러오는데 실패했습니다.')
            setMessageType('error')
        } finally {
            setProjectsLoading(false)
        }
    }
    
    // 예약 목록 불러오기
    const loadReservations = async () => {
        try {
            // 모든 회의실의 예약을 가져와서 통합
            const allReservations = [];
            for (const room of rooms) {
                const response = await api.get(`/rooms/${room._id}/reservations`);
                console.log(`🔍 ${room.roomName} 예약 데이터:`, response.data);
                
                const roomReservations = response.data.map(reservation => {
                    console.log('🔍 개별 예약 처리:', {
                        id: reservation._id,
                        meetingName: reservation.meetingName,
                        createdBy: reservation.createdBy,
                        createdAt: reservation.createdAt
                    });
                    
                    return {
                        ...reservation,
                        roomId: room._id,
                        start: reservation.startTime,
                        end: reservation.endTime,
                        title: reservation.meetingName,
                        description: reservation.meetingDescription || '',
                        project: reservation.project?.title || '',
                        projectId: reservation.project?._id || reservation.project?.id || '',
                        participants: reservation.participants.map(p => p.userId._id),
                        createdBy: reservation.createdBy
                    };
                });
                allReservations.push(...roomReservations);
            }
            console.log('🔍 전체 예약 목록:', allReservations);
            setReservations(allReservations);
        } catch (error) {
            console.error('예약 목록을 불러오는데 실패했습니다:', error)
            setStatusMessage('예약 목록을 불러오는데 실패했습니다.')
            setMessageType('error')
        }
    }
    
    // 초기 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                await loadCurrentUser() // 현재 사용자 정보 먼저 로드
                await loadRooms()
                await loadUsers()
                setProjectsLoading(true)
                await loadProjects()
            } catch (error) {
                console.error('데이터 로딩 중 오류:', error)
            } finally {
                setLoading(false)
                setProjectsLoading(false)
            }
        }
        
        loadData()
    }, [])
    
    // rooms가 로드된 후에 예약 목록 로드
    useEffect(() => {
        if (rooms.length > 0) {
            loadReservations()
        }
    }, [rooms])

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
    
    // 1초마다 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        
        // 컴포넌트 언마운트 시 타이머 정리
        return () => clearInterval(timer)
    }, [])
    
    // 필터링된 회의실 목록 - 필터 제거로 모든 회의실 반환
    const filteredRooms = rooms
    
    // 날짜 관련 함수들
    const formatDate = (date) => {
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        })
    }
    
    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit'
        })
    }
    
    const formatDateTimeForInput = (date) => {
        return date.toISOString().slice(0, 16)
    }
    
    const goToPreviousDay = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() - 1)
            return newDate
        })
    }
    
    const goToNextDay = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            newDate.setDate(prev.getDate() + 1)
            return newDate
        })
    }
    
    const goToToday = () => {
        setCurrentDate(new Date())
    }
    
    const isToday = (date) => {
        const today = new Date()
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        )
    }
    
    // 회의실 관련 함수들
    const handleRoomSelect = (room) => {
        setSelectedRoom(room)
        setEditingRoomDetails(false)
    }
    
    const getRoomReservations = (roomId) => {
        return reservations.filter(reservation => {
            const reservationDate = new Date(reservation.start)
            return (
                reservation.roomId === roomId &&
                reservationDate.getFullYear() === currentDate.getFullYear() &&
                reservationDate.getMonth() === currentDate.getMonth() &&
                reservationDate.getDate() === currentDate.getDate()
            )
        })
    }
    
    // 예약 관련 함수들
    const handleAddReservation = () => {
        setShowReservationForm(true)
        
        // 현재 로컬 날짜와 시간으로 기본 설정
        const now = new Date()
        
        // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 고려)
        const formatLocalDate = (date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
        
        // 현재 시간을 기준으로 시작 시간 설정 (분은 0 또는 30으로 반올림)
        const currentMinutes = now.getMinutes()
        const roundedMinutes = currentMinutes <= 30 ? 30 : 60
        const startTime = new Date(now)
        startTime.setMinutes(roundedMinutes === 60 ? 0 : roundedMinutes)
        if (roundedMinutes === 60) {
            startTime.setHours(startTime.getHours() + 1)
        }
        
        // 종료 시간은 시작 시간 + 1시간
        const endTime = new Date(startTime)
        endTime.setHours(endTime.getHours() + 1)
        
        // 시간을 HH:MM 형식으로 변환
        const formatTime = (date) => {
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${hours}:${minutes}`
        }
        
        const todayDate = formatLocalDate(now)
        
        setReservationFormData({
            title: '',
            startDate: todayDate,
            endDate: todayDate,
            startTime: formatTime(startTime),
            endTime: formatTime(endTime),
            participants: [], // 빈 배열로 시작하여 사용자가 직접 선택하도록 함
            project: '',
            projectId: '',
            description: ''
        })
        
        setSelectedReservation(null)
    }
    
    const handleReservationClick = (reservation) => {
        console.log('🔍 선택된 예약 데이터:', reservation)
        console.log('🔍 예약 생성자 정보:', reservation.createdBy)
        console.log('🔍 예약 생성 날짜:', reservation.createdAt)
        
        setSelectedReservation(reservation)
        setSelectedRoom(rooms.find(room => room._id === reservation.roomId))
        setShowReservationForm(true)
        
        const startDate = new Date(reservation.startTime)
        const endDate = new Date(reservation.endTime)
        
        // 로컬 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 고려)
        const formatLocalDate = (date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }
        
        // 로컬 시간을 HH:MM 형식으로 변환
        const formatLocalTime = (date) => {
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            return `${hours}:${minutes}`
        }
        
        // 프로젝트 정보 찾기
        const projectInfo = projects.find(p => p.id === reservation.projectId)
        
        setReservationFormData({
            title: reservation.meetingName,
            startDate: formatLocalDate(startDate),
            endDate: formatLocalDate(endDate),
            startTime: formatLocalTime(startDate),
            endTime: formatLocalTime(endDate),
            participants: reservation.participants || [],
            project: projectInfo ? projectInfo.title : (reservation.project || ''),
            projectId: reservation.projectId || '',
            description: reservation.meetingDescription || ''
        })
    }
    
    const handleFormChange = (e) => {
        const { name, value } = e.target
        setReservationFormData(prev => {
            const updated = {
            ...prev,
            [name]: value
            }
            
            // startDate가 변경되면 endDate도 같은 날짜로 설정
            if (name === 'startDate') {
                updated.endDate = value
            }
            
            return updated
        })
    }
    
    const handleParticipantChange = (userId) => {
        setReservationFormData(prev => {
            const participants = [...prev.participants]
            
            if (participants.includes(userId)) {
                return {
                    ...prev,
                    participants: participants.filter(id => id !== userId)
                }
            } else {
                return {
                    ...prev,
                    participants: [...participants, userId]
                }
            }
        })
    }
    
    // 프로젝트 검색어 변경 처리
    const handleProjectSearchChange = (e) => {
        setProjectSearchTerm(e.target.value)
    }
    
    // 프로젝트 선택 처리
    const handleProjectSelect = (projectId) => {
        const selectedProject = projectsList.find(project => project.id === projectId)
        if (selectedProject) {
        setReservationFormData(prev => ({
            ...prev,
                project: selectedProject.title,
                projectId: selectedProject.id
        }))
        }
        setProjectSearchTerm('')
    }
    
    // 프로젝트 모달 선택 처리 (ReservationModal에서 사용)
    const handleProjectModalSelect = (project) => {
        if (project) {
            console.log('프로젝트 선택:', project.title, project.id)
            setReservationFormData(prev => ({
                ...prev,
                project: project.title,
                projectId: project.id
            }))
        } else {
            console.log('프로젝트 선택 해제')
            setReservationFormData(prev => ({
                ...prev,
                project: '',
                projectId: ''
            }))
        }
    }
    
    // 필터링된 프로젝트 목록
    const filteredProjects = projectSearchTerm 
        ? projectsList.filter(project => 
            project.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(projectSearchTerm.toLowerCase())
          )
        : projectsList
    
    const handleFormSubmit = async (e) => {
        e.preventDefault()
        
        if (!selectedRoom) {
            alert('⚠️ 회의실을 선택해주세요.')
            return
        }
        
        try {
            // 날짜와 시간을 정확하게 결합
            const startDateTimeString = `${reservationFormData.startDate} ${reservationFormData.startTime}:00`
            const endDateTimeString = `${reservationFormData.endDate} ${reservationFormData.endTime}:00`
            
            const startDateTime = new Date(startDateTimeString)
            const endDateTime = new Date(endDateTimeString)
        
            // 유효한 날짜인지 확인
            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                alert('⚠️ 날짜나 시간 형식이 올바르지 않습니다.')
                return
            }
            
            const reservationData = {
                meetingName: reservationFormData.title,
                meetingDescription: reservationFormData.description || '',
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                participants: reservationFormData.participants,
                project: reservationFormData.projectId || null, // 프로젝트 ID 전송
                createdBy: currentUser ? currentUser._id : null // 생성자 정보 전송
            }
            
            // 기존 예약 수정
            if (selectedReservation) {
                await api.put(`/rooms/${selectedRoom._id}/reservations/${selectedReservation._id}`, reservationData)
                alert('✅ 예약이 성공적으로 업데이트되었습니다.')
        } 
            // 새 예약 생성
        else {
                await api.post(`/rooms/${selectedRoom._id}/reservations`, reservationData)
                alert('✅ 새 예약이 성공적으로 추가되었습니다.')
            }
            
            // 예약 목록 새로고침
            await loadReservations()
            setShowReservationForm(false)
            
        } catch (error) {
            console.error('예약 처리 중 오류:', error)
            console.error('Error response:', error.response)
            
            let errorMessage = '예약 처리 중 오류가 발생했습니다.';
            
            if (error.response) {
                // 서버에서 응답을 받은 경우
                if (error.response.status === 400 && error.response.data?.conflictingReservation) {
                    // 시간 충돌 에러인 경우 특별 처리
                    const conflictData = error.response.data.conflictingReservation
                    const conflictStart = new Date(conflictData.startTime)
                    const conflictEnd = new Date(conflictData.endTime)
                    
                    const formatTime = (date) => {
                        return date.toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                        })
                    }
                    
                    const formatDate = (date) => {
                        return date.toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric'
                        })
                    }
                    
                    errorMessage = `⚠️ 예약 시간이 겹칩니다!\n\n기존 예약: "${conflictData.meetingName}"\n시간: ${formatDate(conflictStart)} ${formatTime(conflictStart)} - ${formatTime(conflictEnd)}\n\n다른 시간을 선택해주세요.`
                } else if (error.response.data?.message) {
                    // 서버에서 보낸 구체적인 에러 메시지
                    errorMessage = `❌ ${error.response.data.message}`
                } else if (error.response.status === 400) {
                    errorMessage = '❌ 입력한 정보에 문제가 있습니다. 다시 확인해주세요.'
                } else if (error.response.status === 404) {
                    errorMessage = '❌ 회의실을 찾을 수 없습니다.'
                } else if (error.response.status === 500) {
                    errorMessage = '❌ 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                } else {
                    errorMessage = `❌ 오류가 발생했습니다. (상태 코드: ${error.response.status})`
                }
            } else if (error.request) {
                // 네트워크 오류
                errorMessage = '❌ 네트워크 연결을 확인해주세요.'
            } else {
                // 기타 오류
                errorMessage = `❌ 알 수 없는 오류가 발생했습니다: ${error.message}`
            }
            
            alert(errorMessage)
        }
    }
    
    const handleDeleteReservation = async () => {
        if (!selectedReservation || !selectedRoom) return
        
        // 삭제 확인
        if (!window.confirm('정말로 이 예약을 취소하시겠습니까?')) {
            return
        }
        
        try {
            await api.delete(`/rooms/${selectedRoom._id}/reservations/${selectedReservation._id}`)
            
            // 성공 메시지 표시
            alert('✅ 예약이 취소되었습니다.')
            
            // 예약 목록 새로고침
            await loadReservations()
        setShowReservationForm(false)
            
        } catch (error) {
            console.error('예약 삭제 중 오류:', error)
            console.error('Delete error response:', error.response)
            
            let errorMessage = '예약 삭제 중 오류가 발생했습니다.';
            
            if (error.response) {
                if (error.response.data?.message) {
                    errorMessage = `❌ ${error.response.data.message}`
                } else if (error.response.status === 404) {
                    errorMessage = '❌ 예약을 찾을 수 없습니다.'
                } else if (error.response.status === 403) {
                    errorMessage = '❌ 이 예약을 삭제할 권한이 없습니다.'
                } else if (error.response.status === 500) {
                    errorMessage = '❌ 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                } else {
                    errorMessage = `❌ 삭제 중 오류가 발생했습니다. (상태 코드: ${error.response.status})`
                }
            } else if (error.request) {
                errorMessage = '❌ 네트워크 연결을 확인해주세요.'
            } else {
                errorMessage = `❌ 알 수 없는 오류가 발생했습니다: ${error.message}`
            }
            
            alert(errorMessage)
        }
    }
    
    const handleCancelForm = () => {
        setShowReservationForm(false)
    }
    
    const isTimeSlotReserved = (roomId, hour) => {
        return reservations.some(reservation => {
            const startTime = new Date(reservation.start)
            const endTime = new Date(reservation.end)
            
            return (
                reservation.roomId === roomId &&
                startTime.getFullYear() === currentDate.getFullYear() &&
                startTime.getMonth() === currentDate.getMonth() &&
                startTime.getDate() === currentDate.getDate() &&
                (startTime.getHours() <= hour && endTime.getHours() > hour)
            )
        })
    }
    
    const getReservationAtTimeSlot = (roomId, hour) => {
        return reservations.find(reservation => {
            const startTime = new Date(reservation.start)
            const endTime = new Date(reservation.end)
            
            return (
                reservation.roomId === roomId &&
                startTime.getFullYear() === currentDate.getFullYear() &&
                startTime.getMonth() === currentDate.getMonth() &&
                startTime.getDate() === currentDate.getDate() &&
                (startTime.getHours() <= hour && endTime.getHours() > hour)
            )
        })
    }
    
    const calculateReservationStats = () => {
        // 오늘 예약된 회의실 수
        const todayReservations = reservations.filter(reservation => {
            const reservationDate = new Date(reservation.start)
            return (
                reservationDate.getFullYear() === currentDate.getFullYear() &&
                reservationDate.getMonth() === currentDate.getMonth() &&
                reservationDate.getDate() === currentDate.getDate()
            )
        })
        
        const reservedRoomsCount = new Set(
            todayReservations.map(reservation => reservation.roomId)
        ).size
        
        // 오늘 예약된 시간대 계산
        const busyHours = Array(24).fill(0)
        
        todayReservations.forEach(reservation => {
            const startTime = new Date(reservation.start)
            const endTime = new Date(reservation.end)
            
            for (let hour = startTime.getHours(); hour < endTime.getHours(); hour++) {
                busyHours[hour]++
            }
        })
        
        const peakHour = busyHours.indexOf(Math.max(...busyHours))
        
        return {
            totalRooms: rooms.length,
            reservedRooms: reservedRoomsCount,
            totalReservations: todayReservations.length,
            peakHour: peakHour !== -1 ? `${peakHour}:00` : '없음'
        }
    }
    
    const getProjectColor = (projectName) => {
        if (!projectName) return ''
        
        // 간단한 해시 함수를 사용하여 프로젝트명으로부터 일관된 색상 생성
        let hash = 0
        for (let i = 0; i < projectName.length; i++) {
            hash = projectName.charCodeAt(i) + ((hash << 5) - hash)
        }
        
        const hue = hash % 360
        return `hsl(${hue}, 70%, 65%)`
    }
    
    const handleCloseDetail = () => {
        setSelectedRoom(null)
    }

    const stats = calculateReservationStats()

    return (
        <div className={styles.container}>
            <header className={styles.dashboard_header}>
                <div className={styles.header_content}>
                    <h1 className={styles.dashboard_title}>Room Reservation</h1>
                    <p className={styles.dashboard_date}>
                        {currentTime.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })} {currentTime.toLocaleTimeString('en-US')}
                    </p>
                </div>
                
                <div className={styles.header_controls}>
                    <div className={styles.date_navigation}>
                        <button 
                            className={styles.customize_btn} 
                            onClick={goToToday}
                        >
                            오늘
                        </button>
                        <div className={styles.date_controls}>
                            <button 
                                className={styles.nav_button} 
                                onClick={goToPreviousDay}
                            >
                                <HiChevronLeft />
                            </button>
                            <span className={styles.current_date}>
                                {formatDate(currentDate)}
                            </span>
                            <button 
                                className={styles.nav_button} 
                                onClick={goToNextDay}
                            >
                                <HiChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {statusMessage && (
                <div className={`${styles.status_message} ${styles[messageType]}`}>
                    {statusMessage}
                </div>
            )}

            <div className={styles.content_grid}>
                <div className={styles.rooms_card}>
                    <div className={styles.card_header}>
                        <HiOfficeBuilding className={styles.header_icon} />
                        <h2>회의실 목록</h2>
                    </div>
                    
                    <div className={styles.stats_summary}>
                        <div className={styles.stat_item}>
                            <div className={styles.stat_value}>{stats.totalRooms}</div>
                            <div className={styles.stat_label}>총 회의실</div>
                        </div>
                        <div className={styles.stat_item}>
                            <div className={styles.stat_value}>{stats.reservedRooms}</div>
                            <div className={styles.stat_label}>오늘 사용중</div>
                        </div>
                        <div className={styles.stat_item}>
                            <div className={styles.stat_value}>{stats.totalReservations}</div>
                            <div className={styles.stat_label}>오늘 예약</div>
                        </div>
                    </div>

                    <div className={styles.rooms_grid}>
                        {loading ? (
                            <div className={styles.loading_state}>
                                <p>회의실 목록을 불러오는 중...</p>
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className={styles.no_rooms}>
                                <HiOfficeBuilding />
                                <p>등록된 회의실이 없습니다.</p>
                            </div>
                        ) : (
                            filteredRooms.map((room) => (
                                <div 
                                    key={room._id}
                                    className={`${styles.room_card} ${selectedRoom && selectedRoom._id === room._id ? styles.selected : ''}`}
                                    onClick={() => handleRoomSelect(room)}
                                >
                                    <div className={styles.room_content}>
                                        <h3 className={styles.room_title}>{room.roomName}</h3>
                                        <div className={styles.room_meta}>
                                            <span className={styles.room_utilization}>
                                                <HiClock />
                                                {getRoomReservations(room._id).length}건의 예약
                                            </span>
                                        </div>
                                        <div className={styles.room_facilities}>
                                            {room.tools && room.tools.map((facility, index) => (
                                                <span key={index} className={styles.facility_tag}>
                                                    {facility}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={styles.schedule_card}>
                    <div className={styles.card_header}>
                        <HiCalendar className={styles.header_icon} />
                        <h2>예약 현황</h2>
                    </div>

                    {selectedRoom ? (
                        <div className={styles.schedule_content}>
                            <div className={styles.selected_room_header}>
                                <div className={styles.room_detail}>
                                    <h3>{selectedRoom.roomName}</h3>
                                    <div className={styles.room_info}>
                                        <span><HiOfficeBuilding /> {selectedRoom.location}</span>
                                        <span><HiDocumentText /> {getRoomReservations(selectedRoom._id).length}건의 예약</span>
                                    </div>
                                </div>
                                <div className={styles.room_actions}>
                                    <button 
                                        className={styles.add_reservation_btn}
                                        onClick={handleAddReservation}
                                    >
                                        <HiPlus />
                                        예약하기
                                    </button>
                                    <button className={styles.close_button} onClick={handleCloseDetail}>
                                        <HiX />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.reservations_list}>
                                {getRoomReservations(selectedRoom._id).length > 0 ? (
                                    getRoomReservations(selectedRoom._id).map(reservation => (
                                        <div 
                                            key={reservation.id}
                                            className={styles.reservation_card}
                                            onClick={() => handleReservationClick(reservation)}
                                            style={{
                                                borderLeft: `4px solid ${getProjectColor(reservation.project)}`
                                            }}
                                        >
                                            <div className={styles.reservation_header}>
                                                <h4 className={styles.reservation_title}>{reservation.title}</h4>
                                                <span className={styles.reservation_time}>
                                                    {formatTime(reservation.start)} - {formatTime(reservation.end)}
                                                </span>
                                            </div>
                                            {reservation.project && (
                                                <div className={styles.reservation_project}>
                                                    <HiBookmark />
                                                    {reservation.project}
                                                </div>
                                            )}
                                            <div className={styles.reservation_meta}>
                                                <span className={styles.reservation_duration}>
                                                    <HiClock />
                                                    {Math.round((new Date(reservation.end) - new Date(reservation.start)) / (1000 * 60))}분
                                                </span>
                                                {reservation.participants && (
                                                    <span className={styles.reservation_participants}>
                                                        <HiUserGroup />
                                                        {reservation.participants.length}명
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.no_reservations}>
                                        <HiCalendar className={styles.no_reservations_icon} />
                                        <p>오늘 예약된 회의가 없습니다.</p>
                                        <button 
                                            className={styles.add_first_reservation}
                                            onClick={handleAddReservation}
                                        >
                                            <HiPlus />
                                            첫 예약 만들기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.no_selection}>
                            <HiOfficeBuilding className={styles.no_selection_icon} />
                            <p>회의실을 선택하면 예약 현황이 표시됩니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 예약 모달 */}
            <ReservationModal
                isOpen={showReservationForm}
                selectedRoom={selectedRoom || {}}
                selectedReservation={selectedReservation}
                reservationFormData={reservationFormData}
                projectSearchTerm={projectSearchTerm}
                filteredProjects={filteredProjects}
                projects={projects}
                projectsLoading={projectsLoading}
                users={users}
                currentUser={currentUser} // 현재 사용자 정보 전달
                onClose={handleCancelForm}
                onFormChange={handleFormChange}
                onProjectSearchChange={handleProjectSearchChange}
                onProjectSelect={handleProjectSelect}
                onProjectModalSelect={handleProjectModalSelect}
                onParticipantChange={handleParticipantChange}
                onSubmit={handleFormSubmit}
                onDelete={handleDeleteReservation}
                onClearProject={() => setReservationFormData(prev => ({...prev, project: '', projectId: ''}))}
            />
        </div>
    )
}

export default RoomReservation 