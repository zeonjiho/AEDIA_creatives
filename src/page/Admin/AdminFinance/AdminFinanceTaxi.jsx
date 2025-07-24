import React, { useEffect, useState } from 'react'
import ss from '../CSS/AdminChart.module.css'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import ExportButton from '../../../components/ExportButton/ExportButton'
import FinanceModal from './FinanceModal'
import api from '../../../utils/api'

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

const AdminFinanceTaxi = () => {
  const [taxiData, setTaxiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 필터링 상태
  const [filters, setFilters] = useState({
    month: '',
    employee: '',
    project: ''
  });
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchTaxiData();
    fetchEmployees();
    fetchProjects();
  }, []);

  // 택시비 데이터 가져오기 (실제 API 호출)
  const fetchTaxiData = async () => {
    try {
      setLoading(true);
      // 최신 API 구조에 맞게 수정
      const response = await api.get('/receipts?type=TAXI');
      
      // API 응답 구조에 맞게 데이터 추출
      const receiptsData = response.data?.data || response.data || [];
      console.log('택시비 데이터 로드 성공:', receiptsData);
      setTaxiData(receiptsData);
    } catch (error) {
      console.error('택시비 데이터 로드 실패:', error);
      // API 실패시 빈 배열로 설정
      setTaxiData([]);
    } finally {
      setLoading(false);
    }
  };

  // 내부 직원 목록 가져오기
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users?role=INTERNAL');
      const employeesData = response.data?.data || response.data || [];
      console.log('택시비 - 직원 목록 로드 성공:', employeesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('택시비 - 직원 목록 로드 실패:', error);
      setEmployees([]);
    }
  };

  // 프로젝트 목록 가져오기
  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      const projectsData = response.data?.data || response.data || [];
      setProjects(projectsData);
    } catch (error) {
      console.error('프로젝트 목록 로드 실패:', error);
      setProjects([]);
    }
  };

  // 통계 계산
  const getTaxiStats = () => {
    const stats = {
      total: taxiData.reduce((sum, item) => sum + item.amount, 0),
      approved: taxiData.filter(item => item.status === 'APPROVED').reduce((sum, item) => sum + item.amount, 0),
      pending: taxiData.filter(item => item.status === 'PENDING').reduce((sum, item) => sum + item.amount, 0),
      rejected: taxiData.filter(item => item.status === 'REJECTED').reduce((sum, item) => sum + item.amount, 0),
      processing: taxiData.filter(item => item.status === 'PROCESSING').reduce((sum, item) => sum + item.amount, 0),
      count: taxiData.length,
      pendingCount: taxiData.filter(item => item.status === 'PENDING').length,
      approvedCount: taxiData.filter(item => item.status === 'APPROVED').length,
      rejectedCount: taxiData.filter(item => item.status === 'REJECTED').length,
      processingCount: taxiData.filter(item => item.status === 'PROCESSING').length,
      avgAmount: Math.round(taxiData.reduce((sum, item) => sum + item.amount, 0) / taxiData.length) || 0
    };
    return stats;
  }

  // 상태에 따른 스타일 클래스 반환
  const getStatusClass = (status) => {
    switch (status) {
      case 'APPROVED': return ss.status_active;
      case 'PENDING': return ss.status_warning;
      case 'REJECTED': return ss.status_danger;
      case 'PROCESSING': return ss.status_info;
      default: return ss.status_info;
    }
  }

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return '승인';
      case 'PENDING': return '승인 대기';
      case 'REJECTED': return '거절';
      case 'PROCESSING': return '처리 중';
      default: return status;
    }
  }

  // 카테고리 텍스트 변환
  const getCategoryText = (category) => {
    return category; // 이미 한글로 저장되어 있음
  }

  // 결제 방법 텍스트 변환
  const getPaymentMethodText = (method) => {
    const methodMap = {
      'CORPORATE_CARD': '법인카드',
      'PERSONAL_CARD': '개인카드',
      'CASH': '현금/계좌이체',
      'BANK_TRANSFER': '계좌이체'
    };
    return methodMap[method] || method;
  }

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  }

  // 카드 번호 마스킹
  const maskCardNumber = (number) => {
    if (!number) return '';
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 8) return number;
    
    const first4 = cleanNumber.slice(0, 4);
    const last4 = cleanNumber.slice(-4);
    return `${first4} **** **** ${last4}`;
  }

  // 카드 정보 표시
  const getCreditCardInfo = (item) => {
    if (item.paymentMethod !== 'CORPORATE_CARD' || !item.creditCardId) return null;
    
    const cardName = item.creditCardId?.cardName || '';
    const label = item.creditCardId?.label || '';
    
    if (!cardName && !label) return null;
    return `${cardName} - ${label}`;
  }

  // CSV용 결제방법 표시
  const getPaymentMethodForCSV = (item) => {
    if (item.paymentMethod === 'CORPORATE_CARD' && item.creditCardId) {
      const cardName = item.creditCardId?.cardName || '';
      const label = item.creditCardId?.label || '';
      const number = item.creditCardId?.number || '';
      
      const maskedNumber = maskCardNumber(number);
      
      if (cardName || label) {
        return `법인카드 - ${cardName} - ${label} ${maskedNumber}`;
      }
    }
    return getPaymentMethodText(item.paymentMethod);
  }

  // 날짜 포맷팅 (서버에서 한국 시간으로 저장되므로 그대로 사용)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes.toString().padStart(2, '0')}분`;
  }

  // 시간 포맷팅
  const formatTime = (time) => {
    if (!time) return '00:00';
    // 이미 HH:MM 형식이면 그대로 반환
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    return '00:00';
  }

  // 프로젝트명 표시
  const getProjectDisplay = (item) => {
    return item.projectId?.title || item.projectName || item.project || '미배정';
  }

  // 실제 데이터가 있는 월 목록 생성 (최신 순)
  const getAvailableMonths = () => {
    const monthSet = new Set();
    
    taxiData.forEach(item => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      monthSet.add(`${year}-${month.toString().padStart(2, '0')}`);
    });
    
    // 최신 순으로 정렬
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  };

  // 필터링된 데이터 계산
  const getFilteredData = () => {
    let filteredData = [...taxiData];

    // 월별 필터링
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === parseInt(year) && 
               itemDate.getMonth() + 1 === parseInt(month);
      });
    }

    // 직원별 필터링 (등록자 + 다중인원 결제 참가자 포함)
    if (filters.employee) {
      filteredData = filteredData.filter(item => {
        // 등록자 확인
        if (item.userId?._id === filters.employee || item.userId?.id === filters.employee) {
          return true;
        }
        
        // 다중인원 결제 참가자 확인
        if (item.isMultiPersonPayment && item.participants && item.participants.length > 0) {
          return item.participants.some(participant => 
            participant.person && (
              participant.person._id === filters.employee || 
              participant.person.id === filters.employee
            )
          );
        }
        
        return false;
      });
    }

    // 프로젝트별 필터링 (메인 프로젝트 + 다중인원 결제 프로젝트 포함)
    if (filters.project) {
      filteredData = filteredData.filter(item => {
        // 메인 프로젝트 확인
        if (item.projectId?._id === filters.project || item.projectId?.id === filters.project) {
          return true;
        }
        
        // 다중인원 결제 프로젝트 확인
        if (item.isMultiPersonPayment && item.participants && item.participants.length > 0) {
          return item.participants.some(participant => {
            if (!participant.project) return false;
            
            // ObjectId 형태인지 확인
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(participant.project);
            
            if (isObjectId) {
              // ObjectId인 경우 직접 비교
              return participant.project === filters.project;
            } else {
              // 프로젝트명인 경우 (현재는 ObjectId만 저장되므로 이 부분은 거의 사용되지 않음)
              return participant.project === filters.project;
            }
          });
        }
        
        return false;
      });
    }

    return filteredData;
  };

  const filteredData = getFilteredData();
  const stats = getTaxiStats();

  // 상태별 금액 도넛 차트
  const statusAmountChartData = {
    labels: ['승인', '승인 대기', '거절', '처리 중'],
    datasets: [
      {
        data: [stats.approved, stats.pending, stats.rejected, stats.processing],
        backgroundColor: [
          'rgba(64, 192, 87, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(250, 82, 82, 0.8)',
          'rgba(74, 144, 226, 0.8)'
        ],
        borderColor: [
          'rgba(64, 192, 87, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(250, 82, 82, 1)',
          'rgba(74, 144, 226, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 시간대별 이용 현황 (택시 할증 시간 기준)
  const timeData = taxiData.reduce((acc, item) => {
    const hour = parseInt(item.time.split(':')[0]);
    let timeRange;
    // 22시부터 04시까지는 야간 할증 시간
    if (hour >= 22 || hour < 4) timeRange = '야간(할증)';
    else timeRange = '할증 시간 외';
    
    acc[timeRange] = (acc[timeRange] || 0) + item.amount;
    return acc;
  }, {});

  const timeChartData = {
    labels: Object.keys(timeData),
    datasets: [
      {
        label: '이용 금액',
        data: Object.values(timeData),
        backgroundColor: [
          'rgba(134, 142, 150, 0.8)',  // 야간(할증) - 회색
          'rgba(74, 144, 226, 0.8)'    // 할증 시간 외 - 파란색
        ],
        borderColor: [
          'rgba(134, 142, 150, 1)',
          'rgba(74, 144, 226, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // 월별 택시비 지출 (실제 데이터)
  const getMonthlyTrendData = () => {
    const months = [];
    const data = [];
    
    // 현재 월을 기준으로 최근 6개월 계산
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      // 해당 월의 데이터 필터링
      const monthData = taxiData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
      });
      
      // 해당 월의 총 금액 계산 (거절된 항목 제외)
      const monthTotal = monthData
        .filter(item => item.status !== 'REJECTED')
        .reduce((sum, item) => sum + item.amount, 0);
      
      months.push(`${month}월`);
      data.push(monthTotal);
    }
    
    return {
      labels: months,
      datasets: [
        {
          label: '택시비 지출',
          data: data,
          borderColor: 'rgba(74, 144, 226, 1)',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const monthlyTrendData = getMonthlyTrendData();



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
            return new Intl.NumberFormat('ko-KR').format(value) + '원';
          }
        }
      }
    }
  };

  // 택시 테이블 데이터를 CSV로 변환하는 함수
  const generateTaxiTableCSV = (data) => {
    let csvContent = '';
    
    // 필터 정보 추가
    if (hasActiveFilters()) {
      csvContent += `필터 적용: ${getFilterInfo()}\n`;
      csvContent += `필터링된 데이터: ${data.length}건\n\n`;
    }
    
    csvContent += '날짜,사용자,카테고리,금액,내가_낸_금액,결제방법,프로젝트,분할결제,다중인원,참가자수,상태,메모\n';
    
    data.forEach(item => {
      const csvRow = [
        formatDate(item.date) || '',
        item.userId?.name || '알 수 없음' || '',
        getCategoryText(item.category) || '',
        item.amount || 0,
        item.isSplitPayment ? (item.myAmount || 0) : (item.amount || 0),
        getPaymentMethodForCSV(item) || '',
        getProjectDisplay(item) || '',
        item.isSplitPayment ? 'Y' : 'N',
        item.isMultiPersonPayment ? 'Y' : 'N',
        item.isMultiPersonPayment ? (item.participants?.length || 0) : 1,
        getStatusText(item.status) || '',
        item.description || ''
      ];
      
      csvContent += csvRow.map(value => {
        // null이나 undefined 값을 안전하게 처리
        const safeValue = value !== null && value !== undefined ? value : '';
        const stringValue = safeValue.toString();
        
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',') + '\n';
    });
    
    return csvContent;
  };

  // 모달 열기
  const handleRowClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      month: '',
      employee: '',
      project: ''
    });
  };

  // 필터 적용 여부 확인
  const hasActiveFilters = () => {
    return filters.month || filters.employee || filters.project;
  };

  // 필터 정보 문자열 생성
  const getFilterInfo = () => {
    const filterInfo = [];
    
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      filterInfo.push(`${year}년 ${month}월`);
    }
    
    if (filters.employee) {
      const employee = employees.find(emp => emp._id === filters.employee || emp.id === filters.employee);
      filterInfo.push(`직원: ${employee?.name || '알 수 없음'}`);
    }
    
    if (filters.project) {
      const project = projects.find(proj => proj._id === filters.project || proj.id === filters.project);
      filterInfo.push(`프로젝트: ${project?.title || '알 수 없음'}`);
    }
    
    return filterInfo.join(', ');
  };

  // 상태 업데이트 처리
  const handleStatusUpdate = (updatedItem) => {
    setTaxiData(prevData => 
      prevData.map(item => 
        item._id === updatedItem._id ? updatedItem : item
      )
    );
  };

  if (loading) {
    return (
      <div className={ss.admin_chart_container}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className={ss.spinner}></div>
          <p>택시비 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ss.admin_chart_container}>
      <div className={ss.header}>
        <h1>택시비 관리</h1>
        <div className={ss.summary_stats}>
          <div className={`${ss.stat_item} ${ss.stat_finance}`}>
            <span className={ss.stat_number}>{formatAmount(stats.total)}</span>
            <div className={ss.stat_label}>총 택시비</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--warning-color)'}}>{stats.pendingCount + stats.processingCount}</span>
            <div className={ss.stat_label}>처리 대기</div>
          </div>
          <div className={ss.stat_item}>
            <span className={ss.stat_number} style={{color: 'var(--accent-color)'}}>{formatAmount(stats.avgAmount)}</span>
            <div className={ss.stat_label}>평균 금액</div>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 */}
      <div className={ss.metrics_row}>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--success-color)'}}>{formatAmount(stats.approved)}</div>
          <div className={ss.metric_label}>승인된 금액</div>
          <div className={`${ss.metric_change} ${ss.positive}`}>
            {stats.approvedCount}건 승인
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--warning-color)'}}>{formatAmount(stats.pending)}</div>
          <div className={ss.metric_label}>대기 중인 금액</div>
          <div className={`${ss.metric_change} ${stats.pendingCount > 0 ? ss.negative : ss.neutral}`}>
            {stats.pendingCount}건 대기
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--danger-color)'}}>{formatAmount(stats.rejected)}</div>
          <div className={ss.metric_label}>거절된 금액</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            {stats.rejectedCount}건 거절
          </div>
        </div>
        <div className={ss.metric_card}>
          <div className={ss.metric_value} style={{color: 'var(--accent-color)'}}>{stats.count}</div>
          <div className={ss.metric_label}>총 이용 건수</div>
          <div className={`${ss.metric_change} ${ss.neutral}`}>
            월간 집계
          </div>
        </div>
      </div>



      {/* 차트 영역 */}
      <div className={ss.chart_grid}>
        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            승인 상태별 금액 분포
          </div>
          <div className={ss.chart_content}>
            <Doughnut data={statusAmountChartData} options={chartOptions} />
          </div>
          <div className={ss.chart_legend}>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--success-color)'}}></div>
              승인 ({formatAmount(stats.approved)})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--warning-color)'}}></div>
              대기 ({formatAmount(stats.pending)})
            </div>
            <div className={ss.legend_item}>
              <div className={ss.legend_color} style={{backgroundColor: 'var(--danger-color)'}}></div>
              거절 ({formatAmount(stats.rejected)})
            </div>
            {stats.processing > 0 && (
              <div className={ss.legend_item}>
                <div className={ss.legend_color} style={{backgroundColor: 'var(--accent-color)'}}></div>
                처리 중 ({formatAmount(stats.processing)})
              </div>
            )}
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            시간대별 이용 현황
          </div>
          <div className={ss.chart_content}>
            <Bar data={timeChartData} options={barChartOptions} />
          </div>
        </div>

        <div className={ss.chart_card}>
          <div className={ss.chart_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            월별 택시비 지출
          </div>
          <div className={ss.chart_content}>
            <Line data={monthlyTrendData} options={chartOptions} />
          </div>
        </div>


      </div>

      {/* 데이터 테이블 */}
      <div className={ss.data_table_container}>
        {/* 필터 섹션 */}
        <div className={ss.filter_section}>
          <div className={ss.filter_row}>
            <div className={ss.filter_group}>
              <label className={ss.filter_label}>월별 필터</label>
              <select 
                className={ss.filter_select}
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <option value="">전체</option>
                {getAvailableMonths().map(monthKey => {
                  const [year, month] = monthKey.split('-');
                  return (
                    <option key={monthKey} value={monthKey}>
                      {year}년 {parseInt(month)}월
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className={ss.filter_group}>
              <label className={ss.filter_label}>직원별 필터</label>
              <select 
                className={ss.filter_select}
                value={filters.employee}
                onChange={(e) => handleFilterChange('employee', e.target.value)}
              >
                <option value="">전체</option>
                {employees.map(employee => (
                  <option key={employee._id || employee.id} value={employee._id || employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={ss.filter_group}>
              <label className={ss.filter_label}>프로젝트별 필터</label>
              <select 
                className={ss.filter_select}
                value={filters.project}
                onChange={(e) => handleFilterChange('project', e.target.value)}
              >
                <option value="">전체</option>
                {projects.map(project => (
                  <option key={project._id || project.id} value={project._id || project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={ss.filter_actions}>
              {hasActiveFilters() && (
                <button 
                  className={ss.clear_filter_button}
                  onClick={clearFilters}
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>
          
          {hasActiveFilters() && (
            <div className={ss.filter_info}>
              <span className={ss.filter_info_text}>
                필터 적용: {getFilterInfo()} ({filteredData.length}건)
              </span>
            </div>
          )}
        </div>

        <div className={ss.table_header}>
          <div className={ss.table_title}>
            <div className={`${ss.chart_icon} ${ss.finance}`}></div>
            택시 이용 내역
          </div>
          <ExportButton 
            chartRef={{ current: null }}
            chartTitle={hasActiveFilters() ? `택시_이용_내역_${getFilterInfo().replace(/[^a-zA-Z0-9가-힣]/g, '_')}` : "택시_이용_내역"}
            csvData={generateTaxiTableCSV(filteredData)}
            buttonText={hasActiveFilters() ? "선택 Export" : "Export"}
          />
        </div>
        <table className={ss.data_table}>
          <thead>
            <tr>
              <th>날짜</th>
              <th>등록자</th>
              <th>카테고리</th>
              <th>금액</th>
              <th>결제방법</th>
              <th>프로젝트</th>
              <th>메모</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredData && filteredData.length > 0 ? filteredData.map((item) => (
              <tr 
                key={item._id}
                onClick={() => handleRowClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <td>{formatDate(item.date)}</td>
                <td style={{fontWeight: '500'}}>
                  {item.userId?.name || '알 수 없음'}
                  {item.isMultiPersonPayment && (
                    <span className={ss.status_badge} style={{
                      backgroundColor: 'var(--accent-color)', 
                      color: 'white', 
                      fontSize: '0.7rem',
                      marginLeft: '6px',
                      padding: '2px 6px'
                    }}>
                      다중
                    </span>
                  )}
                </td>
                <td>{getCategoryText(item.category)}</td>
                <td style={{fontWeight: '600'}}>
                  {formatAmount(item.amount)}
                  {/* 분할결제인 경우 내가 낸 금액 표시 */}
                  {item.isSplitPayment && item.myAmount && (
                    <div style={{fontSize: '0.75rem', color: 'var(--warning-color)', marginTop: '2px'}}>
                      내가 낸 금액: {formatAmount(item.myAmount)}
                    </div>
                  )}
                </td>
                <td>
                  {getPaymentMethodText(item.paymentMethod)}
                  {/* 법인카드인 경우 카드 정보 표시 */}
                  {item.paymentMethod === 'CORPORATE_CARD' && getCreditCardInfo(item) && (
                    <div style={{fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px'}}>
                      {getCreditCardInfo(item)}
                    </div>
                  )}
                </td>
                <td>
                  {getProjectDisplay(item) !== '미배정' ? (
                    <span className={ss.status_badge} style={{backgroundColor: 'var(--accent-color)', color: 'white'}}>
                      {getProjectDisplay(item)}
                    </span>
                  ) : (
                    <span style={{color: 'var(--text-tertiary)'}}>미배정</span>
                  )}
                </td>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                    {/* 분할결제 표시 */}
                    {item.isSplitPayment && (
                      <span className={ss.status_badge} style={{backgroundColor: 'var(--info-color)', color: 'white', fontSize: '0.7rem'}}>
                        분할결제
                      </span>
                    )}
                    {/* 다중인원 결제 표시 */}
                    {item.isMultiPersonPayment && item.participants && item.participants.length > 0 && (
                      <span className={ss.status_badge} style={{backgroundColor: 'var(--secondary-color)', color: 'white', fontSize: '0.7rem'}}>
                        다중인원 ({item.participants.length}명)
                      </span>
                    )}
                    {/* 메모가 없는 경우 */}
                    {!item.isSplitPayment && !item.isMultiPersonPayment && (
                      <span style={{color: 'var(--text-tertiary)', fontSize: '0.8rem'}}>-</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`${ss.status_badge} ${getStatusClass(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontStyle: 'italic'}}>
                  {hasActiveFilters() ? '필터 조건에 맞는 택시 이용 내역이 없습니다.' : '택시 이용 내역이 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Finance Modal */}
      <FinanceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        item={selectedItem}
        type="taxi"
        onUpdate={handleStatusUpdate}
      />
    </div>
  )
}

export default AdminFinanceTaxi