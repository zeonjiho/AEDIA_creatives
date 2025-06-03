import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import { generateTableCSV } from '../../../utils/exportUtils'

const AdminAttendanceSummary = () => {

  const [summaryData, setSummaryData] = useState([]);
  const [userList, setUserList] = useState([]);
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
    try {
      const response = await api.get('/admin/attendance/summary', {
        params: filters
      });
      setSummaryData(response.data);
    } catch (err) {
      console.log(err);
      // 임시 데이터로 대체
      setSummaryData(generateMockSummaryData());
    }
  }

  const fetchUserList = async () => {
    try {
      const response = await api.get('/get-user-list?userType=all');
      setUserList(response.data.filter(user => user.status === 'active'));
    } catch (err) {
      console.log(err);
      setUserList([
        { _id: '1', name: '김직원', userType: 'internal' },
        { _id: '2', name: '이직원', userType: 'internal' },
        { _id: '3', name: '박스태프', userType: 'external' }
      ]);
    }
  }

  // 임시 통계 데이터 생성
  const generateMockSummaryData = () => {
    const mockData = [];
    
    // userList가 비어있으면 임시 사용자 사용
    const users = userList.length > 0 ? userList : [
      { _id: '1', name: '김직원', userType: 'internal' },
      { _id: '2', name: '이직원', userType: 'internal' },
      { _id: '3', name: '박스태프', userType: 'external' }
    ];
    
    users.forEach(user => {
      const workingDays = 22; // 해당 월 근무일
      const present = Math.floor(Math.random() * 3) + 19; // 19-21일
      const late = Math.floor(Math.random() * 3); // 0-2일
      const absent = Math.floor(Math.random() * 2); // 0-1일
      const vacation = workingDays - present - late - absent;
      
      const totalWorkHours = present * 8 + late * 7.5; // 지각은 0.5시간 적게
      const avgWorkHours = totalWorkHours / (present + late);
      
      mockData.push({
        userId: user._id,
        userName: user.name,
        userType: user.userType,
        workingDays,
        present,
        late,
        absent,
        vacation,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        avgWorkHours: Math.round(avgWorkHours * 10) / 10,
        attendanceRate: Math.round(((present + late) / workingDays) * 100),
        punctualityRate: Math.round((present / (present + late)) * 100)
      });
    });
    
    return mockData;
  };

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
    const totalPresent = summaryData.reduce((sum, data) => sum + data.present, 0);
    const totalLate = summaryData.reduce((sum, data) => sum + data.late, 0);
    const totalAbsent = summaryData.reduce((sum, data) => sum + data.absent, 0);
    const totalVacation = summaryData.reduce((sum, data) => sum + data.vacation, 0);
    const totalWorkHours = summaryData.reduce((sum, data) => sum + data.totalWorkHours, 0);

    return {
      avgAttendanceRate: Math.round((totalPresent + totalLate) / totalWorkingDays * 100),
      avgPunctualityRate: Math.round(totalPresent / (totalPresent + totalLate) * 100),
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      avgWorkHours: Math.round((totalWorkHours / summaryData.length) * 10) / 10,
      totalPresent,
      totalLate,
      totalAbsent,
      totalVacation
    };
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

  const totalStats = getTotalStatistics();
  
  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>출석 통계</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_user}`}>
            <span className={ss.stat_number}>{summaryData.length}</span>
            <div className={ss.stat_label}>대상 인원</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{totalStats.avgAttendanceRate}%</span>
            <div className={ss.stat_label}>평균 출석률</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--accent-color)'}}>{totalStats.avgPunctualityRate}%</span>
            <div className={ss.stat_label}>평균 정시출근률</div>
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
              minWidth: '100px'
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
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{totalStats.totalPresent}</div>
          <div className={ss.metric_label}>총 정상 출석</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            {Math.round((totalStats.totalPresent / (totalStats.totalPresent + totalStats.totalLate + totalStats.totalAbsent)) * 100)}%
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{totalStats.totalLate}</div>
          <div className={ss.metric_label}>총 지각</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            {Math.round((totalStats.totalLate / (totalStats.totalPresent + totalStats.totalLate + totalStats.totalAbsent)) * 100)}%
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{totalStats.avgWorkHours}h</div>
          <div className={ss.metric_label}>평균 근무시간</div>
          <div className={`${ss.metric_change} ${totalStats.avgWorkHours >= 8 ? ss.positive : ss.negative}`}>
            {totalStats.avgWorkHours >= 8 ? '목표 달성' : '목표 미달'}
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--info-color)'}}>{totalStats.totalVacation}</div>
          <div className={ss.metric_label}>총 휴가</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            연차/휴가
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
              월별 출석률, 정시출근률, 평균근무시간 트렌드를 시각화할 수 있습니다
            </div>
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              출석률 ({totalStats.avgAttendanceRate}%)
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--accent-color)'}}></div>
              정시출근률 ({totalStats.avgPunctualityRate}%)
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
            chartTitle={`출석통계_${filters.year}년${filters.month}월`}
            csvData={generateTableCSV(summaryData, ['이름', '구분', '근무일', '출석', '지각', '결석', '휴가', '총근무시간', '평균근무시간', '출석률', '정시출근률'])}
          />
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>구분</th>
              <th>근무일</th>
              <th>출석</th>
              <th>지각</th>
              <th>결석</th>
              <th>휴가</th>
              <th>총근무시간</th>
              <th>평균근무시간</th>
              <th>출석률</th>
              <th>정시출근률</th>
            </tr>
          </thead>
          <tbody>
            {summaryData && summaryData.length > 0 ? summaryData.map((data, idx) => (
              <tr key={data.userId || idx}>
                <td style={{fontWeight: '600', color: 'var(--text-primary)'}}>
                  {data.userName}
                </td>
                <td>{getUserTypeText(data.userType)}</td>
                <td style={{textAlign: 'center'}}>{data.workingDays}일</td>
                <td style={{textAlign: 'center', color: 'var(--success-color)', fontWeight: '600'}}>
                  {data.present}일
                </td>
                <td style={{textAlign: 'center', color: 'var(--warning-color)', fontWeight: '600'}}>
                  {data.late}일
                </td>
                <td style={{textAlign: 'center', color: 'var(--danger-color)', fontWeight: '600'}}>
                  {data.absent}일
                </td>
                <td style={{textAlign: 'center', color: 'var(--info-color)', fontWeight: '600'}}>
                  {data.vacation}일
                </td>
                <td style={{textAlign: 'center'}}>{data.totalWorkHours}시간</td>
                <td style={{textAlign: 'center'}}>{data.avgWorkHours}시간</td>
                <td style={{textAlign: 'center'}}>
                  <span className={`${ss.status_badge} ${data.attendanceRate >= 95 ? ss.status_active : data.attendanceRate >= 90 ? ss.status_warning : ss.status_danger}`}>
                    {data.attendanceRate}%
                  </span>
                </td>
                <td style={{textAlign: 'center'}}>
                  <span className={`${ss.status_badge} ${data.punctualityRate >= 95 ? ss.status_active : data.punctualityRate >= 90 ? ss.status_warning : ss.status_danger}`}>
                    {data.punctualityRate}%
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="11" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
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
              <th>평균 정시출근률</th>
              <th>평균 근무시간</th>
            </tr>
          </thead>
          <tbody>
            {['internal', 'external'].map(userType => {
              const filteredData = summaryData.filter(data => data.userType === userType);
              if (filteredData.length === 0) return null;

              const avgAttendanceRate = Math.round(filteredData.reduce((sum, data) => sum + data.attendanceRate, 0) / filteredData.length);
              const avgPunctualityRate = Math.round(filteredData.reduce((sum, data) => sum + data.punctualityRate, 0) / filteredData.length);
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
                  <td style={{textAlign: 'center'}}>
                    <span className={`${ss.status_badge} ${avgPunctualityRate >= 95 ? ss.status_active : avgPunctualityRate >= 90 ? ss.status_warning : ss.status_danger}`}>
                      {avgPunctualityRate}%
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