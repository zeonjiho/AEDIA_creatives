import React, { useState, useEffect } from 'react'
import ss from './AdminRoom.module.css'
import { FaPlus, FaEdit, FaTrash, FaClock, FaUsers, FaMapMarkerAlt, FaTools, FaCalendarAlt } from 'react-icons/fa'
import api from '../../../utils/api'

const AdminRoom = () => {
    const [rooms, setRooms] = useState([])
    const [reservations, setReservations] = useState([]) // 모든 예약 데이터
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
    const [reservationsLoading, setReservationsLoading] = useState(false)

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

    // 모든 회의실의 예약 데이터 로드
    const fetchAllReservations = async () => {
        if (rooms.length === 0) return
        
        setReservationsLoading(true)
        try {
            const allReservations = []
            
            // 각 회의실별로 예약 데이터 가져오기
            for (const room of rooms) {
                try {
                    const response = await api.get(`/rooms/${room._id}/reservations`)
                    const roomReservations = response.data.map(reservation => ({
                        ...reservation,
                        roomId: room._id,
                        roomName: room.roomName,
                        roomLocation: room.location
                    }))
                    allReservations.push(...roomReservations)
                } catch (error) {
                    console.error(`회의실 ${room.roomName} 예약 조회 실패:`, error)
                    // 개별 회의실 예약 조회 실패는 전체를 막지 않음
                }
            }
            
            setReservations(allReservations)
        } catch (error) {
            console.error('예약 목록 조회 실패:', error)
        } finally {
            setReservationsLoading(false)
        }
    }

    // 컴포넌트 마운트 시 회의실 목록 로드
    useEffect(() => {
        fetchRooms()
    }, [])

    // 회의실 목록이 로드된 후 예약 데이터 로드
    useEffect(() => {
        if (rooms.length > 0) {
            fetchAllReservations()
        }
    }, [rooms])

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
            // 새 회의실은 예약이 없으므로 예약 데이터 재로드 불필요
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
            
            // 회의실 정보가 변경되었으므로 예약 데이터의 회의실 정보도 업데이트
            setReservations(reservations.map(reservation => 
                reservation.roomId === editingRoom._id 
                    ? { ...reservation, roomName: response.data.roomName, roomLocation: response.data.location }
                    : reservation
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
            // 삭제된 회의실의 예약도 제거
            setReservations(reservations.filter(reservation => reservation.roomId !== roomId))
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
        return reservations.filter(reservation => {
            const reservationDate = new Date(reservation.startTime).toDateString()
            return reservationDate === today
        }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    }

    // 선택된 날짜의 예약 가져오기
    const getSelectedDateReservations = () => {
        const selectedDateObj = new Date(selectedDate).toDateString()
        return reservations.filter(reservation => {
            const reservationDate = new Date(reservation.startTime).toDateString()
            return reservationDate === selectedDateObj
        }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    }

    // 현재 진행 중인 회의 확인
    const getCurrentMeetings = () => {
        const now = new Date()
        return reservations.filter(reservation => {
            const startTime = new Date(reservation.startTime)
            const endTime = new Date(reservation.endTime)
            return now >= startTime && now <= endTime
        })
    }

    // 각 회의실별 예약 개수 계산
    const getRoomReservationCount = (roomId) => {
        return reservations.filter(reservation => reservation.roomId === roomId).length
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
            {reservationsLoading ? (
                <div className={ss.currentMeetings}>
                    <h3><FaClock /> 현재 진행 중인 회의</h3>
                    <div className={ss.loadingState}>
                        <p>회의 정보를 불러오는 중...</p>
                    </div>
                </div>
            ) : currentMeetings.length > 0 && (
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
                                    <span>
                                        {meeting.participants && meeting.participants.length > 0 
                                            ? `${meeting.participants.length}명`
                                            : '0명'
                                        }
                                    </span>
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
                                        <span>예약: {getRoomReservationCount(room._id)}건</span>
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
                    
                    {reservationsLoading ? (
                        <div className={ss.loadingState}>
                            <p>예약 정보를 불러오는 중...</p>
                        </div>
                    ) : selectedDateReservations.length > 0 ? (
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
                                            {reservation.participants && reservation.participants.length > 0 
                                                ? reservation.participants.map(p => 
                                                    typeof p.userId === 'object' ? p.userId.name : p.userId
                                                  ).join(', ')
                                                : '참여자 정보 없음'
                                            }
                                        </p>
                                        
                                        {reservation.meetingDescription && (
                                            <p className={ss.description}>{reservation.meetingDescription}</p>
                                        )}
                                        
                                        {reservation.project && (
                                            <p className={ss.project}>
                                                프로젝트: {typeof reservation.project === 'object' 
                                                    ? reservation.project.title || reservation.project.name
                                                    : reservation.project}
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