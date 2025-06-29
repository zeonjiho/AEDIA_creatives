import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import { generateTableCSV } from '../../../utils/exportUtils'

const AdminAttendanceSummary = () => {

  const [summaryData, setSummaryData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    userType: 'all'
  });

  useEffect(() => {
    fetchSummaryData();
    fetchUserList();
  }, [filters])

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      // 실제 출석 통계 데이터 조회 API 호출
      const response = await api.get('/admin/attendance/summary', {
        params: {
          year: filters.year,
          month: filters.month,
          userType: filters.userType !== 'all' ? filters.userType : undefined
        }
      });
      
      // 응답 데이터 처리
      const processedData = response.data.map(summary => ({
        userId: summary.userId?._id || summary.userId,
        userName: summary.userId?.name || summary.userName || '알 수 없음',
        userType: summary.userId?.userType || summary.userType || 'internal',
        workingDays: summary.workingDays,
        checkedIn: summary.checkedIn || 0,
        checkedOut: summary.checkedOut || 0,
        notCheckedIn: summary.notCheckedIn || 0,
        totalWorkHours: summary.totalWorkHours,
        avgWorkHours: summary.avgWorkHours,
        attendanceRate: summary.attendanceRate
      }));
      
      setSummaryData(processedData);
    } catch (err) {
      console.error('출석 통계 데이터 로드 실패:', err);
      // 에러 발생 시 빈 배열로 설정
      setSummaryData([]);
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

  // 필터 변경 처리
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 유저타입 텍스트 변환
  const getUserTypeText = (userType) => {
    return userType === 'internal' ? '직원' : '외부 스태프';
  }

  // 전체 통계 계산
  const getTotalStatistics = () => {
    if (summaryData.length === 0) return {};

    const totalWorkingDays = summaryData.reduce((sum, data) => sum + data.workingDays, 0);
    const totalCheckedIn = summaryData.reduce((sum, data) => sum + (data.checkedIn || 0), 0);
    const totalCheckedOut = summaryData.reduce((sum, data) => sum + (data.checkedOut || 0), 0);
    const totalNotCheckedIn = summaryData.reduce((sum, data) => sum + (data.notCheckedIn || 0), 0);
    const totalWorkHours = summaryData.reduce((sum, data) => sum + data.totalWorkHours, 0);

    return {
      avgAttendanceRate: totalWorkingDays > 0 ? Math.round((totalCheckedIn + totalCheckedOut) / totalWorkingDays * 100) : 0,
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      avgWorkHours: summaryData.length > 0 ? Math.round((totalWorkHours / summaryData.length) * 10) / 10 : 0,
      totalCheckedOut,
      totalCheckedIn,
      totalNotCheckedIn
    };
  };

  // 필터링된 요약 데이터
  const getFilteredSummaryData = () => {
    let filtered = [...summaryData];

    // 사용자 타입 필터링
    if (filters.userType !== 'all') {
      filtered = filtered.filter(data => data.userType === filters.userType);
    }

    return filtered.sort((a, b) => a.userName.localeCompare(b.userName));
  };

  // 년도 옵션 생성
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  // 월 옵션 생성
  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // CSV 내보내기용 리포트 정보 생성
  const getReportInfo = () => {
    const activeFilters = {};
    
    activeFilters['년도'] = filters.year;
    activeFilters['월'] = filters.month;
    if (filters.userType !== 'all') activeFilters['구분'] = getUserTypeText(filters.userType);

    return {
      title: '출석 통계 리포트',
      filters: activeFilters
    };
  };

  const totalStats = getTotalStatistics();
  const filteredData = getFilteredSummaryData();
  
  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>출석 통계</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_user}`}>
            <span className={ss.stat_number}>{filteredData.length}</span>
            <div className={ss.stat_label}>대상 인원</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{totalStats.avgAttendanceRate}%</span>
            <div className={ss.stat_label}>평균 출석률</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--info-color)'}}>{totalStats.avgWorkHours}h</span>
            <div className={ss.stat_label}>평균 근무시간</div>
          </div>
        </div>
      </div>

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
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontWeight: '600', color: 'var(--text-primary)'}}>년도:</label>
          <select
            value={filters.year}
            onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '100px'
            }}
          >
            {generateYearOptions().map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label style={{fontWeight: '600', color: 'var(--text-primary)'}}>월:</label>
          <select
            value={filters.month}
            onChange={(e) => handleFilterChange('month', parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '80px'
            }}
          >
            {generateMonthOptions().map(month => (
              <option key={month} value={month}>{month}월</option>
            ))}
          </select>
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
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{totalStats.totalCheckedOut}</div>
          <div className={ss.metric_label}>정상 완료</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            {totalStats.avgAttendanceRate >= 90 ? '우수' : totalStats.avgAttendanceRate >= 80 ? '양호' : '개선 필요'}
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--info-color)'}}>{totalStats.totalCheckedIn}</div>
          <div className={ss.metric_label}>출근 중</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            현재 근무 중인 인원
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{totalStats.totalNotCheckedIn}</div>
          <div className={ss.metric_label}>미출근</div>
          <div className={`${ss.metric_change} ${totalStats.totalNotCheckedIn <= 2 ? ss.positive : ss.negative}`}>
            {totalStats.totalNotCheckedIn <= 2 ? '양호' : '주의 필요'}
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{totalStats.totalWorkHours}h</div>
          <div className={ss.metric_label}>총 근무시간</div>
          <div className={`${ss.metric_change} ${totalStats.avgWorkHours >= 8 ? ss.positive : ss.neutral}`}>
            평균 {totalStats.avgWorkHours}h/일
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            {filters.year}년 {filters.month}월 출석 통계
          </div>
          <div className={ss.chart_content}>
            <div className={ss.chart_placeholder}>
              월별 출석률, 평균근무시간 트렌드를 시각화할 수 있습니다
            </div>
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              출석률 ({totalStats.avgAttendanceRate}%)
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--info-color)'}}></div>
              평균근무시간 ({totalStats.avgWorkHours}h)
            </div>
          </div>
        </div>
      </div>

      {/* 개별 통계 테이블 */}
      <div className={ss.data_table_container}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            개별 출석 통계 ({filters.year}년 {filters.month}월)
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle={getReportInfo().title}
            csvData={generateTableCSV(filteredData, ['이름', '구분', '근무일', '출근완료', '출근중', '미출근', '총근무시간', '평균근무시간', '출석률'], getReportInfo())}
            reportInfo={getReportInfo()}
          />
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>구분</th>
              <th>근무일</th>
              <th>출근완료</th>
              <th>출근중</th>
              <th>미출근</th>
              <th>총근무시간</th>
              <th>평균근무시간</th>
              <th>출석률</th>
            </tr>
          </thead>
          <tbody>
            {filteredData && filteredData.length > 0 ? filteredData.map((data, idx) => (
              <tr key={data.userId || idx}>
                <td style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                  {data.userName}
                </td>
                <td>{getUserTypeText(data.userType)}</td>
                <td style={{textAlign: 'center'}}>{data.workingDays}일</td>
                <td style={{textAlign: 'center', color: 'var(--success-color)', fontWeight: '600'}}>
                  {data.checkedOut || 0}일
                </td>
                <td style={{textAlign: 'center', color: 'var(--info-color)', fontWeight: '600'}}>
                  {data.checkedIn || 0}일
                </td>
                <td style={{textAlign: 'center', color: 'var(--warning-color)', fontWeight: '600'}}>
                  {data.notCheckedIn || 0}일
                </td>
                <td style={{textAlign: 'center'}}>{data.totalWorkHours}시간</td>
                <td style={{textAlign: 'center'}}>{data.avgWorkHours}시간</td>
                <td style={{textAlign: 'center'}}>
                  <span className={`${ss.status_badge} ${data.attendanceRate >= 95 ? ss.status_active : data.attendanceRate >= 90 ? ss.status_warning : ss.status_danger}`}>
                    {data.attendanceRate}%
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  통계 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 부서별 통계 요약 */}
      <div className={ss.data_table_container} style={{marginTop: '24px'}}>
        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            부서별 통계 요약
          </div>
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>구분</th>
              <th>인원수</th>
              <th>평균 출석률</th>
              <th>평균 근무시간</th>
            </tr>
          </thead>
          <tbody>
            {['internal', 'external'].map(userType => {
              const filteredData = summaryData.filter(data => data.userType === userType);
              if (filteredData.length === 0) return null;

              const avgAttendanceRate = Math.round(filteredData.reduce((sum, data) => sum + data.attendanceRate, 0) / filteredData.length);
              const avgWorkHours = Math.round((filteredData.reduce((sum, data) => sum + data.avgWorkHours, 0) / filteredData.length) * 10) / 10;

              return (
                <tr key={userType}>
                  <td style={{fontWeight: '600'}}>{getUserTypeText(userType)}</td>
                  <td style={{textAlign: 'center'}}>{filteredData.length}명</td>
                  <td style={{textAlign: 'center'}}>
                    <span className={`${ss.status_badge} ${avgAttendanceRate >= 95 ? ss.status_active : avgAttendanceRate >= 90 ? ss.status_warning : ss.status_danger}`}>
                      {avgAttendanceRate}%
                    </span>
                  </td>
                  <td style={{textAlign: 'center'}}>{avgWorkHours}시간</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminAttendanceSummary 