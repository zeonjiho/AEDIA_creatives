import React, { useState } from 'react'
import ss from './ProjectLinkModal.module.css'
import { FaLink, FaTimes, FaSearch, FaCalendarAlt, FaFolder, FaUsers, FaClock } from 'react-icons/fa'

const ProjectLinkModal = ({ 
    isOpen, 
    onClose, 
    projects, 
    events, 
    eventProjectLinks, 
    onLinkProject,
    onUnlinkProject 
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [selectedProject, setSelectedProject] = useState(null)

    if (!isOpen) return null

    // 프로젝트 상태를 한국어로 변환
    const getStatusInKorean = (status) => {
        const statusMap = {
            'concept': '기획',
            'development': '개발',
            'pre_production': '프리 프로덕션',
            'production': '프로덕션',
            'post_production': '포스트 프로덕션',
            'vfx': 'VFX',
            'sound_design': '사운드 디자인',
            'quality_check': '품질 검수',
            'delivery': '납품'
        }
        return statusMap[status] || status
    }

    // 검색된 프로젝트 필터링
    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // 이벤트가 연결된 프로젝트 찾기
    const getLinkedProject = (eventId) => {
        const link = eventProjectLinks.find(link => link.eventId === eventId)
        return link ? projects.find(p => p._id === link.projectId) : null
    }

    // 연동 처리
    const handleLink = () => {
        if (selectedEvent && selectedProject) {
            onLinkProject(selectedEvent, selectedProject)
            setSelectedEvent(null)
            setSelectedProject(null)
        }
    }

    // 연동 해제
    const handleUnlink = (eventId) => {
        onUnlinkProject(eventId)
    }

    return (
        <div className={ss.modal_overlay} onClick={onClose}>
            <div className={ss.modal_content} onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className={ss.modal_header}>
                    <h2 className={ss.modal_title}>
                        <FaLink className={ss.title_icon} />
                        프로젝트 연동 관리
                    </h2>
                    <button className={ss.close_btn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={ss.modal_body}>
                    {/* 현재 연동 상태 */}
                    <div className={ss.section}>
                        <h3 className={ss.section_title}>
                            <FaCalendarAlt className={ss.section_icon} />
                            현재 연동 상태
                        </h3>
                        <div className={ss.linked_events}>
                            {events.length === 0 ? (
                                <div className={ss.empty_state}>이벤트가 없습니다.</div>
                            ) : (
                                events.map(event => {
                                    const linkedProject = getLinkedProject(event.id || event.title)
                                    return (
                                        <div key={event.id || event.title} className={ss.event_item}>
                                            <div className={ss.event_info}>
                                                <div className={ss.event_title}>{event.title}</div>
                                                <div className={ss.event_time}>
                                                    {event.start?.toLocaleDateString('ko-KR')}
                                                </div>
                                            </div>
                                            <div className={ss.link_status}>
                                                {linkedProject ? (
                                                    <div className={ss.linked}>
                                                        <span className={ss.project_name}>
                                                            {linkedProject.title}
                                                        </span>
                                                        <button 
                                                            className={ss.unlink_btn}
                                                            onClick={() => handleUnlink(event.id || event.title)}
                                                        >
                                                            연동 해제
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className={ss.unlinked}>
                                                        <span className={ss.unlinked_text}>연동되지 않음</span>
                                                        <button 
                                                            className={ss.select_btn}
                                                            onClick={() => setSelectedEvent(event)}
                                                        >
                                                            연동하기
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* 프로젝트 선택 */}
                    {selectedEvent && (
                        <div className={ss.section}>
                            <h3 className={ss.section_title}>
                                <FaFolder className={ss.section_icon} />
                                "{selectedEvent.title}" 이벤트와 연동할 프로젝트 선택
                            </h3>
                            
                            {/* 검색 */}
                            <div className={ss.search_box}>
                                <FaSearch className={ss.search_icon} />
                                <input
                                    type="text"
                                    placeholder="프로젝트 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={ss.search_input}
                                />
                            </div>

                            {/* 프로젝트 목록 */}
                            <div className={ss.projects_grid}>
                                {filteredProjects.map(project => (
                                    <div 
                                        key={project._id}
                                        className={`${ss.project_card} ${selectedProject?._id === project._id ? ss.selected : ''}`}
                                        onClick={() => setSelectedProject(project)}
                                    >
                                        <div className={ss.project_header}>
                                            <h4 className={ss.project_title}>{project.title}</h4>
                                            <span className={ss.project_status}>
                                                {getStatusInKorean(project.status)}
                                            </span>
                                        </div>
                                        <p className={ss.project_description}>
                                            {project.description}
                                        </p>
                                        <div className={ss.project_meta}>
                                            <div className={ss.meta_item}>
                                                <FaUsers className={ss.meta_icon} />
                                                {project.team?.length || 0}명
                                            </div>
                                            <div className={ss.meta_item}>
                                                <FaClock className={ss.meta_icon} />
                                                {project.progress}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 연동 버튼 */}
                            <div className={ss.action_buttons}>
                                <button 
                                    className={ss.cancel_btn}
                                    onClick={() => {
                                        setSelectedEvent(null)
                                        setSelectedProject(null)
                                    }}
                                >
                                    취소
                                </button>
                                <button 
                                    className={ss.link_btn}
                                    onClick={handleLink}
                                    disabled={!selectedProject}
                                >
                                    <FaLink />
                                    연동하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProjectLinkModal 