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
    FaProjectDiagram
} from 'react-icons/fa'
import { 
    rooms as initialRooms, 
    roomReservations as initialReservations, 
    addReservation, 
    updateReservation, 
    deleteReservation, 
    users, 
    currentUser 
} from '../../data/mockDatabase'

const RoomReservation = () => {
    const navigate = useNavigate()
    
    // 상태 관리
    const [rooms, setRooms] = useState([])
    const [reservations, setReservations] = useState([])
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [showReservationForm, setShowReservationForm] = useState(false)
    const [selectedReservation, setSelectedReservation] = useState(null)
    const [reservationFormData, setReservationFormData] = useState({
        title: '',
        start: '',
        end: '',
        participants: []
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterFacility, setFilterFacility] = useState('')
    const [filterCapacity, setFilterCapacity] = useState('')
    
    // 초기 데이터 로드
    useEffect(() => {
        setRooms(initialRooms)
        setReservations(initialReservations)
    }, [])
    
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
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }
    
    const formatTime = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
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
            participants: [currentUser.id]
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
            participants: reservation.participants || []
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
    
    const handleFormSubmit = (e) => {
        e.preventDefault()
        
        const reservationData = {
            roomId: selectedRoom.id,
            userId: currentUser.id,
            title: reservationFormData.title,
            start: reservationFormData.start,
            end: reservationFormData.end,
            participants: reservationFormData.participants
        }
        
        if (selectedReservation) {
            // 예약 수정
            const updatedReservation = updateReservation(selectedReservation.id, reservationData)
            setReservations(reservations.map(reservation => 
                reservation.id === selectedReservation.id ? updatedReservation : reservation
            ))
        } else {
            // 새 예약 추가
            const newReservation = addReservation(reservationData)
            setReservations([...reservations, newReservation])
        }
        
        // 폼 닫기
        setShowReservationForm(false)
        setSelectedReservation(null)
    }
    
    const handleDeleteReservation = () => {
        if (selectedReservation) {
            deleteReservation(selectedReservation.id)
            setReservations(reservations.filter(reservation => reservation.id !== selectedReservation.id))
            setShowReservationForm(false)
            setSelectedReservation(null)
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
    
    return (
        <div className={ss.roomReservationContainer}>
            <div className={ss.header}>
                <h1>회의실 예약</h1>
                <p>회의실 예약 및 관리 시스템입니다.</p>
            </div>
            
            <div className={ss.contentWrapper}>
                {/* 회의실 목록 */}
                <div className={ss.roomListSection}>
                    <div className={ss.sectionHeader}>
                        <h2>회의실 목록</h2>
                        <div className={ss.searchBar}>
                            <FaSearch className={ss.searchIcon} />
                            <input
                                type="text"
                                placeholder="회의실 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className={ss.filterControls}>
                        <div className={ss.filterItem}>
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
                        <div className={ss.filterItem}>
                            <label>수용 인원:</label>
                            <select 
                                value={filterCapacity} 
                                onChange={(e) => setFilterCapacity(e.target.value)}
                            >
                                <option value="">전체</option>
                                <option value="4">4명 이상</option>
                                <option value="6">6명 이상</option>
                                <option value="10">10명 이상</option>
                                <option value="20">20명 이상</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className={ss.roomList}>
                        {filteredRooms.length === 0 ? (
                            <div className={ss.emptyState}>
                                <p>검색 결과가 없습니다.</p>
                            </div>
                        ) : (
                            filteredRooms.map(room => (
                                <div 
                                    key={room.id} 
                                    className={`${ss.roomItem} ${selectedRoom?.id === room.id ? ss.selected : ''}`}
                                    onClick={() => handleRoomSelect(room)}
                                >
                                    <div className={ss.roomHeader}>
                                        <h3>{room.name}</h3>
                                        <span className={ss.roomCapacity}>
                                            <FaUsers /> {room.capacity}명
                                        </span>
                                    </div>
                                    <div className={ss.roomFacilities}>
                                        {room.facilities.map((facility, index) => (
                                            <span key={index} className={ss.facilityTag}>
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
                <div className={ss.scheduleSection}>
                    <div className={ss.dateNavigation}>
                        <button 
                            className={ss.todayButton}
                            onClick={goToToday}
                        >
                            오늘
                        </button>
                        <div className={ss.navigationButtons}>
                            <button onClick={goToPreviousDay}><FaChevronLeft /></button>
                            <span className={`${ss.currentDate} ${isToday(currentDate) ? ss.today : ''}`}>
                                {formatDate(currentDate)}
                            </span>
                            <button onClick={goToNextDay}><FaChevronRight /></button>
                        </div>
                    </div>
                    
                    <div className={ss.scheduleGrid}>
                        <div className={ss.timeColumn}>
                            {timeSlots.map(hour => (
                                <div key={hour} className={ss.timeSlot}>
                                    {hour}:00
                                </div>
                            ))}
                        </div>
                        
                        <div className={ss.roomColumns}>
                            {filteredRooms.map(room => (
                                <div key={room.id} className={ss.roomColumn}>
                                    <div className={ss.roomColumnHeader}>
                                        {room.name}
                                    </div>
                                    <div className={ss.roomTimeSlots}>
                                        {timeSlots.map(hour => {
                                            const isReserved = isTimeSlotReserved(room.id, hour)
                                            const reservation = getReservationAtTimeSlot(room.id, hour)
                                            
                                            return (
                                                <div 
                                                    key={hour} 
                                                    className={`${ss.roomTimeSlot} ${isReserved ? ss.reserved : ''}`}
                                                    onClick={() => isReserved 
                                                        ? handleReservationClick(reservation) 
                                                        : handleAddReservation(room.id)
                                                    }
                                                >
                                                    {isReserved ? (
                                                        <div className={ss.reservationInfo}>
                                                            <div className={ss.reservationTitle}>
                                                                {reservation.title}
                                                            </div>
                                                            <div className={ss.reservationTime}>
                                                                {formatTime(reservation.start)} - {formatTime(reservation.end)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={ss.addReservation}>
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
                <div className={ss.modalOverlay}>
                    <div className={ss.modal}>
                        <div className={ss.modalHeader}>
                            <h2>{selectedReservation ? '예약 수정' : '새 예약 추가'}</h2>
                            <button 
                                className={ss.closeButton}
                                onClick={handleCancelForm}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className={ss.formGroup}>
                                <label htmlFor="room">회의실</label>
                                <input
                                    type="text"
                                    id="room"
                                    value={selectedRoom.name}
                                    disabled
                                />
                            </div>
                            <div className={ss.formGroup}>
                                <label htmlFor="title">회의 제목</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={reservationFormData.title}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="회의 제목을 입력하세요"
                                />
                            </div>
                            <div className={ss.formRow}>
                                <div className={ss.formGroup}>
                                    <label htmlFor="start">시작 시간</label>
                                    <input
                                        type="datetime-local"
                                        id="start"
                                        name="start"
                                        value={reservationFormData.start}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className={ss.formGroup}>
                                    <label htmlFor="end">종료 시간</label>
                                    <input
                                        type="datetime-local"
                                        id="end"
                                        name="end"
                                        value={reservationFormData.end}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={ss.formGroup}>
                                <label>참석자</label>
                                <div className={ss.participantsList}>
                                    {users.map(user => (
                                        <div 
                                            key={user.id} 
                                            className={`${ss.participantItem} ${reservationFormData.participants.includes(user.id) ? ss.selected : ''}`}
                                            onClick={() => handleParticipantChange(user.id)}
                                        >
                                            <img 
                                                src={user.avatar} 
                                                alt={user.name} 
                                                className={ss.participantAvatar}
                                            />
                                            <span className={ss.participantName}>{user.name}</span>
                                            {reservationFormData.participants.includes(user.id) && (
                                                <FaCheck className={ss.checkIcon} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={ss.formActions}>
                                {selectedReservation && (
                                    <button 
                                        type="button" 
                                        className={ss.deleteButton}
                                        onClick={handleDeleteReservation}
                                    >
                                        <FaTrash /> 삭제
                                    </button>
                                )}
                                <button 
                                    type="button" 
                                    className={ss.cancelButton}
                                    onClick={handleCancelForm}
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit" 
                                    className={ss.saveButton}
                                >
                                    {selectedReservation ? '수정' : '예약'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RoomReservation 