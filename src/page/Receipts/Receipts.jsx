import React, { useState, useEffect, useRef } from 'react';
import styles from './Receipts.module.css';
import { FaPlus, FaSearch, FaFileDownload, FaTrash, FaEdit, FaReceipt, FaUtensils, FaTaxi, FaTimes } from 'react-icons/fa';
import ReceiptStepper from '../../components/ReceiptStepper/ReceiptStepper';
import { 
  receipts as initialReceiptsData, 
  receiptCategories, 
  receiptTypes, 
  receiptStatuses, 
  paymentMethods,
  getReceipts,
  getReceiptsByType,
  addReceipt,
  updateReceipt,
  deleteReceipt,
  getReceiptStatsByType,
  currentUser
} from '../../data/mockDatabase';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' 또는 'edit'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'MEAL', 'TAXI'
  const [typeStats, setTypeStats] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 새 영수증 또는 편집할 영수증 데이터
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    amount: '',
    category: '',
    paymentMethod: 'CORPORATE_CARD',
    status: 'PENDING',
    attachmentUrl: null,
    type: 'OTHER',
    description: '',
    userId: currentUser.id,
    projectId: null
  });

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 데이터 로드
  useEffect(() => {
    loadReceipts();
    loadStats();
  }, [activeTab]);

  // 1초마다 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timer)
  }, [])

  // 영수증 데이터 로드
  const loadReceipts = () => {
    let data;
    if (activeTab === 'all') {
      data = getReceipts();
    } else {
      data = getReceiptsByType(activeTab);
    }
    setReceipts(data);
  };

  // 통계 데이터 로드
  const loadStats = () => {
    const stats = getReceiptStatsByType();
    setTypeStats(stats);
  };

  // 검색 및 필터링된 영수증 목록
  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || receipt.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || receipt.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 모달 열기 - 추가 모드
  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      amount: '',
      category: '',
      paymentMethod: 'CORPORATE_CARD',
      status: 'PENDING',
      attachmentUrl: null,
      type: activeTab === 'all' ? 'OTHER' : activeTab,
      description: '',
      userId: currentUser.id,
      projectId: null
    });
    setIsModalOpen(true);
  };

  // 모달 열기 - 편집 모드
  const openEditModal = (receipt) => {
    setModalMode('edit');
    setFormData({
      ...receipt,
      amount: receipt.amount.toString()
    });
    setSelectedReceipt(receipt);
    setIsModalOpen(true);
    setIsActionModalOpen(false); // 작업 모달 닫기
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReceipt(null);
  };

  // 입력 필드 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 영수증 추가 또는 수정
  const handleSubmit = (receiptData) => {    
    if (modalMode === 'add') {
      // 새 영수증 추가
      addReceipt(receiptData);
    } else {
      // 기존 영수증 수정
      updateReceipt(selectedReceipt.id, receiptData);
    }
    
    loadReceipts();
    loadStats();
  };

  // 영수증 삭제
  const handleDelete = () => {
    if (window.confirm('정말로 이 영수증을 삭제하시겠습니까?')) {
      deleteReceipt(selectedReceipt.id);
      loadReceipts();
      loadStats();
      setIsActionModalOpen(false); // 작업 모달 닫기
    }
  };

  // 행 클릭 시 선택된 영수증 설정 및 작업 모달 열기
  const handleRowClick = (receipt) => {
    setSelectedReceipt(receipt);
    setIsActionModalOpen(true);
  };

  // 작업 모달 닫기
  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setSelectedReceipt(null);
  };

  // 금액 포맷팅 함수
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  // 탭 변경 처리
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterCategory('all'); // 탭 변경 시 카테고리 필터 초기화
  };

  // 탭 제목 및 아이콘 설정 - 모바일과 데스크톱에 따라 다르게 표시
  const tabConfig = {
    all: { 
      title: isMobile ? 'All' : 'All Receipts', 
      icon: <FaReceipt className={styles.tab_icon} /> 
    },
    MEAL: { 
      title: isMobile ? 'Meal' : 'Meal Expenses', 
      icon: <FaUtensils className={styles.tab_icon} /> 
    },
    TAXI: { 
      title: isMobile ? 'Taxi' : 'Taxi Expenses', 
      icon: <FaTaxi className={styles.tab_icon} /> 
    }
  };

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId) => {
    const category = receiptCategories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // 결제 방법 이름 가져오기
  const getPaymentMethodName = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.name : methodId;
  };

  // 상태 이름 가져오기
  const getStatusName = (statusId) => {
    const status = receiptStatuses.find(s => s.id === statusId);
    return status ? status.name : statusId;
  };

  return (
    <div className={styles.receipts_container}>
      <header className={styles.dashboard_header}>
        <div className={styles.header_content}>
          <h1 className={styles.dashboard_title}>
            Receipts
          </h1>
          <p className={styles.dashboard_date}>
            {currentTime.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} {currentTime.toLocaleTimeString('en-US')}
          </p>
        </div>
        
        <div className={styles.header_controls}>
          <div className={styles.search_container}>
            <FaSearch className={styles.search_icon} />
            <input
              type="text"
              placeholder="영수증 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.search_input}
            />
          </div>
          <button className={`${styles.customize_btn} ${styles.save_btn}`} onClick={openAddModal}>
            <FaPlus /> 영수증 추가
          </button>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className={styles.tabs_container}>
        {Object.entries(tabConfig).map(([key, { title, icon }]) => (
          <button
            key={key}
            className={`${styles.tab_button} ${activeTab === key ? styles.active_tab : ''}`}
            onClick={() => handleTabChange(key)}
          >
            {icon}
            <span className={styles.tab_text}>{title}</span>
            {!isMobile && typeStats.find(stat => stat.id === key) && (
              <span className={styles.tab_badge}>
                {formatAmount(typeStats.find(stat => stat.id === key)?.total || 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        <div className={styles.filter_group}>
          <label>상태:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filter_select}
          >
            <option value="all">전체</option>
            {receiptStatuses.map(status => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.filter_group}>
          <label>카테고리:</label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className={styles.filter_select}
          >
            <option value="all">전체</option>
            {receiptCategories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.receipts_table_container}>
        <table className={styles.receipts_table}>
          <thead>
            <tr>
              {!isMobile && <th>날짜</th>}
              <th>제목</th>
              <th>금액</th>
              {!isMobile && (
                <>
                  <th>카테고리</th>
                  <th>결제방법</th>
                </>
              )}
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.length > 0 ? (
              filteredReceipts.map(receipt => (
                <tr 
                  key={receipt.id} 
                  className={styles.receipt_row}
                  onClick={() => handleRowClick(receipt)}
                >
                  {!isMobile && <td>{receipt.date}</td>}
                  <td>{receipt.title}</td>
                  <td className={styles.amount}>{formatAmount(receipt.amount)}</td>
                  {!isMobile && (
                    <>
                      <td>{getCategoryName(receipt.category)}</td>
                      <td>{getPaymentMethodName(receipt.paymentMethod)}</td>
                    </>
                  )}
                  <td>
                    <span className={`${styles.status} ${styles[receipt.status]}`}>
                      {getStatusName(receipt.status)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isMobile ? "3" : "6"} className={styles.no_data}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 영수증 모달 컴포넌트 */}
      <ReceiptStepper
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        mode={modalMode}
        initialData={formData}
      />

      {/* 작업 모달 */}
      {isActionModalOpen && selectedReceipt && (
        <div className={styles.modal_overlay} onClick={closeActionModal}>
          <div className={styles.action_modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.action_modal_header}>
              <h3>{selectedReceipt.title}</h3>
              <button className={styles.close_button} onClick={closeActionModal}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.action_modal_body}>
              <div className={styles.receipt_info}>
                <div className={styles.info_row}>
                  <span>날짜:</span>
                  <span>{selectedReceipt.date}</span>
                </div>
                <div className={styles.info_row}>
                  <span>금액:</span>
                  <span className={styles.amount}>{formatAmount(selectedReceipt.amount)}</span>
                </div>
                <div className={styles.info_row}>
                  <span>카테고리:</span>
                  <span>{getCategoryName(selectedReceipt.category)}</span>
                </div>
                <div className={styles.info_row}>
                  <span>결제방법:</span>
                  <span>{getPaymentMethodName(selectedReceipt.paymentMethod)}</span>
                </div>
                <div className={styles.info_row}>
                  <span>상태:</span>
                  <span className={`${styles.status_badge} ${styles[selectedReceipt.status]}`}>
                    {getStatusName(selectedReceipt.status)}
                  </span>
                </div>
                {selectedReceipt.description && (
                  <div className={styles.info_description}>
                    <span>메모:</span>
                    <p>{selectedReceipt.description}</p>
                  </div>
                )}
              </div>
              <div className={styles.action_buttons}>
                <button 
                  className={styles.edit_button} 
                  onClick={() => openEditModal(selectedReceipt)}
                >
                  <FaEdit /> 편집
                </button>
                <button 
                  className={styles.delete_button} 
                  onClick={handleDelete}
                >
                  <FaTrash /> 삭제
                </button>
                {selectedReceipt.attachmentUrl && (
                  <button className={styles.download_button}>
                    <FaFileDownload /> 첨부파일 다운로드
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts; 