import React from 'react';
import Widget from '../Widget';
import styles from './TeamWidget.module.css';
import { FaUsers } from 'react-icons/fa';

/**
 * 팀 멤버 위젯 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.members - 팀 멤버 목록
 * @param {Function} props.onViewAllClick - '전체 팀원 보기' 클릭 함수
 * @returns {JSX.Element}
 */
const TeamWidget = ({
  members = [],
  onViewAllClick
}) => {
  return (
    <Widget
      icon={<FaUsers />}
      title="Team Members"
      footerText="전체 팀원 보기"
      onFooterClick={onViewAllClick}
    >
      <div className={styles.team_members}>
        {members.map(member => (
          <div key={member.id} className={styles.team_member}>
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className={styles.member_avatar} />
            ) : (
              <div className={styles.member_avatar_placeholder}>
                {member.name.charAt(0)}
              </div>
            )}
            
            <div className={styles.member_info}>
              <h3 className={styles.member_name}>{member.name}</h3>
              <p className={styles.member_position}>{member.position}</p>
            </div>
            
            <div className={`${styles.member_status} ${member.online ? styles.online : styles.offline}`}></div>
          </div>
        ))}
        
        {members.length === 0 && (
          <p className={styles.no_members}>등록된 팀원이 없습니다.</p>
        )}
      </div>
    </Widget>
  );
};

export default TeamWidget; 