import React, { useEffect, useState } from 'react'
import ss from './AdminUser.module.css'
import api from '../../../utils/api'

const AdminUser = () => {

  const [userList, setUserList] = useState([]);

  useEffect(() => {
    fetchUserList();
  }, [])

  const fetchUserList = async () => {
    try {
      const response = await api.get('/get-user-list?userType=all');
      
      // status가 waiting인 유저를 최상단에 배치
      const sortedUsers = response.data.sort((a, b) => {
        if (a.status === 'waiting' && b.status !== 'waiting') return -1;
        if (a.status !== 'waiting' && b.status === 'waiting') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt); // 최신순 정렬
      });
      
      setUserList(sortedUsers);
    } catch (err) {
      console.log(err);
    }
  }

  // 유저 승인 처리
  const handleApproveUser = async (userId) => {
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

  // 상태에 따른 스타일 클래스 반환
  const getStatusClass = (status) => {
    switch (status) {
      case 'waiting': return ss.status_waiting;
      case 'active': return ss.status_active;
      case 'inactive': return ss.status_inactive;
      case 'deleted': return ss.status_deleted;
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
  
  return (
    <div className={ss.admin_user_container}>
      <div className={ss.header}>
        {/* <h1>유저 관리</h1> */}
        <div className={ss.user_count}>
          총 <span className={ss.count_number}>{userList.length}</span>명
          {userList.filter(user => user.status === 'waiting').length > 0 && (
            <span className={ss.waiting_count}>
              (대기중: {userList.filter(user => user.status === 'waiting').length}명)
            </span>
          )}
        </div>
      </div>

      <div className={ss.table_container}>
        <table className={ss.user_table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>전화번호</th>
              <th>이메일</th>
              <th>상태</th>
              <th>구분</th>
              <th>역할</th>
              <th>가입일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {userList && userList.length > 0 ? userList.map((user, idx) => (
              <tr key={user._id || idx} className={user.status === 'waiting' ? ss.waiting_row : ''}>
                <td className={ss.name_cell}>
                  {user.name}
                  {user.status === 'waiting' && <span className={ss.new_badge}>NEW</span>}
                </td>
                <td>{formatPhoneNumber(user.phone)}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`${ss.status_badge} ${getStatusClass(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                </td>
                <td>{getUserTypeText(user.userType)}</td>
                <td className={ss.roles_cell}>
                  {user.roles && user.roles.length > 0 
                    ? user.roles.join(', ') 
                    : '-'
                  }
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td className={ss.action_cell}>
                  {user.status === 'waiting' && (
                    <button 
                      className={ss.approve_button}
                      onClick={() => handleApproveUser(user._id)}
                    >
                      승인하기
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className={ss.no_data}>
                  등록된 유저가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUser