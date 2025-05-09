import React, { useState, useEffect } from 'react';
import styles from './ReservationModal.module.css';
import { HiX, HiCalendar, HiClock, HiOfficeBuilding, HiDocumentText, HiBookmark } from 'react-icons/hi';

const ReservationModal = ({ isOpen, selectedRoom, selectedReservation, reservationFormData, projectSearchTerm, filteredProjects, users, onClose, onFormChange, onProjectSearchChange, onProjectSelect, onParticipantChange, onSubmit, onDelete, onClearProject }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // 폼 유효성 검사
        if (!reservationFormData.title.trim()) {
            alert('회의 제목을 입력해주세요.');
            return;
        }
        
        if (!reservationFormData.start) {
            alert('시작 시간을 선택해주세요.');
            return;
        }
        
        if (!reservationFormData.end) {
            alert('종료 시간을 선택해주세요.');
            return;
        }
        
        // 시작 시간이 종료 시간보다 이후인지 확인
        const startTime = new Date(reservationFormData.start);
        const endTime = new Date(reservationFormData.end);
        
        if (startTime >= endTime) {
            alert('종료 시간은 시작 시간보다 나중이어야 합니다.');
            return;
        }
        
        // 모든 유효성 검사를 통과하면 onSubmit 호출
        onSubmit(e);
    };
    
    return (
        <div className={styles.modal_wrapper}>
            <div className={styles.modal_background} onClick={onClose}></div>
            <div className={styles.modal_panel}>
                <div className={styles.panel_header}>
                    <div className={styles.panel_title}>
                        <HiCalendar size={24} className={styles.title_icon} />
                        <h2>{selectedReservation ? '예약 수정' : '새 예약 등록'}</h2>
                    </div>
                    <button className={styles.close_button} onClick={onClose}>
                        <HiX size={24} />
                    </button>
                </div>
                
                <div className={styles.panel_content}>
                    {selectedRoom && (
                        <div className={styles.room_preview}>
                            <div className={styles.room_preview_content}>
                                <h3>{selectedRoom.name}</h3>
                                <div className={styles.room_preview_info}>
                                    <span>
                                        <HiOfficeBuilding size={16} />
                                        {selectedRoom.location}
                                    </span>
                                </div>
                            </div>
                            <HiOfficeBuilding size={48} className={styles.room_preview_icon} />
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className={styles.modal_form}>
                        <div className={styles.form_group}>
                            <label htmlFor="title">
                                <HiDocumentText size={16} />
                                예약 제목
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={reservationFormData.title}
                                onChange={onFormChange}
                                placeholder="예약 제목을 입력하세요"
                            />
                        </div>
                        
                        <div className={styles.form_group}>
                            <label htmlFor="project">
                                <HiBookmark size={16} />
                                프로젝트
                            </label>
                            <div className={styles.input_with_icon}>
                                <input
                                    type="text"
                                    id="project"
                                    value={reservationFormData.project}
                                    onClick={() => onProjectSearchChange({ target: { value: '' } })}
                                    placeholder="프로젝트를 선택하세요"
                                    readOnly
                                />
                            </div>
                            
                            {projectSearchTerm !== null && (
                                <div className={styles.project_selector}>
                                    {filteredProjects.map(project => (
                                        <div
                                            key={project.id}
                                            className={`${styles.project_item} ${reservationFormData.project === project.title ? styles.selected : ''}`}
                                            onClick={() => onProjectSelect(project.id)}
                                        >
                                            {project.title}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.time_input_group}>
                            <div className={styles.time_input}>
                                <label htmlFor="start">
                                    <HiClock size={16} />
                                    시작 시간
                                </label>
                                <input
                                    type="datetime-local"
                                    id="start"
                                    name="start"
                                    value={reservationFormData.start}
                                    onChange={onFormChange}
                                    className={styles.datetime_picker}
                                />
                            </div>
                            <div className={styles.time_input}>
                                <label htmlFor="end">
                                    <HiClock size={16} />
                                    종료 시간
                                </label>
                                <input
                                    type="datetime-local"
                                    id="end"
                                    name="end"
                                    value={reservationFormData.end}
                                    onChange={onFormChange}
                                    className={styles.datetime_picker}
                                />
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
                                {selectedReservation ? '저장' : '예약 등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReservationModal; 