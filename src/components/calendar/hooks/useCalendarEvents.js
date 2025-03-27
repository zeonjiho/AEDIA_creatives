import { projectStatuses, users as dbUsers } from '../../../data/mockDatabase';

/**
 * 캘린더 이벤트 관련 유틸리티 함수들
 */

/**
 * 날짜를 yyyy-mm-dd 형식의 문자열로 변환
 * @param {Date} date - 변환할 날짜
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

/**
 * 담당자 ID로 이름 가져오기
 * @param {string} assigneeId - 담당자 ID
 * @returns {string} 담당자 이름
 */
export const getAssigneeName = (assigneeId) => {
    return dbUsers.find(user => user.id === assigneeId)?.name || '미배정';
};

/**
 * 여러 담당자 이름 가져오기
 * @param {Array} assignees - 담당자 ID 배열
 * @returns {string} 담당자 이름 목록
 */
export const getAssigneeNames = (assignees) => {
    if (!assignees || assignees.length === 0) return '미배정';
    
    const names = assignees.map(id => getAssigneeName(id));
    
    if (names.length === 1) {
        return names[0];
    } else if (names.length === 2) {
        return `${names[0]}, ${names[1]}`;
    } else {
        return `${names[0]} 외 ${names.length - 1}명`;
    }
};

/**
 * 프로젝트 상태 이름 가져오기
 * @param {string} statusId - 프로젝트 상태 ID
 * @returns {string} 프로젝트 상태 이름
 */
export const getProjectStatusName = (statusId) => {
    return Object.values(projectStatuses).find(status => status.id === statusId)?.name || '상태 없음';
};

/**
 * 프로젝트 상태 색상 가져오기
 * @param {string} statusId - 프로젝트 상태 ID
 * @returns {string} 프로젝트 상태 색상 변수
 */
export const getProjectStatusColor = (statusId) => {
    const status = Object.values(projectStatuses).find(status => status.id === statusId);
    return status ? `var(--color-status-${status.color})` : 'transparent';
};

/**
 * 이벤트가 여러 날짜에 걸쳐 있는지 확인
 * @param {Object} event - 캘린더 이벤트
 * @returns {boolean} 여러 날짜에 걸쳐 있는지 여부
 */
export const isMultiDayEvent = (event) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    // 시간과 분을 제외한 날짜만 비교
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return startDate.getTime() !== endDate.getTime();
};

/**
 * 특정 날짜가 이벤트 범위에 속하는지 확인
 * @param {Date} date - 확인할 날짜
 * @param {Object} event - 캘린더 이벤트
 * @returns {boolean} 날짜가 이벤트 범위에 속하는지 여부
 */
export const isDateInEventRange = (date, event) => {
    const checkDate = new Date(date);
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    // 시간과 분을 제외한 날짜만 비교
    checkDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return checkDate >= startDate && checkDate <= endDate;
}; 