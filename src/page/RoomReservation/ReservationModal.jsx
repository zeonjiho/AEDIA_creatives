import React from 'react'
import { FaTimes, FaSearch, FaCheck, FaTrash } from 'react-icons/fa'
import styles from './ReservationModal.module.css'

const ReservationModal = ({
    isOpen,
    selectedRoom,
    selectedReservation,
    reservationFormData,
    projectSearchTerm,
    filteredProjects,
    users,
    onClose,
    onFormChange,
    onProjectSearchChange,
    onProjectSelect,
    onParticipantChange,
    onSubmit,
    onDelete,
    onClearProject
}) => {
    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        // 폼 유효성 검사
        if (!reservationFormData.title.trim()) {
            alert('회의 제목을 입력해주세요.')
            return
        }
        
        if (!reservationFormData.start) {
            alert('시작 시간을 선택해주세요.')
            return
        }
        
        if (!reservationFormData.end) {
            alert('종료 시간을 선택해주세요.')
            return
        }
        
        // 시작 시간이 종료 시간보다 이후인지 확인
        const startTime = new Date(reservationFormData.start)
        const endTime = new Date(reservationFormData.end)
        
        if (startTime >= endTime) {
            alert('종료 시간은 시작 시간보다 나중이어야 합니다.')
            return
        }
        
        // 모든 유효성 검사를 통과하면 onSubmit 호출
        onSubmit(e)
    }

    return (
        <div className={styles.modal_overlay}>
            <div className={styles.modal}>
                <div className={styles.modal_header}>
                    <h2>{selectedReservation ? '예약 수정' : '새 예약 추가'}</h2>
                    <button 
                        className={styles.close_button}
                        onClick={onClose}
                    >
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.form_group}>
                        <label htmlFor="room">회의실</label>
                        <input
                            type="text"
                            id="room"
                            value={selectedRoom.name}
                            disabled
                        />
                    </div>
                    <div className={styles.form_group}>
                        <label htmlFor="title">회의 제목</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={reservationFormData.title}
                            onChange={onFormChange}
                            required
                            placeholder="회의 제목을 입력하세요"
                        />
                    </div>
                    <div className={styles.form_group}>
                        <label htmlFor="project">프로젝트</label>
                        <div className={styles.project_selector}>
                            <div className={styles.project_search}>
                                <input
                                    type="text"
                                    id="project_search"
                                    value={projectSearchTerm}
                                    onChange={onProjectSearchChange}
                                    placeholder="프로젝트 검색..."
                                    className={styles.project_search_input}
                                />
                                <div className={styles.search_icon}>
                                    <FaSearch />
                                </div>
                            </div>
                            
                            {projectSearchTerm && (
                                <div className={styles.project_dropdown}>
                                    {filteredProjects.length > 0 ? (
                                        filteredProjects.map(project => (
                                            <div 
                                                key={project.id} 
                                                className={styles.project_item}
                                                onClick={() => onProjectSelect(project.id)}
                                            >
                                                <div className={styles.project_title}>{project.title}</div>
                                                <div className={styles.project_description}>{project.description}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.no_results}>검색 결과가 없습니다</div>
                                    )}
                                </div>
                            )}
                            
                            <div className={styles.selected_project}>
                                {reservationFormData.project ? (
                                    <div className={styles.project_tag}>
                                        {reservationFormData.project}
                                        <button 
                                            type="button" 
                                            className={styles.clear_project}
                                            onClick={onClearProject}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.no_project}>선택된 프로젝트 없음</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.form_row}>
                        <div className={styles.form_group}>
                            <label htmlFor="start">시작 시간</label>
                            <input
                                type="datetime-local"
                                id="start"
                                name="start"
                                value={reservationFormData.start}
                                onChange={onFormChange}
                                required
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label htmlFor="end">종료 시간</label>
                            <input
                                type="datetime-local"
                                id="end"
                                name="end"
                                value={reservationFormData.end}
                                onChange={onFormChange}
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.form_group}>
                        <label>참석자</label>
                        <div className={styles.participants_list}>
                            {users.map(user => (
                                <div 
                                    key={user.id} 
                                    className={`${styles.participant_item} ${reservationFormData.participants.includes(user.id) ? styles.selected : ''}`}
                                    onClick={() => onParticipantChange(user.id)}
                                >
                                    <img 
                                        src={user.avatar} 
                                        alt={user.name} 
                                        className={styles.participant_avatar}
                                    />
                                    <span className={styles.participant_name}>{user.name}</span>
                                    {reservationFormData.participants.includes(user.id) && (
                                        <FaCheck className={styles.check_icon} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.form_actions}>
                        {selectedReservation && (
                            <button 
                                type="button" 
                                className={styles.delete_button}
                                onClick={onDelete}
                            >
                                <FaTrash /> 삭제
                            </button>
                        )}
                        <button 
                            type="button" 
                            className={styles.cancel_button}
                            onClick={onClose}
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            className={styles.save_button}
                        >
                            {selectedReservation ? '수정' : '예약'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReservationModal 