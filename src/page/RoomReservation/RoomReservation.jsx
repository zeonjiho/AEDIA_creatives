import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './RoomReservation.module.css'
import { 
    HiPlus, HiPencil, HiTrash, HiX, 
    HiCalendar, HiOfficeBuilding, HiClock, HiUserGroup,
    HiChevronLeft, HiChevronRight, HiFilter, HiSearch,
    HiDocumentText, HiCheckCircle, HiSave, HiBookmark
} from 'react-icons/hi'
import { 
    users, 
    currentUser,
    projects
} from '../../data/mockDatabase'
import ReservationModal from './ReservationModal'
import api from '../../utils/api'

const RoomReservation = () => {
    const navigate = useNavigate()
    
    // 상태 관리
    const [currentUserState] = useState(currentUser) // 현재 로그인한 사용자 (임시)
    const [rooms, setRooms] = useState([])
    const [reservations, setReservations] = useState([])
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date('2023-03-06')) // 2023년 3월 6일로 설정
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
        description: ''
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterFacility, setFilterFacility] = useState('')
    const [statusMessage, setStatusMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' 또는 'error'
    const [projectsList, setProjectsList] = useState([])
    const [projectSearchTerm, setProjectSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [editingRoomDetails, setEditingRoomDetails] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [loading, setLoading] = useState(true)
    
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
    
    // 예약 목록 불러오기 (필요시 추가 구현)
    const loadReservations = async () => {
        try {
            // TODO: 예약 API가 구현되면 실제 API 호출로 변경
            // const response = await api.get('/reservations')
            // setReservations(response.data)
            setReservations([]) // 임시로 빈 배열
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
                await Promise.all([
                    loadRooms(),
                    loadReservations()
                ])
                setProjectsList(projects) // 프로젝트는 임시로 목업 데이터 사용
            } catch (error) {
                console.error('데이터 로딩 중 오류:', error)
            } finally {
                setLoading(false)
            }
        }
        
        loadData()
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
    
    // 1초마다 시간 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        
        // 컴포넌트 언마운트 시 타이머 정리
        return () => clearInterval(timer)
    }, [])
    
    // 필터링된 회의실 목록
    const filteredRooms = rooms.filter(room => {
        // 검색어 필터링
        const matchesSearch = searchTerm === '' || 
            room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.location.toLowerCase().includes(searchTerm.toLowerCase())
        
        // 시설 필터링
        const matchesFacility = filterFacility === '' || 
            (room.tools && room.tools.some(tool => tool.toLowerCase().includes(filterFacility.toLowerCase())))
        
        return matchesSearch && matchesFacility
    })
    
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
        
        // 오늘 날짜로 기본 설정
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)
        
        setReservationFormData({
            title: '',
            startDate: today.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '10:00',
            participants: [currentUserState.id],
            project: '',
            description: ''
        })
        
        setSelectedReservation(null)
    }
    
    const handleReservationClick = (reservation) => {
        setSelectedReservation(reservation)
        setSelectedRoom(rooms.find(room => room._id === reservation.roomId))
        setShowReservationForm(true)
        
        const startDate = new Date(reservation.start)
        const endDate = new Date(reservation.end)
        
        setReservationFormData({
            title: reservation.title,
            startDate: startDate.toISOString().split('T')[0],
            endDate: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().slice(0, 5),
            endTime: endDate.toTimeString().slice(0, 5),
            participants: reservation.participants || [currentUserState.id],
            project: reservation.project || '',
            description: reservation.description || ''
        })
    }
    
    const handleFormChange = (e) => {
        const { name, value } = e.target
        setReservationFormData(prev => ({
            ...prev,
            [name]: value
        }))
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
        setReservationFormData(prev => ({
            ...prev,
            project: selectedProject.title
        }))
        setProjectSearchTerm('')
    }
    
    // 필터링된 프로젝트 목록
    const filteredProjects = projectSearchTerm 
        ? projectsList.filter(project => 
            project.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(projectSearchTerm.toLowerCase())
          )
        : []
    
    const handleFormSubmit = (e) => {
        e.preventDefault()
        
        // 날짜와 시간을 조합하여 DateTime 생성
        const startDateTime = new Date(`${reservationFormData.startDate}T${reservationFormData.startTime}:00`)
        const endDateTime = new Date(`${reservationFormData.endDate}T${reservationFormData.endTime}:00`)
        
        const newReservation = {
            id: selectedReservation ? selectedReservation.id : `res${Date.now()}`,
            roomId: selectedRoom._id,
            title: reservationFormData.title,
            description: reservationFormData.description,
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            participants: reservationFormData.participants,
            project: reservationFormData.project,
            color: getProjectColor(reservationFormData.project),
            createdBy: currentUserState.id
        }
        
        // 기존 예약 업데이트
        if (selectedReservation) {
            const updated = {
                ...selectedReservation,
                title: reservationFormData.title,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
                participants: reservationFormData.participants,
                project: reservationFormData.project,
                description: reservationFormData.description
            }
            
            // 예약 목록 업데이트
            setReservations(prev => 
                prev.map(res => res.id === selectedReservation.id ? updated : res)
            )
            
            setStatusMessage('예약이 성공적으로 업데이트되었습니다.')
            setMessageType('success')
        } 
        // 새 예약 추가
        else {
            // 예약 목록 업데이트
            setReservations(prev => [...prev, newReservation])
            
            setStatusMessage('새 예약이 성공적으로 추가되었습니다.')
            setMessageType('success')
        }
        
        setShowReservationForm(false)
    }
    
    const handleDeleteReservation = () => {
        if (!selectedReservation) return
        
        // 예약 목록 업데이트
        setReservations(prev => 
            prev.filter(res => res.id !== selectedReservation.id)
        )
        
        setStatusMessage('예약이 삭제되었습니다.')
        setMessageType('success')
        setShowReservationForm(false)
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

            <button 
                className={styles.filter_toggle} 
                onClick={() => setShowFilters(!showFilters)}
            >
                <HiFilter />
                필터
            </button>

            {showFilters && (
                <div className={styles.filters_panel}>
                    <div className={styles.search_box}>
                        <HiSearch className={styles.search_icon} />
                        <input
                            type="text"
                            placeholder="회의실 이름 또는 위치 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className={styles.filter_group}>
                        <label>시설:</label>
                        <select
                            value={filterFacility}
                            onChange={(e) => setFilterFacility(e.target.value)}
                        >
                            <option value="">모든 시설</option>
                            <option value="프로젝터">프로젝터</option>
                            <option value="TV">TV</option>
                            <option value="화이트보드">화이트보드</option>
                        </select>
                    </div>
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
                        ) : filteredRooms.length === 0 ? (
                            <div className={styles.no_rooms}>
                                <HiOfficeBuilding />
                                <p>검색 조건에 맞는 회의실이 없습니다.</p>
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
                users={users}
                onClose={handleCancelForm}
                onFormChange={handleFormChange}
                onProjectSearchChange={handleProjectSearchChange}
                onProjectSelect={handleProjectSelect}
                onParticipantChange={handleParticipantChange}
                onSubmit={handleFormSubmit}
                onDelete={handleDeleteReservation}
                onClearProject={() => setReservationFormData(prev => ({...prev, project: ''}))}
            />
        </div>
    )
}

export default RoomReservation 