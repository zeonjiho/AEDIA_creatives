import React, { useEffect, useState, useRef } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import ExportButton from '../../../components/ExportButton/ExportButton'
import StaffModal from './StaffModal'
import { 
  generateDepartmentCSV, 
  generateRoleCSV, 
  generateMonthlyStaffCSV,
  generateTableCSV
} from '../../../utils/exportUtils'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const AdminStaff = () => {
  const [userList, setUserList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chartRefs = useRef({});

  useEffect(() => {
    fetchUserList();
  }, [])

  const fetchUserList = async () => {
    try {
      const response = await api.get('/get-user-list?userType=external');
      
      // API 응답 데이터 검증
      const userData = response.data || [];
      if (!Array.isArray(userData)) {
        console.error('API 응답이 배열이 아닙니다:', userData);
        setUserList([]);
        return;
      }
      
      // status가 deleted인 외부 스태프는 제외하고, null/undefined 값도 제거
      const filteredUsers = userData
        .filter(user => user !== null && user !== undefined)
        .filter(user => user.status !== 'deleted');
      
      setUserList(filteredUsers);
    } catch (err) {
      console.error('스태프 목록 조회 실패:', err);
      setUserList([]); // 에러 시 빈 배열로 설정
    }
  }

  // 통계 계산 (상태 제거)
  const getStaffStats = () => {
    const validUsers = userList.filter(user => user !== null && user !== undefined);
    const stats = {
      total: validUsers.length,
      departments: [...new Set(validUsers.filter(user => user.department).map(user => user.department))].length,
      withSNS: validUsers.filter(user => user.snsId).length
    };
    return stats;
  }

  // 소속별 카운트 계산
  const getDepartmentData = () => {
    const validUsers = userList.filter(user => user !== null && user !== undefined);
    const departmentCounts = validUsers.reduce((acc, user) => {
      const dept = user.department || '미정';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    return departmentCounts;
  }

  // 역할별 데이터 계산
  const getRoleData = () => {
    const validUsers = userList.filter(user => user !== null && user !== undefined);
    return validUsers.reduce((acc, user) => {
      if (user.roles && user.roles.length > 0) {
        user.roles.forEach(role => {
          acc[role] = (acc[role] || 0) + 1;
        });
      } else {
        acc['미정'] = (acc['미정'] || 0) + 1;
      }
      return acc;
    }, {});
  }

  // 모달 열기
  const handleRowClick = (staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  // 스태프 정보 업데이트 처리
  const handleStaffUpdate = (updatedStaff) => {
    if (updatedStaff === null) {
      // 삭제된 스태프인 경우 목록에서 제거
      fetchUserList(); // 전체 목록 새로고침으로 삭제된 스태프 제외
      return;
    }
    
    if (updatedStaff.status === 'deleted') {
      // status가 deleted로 변경된 경우 목록에서 제거
      setUserList(prevList => 
        prevList.filter(staff => staff._id !== updatedStaff._id)
      );
    } else {
      // 일반 업데이트인 경우
      setUserList(prevList => 
        prevList.map(staff => 
          staff && staff._id === updatedStaff._id ? updatedStaff : staff
        ).filter(staff => staff !== null) // null 값 제거
      );
    }
    
    // 안전을 위해 전체 목록도 새로고침
    setTimeout(() => {
      fetchUserList();
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

  const staffStats = getStaffStats();
  const departmentData = getDepartmentData();
  const roleData = getRoleData();

  // 소속별 스태프 도넛 차트
  const departmentChartData = {
    labels: Object.keys(departmentData),
    datasets: [
      {
        data: Object.values(departmentData),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(64, 192, 87, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(250, 82, 82, 0.8)',
          'rgba(134, 142, 150, 0.8)',
          'rgba(155, 89, 182, 0.8)'
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(64, 192, 87, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(250, 82, 82, 1)',
          'rgba(134, 142, 150, 1)',
          'rgba(155, 89, 182, 1)'
        ],
        borderWidth: 2
      }
    ]
  };


  // 역할별 스태프 분포
  const roleChartData = {
    labels: Object.keys(roleData),
    datasets: [
      {
        label: '스태프 수',
        data: Object.values(roleData),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(64, 192, 87, 0.8)',
          'rgba(134, 142, 150, 0.8)',
          'rgba(250, 82, 82, 0.8)',
          'rgba(155, 89, 182, 0.8)'
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(64, 192, 87, 1)',
          'rgba(134, 142, 150, 1)',
          'rgba(250, 82, 82, 1)',
          'rgba(155, 89, 182, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>외부 스태프 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_staff}`}>
            <span className={ss.stat_number}>{staffStats.total}</span>
            <div className={ss.stat_label}>총 스태프</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--accent-color)'}}>{staffStats.departments}</span>
            <div className={ss.stat_label}>소속 부서</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{staffStats.withSNS}</span>
            <div className={ss.stat_label}>SNS 연동</div>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{Object.keys(departmentData).length}</div>
          <div className={ss.metric_label}>총 소속 부서</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            다양한 조직
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{Object.keys(roleData).length}</div>
          <div className={ss.metric_label}>역할 유형</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            전문 분야
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{staffStats.withSNS}</div>
          <div className={ss.metric_label}>SNS 연동 완료</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            {Math.round((staffStats.withSNS / staffStats.total) * 100)}%
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.staff}`}></div>
            소속별 스태프 분포
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['department-chart'] = el}>
            <Doughnut data={departmentChartData} options={chartOptions} />
          </div>
          <div className={ss.chart_legend}>
            {Object.entries(departmentData).map(([dept, count], index) => (
              <div key={dept} className={ss.legend_item}>
                <div className={ss.legend_color} style={{
                  backgroundColor: departmentChartData.datasets[0].backgroundColor[index]
                }}></div>
                {dept} ({count}명)
              </div>
            ))}
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_header}>
            <div className={ss.chart_title}>
              <div className={`${ss.chart_icon} ${ss.staff}`}></div>
              역할별 스태프 분포
            </div>
            <ExportButton 
              chartRef={{ current: chartRefs.current['role-chart'] }}
              chartTitle="역할별 스태프 분포"
              csvData={generateRoleCSV(roleData)}
            />
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['role-chart'] = el}>
            <Bar data={roleChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className={ss.data_table_container}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.staff}`}></div>
            스태프 목록
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle="스태프_목록"
            csvData={generateTableCSV(
              userList.filter(user => user !== null && user !== undefined), 
              ['이름', '소속', '전화번호', '이메일', 'SNS 아이디', '역할', '관리자 메모', '등록일']
            )}
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
              <th>관리자 메모</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            {userList && userList.length > 0 ? userList
              .filter(user => user !== null && user !== undefined) // null, undefined 값 제거
              .map((user, idx) => (
              <tr 
                key={user._id || `staff-${idx}`}
                onClick={() => handleRowClick(user)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{fontWeight: '600', color: 'var(--text-primary)'}}>{user.name || '-'}</td>
                <td style={{fontWeight: '500', color: 'var(--accent-color)'}}>{user.department || '미정'}</td>
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
              </tr>
            )) : (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  등록된 외부 스태프가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Staff Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        staff={selectedStaff}
        onUpdate={handleStaffUpdate}
      />
    </div>
  )
}

export default AdminStaff