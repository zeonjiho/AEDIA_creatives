import React, { useEffect, useState, useRef } from 'react'
import ss from '../CSS/AdminChart.module.css'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import api from '../../../utils/api'
import ExportButton from '../../../components/ExportButton/ExportButton'
import { 
  generateUserStatusCSV, 
  generateUserTypeCSV, 
  generateFinanceCSV, 
  generateTrendCSV 
} from '../../../utils/exportUtils'

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

const AdminMain = () => {
  const [userList, setUserList] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const chartRefs = useRef({});
  const [dashboardStats, setDashboardStats] = useState({
    users: { total: 0, active: 0, waiting: 0, internal: 0, external: 0 },
    finance: { 
      meal: { total: 0, approved: 0, pending: 0, rejected: 0 },
      taxi: { total: 0, approved: 0, pending: 0, rejected: 0 }
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 1. 사용자 데이터 가져오기
      const userResponse = await api.get('/get-user-list?userType=all');
      setUserList(userResponse.data);
      
      // 2. 영수증 데이터 가져오기
      const receiptsResponse = await api.get('/receipts?limit=1000');
      setReceipts(receiptsResponse.data.data || []);
      
      // 3. 사용자 통계 계산
      const userStats = {
        total: userResponse.data.filter(user => user.userType === 'internal').length,
        active: userResponse.data.filter(user => user.status === 'active' && user.userType === 'internal').length,
        waiting: userResponse.data.filter(user => user.status === 'waiting' && user.userType === 'internal').length,
        internal: userResponse.data.filter(user => user.userType === 'internal').length,
        external: userResponse.data.filter(user => user.userType === 'external').length
      };
      
      // 4. 재무 통계 계산
      const mealReceipts = receipts.filter(r => r.category === '식비');
      const taxiReceipts = receipts.filter(r => r.category === '택시비');
      
      const mealStats = {
        total: mealReceipts.reduce((sum, r) => sum + (r.amount || 0), 0),
        approved: mealReceipts.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + (r.amount || 0), 0),
        pending: mealReceipts.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + (r.amount || 0), 0),
        rejected: mealReceipts.filter(r => r.status === 'REJECTED').reduce((sum, r) => sum + (r.amount || 0), 0)
      };
      
      const taxiStats = {
        total: taxiReceipts.reduce((sum, r) => sum + (r.amount || 0), 0),
        approved: taxiReceipts.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + (r.amount || 0), 0),
        pending: taxiReceipts.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + (r.amount || 0), 0),
        rejected: taxiReceipts.filter(r => r.status === 'REJECTED').reduce((sum, r) => sum + (r.amount || 0), 0)
      };
      
      // 5. 전체 통계 업데이트
      setDashboardStats({
        users: userStats,
        finance: { meal: mealStats, taxi: taxiStats }
      });
      
    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err);
      // 에러 시 기존 목업 데이터 유지
    }
  }

  // 전체 통계 계산
  const getTotalStats = () => ({
    totalUsers: dashboardStats.users.total,
    pendingApprovals: dashboardStats.users.waiting,
    totalFinance: dashboardStats.finance.meal.total + dashboardStats.finance.taxi.total,
    pendingFinance: dashboardStats.finance.meal.pending + dashboardStats.finance.taxi.pending
  });

  // 사용자 현황 도넛 차트 데이터
  const userStatusChartData = {
    labels: ['활성 유저', '승인 대기', '비활성'],
    datasets: [
      {
        data: [
          dashboardStats.users.active,
          dashboardStats.users.waiting,
          dashboardStats.users.total - dashboardStats.users.active - dashboardStats.users.waiting
        ],
        backgroundColor: [
          'rgba(64, 192, 87, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(134, 142, 150, 0.8)'
        ],
        borderColor: [
          'rgba(64, 192, 87, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(134, 142, 150, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 사용자 유형별 바 차트 데이터
  const userTypeChartData = {
    labels: ['내부 직원', '외부 스태프'],
    datasets: [
      {
        label: '사용자 수',
        data: [dashboardStats.users.internal, dashboardStats.users.external],
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(64, 192, 87, 0.8)'
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(64, 192, 87, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 재무 현황 바 차트 데이터
  const financeChartData = {
    labels: ['식비', '택시비'],
    datasets: [
      {
        label: '승인된 금액',
        data: [dashboardStats.finance.meal.approved, dashboardStats.finance.taxi.approved],
        backgroundColor: 'rgba(64, 192, 87, 0.8)',
        borderColor: 'rgba(64, 192, 87, 1)',
        borderWidth: 2
      },
      {
        label: '대기 중인 금액',
        data: [dashboardStats.finance.meal.pending, dashboardStats.finance.taxi.pending],
        backgroundColor: 'rgba(253, 126, 20, 0.8)',
        borderColor: 'rgba(253, 126, 20, 1)',
        borderWidth: 2
      },
      {
        label: '거절된 금액',
        data: [dashboardStats.finance.meal.rejected, dashboardStats.finance.taxi.rejected],
        backgroundColor: 'rgba(250, 82, 82, 0.8)',
        borderColor: 'rgba(250, 82, 82, 1)',
        borderWidth: 2
      }
    ]
  };

  // 월별 트렌드 라인 차트 데이터 (실제 데이터)
  const getMonthlyTrendData = () => {
    const months = [];
    const newUsersData = [];
    const expensesData = [];
    
    // 현재 월을 기준으로 최근 6개월 계산
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      // 해당 월의 신규 가입자 수 계산 (내부 직원만)
      const monthNewUsers = userList.filter(user => {
        if (user.userType !== 'internal') return false;
        const userDate = new Date(user.createdAt);
        return userDate.getFullYear() === year && userDate.getMonth() + 1 === month;
      }).length;
      
      // 해당 월의 재무 지출 계산 (거절된 항목 제외)
      const monthExpenses = receipts
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        })
        .filter(item => item.status !== 'REJECTED')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
      
      months.push(`${month}월`);
      newUsersData.push(monthNewUsers);
      expensesData.push(monthExpenses);
    }
    
    return {
      labels: months,
      datasets: [
        {
          label: '신규 가입자',
          data: newUsersData,
          borderColor: 'rgba(74, 144, 226, 1)',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          tension: 0.4
        },
        {
          label: '재무 지출',
          data: expensesData,
          borderColor: 'rgba(253, 126, 20, 1)',
          backgroundColor: 'rgba(253, 126, 20, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  const trendChartData = getMonthlyTrendData();

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
          callback: function(value) {
            return new Intl.NumberFormat('ko-KR').format(value);
          }
        }
      }
    }
  };

  const totalStats = getTotalStats();

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  }

  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>관리자 대시보드</h1>
        <div className={ss.summary_stats}>
          <div className={ss.stat_item}>
            <span className={ss.stat_number}>{totalStats.totalUsers}</span>
            <div className={ss.stat_label}>전체 사용자</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--warning-color)'}}>{totalStats.pendingApprovals}</span>
            <div className={ss.stat_label}>승인 대기</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--success-color)'}}>{formatAmount(totalStats.totalFinance)}</span>
            <div className={ss.stat_label}>총 재무</div>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{dashboardStats.users.total}</div>
          <div className={ss.metric_label}>총 사용자</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            +{dashboardStats.users.waiting} 대기 중
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{formatAmount(dashboardStats.finance.meal.approved + dashboardStats.finance.taxi.approved)}</div>
          <div className={ss.metric_label}>승인된 재무</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            이번 달
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{formatAmount(dashboardStats.finance.meal.pending + dashboardStats.finance.taxi.pending)}</div>
          <div className={ss.metric_label}>대기 중인 재무</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            처리 필요
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.user}`}></div>
            사용자 현황
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['user-status-chart'] = el}>
            <Doughnut data={userStatusChartData} options={chartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_header}>
            <div className={ss.chart_title}>
              <div className={`${ss.chart_icon} ${ss.user}`}></div>
              사용자 유형별 분포
            </div>
            <ExportButton 
              chartRef={{ current: chartRefs.current['user-type-chart'] }}
              chartTitle="사용자 유형별 분포"
              csvData={generateUserTypeCSV(dashboardStats.users)}
            />
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['user-type-chart'] = el}>
            <Bar data={userTypeChartData} options={barChartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_header}>
            <div className={ss.chart_title}>
              <div className={`${ss.chart_icon} ${ss.finance}`}></div>
              재무 현황
            </div>
            <ExportButton 
              chartRef={{ current: chartRefs.current['finance-chart'] }}
              chartTitle="재무 현황"
              csvData={generateFinanceCSV(dashboardStats.finance)}
            />
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['finance-chart'] = el}>
            <Bar data={financeChartData} options={barChartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_header}>
            <div className={ss.chart_title}>
              <div className={`${ss.chart_icon} ${ss.user}`}></div>
              월별 트렌드
            </div>
            <ExportButton 
              chartRef={{ current: chartRefs.current['trend-chart'] }}
              chartTitle="월별 트렌드"
              csvData={generateTrendCSV(userList, receipts)}
            />
          </div>
          <div className={ss.chart_content} ref={(el) => chartRefs.current['trend-chart'] = el}>
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminMain