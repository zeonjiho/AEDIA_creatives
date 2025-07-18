import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import DeletedUserModal from './DeletedUserModal'
import { generateTableCSV } from '../../../utils/exportUtils'

const AdminDeleted = () => {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDeletedUsers();
  }, [])

  const fetchDeletedUsers = async () => {
    try {
      console.log('=== 삭제된 사용자 목록 조회 시작 ===')
      const response = await api.get('/get-user-list?userType=all-deleted');
      console.log('API 응답:', response.data)
      
      // status가 deleted인 유저만 필터링
      const deletedOnly = response.data.filter(user => user.status === 'deleted');
      console.log('삭제된 사용자 필터링 결과:', deletedOnly)
      
      // 최신 삭제순으로 정렬
      const sortedUsers = deletedOnly.sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      console.log('정렬된 삭제된 사용자:', sortedUsers)
      
      setDeletedUsers(sortedUsers);
      console.log('=== 삭제된 사용자 목록 조회 완료 ===')
    } catch (err) {
      console.error('=== 삭제된 사용자 목록 조회 실패 ===')
      console.error(err);
    }
  }

  // 모달 열기
  const handleRowClick = (user) => {
    console.log('=== 모달 열기 ===')
    console.log('선택된 사용자:', user)
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    console.log('=== 모달 닫기 ===')
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // 사용자 정보 업데이트 처리
  const handleUserUpdate = (updatedUser) => {
    console.log('=== handleUserUpdate 호출됨 ===')
    console.log('업데이트된 사용자:', updatedUser)
    
    if (!updatedUser) {
      console.log('updatedUser가 null/undefined입니다.')
      return;
    }
    
    console.log('업데이트된 사용자 상태:', updatedUser.status)
    
    // 복구된 사용자는 목록에서 제거 (deleted 상태가 아니므로)
    if (updatedUser.status === 'active') {
      console.log('사용자가 복구되었습니다. 목록에서 제거합니다.')
      setDeletedUsers(prevList => {
        const newList = prevList.filter(user => user._id !== updatedUser._id);
        console.log(`사용자 "${updatedUser.name}"이(가) 성공적으로 복구되어 목록에서 제거되었습니다.`);
        console.log(`남은 삭제된 사용자 수: ${newList.length}명`);
        return newList;
      });
    } else {
      console.log('사용자 상태가 active가 아닙니다. 목록에서 업데이트만 합니다.')
      // 그 외의 경우는 업데이트
      setDeletedUsers(prevList => 
        prevList.map(user => 
          user._id === updatedUser._id ? updatedUser : user
        )
      );
    }
    
    // 전체 목록 새로고침 (최신 상태 반영)
    console.log('0.5초 후 목록을 새로고침합니다.')
    setTimeout(() => {
      fetchDeletedUsers();
    }, 500);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // 전화번호 포맷팅
  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    }
    return phone;
  }

  // 통계 계산
  const getDeletedStats = () => {
    const internalUsers = deletedUsers.filter(user => user.userType === 'internal');
    const externalUsers = deletedUsers.filter(user => user.userType === 'external');
    
    return {
      total: deletedUsers.length,
      internal: internalUsers.length,
      external: externalUsers.length
    };
  }

  const stats = getDeletedStats();
  const internalUsers = deletedUsers.filter(user => user.userType === 'internal');
  const externalUsers = deletedUsers.filter(user => user.userType === 'external');

  // 유저타입 텍스트 변환
  const getUserTypeText = (userType) => {
    return userType === 'internal' ? '직원' : '외부 스태프';
  }

  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>삭제된 인력 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_user}`}>
            <span className={ss.stat_number}>{stats.total}</span>
            <div className={ss.stat_label}>총 삭제된 인력</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{stats.internal}</span>
            <div className={ss.stat_label}>삭제된 직원</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--accent-color)'}}>{stats.external}</span>
            <div className={ss.stat_label}>삭제된 외부 스태프</div>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{stats.internal}</div>
          <div className={ss.metric_label}>삭제된 내부 직원</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            {stats.total > 0 ? Math.round((stats.internal / stats.total) * 100) : 0}%
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{stats.external}</div>
          <div className={ss.metric_label}>삭제된 외부 스태프</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            {stats.total > 0 ? Math.round((stats.external / stats.total) * 100) : 0}%
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--danger-color)'}}>{stats.total}</div>
          <div className={ss.metric_label}>전체 삭제된 인력</div>
          <div className={`${ss.metric_change} ${ss.negative}`}>
            복구 가능
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      {/* <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            삭제된 인력 현황
          </div>
          <div className={ss.chart_content}>
            <div className={ss.chart_placeholder}>
              삭제된 인력의 분포 및 복구 현황을 시각화할 수 있습니다
            </div>
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              삭제된 내부 직원 ({stats.internal})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--accent-color)'}}></div>
              삭제된 외부 스태프 ({stats.external})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--danger-color)'}}></div>
              총 삭제된 인력 ({stats.total})
            </div>
          </div>
        </div>
      </div> */}

      {/* 내부 직원 테이블 */}
      {internalUsers.length > 0 && (
        <div className={ss.data_table_container}>
          <div className={ss.table_header}>
            <div className={ss.table_title}>
              <div className={`${ss.chart_icon} ${ss.user}`}></div>
              삭제된 내부 직원 목록 ({internalUsers.length}명)
            </div>
            <ExportButton 
              chartRef={{ current: null }}
              chartTitle="삭제된_내부직원_목록"
              csvData={generateTableCSV(internalUsers, ['이름', '전화번호', '이메일', '상태', '사용자 유형', '역할', '삭제일'])}
            />
          </div>
          <table className={ss.data_table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>상태</th>
                <th>구분</th>
                <th>역할</th>
                <th>삭제일</th>
              </tr>
            </thead>
            <tbody>
              {internalUsers.map((user, idx) => (
                <tr 
                  key={user._id || idx} 
                  onClick={() => handleRowClick(user)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{fontWeight: '600', color: 'var(--text-primary)', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {user.name}
                    <span style={{backgroundColor: 'var(--danger-color)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'}}>DELETED</span>
                  </td>
                  <td>{formatPhoneNumber(user.phone)}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span className={`${ss.status_badge} ${ss.status_danger}`}>
                      삭제됨
                    </span>
                  </td>
                  <td>{getUserTypeText(user.userType)}</td>
                  <td style={{maxWidth: '200px', wordWrap: 'break-word', fontSize: '0.85rem'}}>
                    {user.roles && user.roles.length > 0 
                      ? user.roles.join(', ') 
                      : '-'
                    }
                  </td>
                  <td>{formatDate(user.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 외부 스태프 테이블 */}
      {externalUsers.length > 0 && (
        <div className={ss.data_table_container} style={{ marginTop: '2rem' }}>
          <div className={ss.table_header}>
            <div className={ss.table_title}>
              <div className={`${ss.chart_icon} ${ss.staff}`}></div>
              삭제된 외부 스태프 목록 ({externalUsers.length}명)
            </div>
            <ExportButton 
              chartRef={{ current: null }}
              chartTitle="삭제된_외부스태프_목록"
              csvData={generateTableCSV(externalUsers, ['이름', '소속', '전화번호', '이메일', 'SNS 아이디', '역할', '삭제일'])}
            />
          </div>
          <table className={ss.data_table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>소속</th>
                <th>전화번호</th>
                <th>이메일</th>
                <th>SNS 아이디</th>
                <th>역할</th>
                <th>삭제일</th>
              </tr>
            </thead>
            <tbody>
              {externalUsers.map((user, idx) => (
                <tr 
                  key={user._id || idx}
                  onClick={() => handleRowClick(user)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{fontWeight: '600', color: 'var(--text-primary)', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {user.name}
                    <span style={{backgroundColor: 'var(--danger-color)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'}}>DELETED</span>
                  </td>
                  <td style={{fontWeight: '500', color: 'var(--accent-color)'}}>{user.department?.name || user.department || '미정'}</td>
                  <td>{formatPhoneNumber(user.phone)}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    {user.snsId ? (
                      <span className={ss.category_badge}>
                        {user.snsId}
                      </span>
                    ) : (
                      <span style={{color: 'var(--text-tertiary)'}}>미등록</span>
                    )}
                  </td>
                  <td>
                    {user.roles && user.roles.length > 0 
                      ? user.roles.join(', ') 
                      : '미정'
                    }
                  </td>
                  <td>{formatDate(user.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 삭제된 인력이 없는 경우 */}
      {deletedUsers.length === 0 && (
        <div className={ss.data_table_container}>
          <div className={ss.table_header}>
            <div className={ss.table_title}>
              <div className={`${ss.chart_icon} ${ss.user}`}></div>
              삭제된 인력 목록
            </div>
          </div>
          <div style={{textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', fontSize: '1.1rem'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>✨</div>
            <div style={{fontWeight: '600', marginBottom: '0.5rem'}}>삭제된 인력이 없습니다</div>
            <div style={{fontSize: '0.9rem', opacity: 0.8}}>모든 인력이 정상적으로 관리되고 있습니다</div>
          </div>
        </div>
      )}

      {/* DeletedUserModal (내부 직원과 외부 스태프 통합) */}
      <DeletedUserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={selectedUser}
        onUpdate={handleUserUpdate}
      />
    </div>
  )
}

export default AdminDeleted