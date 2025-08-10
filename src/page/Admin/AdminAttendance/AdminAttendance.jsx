import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import AttendanceModal from './AttendanceModal'
import { generateTableCSV } from '../../../utils/exportUtils'

const AdminAttendance = () => {

  const [attendanceList, setAttendanceList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 1); // 한 달 전
      return date.toISOString().split('T')[0];
    })(),
    endDate: new Date().toISOString().split('T')[0],
    userType: 'all',
    searchName: '',
    selectedUser: 'all'
  });

  useEffect(() => {
    fetchAttendanceList();
    fetchUserList();
  }, [filters])

  const fetchAttendanceList = async () => {
    setLoading(true);
    try {
      // 실제 출석 데이터 조회 API 호출
      const response = await api.get('/admin/attendance/list', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          userId: filters.selectedUser !== 'all' ? filters.selectedUser : undefined,
          userType: filters.userType !== 'all' ? filters.userType : undefined,
          searchName: filters.searchName.trim() || undefined
        }
      });
      
      // 응답 데이터 처리 및 정렬
               const processedData = response.data.map(record => ({
          _id: record._id,
          userId: record.userId?._id || record.userId,
          userName: record.userId?.name || record.userName || '알 수 없음',
          userType: record.userId?.userType || record.userType || 'internal',
          date: record.date,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          checkoutDayOffset: record.checkoutDayOffset || 0,
          workHours: record.workHours,
          status: record.status,
          note: record.note || '',
          records: record.records || [],
          isModified: record.isModified || false,
          modificationHistory: record.modificationHistory || []
        }));
      
      // 최신순으로 정렬
      const sortedAttendance = processedData.sort((a, b) => {
        if (a.date === b.date) {
          return new Date(`${a.date}T${a.checkInTime || '00:00'}`) - new Date(`${b.date}T${b.checkInTime || '00:00'}`);
        }
        return new Date(b.date) - new Date(a.date);
      });
      
      setAttendanceList(sortedAttendance);
    } catch (err) {
      console.error('출석 데이터 로드 실패:', err);
      // 에러 발생 시 빈 배열로 설정
      setAttendanceList([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchUserList = async () => {
    try {
      // 사용자 목록 조회
      const response = await api.get('/admin/users/list');
      const activeUsers = response.data.filter(user => user.status === 'active');
      setUserList(activeUsers);
    } catch (err) {
      console.error('사용자 목록 로드 실패:', err);
      setUserList([]);
    }
  }

  // 근무시간 계산
  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    
    const start = new Date(`2000-01-01T${checkIn}`);
    const end = new Date(`2000-01-01T${checkOut}`);
    let diff = (end - start) / (1000 * 60 * 60); // 시간 단위
    
    // 다음날로 넘어간 경우 처리
    if (diff < 0) {
        diff += 24;
    }
    
    return Math.max(0, diff); // 점심시간 제외 없음
  };

  // 출석 상태 업데이트
  const handleUpdateAttendance = async (attendanceId, newStatus, note = '') => {
    try {
      const response = await api.patch(`/admin/attendance/update/${attendanceId}`, {
        status: newStatus,
        note
      });
      
      if (response.status === 200) {
        alert('출석 상태가 업데이트되었습니다.');
        fetchAttendanceList();
      }
    } catch (err) {
      console.error('출석 상태 업데이트 실패:', err);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  // 출석 기록 삭제
  const handleDeleteAttendance = async (attendanceId) => {
    if (!window.confirm('이 출석 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/admin/attendance/delete/${attendanceId}`);
      alert('출석 기록이 삭제되었습니다.');
      fetchAttendanceList();
    } catch (err) {
      console.error('출석 기록 삭제 실패:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 모달 열기
  const handleRowClick = (attendance) => {
    setSelectedAttendance(attendance);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAttendance(null);
  };

  // 출석 정보 업데이트 처리
  const handleAttendanceUpdate = (updatedAttendance) => {
    setAttendanceList(prevList => 
      prevList.map(attendance => 
        attendance._id === updatedAttendance._id ? updatedAttendance : attendance
      )
    );
    fetchAttendanceList();
  };



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
      day: '2-digit',
      weekday: 'short'
    });
  }

  // 시간 포맷팅
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const time = new Date(timeString);
    return time.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }

  // 근무시간 포맷팅
  const formatWorkHours = (hours) => {
    if (!hours && hours !== 0) return '-';
    return `${hours.toFixed(1)}시간`;
  }

  // 필터 변경 처리
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 검색 및 필터링된 출석 목록
  const getFilteredAttendanceList = () => {
    let filtered = [...attendanceList];

    // 이름 검색 필터링
    if (filters.searchName.trim()) {
      filtered = filtered.filter(attendance => 
        attendance.userName.toLowerCase().includes(filters.searchName.toLowerCase().trim())
      );
    }

    // 개별 사용자 필터링
    if (filters.selectedUser !== 'all') {
      filtered = filtered.filter(attendance => attendance.userId === filters.selectedUser);
    }

    // 사용자 타입 필터링
    if (filters.userType !== 'all') {
      filtered = filtered.filter(attendance => attendance.userType === filters.userType);
    }

    return filtered;
  };

  // 통계 계산 (필터링된 데이터 기준)
  const getStatistics = () => {
    const filteredList = getFilteredAttendanceList();
    const stats = {
      total: filteredList.length,
      avgWorkHours: 0
    };

    const workingAttendance = filteredList.filter(a => a.workHours);
    if (workingAttendance.length > 0) {
      stats.avgWorkHours = workingAttendance.reduce((sum, a) => sum + a.workHours, 0) / workingAttendance.length;
    }

    return stats;
  };

  // 활성 사용자 목록 (드롭다운용)
  const getActiveUsers = () => {
    const uniqueUsers = [];
    const userMap = new Map();
    
    attendanceList.forEach(attendance => {
      if (!userMap.has(attendance.userId)) {
        userMap.set(attendance.userId, {
          userId: attendance.userId,
          userName: attendance.userName,
          userType: attendance.userType
        });
        uniqueUsers.push(userMap.get(attendance.userId));
      }
    });
    
    return uniqueUsers.sort((a, b) => a.userName.localeCompare(b.userName));
  };

  // 검색 초기화
  const handleResetSearch = () => {
    setFilters(prev => ({
      ...prev,
      searchName: '',
      selectedUser: 'all',
      userType: 'all'
    }));
  };

  // CSV 내보내기용 리포트 정보 생성
  const getReportInfo = () => {
    const activeFilters = {};
    
    if (filters.startDate) activeFilters['시작일'] = filters.startDate;
    if (filters.endDate) activeFilters['종료일'] = filters.endDate;
    if (filters.userType !== 'all') activeFilters['구분'] = getUserTypeText(filters.userType);
    if (filters.searchName.trim()) activeFilters['이름 검색'] = filters.searchName;
    if (filters.selectedUser !== 'all') {
      const selectedUserName = activeUsers.find(u => u.userId === filters.selectedUser)?.userName;
      if (selectedUserName) activeFilters['선택된 직원'] = selectedUserName;
    }

    return {
      title: '출석 관리 리포트',
      filters: activeFilters
    };
  };

  const statistics = getStatistics();
  const filteredAttendanceList = getFilteredAttendanceList();
  const activeUsers = getActiveUsers();
  
  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>출석 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_user}`}>
            <span className={ss.stat_number}>{statistics.total}</span>
            <div className={ss.stat_label}>총 출석 기록</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--accent-color)'}}>{statistics.avgWorkHours.toFixed(1)}h</span>
            <div className={ss.stat_label}>평균 근무시간</div>
          </div>
        </div>
      </div>

      {/* 현재 필터 정보 표시 */}
      {(filters.searchName || filters.selectedUser !== 'all' || filters.userType !== 'all') && (
        <div style={{
          backgroundColor: '#e7f3ff',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #b3d7ff'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#0056b3',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            적용된 필터:
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '13px',
            color: '#0056b3'
          }}>
            {filters.searchName && (
              <span style={{
                backgroundColor: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #b3d7ff'
              }}>
                이름: "{filters.searchName}"
              </span>
            )}
            {filters.selectedUser !== 'all' && (
              <span style={{
                backgroundColor: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #b3d7ff'
              }}>
                직원: {activeUsers.find(u => u.userId === filters.selectedUser)?.userName || '선택된 직원'}
              </span>
            )}
            {filters.userType !== 'all' && (
              <span style={{
                backgroundColor: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid #b3d7ff'
              }}>
                구분: {getUserTypeText(filters.userType)}
              </span>
            )}
            <span style={{
              fontSize: '12px',
              color: '#666',
              fontStyle: 'italic'
            }}>
              ({statistics.total}건 중 {filteredAttendanceList.length}건 표시)
            </span>
          </div>
        </div>
      )}

      {/* 필터 영역 */}
      <div className={ss.filter_container} style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* 검색창 */}
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px'}}>
          <label style={{fontWeight: '600', color: 'var(--text-primary)'}}>이름 검색:</label>
          <input
            type="text"
            placeholder="직원 이름을 입력하세요"
            value={filters.searchName}
            onChange={(e) => handleFilterChange('searchName', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              flex: 1,
              minWidth: '150px'
            }}
          />
        </div>

        {/* 개별 사용자 선택 */}
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontWeight: '600', color: 'var(--text-primary)'}}>직원 선택:</label>
          <select
            value={filters.selectedUser}
            onChange={(e) => handleFilterChange('selectedUser', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '150px'
            }}
          >
            <option value="all">전체 직원</option>
            {activeUsers.map(user => (
              <option key={user.userId} value={user.userId}>
                {user.userName} ({getUserTypeText(user.userType)})
              </option>
            ))}
          </select>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontWeight: '600', color: 'var(--text-primary)'}}>시작일:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontWeight: '600', color: 'var(--text-primary)'}}>종료일:</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontWeight: '600', color: 'var(--text-primary)'}}>구분:</label>
          <select
            value={filters.userType}
            onChange={(e) => handleFilterChange('userType', e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '120px'
            }}
          >
            <option value="all">전체</option>
            <option value="internal">직원</option>
            <option value="external">외부 스태프</option>
          </select>
        </div>

        {/* 초기화 버튼 */}
        <button
          onClick={handleResetSearch}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#5a6268';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#6c757d';
          }}
        >
          필터 초기화
        </button>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{statistics.total}</div>
          <div className={ss.metric_label}>총 기록</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            전체 출석 기록
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{statistics.avgWorkHours.toFixed(1)}h</div>
          <div className={ss.metric_label}>평균 근무시간</div>
          <div className={`${ss.metric_change} ${statistics.avgWorkHours >= 8 ? ss.positive : ss.negative}`}>
            {statistics.avgWorkHours >= 8 ? '목표 달성' : '목표 미달'}
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            출석 현황 차트
          </div>
          <div className={ss.chart_content}>
            <div className={ss.chart_placeholder}>
              일별/주별/월별 출석 현황을 시각화할 수 있습니다
            </div>
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              총 기록 ({statistics.total})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--accent-color)'}}></div>
              평균 근무시간 ({statistics.avgWorkHours.toFixed(1)}h)
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className={ss.data_table_container}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            출석 목록
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle="출석_목록"
            csvData={generateTableCSV(filteredAttendanceList, ['날짜', '이름', '구분', '출근시간', '퇴근시간', '근무시간', '외부위치', '수정여부', '비고'], getReportInfo())}
            reportInfo={getReportInfo()}
          />
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>날짜</th>
              <th>이름</th>
              <th>구분</th>
              <th>출근시간</th>
              <th>퇴근시간</th>
              <th>근무시간</th>
              <th>외부 위치</th>
              <th>수정여부</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendanceList && filteredAttendanceList.length > 0 ? filteredAttendanceList.map((attendance, idx) => (
              <tr 
                key={attendance._id || idx} 
                onClick={() => handleRowClick(attendance)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                  {formatDate(attendance.date)}
                </td>
                <td style={{fontWeight: '600'}}>
                  {attendance.userName}
                </td>
                <td>{getUserTypeText(attendance.userType)}</td>
                <td>{formatTime(attendance.checkInTime)}</td>
                <td>{formatTime(attendance.checkOutTime)}{attendance.checkoutDayOffset > 0 && attendance.checkOutTime && (
                  <span style={{marginLeft:'6px', background:'#fde68a', color:'#92400e', border:'1px solid #fcd34d', borderRadius:'8px', padding:'1px 6px', fontSize:'10px', fontWeight:600}}>
                    {new Date(attendance.checkOutTime).getDate()}일
                  </span>
                )}</td>
                <td>{formatWorkHours(attendance.workHours)}</td>
                <td style={{textAlign: 'center', fontSize: '12px'}}>
                  {attendance.hasOffSite ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                      {attendance.offSiteInfo?.checkIn && (
                        <span style={{
                          backgroundColor: '#ffa726',
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          외부출근 ({attendance.offSiteInfo.checkIn.distance}m)
                        </span>
                      )}
                      {attendance.offSiteInfo?.checkOut && (
                        <span style={{
                          backgroundColor: '#ef5350',
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          외부퇴근 ({attendance.offSiteInfo.checkOut.distance}m)
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{
                      color: '#9e9e9e',
                      fontSize: '10px'
                    }}>
                      회사 내
                    </span>
                  )}
                </td>
                <td style={{textAlign: 'center'}}>
                  {((attendance.isModified === true) || (attendance.modificationHistory && attendance.modificationHistory.length > 0)) ? (
                    <span style={{
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      수정됨 ({attendance.modificationHistory ? attendance.modificationHistory.length : 0})
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#51cf66',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      원본
                    </span>
                  )}
                </td>
                <td style={{maxWidth: '150px', wordWrap: 'break-word', fontSize: '0.85rem'}}>
                  {attendance.note || '-'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  {attendanceList.length === 0 
                    ? '등록된 출석 기록이 없습니다.' 
                    : (filters.searchName || filters.selectedUser !== 'all' || filters.userType !== 'all')
                    ? '검색 조건에 맞는 출석 기록이 없습니다.'
                    : '출석 기록이 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        attendance={selectedAttendance}
        userList={userList}
        onUpdate={handleAttendanceUpdate}
      />
    </div>
  )
}

export default AdminAttendance 