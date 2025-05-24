import React, { useState } from 'react';
import styles from './ProjectSelectModal.module.css';
import { HiX, HiSearch, HiBookmark, HiCalendar, HiUsers, HiCheck } from 'react-icons/hi';

const ProjectSelectModal = ({ 
    isOpen, 
    projects, 
    selectedProject, 
    onSelect, 
    onClose 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    if (!isOpen) return null;

    // 프로젝트 필터링
    const filteredProjects = projects.filter(project => {
        const matchesSearch = searchTerm === '' || 
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = selectedStatus === '' || project.status === selectedStatus;
        
        return matchesSearch && matchesStatus;
    });

    // 상태별 색상 매핑
    const getStatusColor = (status) => {
        const statusColors = {
            'kickoff': 'var(--status-kickoff)',
            'pre-production': 'var(--status-pre-production)', 
            'production': 'var(--status-production)',
            'post-production': 'var(--status-post-production)',
            'delivery': 'var(--status-delivery)',
            'review': 'var(--status-review)',
            'in-progress': 'var(--status-in-progress)',
            'completed': 'var(--status-completed)',
            'on-hold': 'var(--status-on-hold)',
            'cancelled': 'var(--status-cancelled)'
        };
        return statusColors[status] || 'var(--accent-color)';
    };

    const handleProjectSelect = (project) => {
        onSelect(project);
        onClose();
    };

    const handleClearSelection = () => {
        onSelect(null);
        onClose();
    };

    return (
        <div className={styles.modal_wrapper}>
            <div className={styles.modal_background} onClick={onClose}></div>
            <div className={styles.modal_panel}>
                <div className={styles.panel_header}>
                    <div className={styles.panel_title}>
                        <HiBookmark size={24} className={styles.title_icon} />
                        <h2>프로젝트 선택</h2>
                    </div>
                    <button className={styles.close_button} onClick={onClose}>
                        <HiX size={24} />
                    </button>
                </div>
                
                <div className={styles.panel_content}>
                    {/* 검색 및 필터 */}
                    <div className={styles.search_section}>
                        <div className={styles.search_box}>
                            <HiSearch className={styles.search_icon} />
                            <input
                                type="text"
                                placeholder="프로젝트명, 설명, 클라이언트로 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.search_input}
                            />
                        </div>
                        
                        <div className={styles.filter_section}>
                            <label htmlFor="status-filter">상태별 필터:</label>
                            <select
                                id="status-filter"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className={styles.status_filter}
                            >
                                <option value="">모든 상태</option>
                                <option value="kickoff">킥오프</option>
                                <option value="pre-production">프리프로덕션</option>
                                <option value="production">프로덕션</option>
                                <option value="post-production">포스트프로덕션</option>
                                <option value="delivery">납품</option>
                                <option value="review">검토</option>
                                <option value="in-progress">진행중</option>
                                <option value="completed">완료</option>
                                <option value="on-hold">보류</option>
                                <option value="cancelled">취소</option>
                            </select>
                        </div>
                    </div>

                    {/* 현재 선택된 프로젝트 */}
                    {selectedProject && (
                        <div className={styles.current_selection}>
                            <h3>현재 선택된 프로젝트</h3>
                            <div className={styles.selected_project_card}>
                                <div className={styles.project_info}>
                                    <div className={styles.project_title}>{selectedProject}</div>
                                    <button 
                                        className={styles.clear_selection_btn}
                                        onClick={handleClearSelection}
                                    >
                                        <HiX size={16} />
                                        선택 해제
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 프로젝트 목록 */}
                    <div className={styles.projects_section}>
                        <h3>프로젝트 목록 ({filteredProjects.length}개)</h3>
                        
                        {filteredProjects.length === 0 ? (
                            <div className={styles.no_projects}>
                                <HiBookmark className={styles.no_projects_icon} />
                                <p>검색 조건에 맞는 프로젝트가 없습니다.</p>
                            </div>
                        ) : (
                            <div className={styles.projects_grid}>
                                {filteredProjects.map(project => (
                                    <div
                                        key={project.id}
                                        className={`${styles.project_card} ${
                                            selectedProject === project.title ? styles.current_selected : ''
                                        }`}
                                        onClick={() => handleProjectSelect(project)}
                                    >
                                        <div className={styles.project_header}>
                                            <div className={styles.project_title_row}>
                                                <h4>{project.title}</h4>
                                                {selectedProject === project.title && (
                                                    <HiCheck className={styles.selected_icon} />
                                                )}
                                            </div>
                                            <div 
                                                className={styles.project_status}
                                                style={{ backgroundColor: getStatusColor(project.status) }}
                                            >
                                                {project.status}
                                            </div>
                                        </div>
                                        
                                        <p className={styles.project_description}>
                                            {project.description}
                                        </p>
                                        
                                        <div className={styles.project_meta}>
                                            {project.client && (
                                                <span className={styles.meta_item}>
                                                    <HiUsers size={14} />
                                                    {project.client}
                                                </span>
                                            )}
                                            {project.deadline && (
                                                <span className={styles.meta_item}>
                                                    <HiCalendar size={14} />
                                                    {new Date(project.deadline).toLocaleDateString('ko-KR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectSelectModal; 