import React, { useState, useEffect } from 'react';
import styles from './ReservationModal.module.css';
import { HiX, HiCalendar, HiClock, HiOfficeBuilding, HiDocumentText, HiBookmark, HiUserGroup, HiPencilAlt } from 'react-icons/hi';
import ProjectSelectModal from '../../components/ProjectSelectModal';

const ReservationModal = ({ isOpen, selectedRoom, selectedReservation, reservationFormData, projectSearchTerm, filteredProjects, users, onClose, onFormChange, onProjectSearchChange, onProjectSelect, onParticipantChange, onSubmit, onDelete, onClearProject }) => {
    const [showProjectModal, setShowProjectModal] = useState(false);
    
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // 폼 유효성 검사
        if (!reservationFormData.title.trim()) {
            alert('회의 제목을 입력해주세요.');
            return;
        }
        
        if (!reservationFormData.startDate) {
            alert('시작 날짜를 선택해주세요.');
            return;
        }
        
        if (!reservationFormData.startTime) {
            alert('시작 시간을 선택해주세요.');
            return;
        }
        
        if (!reservationFormData.endTime) {
            alert('종료 시간을 선택해주세요.');
            return;
        }
        
        if (!reservationFormData.participants || reservationFormData.participants.length === 0) {
            console.log('참여인원 검증 실행:', {
                participants: reservationFormData.participants,
                length: reservationFormData.participants?.length
            });
            alert('참여인원을 최소 1명 이상 선택해주세요.');
            return;
        }
        
        // 날짜와 시간을 정확하게 결합하여 DateTime 객체 생성
        const startDateTimeString = `${reservationFormData.startDate} ${reservationFormData.startTime}:00`;
        const endDateTimeString = `${reservationFormData.endDate} ${reservationFormData.endTime}:00`;
        
        const startDateTime = new Date(startDateTimeString);
        const endDateTime = new Date(endDateTimeString);
        
        // 유효한 날짜인지 확인
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            alert('날짜나 시간 형식이 올바르지 않습니다.');
            return;
        }
        
        // 시작 시간이 종료 시간보다 이후인지 확인
        if (startDateTime >= endDateTime) {
            alert('종료 시간은 시작 시간보다 나중이어야 합니다.');
            return;
        }
        
        // 과거 시간 예약 방지
        const now = new Date();
        if (startDateTime < now) {
            alert('과거 시간으로는 예약할 수 없습니다.');
            return;
        }
        
        // 최소 예약 시간 확인 (예: 30분 이상)
        const durationMinutes = (endDateTime - startDateTime) / (1000 * 60);
        if (durationMinutes < 30) {
            alert('예약은 최소 30분 이상이어야 합니다.');
            return;
        }
        
        // 모든 유효성 검사를 통과하면 onSubmit 호출
        onSubmit(e);
    };

    // 참여자 선택 핸들러
    const handleParticipantToggle = (userId) => {
        onParticipantChange(userId);
    };

    // 선택된 참여자 목록
    const selectedParticipants = users.filter(user => 
        reservationFormData.participants.includes(user.id)
    );

    // 프로젝트 선택 모달 열기
    const handleOpenProjectModal = () => {
        setShowProjectModal(true);
    };

    // 프로젝트 선택 처리
    const handleProjectSelect = (project) => {
        if (project) {
            onProjectSelect(project.id);
        } else {
            onClearProject();
        }
        setShowProjectModal(false);
    };
    
    return (
        <>
            <div className={styles.modal_wrapper}>
                <div className={styles.modal_background} onClick={onClose}></div>
                <div className={styles.modal_panel}>
                    <div className={styles.panel_header}>
                        <div className={styles.panel_title}>
                            <HiCalendar size={24} className={styles.title_icon} />
                            <h2>{selectedReservation ? '예약 수정' : '새 회의 예약'}</h2>
                        </div>
                        <button className={styles.close_button} onClick={onClose}>
                            <HiX size={24} />
                        </button>
                    </div>
                    
                    <div className={styles.panel_content}>
                        {selectedRoom && (
                            <div className={styles.room_preview}>
                                <div className={styles.room_preview_content}>
                                    <h3>{selectedRoom.roomName}</h3>
                                    <div className={styles.room_preview_info}>
                                        <span>
                                            <HiOfficeBuilding size={16} />
                                            {selectedRoom.location}
                                        </span>
                                        {selectedRoom.tools && selectedRoom.tools.length > 0 && (
                                            <div className={styles.room_facilities}>
                                                {selectedRoom.tools.map((tool, index) => (
                                                    <span key={index} className={styles.facility_tag}>
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <HiOfficeBuilding size={48} className={styles.room_preview_icon} />
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit} className={styles.modal_form}>
                            {/* 회의 제목 */}
                            <div className={styles.form_section}>
                                <h4 className={styles.section_title}>
                                    <HiDocumentText size={18} />
                                    회의 정보
                                </h4>
                                <div className={styles.form_group}>
                                    <label htmlFor="title">회의 제목</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={reservationFormData.title}
                                        onChange={onFormChange}
                                        placeholder="회의 제목을 입력하세요"
                                        className={styles.title_input}
                                    />
                                </div>
                                
                                <div className={styles.form_group}>
                                    <label htmlFor="description">회의 설명 (선택사항)</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={reservationFormData.description}
                                        onChange={onFormChange}
                                        placeholder="회의에 대한 간단한 설명을 입력하세요"
                                        className={styles.description_input}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* 날짜 및 시간 */}
                            <div className={styles.form_section}>
                                <h4 className={styles.section_title}>
                                    <HiClock size={18} />
                                    일정
                                </h4>
                                <div className={styles.datetime_container}>
                                    <div className={styles.date_row}>
                                        <div className={styles.form_group}>
                                            <label htmlFor="startDate">시작 날짜</label>
                                            <input
                                                type="date"
                                                id="startDate"
                                                name="startDate"
                                                value={reservationFormData.startDate}
                                                onChange={onFormChange}
                                                className={styles.date_input}
                                            />
                                        </div>
                                        <div className={styles.form_group}>
                                            <label htmlFor="endDate">종료 날짜</label>
                                            <input
                                                type="date"
                                                id="endDate"
                                                name="endDate"
                                                value={reservationFormData.endDate}
                                                onChange={onFormChange}
                                                className={styles.date_input}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.time_row}>
                                        <div className={styles.form_group}>
                                            <label htmlFor="startTime">시작 시간</label>
                                            <input
                                                type="time"
                                                id="startTime"
                                                name="startTime"
                                                value={reservationFormData.startTime}
                                                onChange={onFormChange}
                                                className={styles.time_input}
                                            />
                                        </div>
                                        <div className={styles.form_group}>
                                            <label htmlFor="endTime">종료 시간</label>
                                            <input
                                                type="time"
                                                id="endTime"
                                                name="endTime"
                                                value={reservationFormData.endTime}
                                                onChange={onFormChange}
                                                className={styles.time_input}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 프로젝트 */}
                            <div className={styles.form_section}>
                                <h4 className={styles.section_title}>
                                    <HiBookmark size={18} />
                                    프로젝트
                                </h4>
                                <div className={styles.form_group}>
                                    <label htmlFor="project">연결된 프로젝트 (선택사항)</label>
                                    <div className={styles.project_select_container}>
                                        <div className={styles.project_display}>
                                            {reservationFormData.project ? (
                                                <div className={styles.selected_project_display}>
                                                    <span className={styles.project_name}>{reservationFormData.project}</span>
                                                    <button
                                                        type="button"
                                                        className={styles.clear_project_btn}
                                                        onClick={onClearProject}
                                                    >
                                                        <HiX size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={styles.no_project_text}>선택된 프로젝트가 없습니다</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.select_project_btn}
                                            onClick={handleOpenProjectModal}
                                        >
                                            <HiBookmark size={16} />
                                            프로젝트 선택
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 참여인원 */}
                            <div className={styles.form_section}>
                                <h4 className={styles.section_title}>
                                    <HiUserGroup size={18} />
                                    참여인원
                                </h4>
                                <div className={styles.participants_section}>
                                    <div className={styles.selected_participants}>
                                        <label>선택된 참여자 ({selectedParticipants.length}명)</label>
                                        <div className={styles.participants_preview}>
                                            {selectedParticipants.map(participant => (
                                                <div key={participant.id} className={styles.participant_chip}>
                                                    <img 
                                                        src={participant.avatar || '/default-avatar.png'} 
                                                        alt={participant.name}
                                                        className={styles.participant_avatar}
                                                    />
                                                    <span>{participant.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleParticipantToggle(participant.id)}
                                                        className={styles.remove_participant}
                                                    >
                                                        <HiX size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className={styles.available_participants}>
                                        <label>팀 멤버</label>
                                        <div className={styles.participants_grid}>
                                            {users.length === 0 ? (
                                                <div className={styles.no_users}>
                                                    <p>사용자 목록을 불러오는 중...</p>
                                                </div>
                                            ) : (
                                                users.map(user => (
                                                    <div
                                                        key={user.id}
                                                        className={`${styles.participant_option} ${
                                                            reservationFormData.participants.includes(user.id) ? styles.selected : ''
                                                        }`}
                                                        onClick={() => handleParticipantToggle(user.id)}
                                                    >
                                                        <img 
                                                            src={user.avatar || '/default-avatar.png'} 
                                                            alt={user.name}
                                                            className={styles.participant_avatar}
                                                        />
                                                        <div className={styles.participant_info}>
                                                            <span className={styles.participant_name}>{user.name}</span>
                                                            <span className={styles.participant_role}>
                                                                {user.role}
                                                                {user.userType && (
                                                                    <span className={`${styles.user_type_badge} ${styles[user.userType]}`}>
                                                                        {user.userType === 'internal' ? '내부' : '외부'}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.button_group}>
                                <button type="button" className={styles.cancel_button} onClick={onClose}>
                                    취소
                                </button>
                                {selectedReservation && (
                                    <button type="button" className={styles.delete_button} onClick={onDelete}>
                                        삭제
                                    </button>
                                )}
                                <button type="submit" className={styles.submit_button}>
                                    {selectedReservation ? '수정하기' : '예약 등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* 프로젝트 선택 모달 */}
            <ProjectSelectModal
                isOpen={showProjectModal}
                projects={filteredProjects}
                selectedProject={reservationFormData.project}
                onSelect={handleProjectSelect}
                onClose={() => setShowProjectModal(false)}
            />
        </>
    );
};

export default ReservationModal; 