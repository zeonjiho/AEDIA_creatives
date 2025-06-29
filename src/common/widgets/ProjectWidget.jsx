import React from 'react';
import Widget from '../Widget';
import styles from './ProjectWidget.module.css';
import { FaChartBar } from 'react-icons/fa';

/**
 * 프로젝트 현황 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.projects - 프로젝트 목록
 * @param {Function} props.calculateProgress - 프로젝트 진행률 계산 함수
 * @param {Function} props.calculateRemainingDays - 남은 일수 계산 함수
 * @param {Function} props.formatDate - 날짜 포맷팅 함수
 * @param {Function} props.onViewAllClick - '모든 프로젝트 보기' 클릭 함수
 * @returns {JSX.Element}
 */
const ProjectWidget = ({
  projects = [],
  calculateProgress,
  calculateRemainingDays,
  formatDate,
  onViewAllClick
}) => {
  return (
    <Widget
      icon={<FaChartBar />}
      title="Project Status"
      footerText="모든 프로젝트 보기"
      onFooterClick={onViewAllClick}
    >
      <div className={styles.project_status}>
        {projects.map(project => {
          const progress = calculateProgress ? calculateProgress(project) : 0;
          const remainingDays = calculateRemainingDays ? calculateRemainingDays(project.deadline) : 0;
          
          return (
            <div key={project._id || project.id} className={styles.project_item}>
              <div className={styles.project_header}>
                <h3 className={styles.project_title}>{project.title}</h3>    
                <span className={`${styles.project_badge} ${styles["status_" + project.status.replace(/\s+/g, '_').toLowerCase()]}`}>
                  {project.status}
                </span>
              </div>
              
              <div className={styles.progress_bar}>
                <div 
                  className={styles.progress} 
                  style={{width: `${progress}%`}}
                ></div>
              </div>
              
              <div className={styles.project_details}>
                <p className={styles.progress_text}>{progress}% 완료</p>
                <p className={`${styles.deadline_text} ${remainingDays < 7 ? styles.deadline_soon : ''}`}>
                  마감일: {formatDate && formatDate(project.deadline)} ({remainingDays}일 남음)
                </p>
              </div>
            </div>
          );
        })}
        
        {projects.length === 0 && (
          <p className={styles.no_projects}>진행 중인 프로젝트가 없습니다.</p>
        )}
      </div>
    </Widget>
  );
};

export default ProjectWidget; 