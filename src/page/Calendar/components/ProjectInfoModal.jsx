import React from 'react'
import ss from './ProjectInfoModal.module.css'
import { FaUser, FaClock, FaCalendarAlt, FaTags, FaExternalLinkAlt, FaLink } from 'react-icons/fa'

const ProjectInfoModal = ({ event, position, isVisible, onMouseEnter, onMouseLeave, project }) => {
    if (!isVisible || !event) return null

    // 프로젝트가 연동되지 않은 경우
    if (!project) {
        return (
            <div 
                className={ss.modal_overlay}
                style={{
                    left: position.x,
                    top: position.y,
                }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className={ss.modal_content}>
                    <div className={ss.unlinked_content}>
                        <FaLink className={ss.unlinked_icon} />
                        <h3 className={ss.unlinked_title}>프로젝트 연동 필요</h3>
                        <p className={ss.unlinked_description}>
                            이 이벤트는 아직 프로젝트와 연동되지 않았습니다.
                        </p>
                        <div className={ss.event_info_simple}>
                            <div className={ss.event_title_simple}>
                                <strong>{event.title}</strong>
                            </div>
                            <div className={ss.event_time_simple}>
                                <FaClock className={ss.time_icon} />
                                {event.start?.toLocaleString('ko-KR', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}
                                {event.end && ` - ${event.end.toLocaleString('ko-KR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}`}
                            </div>
                        </div>
                        <div className={ss.unlinked_action}>
                            <span className={ss.action_text}>
                                상단의 "프로젝트 연동" 버튼을 클릭하여 연동하세요
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 실제 프로젝트 데이터가 있으면 사용, 없으면 기본값
    const projectInfo = project || {
        title: event.title || '프로젝트명 없음',
        description: '프로젝트 상세 정보가 없습니다.',
        status: 'concept',
        progress: 0,
        deadline: new Date(),
        team: [],
        staffList: []
    }

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

    // 상태에 따른 우선순위 결정
    const getPriorityFromStatus = (status) => {
        const priorityMap = {
            'delivery': '긴급',
            'quality_check': '긴급',
            'post_production': '높음',
            'production': '높음',
            'vfx': '보통',
            'sound_design': '보통',
            'pre_production': '보통',
            'development': '보통',
            'concept': '낮음'
        }
        
        return priorityMap[status] || '보통'
    }

    // 팀원 수 계산
    const getTeamMemberCount = () => {
        if (projectInfo.staffList && projectInfo.staffList.length > 0) {
            return projectInfo.staffList.reduce((total, role) => {
                return total + (role.members ? role.members.length : 0)
            }, 0)
        }
        return projectInfo.team ? projectInfo.team.length : 0
    }

    // 역할별 팀원 정보 가져오기
    const getRoleInfo = () => {
        if (projectInfo.staffList && projectInfo.staffList.length > 0) {
            return projectInfo.staffList.map(role => role.roleName).join(', ')
        }
        return '팀원 정보 없음'
    }

    const koreanStatus = getStatusInKorean(projectInfo.status)
    const priority = getPriorityFromStatus(projectInfo.status)
    const teamCount = getTeamMemberCount()
    const roleInfo = getRoleInfo()

    return (
        <div 
            className={ss.modal_overlay}
            style={{
                left: position.x,
                top: position.y,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={ss.modal_content}>
                {/* 헤더 */}
                <div className={ss.modal_header}>
                    <div className={ss.project_title}>
                        <FaExternalLinkAlt className={ss.title_icon} />
                        {projectInfo.title}
                    </div>
                    <div className={ss.client_name}>
                        <FaUser /> 프로젝트 ID: {projectInfo._id ? projectInfo._id.slice(-6) : 'N/A'}
                    </div>
                </div>

                {/* 진행률 */}
                <div className={ss.progress_section}>
                    <div className={ss.progress_label}>
                        <span>진행률</span>
                        <span className={ss.progress_percent}>{projectInfo.progress}%</span>
                    </div>
                    <div className={ss.progress_bar}>
                        <div 
                            className={ss.progress_fill}
                            style={{ width: `${projectInfo.progress}%` }}
                        />
                    </div>
                </div>

                {/* 상태 및 우선순위 */}
                <div className={ss.status_section}>
                    <div className={ss.status_item}>
                        <span className={ss.status_badge}>
                            {koreanStatus}
                        </span>
                    </div>
                    <div className={ss.status_item}>
                        <span className={ss.priority_badge}>
                            {priority}
                        </span>
                    </div>
                </div>

                {/* 세부 정보 */}
                <div className={ss.details_section}>
                    <div className={ss.detail_item}>
                        <FaCalendarAlt className={ss.detail_icon} />
                        <span>마감일: {new Date(projectInfo.deadline).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className={ss.detail_item}>
                        <FaTags className={ss.detail_icon} />
                        <span>팀원: {teamCount}명</span>
                    </div>
                    <div className={ss.detail_item}>
                        <FaUser className={ss.detail_icon} />
                        <span>역할: {roleInfo}</span>
                    </div>
                </div>

                {/* 설명 */}
                <div className={ss.description_section}>
                    <p className={ss.description_text}>
                        {projectInfo.description}
                    </p>
                </div>

                {/* 이벤트 정보 */}
                <div className={ss.event_info}>
                    <div className={ss.event_time}>
                        <FaClock className={ss.detail_icon} />
                        {event.start?.toLocaleString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                        {event.end && ` - ${event.end.toLocaleString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}`}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectInfoModal 