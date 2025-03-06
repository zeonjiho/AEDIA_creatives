import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ss from './RoomReservation.module.css'
import { 
    FaBuilding, 
    FaCalendarAlt, 
    FaClock, 
    FaUsers, 
    FaPlus, 
    FaTrash, 
    FaEdit, 
    FaCheck, 
    FaTimes,
    FaChevronLeft,
    FaChevronRight,
    FaSearch,
    FaProjectDiagram,
    FaRegListAlt
} from 'react-icons/fa'
import { 
    rooms as initialRooms, 
    roomReservations as initialReservations, 
    addReservation, 
    updateReservation, 
    deleteReservation, 
    users, 
    currentUser,
    projects
} from '../../data/mockDatabase'
import ReservationModal from './ReservationModal'

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
        start: '',
        end: '',
        participants: [],
        project: ''
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterFacility, setFilterFacility] = useState('')
    const [filterCapacity, setFilterCapacity] = useState('')
    const [statusMessage, setStatusMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' 또는 'error'
    const [projectsList, setProjectsList] = useState([])
    const [projectSearchTerm, setProjectSearchTerm] = useState('')
    
    // 초기 데이터 로드
    useEffect(() => {
        setRooms(initialRooms)
        setReservations(initialReservations)
        
        // 프로젝트 목록 설정
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
            room.name.toLowerCase().includes(searchTerm.toLowerCase())
        
        // 시설 필터링
        const matchesFacility = filterFacility === '' || 
            room.facilities.some(facility => facility.toLowerCase().includes(filterFacility.toLowerCase()))
        
        // 수용 인원 필터링
        const matchesCapacity = filterCapacity === '' || 
            room.capacity >= parseInt(filterCapacity)
        
        return matchesSearch && matchesFacility && matchesCapacity
    })
    
    // 날짜 관련 함수들
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        })
    }
    
    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
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
    const handleAddReservation = (roomId) => {
        setSelectedRoom(rooms.find(room => room.id === roomId))
        setShowReservationForm(true)
        
        // 폼 초기화
        const hours = new Date().getHours()
        const minutes = new Date().getMinutes()
        
        const startDateTime = new Date(currentDate)
        startDateTime.setHours(hours)
        startDateTime.setMinutes(minutes)
        
        const endDateTime = new Date(currentDate)
        endDateTime.setHours(hours + 1)
        endDateTime.setMinutes(minutes)
        
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
        : projectsList
    
    const handleFormSubmit = (e) => {
        e.preventDefault()
        
        // 시작 시간과 종료 시간이 유효한지 확인
        const startTime = new Date(reservationFormData.start)
        const endTime = new Date(reservationFormData.end)
        
        if (startTime >= endTime) {
            setStatusMessage('종료 시간은 시작 시간보다 나중이어야 합니다.')
            setMessageType('error')
            return
        }
        
        const reservationData = {
            roomId: selectedRoom.id,
            userId: currentUserState.id,
            title: reservationFormData.title,
            start: reservationFormData.start,
            end: reservationFormData.end,
            participants: reservationFormData.participants,
            project: reservationFormData.project
        }
        
        try {
            if (selectedReservation) {
                // 예약 수정
                const updatedReservation = updateReservation(selectedReservation.id, reservationData)
                if (updatedReservation) {
                    setReservations(reservations.map(reservation => 
                        reservation.id === selectedReservation.id ? updatedReservation : reservation
                    ))
                    setStatusMessage('예약이 성공적으로 수정되었습니다.')
                    setMessageType('success')
                    
                    // 폼 닫기
                    setShowReservationForm(false)
                    setSelectedReservation(null)
                } else {
                    setStatusMessage('예약 수정 중 오류가 발생했습니다.')
                    setMessageType('error')
                }
            } else {
                // 새 예약 추가
                const newReservation = addReservation(reservationData)
                if (newReservation) {
                    setReservations([...reservations, newReservation])
                    setStatusMessage('새 예약이 성공적으로 추가되었습니다.')
                    setMessageType('success')
                    
                    // 폼 닫기
                    setShowReservationForm(false)
                    setSelectedReservation(null)
                } else {
                    setStatusMessage('예약 추가 중 오류가 발생했습니다.')
                    setMessageType('error')
                }
            }
        } catch (error) {
            console.error('예약 처리 중 오류:', error)
            setStatusMessage('예약 처리 중 오류가 발생했습니다.')
            setMessageType('error')
        }
    }
    
    const handleDeleteReservation = () => {
        if (selectedReservation) {
            deleteReservation(selectedReservation.id)
            setReservations(reservations.filter(reservation => reservation.id !== selectedReservation.id))
            setShowReservationForm(false)
            setSelectedReservation(null)
            setStatusMessage('Reservation deleted successfully')
            setMessageType('success')
        }
    }
    
    const handleCancelForm = () => {
        setShowReservationForm(false)
        setSelectedReservation(null)
    }
    
    // 시간대 생성 (9시부터 18시까지)
    const timeSlots = Array.from({ length: 10 }, (_, i) => i + 9)
    
    // 예약 가능 여부 확인
    const isTimeSlotReserved = (roomId, hour) => {
        const roomReservations = getRoomReservations(roomId)
        
        return roomReservations.some(reservation => {
            const startTime = new Date(reservation.start)
            const endTime = new Date(reservation.end)
            const slotStart = new Date(currentDate)
            slotStart.setHours(hour, 0, 0)
            const slotEnd = new Date(currentDate)
            slotEnd.setHours(hour + 1, 0, 0)
            
            return (
                (startTime < slotEnd && endTime > slotStart)
            )
        })
    }
    
    const getReservationAtTimeSlot = (roomId, hour) => {
        const roomReservations = getRoomReservations(roomId)
        
        return roomReservations.find(reservation => {
            const startTime = new Date(reservation.start)
            const endTime = new Date(reservation.end)
            const slotStart = new Date(currentDate)
            slotStart.setHours(hour, 0, 0)
            const slotEnd = new Date(currentDate)
            slotEnd.setHours(hour + 1, 0, 0)
            
            return (
                (startTime < slotEnd && endTime > slotStart)
            )
        })
    }
    
    // 현재 시간 포맷팅 (Attendance 스타일)
    const formattedDate = formatDate(currentDate)
    const formattedTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    })
    
    // 예약 현황 통계 계산
    const calculateReservationStats = () => {
        // 오늘 날짜의 모든 예약
        const todayReservations = reservations.filter(reservation => {
            const reservationDate = new Date(reservation.start)
            return (
                reservationDate.getFullYear() === currentDate.getFullYear() &&
                reservationDate.getMonth() === currentDate.getMonth() &&
                reservationDate.getDate() === currentDate.getDate()
            )
        })
        
        // 내 예약
        const myReservations = todayReservations.filter(reservation => 
            reservation.userId === currentUserState.id
        )
        
        // 참여 예약 (내가 참석자로 포함된 예약)
        const participatingReservations = todayReservations.filter(reservation => 
            reservation.userId !== currentUserState.id && 
            reservation.participants && 
            reservation.participants.includes(currentUserState.id)
        )
        
        // 회의실별 예약 현황
        const roomStats = rooms.map(room => {
            const roomReservations = todayReservations.filter(reservation => 
                reservation.roomId === room.id
            )
            
            return {
                roomId: room.id,
                roomName: room.name,
                totalReservations: roomReservations.length,
                availableHours: timeSlots.length - roomReservations.length,
                utilization: Math.round((roomReservations.length / timeSlots.length) * 100)
            }
        }).sort((a, b) => b.utilization - a.utilization) // 활용도 높은 순으로 정렬
        
        return {
            total: todayReservations.length,
            my: myReservations.length,
            participating: participatingReservations.length,
            roomStats: roomStats
        }
    }
    
    const reservationStats = calculateReservationStats()
    
    // 프로젝트별 색상 매핑
    const getProjectColor = (projectName) => {
        if (!projectName) return 'var(--accent-color)';
        
        switch(projectName) {
            case '기업 홍보 영상':
                return '#4CAF50'; // 녹색
            case '신제품 광고':
                return '#2196F3'; // 파란색
            case '웹 시리즈':
                return '#FF9800'; // 주황색
            case '다큐멘터리':
                return '#9C27B0'; // 보라색
            default:
                return 'var(--accent-color)';
        }
    };
    
    return (
        <div className={ss.roomReservation_wrap}>
            {/* 회의실 예약 헤더 */}
            <div className={ss.roomReservation_header}>
                <div>
                    <h1 className={ss.roomReservation_title}>Room Reservation</h1>
                    <p className={ss.roomReservation_date}>{formattedDate} {formattedTime}</p>
                </div>
                
                {/* 날짜 네비게이션 */}
                <div className={ss.roomReservation_controls}>
                    <button 
                        className={`${ss.roomReservation_btn} ${ss.today_btn}`}
                        onClick={goToToday}
                    >
                        <FaCalendarAlt />
                        Today
                    </button>
                    <div className={ss.navigation_buttons}>
                        <button 
                            className={ss.nav_btn}
                            onClick={goToPreviousDay}
                        >
                            <FaChevronLeft />
                        </button>
                        <button 
                            className={ss.nav_btn}
                            onClick={goToNextDay}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* 상태 메시지 표시 */}
            {statusMessage && (
                <div className={`${ss.status_message} ${ss[messageType]}`}>
                    {statusMessage}
                </div>
            )}
            
            <div className={ss.roomReservation_content}>
                {/* 회의실 목록 */}
                <div className={ss.room_list_card}>
                    <div className={ss.card_header}>
                        <div className={ss.card_icon}>
                            <FaBuilding />
                        </div>
                        <h2>회의실 목록</h2>
                    </div>
                    
                    <div className={ss.search_bar}>
                        <FaSearch className={ss.search_icon} />
                        <input
                            type="text"
                            placeholder="회의실 검색"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className={ss.filter_controls}>
                        <div className={ss.filter_item}>
                            <label>시설:</label>
                            <select 
                                value={filterFacility} 
                                onChange={(e) => setFilterFacility(e.target.value)}
                            >
                                <option value="">전체</option>
                                <option value="프로젝터">프로젝터</option>
                                <option value="화이트보드">화이트보드</option>
                                <option value="화상회의">화상회의 장비</option>
                                <option value="음향">음향 시스템</option>
                            </select>
                        </div>
                        <div className={ss.filter_item}>
                            <label>수용 인원:</label>
                            <select 
                                value={filterCapacity} 
                                onChange={(e) => setFilterCapacity(e.target.value)}
                            >
                                <option value="">전체</option>
                                <option value="5">5인 이하</option>
                                <option value="10">10인 이하</option>
                                <option value="20">20인 이하</option>
                                <option value="30">30인 이하</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className={ss.room_list}>
                        {filteredRooms.length === 0 ? (
                            <div className={ss.empty_state}>
                                <p>검색 결과가 없습니다.</p>
                            </div>
                        ) : (
                            filteredRooms.map(room => (
                                <div 
                                    key={room.id} 
                                    className={`${ss.room_item} ${selectedRoom?.id === room.id ? ss.selected : ''}`}
                                    onClick={() => handleRoomSelect(room)}
                                >
                                    <div className={ss.room_header}>
                                        <h3>{room.name}</h3>
                                        <span className={ss.room_capacity}>
                                            <FaUsers /> {room.capacity}명
                                        </span>
                                    </div>
                                    <div className={ss.room_facilities}>
                                        {room.facilities.map((facility, index) => (
                                            <span key={index} className={ss.facility_tag}>
                                                {facility === '프로젝터' && <FaProjectDiagram />}
                                                {facility === '화이트보드' && <FaEdit />}
                                                {facility === '화상회의 장비' && <FaUsers />}
                                                {facility === '음향 시스템' && <FaClock />}
                                                {facility}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* 예약 일정 */}
                <div className={ss.schedule_card}>
                    <div className={ss.card_header}>
                        <div className={ss.card_icon}>
                            <FaCalendarAlt />
                        </div>
                        <h2>예약 일정</h2>
                    </div>
                    
                    {/* 예약 현황 요약 */}
                    <div className={ss.reservation_summary}>
                        <h3>예약 현황</h3>
                        <div className={ss.summary_stats}>
                            <div className={ss.stat_item}>
                                <div className={ss.stat_value}>{reservationStats.total}</div>
                                <div className={ss.stat_label}>전체 예약</div>
                            </div>
                            <div className={ss.stat_item}>
                                <div className={ss.stat_value}>{reservationStats.my}</div>
                                <div className={ss.stat_label}>내 예약</div>
                            </div>
                            <div className={ss.stat_item}>
                                <div className={ss.stat_value}>{reservationStats.participating}</div>
                                <div className={ss.stat_label}>참여 예약</div>
                            </div>
                        </div>
                        
                        <div className={ss.room_utilization}>
                            <h3>회의실 활용도</h3>
                            <div className={ss.utilization_list}>
                                {reservationStats.roomStats.slice(0, 3).map(stat => (
                                    <div key={stat.roomId} className={ss.utilization_item}>
                                        <div className={ss.room_name}>{stat.roomName}</div>
                                        <div className={ss.utilization_bar_container}>
                                            <div 
                                                className={ss.utilization_bar} 
                                                style={{width: `${stat.utilization}%`}}
                                            ></div>
                                        </div>
                                        <div className={ss.utilization_value}>{stat.utilization}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className={ss.schedule_grid}>
                        <div className={ss.time_column}>
                            {timeSlots.map(hour => (
                                <div key={hour} className={ss.time_slot}>
                                    {hour}:00
                                </div>
                            ))}
                        </div>
                        
                        <div className={ss.room_columns}>
                            {filteredRooms.map(room => (
                                <div key={room.id} className={ss.room_column}>
                                    <div className={ss.room_column_header}>
                                        {room.name}
                                    </div>
                                    <div className={ss.room_time_slots}>
                                        {timeSlots.map(hour => {
                                            const isReserved = isTimeSlotReserved(room.id, hour)
                                            const reservation = getReservationAtTimeSlot(room.id, hour)
                                            
                                            return (
                                                <div 
                                                    key={hour} 
                                                    className={`${ss.room_time_slot} ${isReserved ? ss.reserved : ''}`}
                                                    onClick={() => isReserved 
                                                        ? handleReservationClick(reservation) 
                                                        : handleAddReservation(room.id)
                                                    }
                                                >
                                                    {isReserved ? (
                                                        <div 
                                                            className={ss.reservation_info}
                                                            style={{ backgroundColor: getProjectColor(reservation.project) }}
                                                        >
                                                            <div className={ss.reservation_title}>
                                                                {reservation.title}
                                                            </div>
                                                            <div className={ss.reservation_time}>
                                                                {formatTime(reservation.start)} - {formatTime(reservation.end)}
                                                            </div>
                                                            <div className={ss.reservation_details}>
                                                                <div className={ss.reservation_project}>
                                                                    {reservation.project || '일반 회의'}
                                                                </div>
                                                                <div className={ss.reservation_participants}>
                                                                    {reservation.participants && 
                                                                     reservation.participants.length > 0 ? (
                                                                        <div className={ss.participants_preview}>
                                                                            {reservation.participants.slice(0, 3).map(participantId => {
                                                                                const participant = users.find(user => user.id === participantId);
                                                                                return participant ? (
                                                                                    <div key={participantId} className={ss.participant_preview}>
                                                                                        <img 
                                                                                            src={participant.avatar} 
                                                                                            alt={participant.name}
                                                                                            className={ss.participant_avatar_small}
                                                                                        />
                                                                                    </div>
                                                                                ) : null;
                                                                            })}
                                                                            {reservation.participants.length > 3 && (
                                                                                <div className={ss.more_participants}>
                                                                                    +{reservation.participants.length - 3}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className={ss.no_participants}>참석자 없음</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={ss.add_reservation}>
                                                            <FaPlus />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 예약 폼 모달 */}
            {showReservationForm && (
                <ReservationModal
                    isOpen={showReservationForm}
                    selectedRoom={selectedRoom}
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
            )}
        </div>
    )
}

export default RoomReservation 