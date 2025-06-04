import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import UserModal from './UserModal'
import { generateTableCSV } from '../../../utils/exportUtils'

const AdminUser = () => {

  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUserList();
  }, [])

  const fetchUserList = async () => {
    try {
      const response = await api.get('/get-user-list?userType=internal');
      
      // API 응답 데이터 검증
      const userData = response.data || [];
      if (!Array.isArray(userData)) {
        console.error('API 응답이 배열이 아닙니다:', userData);
        setUserList([]);
        return;
      }
      
      // status가 deleted인 유저는 제외하고, null/undefined 값도 제거
      const filteredUsers = userData
        .filter(user => user !== null && user !== undefined)
        .filter(user => user.status !== 'deleted');
      
      // waiting인 유저를 최상단에 배치
      const sortedUsers = filteredUsers.sort((a, b) => {
        if (a.status === 'waiting' && b.status !== 'waiting') return -1;
        if (a.status !== 'waiting' && b.status === 'waiting') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt); // 최신순 정렬
      });
      
      setUserList(sortedUsers);
    } catch (err) {
      console.error('유저 목록 조회 실패:', err);
      setUserList([]); // 에러 시 빈 배열로 설정
    }
  }

  // 유저 승인 처리
  const handleApproveUser = async (userId, event) => {
    // 이벤트 버블링 방지
    event.stopPropagation();
    
    // 승인 확인 다이얼로그
    const isConfirmed = window.confirm('이 사용자를 승인하시겠습니까?');
    if (!isConfirmed) {
      return; // 취소하면 함수 종료
    }

    try {
      const response = await api.get(`/admin/approve-user/${userId}`);
      if (response.status === 200) {
        alert('유저가 승인되었습니다.');
        fetchUserList(); // 리스트 새로고침
      }
    } catch (err) {
      console.log(err);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  }

  // 모달 열기
  const handleRowClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // 사용자 정보 업데이트 처리
  const handleUserUpdate = (updatedUser) => {
    if (updatedUser === null) {
      // 삭제된 유저인 경우 목록에서 제거
      fetchUserList(); // 전체 목록 새로고침으로 삭제된 유저 제외
      return;
    }
    
    if (updatedUser.status === 'deleted') {
      // status가 deleted로 변경된 경우 목록에서 제거
      setUserList(prevList => 
        prevList.filter(user => user._id !== updatedUser._id)
      );
    } else {
      // 일반 업데이트인 경우
      setUserList(prevList => 
        prevList.map(user => 
          user && user._id === updatedUser._id ? updatedUser : user
        ).filter(user => user !== null) // null 값 제거
      );
    }
    
    // 안전을 위해 전체 목록도 새로고침
    setTimeout(() => {
      fetchUserList();
    }, 500);
  };

  // 상태에 따른 스타일 클래스 반환
  const getStatusClass = (status) => {
    switch (status) {
      case 'waiting': return ss.status_warning;
      case 'active': return ss.status_active;
      case 'inactive': return ss.status_info;
      case 'deleted': return ss.status_danger;
      default: return '';
    }
  }

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return '대기중';
      case 'active': return 'active';
      case 'inactive': return 'inactive';
      case 'deleted': return '삭제됨';
      default: return status;
    }
  }

  // 유저타입 텍스트 변환
  const getUserTypeText = (userType) => {
    return userType === 'internal' ? '직원' : '외부 스태프';
  }

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

  // 상태별 카운트 계산
  const getStatusCounts = () => {
    const validUsers = userList.filter(user => user !== null && user !== undefined);
    const counts = {
      total: validUsers.length,
      active: validUsers.filter(user => user.status === 'active').length,
      waiting: validUsers.filter(user => user.status === 'waiting').length,
      inactive: validUsers.filter(user => user.status === 'inactive').length,
      internal: validUsers.filter(user => user.userType === 'internal').length,
      external: validUsers.filter(user => user.userType === 'external').length
    };
    return counts;
  }

  const statusCounts = getStatusCounts();
  
  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>유저 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_user}`}>
            <span className={ss.stat_number}>{statusCounts.total}</span>
            <div className={ss.stat_label}>총 유저</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--warning-color)'}}>{statusCounts.waiting}</span>
            <div className={ss.stat_label}>승인 대기</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{statusCounts.active}</span>
            <div className={ss.stat_label}>활성 유저</div>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{statusCounts.internal}</div>
          <div className={ss.metric_label}>내부 직원</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            {Math.round((statusCounts.internal / statusCounts.total) * 100)}%
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{statusCounts.external}</div>
          <div className={ss.metric_label}>외부 스태프</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            {Math.round((statusCounts.external / statusCounts.total) * 100)}%
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{statusCounts.waiting}</div>
          <div className={ss.metric_label}>승인 대기</div>
          <div className={`${ss.metric_change} ${statusCounts.waiting > 0 ? ss.negative : ss.positive}`}>
            {statusCounts.waiting > 0 ? '처리 필요' : '대기 없음'}
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            유저 현황 차트
          </div>
          <div className={ss.chart_content}>
            <div className={ss.chart_placeholder}>
              유저 가입 추이 및 활동 현황을 시각화할 수 있습니다
            </div>
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              내부 직원 ({statusCounts.internal})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--accent-color)'}}></div>
              외부 스태프 ({statusCounts.external})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--warning-color)'}}></div>
              승인 대기 ({statusCounts.waiting})
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className={ss.data_table_container}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            유저 목록
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle="유저_목록"
            csvData={generateTableCSV(
              userList.filter(user => user !== null && user !== undefined), 
              ['이름', '전화번호', '이메일', '상태', '사용자 유형', '역할', '관리자 메모', '가입일']
            )}
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
              <th>관리자 메모</th>
              <th>가입일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {userList && userList.length > 0 ? userList
              .filter(user => user !== null && user !== undefined) // null, undefined 값 제거
              .map((user, idx) => (
              <tr 
                key={user._id || `user-${idx}`}
                className={user.status === 'waiting' ? ss.waiting_row : ''}
                onClick={() => handleRowClick(user)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{fontWeight: '600', color: 'var(--text-primary)', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  {user.name || '-'}
                  {user.status === 'waiting' && <span style={{backgroundColor: 'var(--warning-color)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px'}}>NEW</span>}
                </td>
                <td>{formatPhoneNumber(user.phone)}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`${ss.status_badge} ${getStatusClass(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                </td>
                <td>{getUserTypeText(user.userType)}</td>
                <td style={{maxWidth: '200px', wordWrap: 'break-word', fontSize: '0.85rem'}}>
                  {user.roles && user.roles.length > 0 
                    ? user.roles.join(', ') 
                    : '-'
                  }
                </td>
                <td style={{maxWidth: '150px', wordWrap: 'break-word', fontSize: '0.85rem'}}>
                  {user.adminMemo ? (
                    <span style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontStyle: 'italic',
                      color: 'var(--text-secondary)',
                      display: 'inline-block',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {user.adminMemo}
                    </span>
                  ) : (
                    <span style={{color: 'var(--text-tertiary)'}}>-</span>
                  )}
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td style={{textAlign: 'center', padding: '12px', verticalAlign: 'middle', width: '120px'}}>
                  {user.status === 'waiting' && (
                    <button 
                      style={{
                        backgroundColor: 'var(--success-color)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'inline-block',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={(e) => handleApproveUser(user._id, e)}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#2d8f47';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 2px 4px rgba(64, 192, 87, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'var(--success-color)';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      승인하기
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  등록된 유저가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        user={selectedUser}
        onUpdate={handleUserUpdate}
      />
    </div>
  )
}

export default AdminUser