import React, { useState, useEffect } from 'react'
import ss from './AdminRoom.module.css'
import { FaPlus, FaEdit, FaTrash, FaClock, FaUsers, FaMapMarkerAlt, FaTools, FaCalendarAlt } from 'react-icons/fa'
import api from '../../../utils/api'

const AdminRoom = () => {
    const [rooms, setRooms] = useState([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingRoom, setEditingRoom] = useState(null)
    const [newRoom, setNewRoom] = useState({
        roomName: '',
        location: '',
        tools: []
    })
    const [newTool, setNewTool] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)

    // 회의실 목록 로드
    const fetchRooms = async () => {
        setLoading(true)
        try {
            const response = await api.get('/rooms')
            setRooms(response.data)
        } catch (error) {
            console.error('회의실 목록 조회 실패:', error)
            alert('회의실 목록을 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // 컴포넌트 마운트 시 회의실 목록 로드
    useEffect(() => {
        fetchRooms()
    }, [])

    // 새 회의실 추가
    const handleAddRoom = async () => {
        if (!newRoom.roomName.trim()) {
            alert('회의실 이름을 입력해주세요.')
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/rooms', newRoom)
            setRooms([response.data, ...rooms])
            setNewRoom({ roomName: '', location: '', tools: [] })
            setShowAddModal(false)
        } catch (error) {
            console.error('회의실 추가 실패:', error)
            alert('회의실 추가에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // 회의실 수정
    const handleEditRoom = async () => {
        if (!editingRoom.roomName.trim()) {
            alert('회의실 이름을 입력해주세요.')
            return
        }

        setLoading(true)
        try {
            const response = await api.post(`/rooms/${editingRoom._id}/update`, {
                roomName: editingRoom.roomName,
                location: editingRoom.location,
                tools: editingRoom.tools
            })
            setRooms(rooms.map(room => 
                room._id === editingRoom._id ? response.data : room
            ))
            setShowEditModal(false)
            setEditingRoom(null)
        } catch (error) {
            console.error('회의실 수정 실패:', error)
            alert('회의실 수정에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // 회의실 삭제
    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('정말 이 회의실을 삭제하시겠습니까?')) {
            return
        }

        setLoading(true)
        try {
            await api.post(`/rooms/${roomId}/delete`)
            setRooms(rooms.filter(room => room._id !== roomId))
        } catch (error) {
            console.error('회의실 삭제 실패:', error)
            alert(error.response?.data?.message || '회의실 삭제에 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    // 도구 추가
    const addTool = (isEdit = false) => {
        if (newTool.trim()) {
            if (isEdit) {
                setEditingRoom({
                    ...editingRoom,
                    tools: [...editingRoom.tools, newTool.trim()]
                })
            } else {
                setNewRoom({
                    ...newRoom,
                    tools: [...newRoom.tools, newTool.trim()]
                })
            }
            setNewTool('')
        }
    }

    // 도구 제거
    const removeTool = (index, isEdit = false) => {
        if (isEdit) {
            setEditingRoom({
                ...editingRoom,
                tools: editingRoom.tools.filter((_, i) => i !== index)
            })
        } else {
            setNewRoom({
                ...newRoom,
                tools: newRoom.tools.filter((_, i) => i !== index)
            })
        }
    }

    // 오늘의 예약 가져오기
    const getTodayReservations = () => {
        const today = new Date().toDateString()
        const todayReservations = []
        
        rooms.forEach(room => {
            room.reservations.forEach(reservation => {
                if (new Date(reservation.startTime).toDateString() === today && 
                    reservation.status === '예약됨') {
                    todayReservations.push({
                        ...reservation,
                        roomName: room.roomName
                    })
                }
            })
        })
        
        return todayReservations.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    }

    // 선택된 날짜의 예약 가져오기
    const getSelectedDateReservations = () => {
        const selectedDateObj = new Date(selectedDate).toDateString()
        const dateReservations = []
        
        rooms.forEach(room => {
            room.reservations.forEach(reservation => {
                if (new Date(reservation.startTime).toDateString() === selectedDateObj && 
                    reservation.status === '예약됨') {
                    dateReservations.push({
                        ...reservation,
                        roomName: room.roomName
                    })
                }
            })
        })
        
        return dateReservations.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    }

    // 현재 진행 중인 회의 확인
    const getCurrentMeetings = () => {
        const now = new Date()
        const currentMeetings = []
        
        rooms.forEach(room => {
            room.reservations.forEach(reservation => {
                const startTime = new Date(reservation.startTime)
                const endTime = new Date(reservation.endTime)
                
                if (now >= startTime && now <= endTime && reservation.status === '예약됨') {
                    currentMeetings.push({
                        ...reservation,
                        roomName: room.roomName
                    })
                }
            })
        })
        
        return currentMeetings
    }

    // 시간 포맷팅
    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    const todayReservations = getTodayReservations()
    const selectedDateReservations = getSelectedDateReservations()
    const currentMeetings = getCurrentMeetings()

  return (
        <div className={ss.adminRoom}>
            {/* 헤더 */}
            <div className={ss.header}>
                <div className={ss.headerLeft}>
                    <h2>회의실 관리</h2>
                    <p>회의실 정보와 예약 현황을 관리합니다</p>
                </div>
                <button 
                    className={ss.addBtn}
                    onClick={() => setShowAddModal(true)}
                    disabled={loading}
                >
                    <FaPlus /> {loading ? '로딩 중...' : '회의실 추가'}
                </button>
            </div>

            {/* 현재 진행 중인 회의 */}
            {currentMeetings.length > 0 && (
                <div className={ss.currentMeetings}>
                    <h3><FaClock /> 현재 진행 중인 회의</h3>
                    <div className={ss.meetingCards}>
                        {currentMeetings.map(meeting => (
                            <div key={meeting._id} className={ss.currentMeetingCard}>
                                <div className={ss.meetingInfo}>
                                    <h4>{meeting.meetingName}</h4>
                                    <p className={ss.roomName}>{meeting.roomName}</p>
                                    <p className={ss.time}>
                                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                                    </p>
                                </div>
                                <div className={ss.participants}>
                                    <FaUsers />
                                    <span>{meeting.participants.length}명</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={ss.mainContent}>
                {/* 회의실 목록 */}
                <div className={ss.roomSection}>
                    <h3>회의실 목록</h3>
                    {loading ? (
                        <div className={ss.loadingState}>
                            <p>로딩 중...</p>
                        </div>
                    ) : rooms.length > 0 ? (
                        <div className={ss.roomGrid}>
                            {rooms.map(room => (
                                <div key={room._id} className={ss.roomCard}>
                                    <div className={ss.roomHeader}>
                                        <h4>{room.roomName}</h4>
                                        <div className={ss.roomActions}>
                                            <button 
                                                className={ss.editBtn}
                                                onClick={() => {
                                                    setEditingRoom(room)
                                                    setShowEditModal(true)
                                                }}
                                                disabled={loading}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className={ss.deleteBtn}
                                                onClick={() => handleDeleteRoom(room._id)}
                                                disabled={loading}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className={ss.roomInfo}>
                                        <p><FaMapMarkerAlt /> {room.location}</p>
                                        <div className={ss.tools}>
                                            <FaTools />
                                            <span>{room.tools.length > 0 ? room.tools.join(', ') : '장비 없음'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={ss.reservationCount}>
                                        <span>예약: {room.reservations.filter(r => r.status === '예약됨').length}건</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={ss.emptyRoomState}>
                            <p>등록된 회의실이 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* 예약 현황 */}
                <div className={ss.reservationSection}>
                    <div className={ss.sectionHeader}>
                        <h3><FaCalendarAlt /> 예약 현황</h3>
                        <div className={ss.dateSelector}>
                            <label>날짜 선택:</label>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {selectedDateReservations.length > 0 ? (
                        <div className={ss.reservationList}>
                            {selectedDateReservations.map(reservation => (
                                <div key={reservation._id} className={ss.reservationCard}>
                                    <div className={ss.reservationHeader}>
                                        <h4>{reservation.meetingName}</h4>
                                        <span className={ss.roomBadge}>{reservation.roomName}</span>
                                    </div>
                                    
                                    <div className={ss.reservationDetails}>
                                        <p className={ss.time}>
                                            <FaClock />
                                            {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                                        </p>
                                        
                                        <p className={ss.participants}>
                                            <FaUsers />
                                            {reservation.participants.map(p => p.userId.name).join(', ')}
                                        </p>
                                        
                                        {reservation.meetingDescription && (
                                            <p className={ss.description}>{reservation.meetingDescription}</p>
                                        )}
                                        
                                        {reservation.project && (
                                            <p className={ss.project}>
                                                프로젝트: {typeof reservation.project === 'object' ? reservation.project.name : reservation.project}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={ss.noReservations}>
                            <p>선택한 날짜에 예약이 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 회의실 추가 모달 */}
            {showAddModal && (
                <div className={ss.modal}>
                    <div className={ss.modalContent}>
                        <h3>새 회의실 추가</h3>
                        
                        <div className={ss.formGroup}>
                            <label>회의실 이름</label>
                            <input 
                                type="text"
                                value={newRoom.roomName}
                                onChange={(e) => setNewRoom({...newRoom, roomName: e.target.value})}
                                placeholder="회의실 이름을 입력하세요"
                            />
                        </div>
                        
                        <div className={ss.formGroup}>
                            <label>위치</label>
                            <input 
                                type="text"
                                value={newRoom.location}
                                onChange={(e) => setNewRoom({...newRoom, location: e.target.value})}
                                placeholder="위치를 입력하세요"
                            />
                        </div>
                        
                        <div className={ss.formGroup}>
                            <label>장비/도구</label>
                            <div className={ss.toolInput}>
                                <input 
                                    type="text"
                                    value={newTool}
                                    onChange={(e) => setNewTool(e.target.value)}
                                    placeholder="장비명을 입력하세요"
                                    onKeyPress={(e) => e.key === 'Enter' && addTool()}
                                />
                                <button type="button" onClick={() => addTool()}>추가</button>
                            </div>
                            
                            <div className={ss.toolList}>
                                {newRoom.tools.map((tool, index) => (
                                    <span key={index} className={ss.toolTag}>
                                        {tool}
                                        <button onClick={() => removeTool(index)}>×</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className={ss.modalActions}>
                            <button className={ss.cancelBtn} onClick={() => setShowAddModal(false)}>
                                취소
                            </button>
                            <button className={ss.saveBtn} onClick={handleAddRoom} disabled={loading}>
                                {loading ? '추가 중...' : '추가'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 회의실 수정 모달 */}
            {showEditModal && editingRoom && (
                <div className={ss.modal}>
                    <div className={ss.modalContent}>
                        <h3>회의실 수정</h3>
                        
                        <div className={ss.formGroup}>
                            <label>회의실 이름</label>
                            <input 
                                type="text"
                                value={editingRoom.roomName}
                                onChange={(e) => setEditingRoom({...editingRoom, roomName: e.target.value})}
                            />
                        </div>
                        
                        <div className={ss.formGroup}>
                            <label>위치</label>
                            <input 
                                type="text"
                                value={editingRoom.location}
                                onChange={(e) => setEditingRoom({...editingRoom, location: e.target.value})}
                            />
                        </div>
                        
                        <div className={ss.formGroup}>
                            <label>장비/도구</label>
                            <div className={ss.toolInput}>
                                <input 
                                    type="text"
                                    value={newTool}
                                    onChange={(e) => setNewTool(e.target.value)}
                                    placeholder="장비명을 입력하세요"
                                    onKeyPress={(e) => e.key === 'Enter' && addTool(true)}
                                />
                                <button type="button" onClick={() => addTool(true)}>추가</button>
                            </div>
                            
                            <div className={ss.toolList}>
                                {editingRoom.tools.map((tool, index) => (
                                    <span key={index} className={ss.toolTag}>
                                        {tool}
                                        <button onClick={() => removeTool(index, true)}>×</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className={ss.modalActions}>
                            <button className={ss.cancelBtn} onClick={() => setShowEditModal(false)}>
                                취소
                            </button>
                            <button className={ss.saveBtn} onClick={handleEditRoom} disabled={loading}>
                                {loading ? '수정 중...' : '수정'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
  )
}

export default AdminRoom