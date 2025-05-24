import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './RoomReservation.module.css'
import { 
    HiPlus, HiPencil, HiTrash, HiX, 
    HiCalendar, HiOfficeBuilding, HiClock, HiUserGroup,
    HiChevronLeft, HiChevronRight, HiFilter, HiSearch,
    HiDocumentText, HiCheckCircle, HiSave
} from 'react-icons/hi'
import { 
    users, 
    currentUser,
    projects
} from '../../data/mockDatabase'
import ReservationModal from './ReservationModal'

const RoomReservation = () => {
    const navigate = useNavigate()
    
    // 샘플 회의실 데이터
    const initialRooms = [
        { id: 'room1', name: '회의실 A', location: '2층', facilities: ['프로젝터', 'TV', '화이트보드'] },
        { id: 'room2', name: '회의실 B', location: '3층', facilities: ['TV', '화이트보드'] },
        { id: 'room3', name: '회의실 C', location: '3층', facilities: ['프로젝터', '화이트보드'] }
    ]

    // 샘플 예약 데이터
    const initialReservations = [
        {
            id: 'res1',
            roomId: 'room1',
            title: '프로젝트 킥오프 미팅',
            startTime: new Date('2023-03-06T10:00:00').toISOString(),
            endTime: new Date('2023-03-06T11:30:00').toISOString(),
            projectId: 'project1',
            projectName: 'AEDIA 웹사이트 리뉴얼',
            createdBy: 'user1',
            color: '#4CAF50'
        },
        {
            id: 'res2',
            roomId: 'room2',
            title: '주간 팀 회의',
            startTime: new Date('2023-03-06T14:00:00').toISOString(),
            endTime: new Date('2023-03-06T15:00:00').toISOString(),
            projectId: 'project2',
            projectName: '모바일 앱 개발',
            createdBy: 'user2',
            color: '#2196F3'
        },
        {
            id: 'res3',
            roomId: 'room3',
            title: '디자인 리뷰',
            startTime: new Date('2023-03-06T16:00:00').toISOString(),
            endTime: new Date('2023-03-06T17:30:00').toISOString(),
            projectId: 'project3',
            projectName: '신규 브랜딩',
            createdBy: 'user3',
            color: '#9C27B0'
        }
    ]
    
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
        start: '',
        end: '',
        participants: [],
        project: ''
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterFacility, setFilterFacility] = useState('')
    const [statusMessage, setStatusMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' 또는 'error'
    const [projectsList, setProjectsList] = useState([])
    const [projectSearchTerm, setProjectSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [editingRoomDetails, setEditingRoomDetails] = useState(false)
    
    // 초기 데이터 로드
    useEffect(() => {
        setRooms(initialRooms)
        setReservations(initialReservations)
        setProjectsList(projects)
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
    
    // 필터링된 회의실 목록
    const filteredRooms = rooms.filter(room => {
        // 검색어 필터링
        const matchesSearch = searchTerm === '' || 
            room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.location.toLowerCase().includes(searchTerm.toLowerCase())
        
        // 시설 필터링
        const matchesFacility = filterFacility === '' || 
            room.facilities.some(facility => facility.toLowerCase().includes(filterFacility.toLowerCase()))
        
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
    const handleAddReservation = (roomId, hour) => {
        setSelectedRoom(rooms.find(room => room.id === roomId))
        setShowReservationForm(true)
        
        // 시작 시간과 종료 시간 설정
        const startDateTime = new Date(currentDate)
        startDateTime.setHours(hour, 0, 0)
        
        const endDateTime = new Date(currentDate)
        endDateTime.setHours(hour + 1, 0, 0)
        
        setReservationFormData({
            title: '',
            start: formatDateTimeForInput(startDateTime),
            end: formatDateTimeForInput(endDateTime),
            participants: [currentUserState.id],
            project: ''
        })
        
        setSelectedReservation(null)
    }
    
    const handleReservationClick = (reservation) => {
        setSelectedReservation(reservation)
        setSelectedRoom(rooms.find(room => room.id === reservation.roomId))
        setShowReservationForm(true)
        
        setReservationFormData({
            title: reservation.title,
            start: formatDateTimeForInput(new Date(reservation.start)),
            end: formatDateTimeForInput(new Date(reservation.end)),
            participants: reservation.participants || [],
            project: reservation.project || ''
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
        
        const startTime = new Date(reservationFormData.start)
        const endTime = new Date(reservationFormData.end)
        
        // 기존 예약 업데이트
        if (selectedReservation) {
            const updated = {
                ...selectedReservation,
                title: reservationFormData.title,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                participants: reservationFormData.participants,
                project: reservationFormData.project
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
            const newReservation = {
                id: Date.now(),
                roomId: selectedRoom.id,
                title: reservationFormData.title,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                userId: currentUserState.id,
                participants: reservationFormData.participants,
                project: reservationFormData.project
            }
            
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
            <div className={styles.header}>
                <h1>Room Reservation</h1>
                <div className={styles.date_navigation}>
                    <button 
                        className={styles.today_button} 
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
                        {filteredRooms.length === 0 ? (
                            <div className={styles.no_rooms}>
                                <HiOfficeBuilding />
                                <p>검색 조건에 맞는 회의실이 없습니다.</p>
                            </div>
                        ) : (
                            filteredRooms.map(room => (
                                <div 
                                    key={room.id}
                                    className={`${styles.room_card} ${selectedRoom && selectedRoom.id === room.id ? styles.selected : ''}`}
                                    onClick={() => handleRoomSelect(room)}
                                >
                                    <div className={styles.room_content}>
                                        <h3 className={styles.room_title}>{room.name}</h3>
                                        <div className={styles.room_meta}>
                                            <span className={styles.room_utilization}>
                                                <HiClock />
                                                {getRoomReservations(room.id).length}건의 예약
                                            </span>
                                        </div>
                                        <div className={styles.room_facilities}>
                                            {room.facilities.map((facility, index) => (
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
                                    <h3>{selectedRoom.name}</h3>
                                    <div className={styles.room_info}>
                                        <span><HiDocumentText /> {getRoomReservations(selectedRoom.id).length}건의 예약</span>
                                    </div>
                                </div>
                                <button className={styles.close_button} onClick={handleCloseDetail}>
                                    <HiX />
                                </button>
                            </div>

                            <div className={styles.time_slots}>
                                {Array.from({ length: 24 }, (_, hour) => (
                                    <div 
                                        key={hour}
                                        className={`${styles.time_slot} ${isTimeSlotReserved(selectedRoom.id, hour) ? styles.reserved : ''}`}
                                    >
                                        <div className={styles.time_label}>
                                            {`${hour}:00`}
                                        </div>
                                        {isTimeSlotReserved(selectedRoom.id, hour) ? (
                                            <div 
                                                className={styles.reservation_block}
                                                onClick={() => handleReservationClick(getReservationAtTimeSlot(selectedRoom.id, hour))}
                                                style={{
                                                    backgroundColor: getProjectColor(getReservationAtTimeSlot(selectedRoom.id, hour)?.project)
                                                }}
                                            >
                                                <div className={styles.reservation_title}>
                                                    {getReservationAtTimeSlot(selectedRoom.id, hour)?.title}
                                                </div>
                                                <div className={styles.reservation_time}>
                                                    {formatTime(getReservationAtTimeSlot(selectedRoom.id, hour)?.start)} - 
                                                    {formatTime(getReservationAtTimeSlot(selectedRoom.id, hour)?.end)}
                                                </div>
                                                {getReservationAtTimeSlot(selectedRoom.id, hour)?.project && (
                                                    <div className={styles.reservation_project}>
                                                        {getReservationAtTimeSlot(selectedRoom.id, hour)?.project}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div 
                                                className={styles.empty_slot}
                                                onClick={() => handleAddReservation(selectedRoom.id, hour)}
                                            >
                                                <div className={styles.add_reservation}>
                                                    <HiPlus /> 예약하기
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
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