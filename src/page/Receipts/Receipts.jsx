import React, { useState, useEffect, useRef } from 'react';
import styles from './Receipts.module.css';
import { FaPlus, FaSearch, FaFileDownload, FaEdit, FaReceipt, FaUtensils, FaTaxi, FaTimes } from 'react-icons/fa';
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
  getReceiptStatsByType,
  currentUser
} from '../../data/mockDatabase';
import api from '../../utils/api';
import { jwtDecode } from 'jwt-decode';
import baseURL from '../../utils/baseURL';
import { optimizeImage } from '../../utils/imageUtils';

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
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  // 새 영수증 또는 편집할 영수증 데이터
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    amount: '',
    category: '',
    paymentMethod: 'CORPORATE_CARD',
    status: 'PENDING',
    attachmentUrls: [], // 배열로 변경
    type: 'OTHER',
    description: '',
    project: '',
    projectId: null,
    userId: null // JWT에서 추출하도록 수정
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
  }, [activeTab]);

  // receipts가 변경될 때마다 통계 업데이트
  useEffect(() => {
    loadStats();
  }, [receipts]);

  // 1초마다 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearInterval(timer)
  }, [])

  // 영수증 데이터 로드
  const loadReceipts = async () => {
    if (!localStorage.getItem('token')) {
      return
    }
    const response = await api.get(`/receipts?userId=${jwtDecode(localStorage.getItem('token')).userId}`);
    if (response.status === 200) {
      setReceipts(response.data.data);
    }
  };

  // 통계 데이터 로드 - 실제 receipts 데이터를 기반으로 계산
  const loadStats = () => {
    const stats = [
      {
        id: 'all',
        total: receipts.reduce((sum, receipt) => sum + receipt.amount, 0)
      },
      {
        id: 'MEAL',
        total: receipts.filter(r => r.type === 'MEAL').reduce((sum, receipt) => sum + receipt.amount, 0)
      },
      {
        id: 'TAXI', 
        total: receipts.filter(r => r.type === 'TAXI').reduce((sum, receipt) => sum + receipt.amount, 0)
      }
    ];
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
      attachmentUrls: [],
      type: activeTab === 'all' ? 'OTHER' : activeTab,
      description: '',
      project: '',
      projectId: null,
      userId: null // JWT에서 추출하도록 수정
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
  const handleSubmit = async (receiptData) => {
    try {
      if (modalMode === 'add') {
        // StepperModal 데이터를 서버 형식으로 변환
        const serverData = await convertStepperDataToServerFormat(receiptData);
        
        // 서버로 전송
        const response = await api.post('/receipts', serverData);
        if (response.status === 201) {
          console.log('영수증 추가 성공:', response.data);
          loadReceipts();
          setIsModalOpen(false);
        }
      } else {
        // 기존 영수증 수정
        updateReceipt(selectedReceipt.id, receiptData);
        loadReceipts();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('영수증 처리 실패:', error);
      alert('영수증 처리에 실패했습니다: ' + (error.response?.data?.message || error.message));
    }
  };

  // StepperModal 데이터를 서버 형식으로 변환
  const convertStepperDataToServerFormat = async (stepperData) => {
    const { dateTime, attachedFiles, paymentMethod, category, ...rest } = stepperData;

    // JWT 토큰에서 실제 사용자 ID 추출
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }
    const decodedToken = jwtDecode(token);
    const actualUserId = decodedToken.userId;

    // 날짜/시간 변환 (한국 시간 기준으로 ISO 문자열 생성)
    const dateString = `${dateTime.year}-${dateTime.month.padStart(2, '0')}-${dateTime.day.padStart(2, '0')}`;
    const timeString = `${dateTime.hour.padStart(2, '0')}:${dateTime.minute.padStart(2, '0')}`;
    
    // 한국 시간 기준으로 정확한 날짜/시간 생성
    const koreaDateTime = new Date(`${dateString}T${timeString}:00+09:00`);
    
    // 카테고리는 한글 그대로 사용

    // 결제방법 한글 -> 영어 변환
    let finalPaymentMethod;
    if (paymentMethod === '신용카드') {
      finalPaymentMethod = rest.cardType === '법인카드' ? 'CORPORATE_CARD' : 'PERSONAL_CARD';
    } else {
      finalPaymentMethod = 'CASH';
    }

    // 이미지 업로드 처리
    let attachmentUrls = [];
    if (attachedFiles && attachedFiles.length > 0) {
      attachmentUrls = await uploadImages(attachedFiles);
    }

    return {
      title: `${category} - ${parseInt(rest.amount).toLocaleString()}원`,
      description: rest.description || '', // 사용자 입력 메모 사용 (없으면 빈 문자열)
      amount: parseFloat(rest.amount),
      date: koreaDateTime.toISOString(), // 한국 시간 기준 ISO 문자열
      time: timeString,
      type: category === '교통비' ? 'TAXI' : (category === '식비' ? 'MEAL' : 'OTHER'),
      category: category, // 한글 그대로 저장
      paymentMethod: finalPaymentMethod,
      userId: actualUserId,
      userName: decodedToken.name || currentUser.name,
      projectId: rest.project,
      attachmentUrls: attachmentUrls,
      
      // StepperModal 확장 데이터
      stepperDateTime: dateTime,
      isSplitPayment: rest.isSplitPayment || false,
      myAmount: rest.myAmount ? parseFloat(rest.myAmount) : null,
      isMultiPersonPayment: rest.isMultiPersonPayment || false,
      participants: rest.participants || [],
      cardType: rest.cardType, // 법인카드/개인카드 구분
      creditCardId: rest.creditCardId, // 법인카드 ID
      bankName: rest.bankName,
      bankNameOther: rest.bankNameOther,
      accountNumber: rest.accountNumber
    };
  };

  // 이미지 업로드 함수
  const uploadImages = async (files) => {
    const uploadedUrls = [];
    
    for (const file of files) {
      try {
        console.log('이미지 최적화 시작:', file.name);
        
        // 이미지 최적화 (리사이징 및 압축)
        const optimizedFile = await optimizeImage(file);
        
        const formData = new FormData();
        formData.append('file', optimizedFile);
        
        const response = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.status === 200 && response.data.url) {
          uploadedUrls.push(response.data.url);
        }
      } catch (error) {
        console.error('이미지 처리 또는 업로드 실패:', error);
        // 최적화 실패 시 원본 파일로 재시도
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await api.post('/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.status === 200 && response.data.url) {
            uploadedUrls.push(response.data.url);
          }
        } catch (fallbackError) {
          console.error('원본 파일 업로드도 실패:', fallbackError);
          // 하나 실패해도 계속 진행
        }
      }
    }
    
    return uploadedUrls;
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

  // 날짜 포맷팅 함수 (서버에서 한국 시간으로 저장되므로 그대로 사용)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes.toString().padStart(2, '0')}분`;
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

  // 이미지 보기
  const handleImageView = (imageUrl) => {
    const fullUrl = `${baseURL}${imageUrl}`
    setCurrentImageUrl(fullUrl)
    setImageViewerOpen(true)
  }

  // 원본 파일명 추출
  const getOriginalFileName = (imageUrl) => {
    const pathSegments = imageUrl.split('/')
    return pathSegments[pathSegments.length - 1]
  }

  // 이미지 다운로드
  const handleImageDownload = async (imageUrl) => {
    try {
      const fullUrl = `${baseURL}${imageUrl}`
      const response = await fetch(fullUrl)
      const blob = await response.blob()
      
      const originalFileName = getOriginalFileName(imageUrl)
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = originalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 메모리 정리
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('다운로드 실패:', error)
      alert('이미지 다운로드에 실패했습니다.')
    }
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
              <th>금액</th>
              {!isMobile && (
                <>
                  <th>카테고리</th>
                  <th>결제방법</th>
                  <th>프로젝트</th>
                  <th>메모</th>
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
                  {!isMobile && <td>{formatDate(receipt.date)}</td>}
                  <td className={styles.amount}>{formatAmount(receipt.amount)}</td>
                  {!isMobile && (
                    <>
                      <td>{getCategoryName(receipt.category)}</td>
                      <td>{getPaymentMethodName(receipt.paymentMethod)}</td>
                      <td className={styles.project_cell}>
                        {receipt.projectId?.title || receipt.projectName || receipt.project ? (
                          <span className={styles.project_tag}>
                            {receipt.projectId?.title || receipt.projectName || receipt.project}
                          </span>
                        ) : (
                          <span className={styles.no_project}>-</span>
                        )}
                      </td>
                      <td className={styles.memo_cell}>
                        {receipt.description ? (
                          <span className={styles.memo_text} title={receipt.description}>
                            {receipt.description.length > 20 
                              ? `${receipt.description.substring(0, 20)}...` 
                              : receipt.description}
                          </span>
                        ) : (
                          <span className={styles.no_memo}>-</span>
                        )}
                      </td>
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
                <td colSpan={isMobile ? "2" : "7"} className={styles.no_data}>
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
                  <span>{formatDate(selectedReceipt.date)}</span>
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
                <div className={styles.info_row}>
                  <span>프로젝트:</span>
                  <span>
                    {selectedReceipt.projectId?.title || selectedReceipt.projectName || selectedReceipt.project ? (
                      <span className={styles.project_tag_modal}>
                        {selectedReceipt.projectId?.title || selectedReceipt.projectName || selectedReceipt.project}
                      </span>
                    ) : (
                      <span className={styles.no_project_modal}>선택되지 않음</span>
                    )}
                  </span>
                </div>
                {selectedReceipt.description && (
                  <div className={styles.info_description}>
                    <span>메모:</span>
                    <p>{selectedReceipt.description}</p>
                  </div>
                )}
                {selectedReceipt.attachmentUrls && selectedReceipt.attachmentUrls.length > 0 && (
                  <div className={styles.info_attachments}>
                    <span>첨부파일:</span>
                    <div className={styles.attachments_list}>
                      {selectedReceipt.attachmentUrls.map((url, index) => (
                        <div key={index} className={styles.attachment_item}>
                          <span className={styles.attachment_name}>
                            첨부{index + 1}
                          </span>
                          <div className={styles.attachment_buttons}>
                            <button 
                              className={styles.attachment_view}
                              onClick={() => handleImageView(url)}
                            >
                              보기
                            </button>
                            <button 
                              className={styles.attachment_download}
                              onClick={() => handleImageDownload(url)}
                            >
                              다운로드
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.action_buttons}>
                <button 
                  className={`${styles.edit_button} ${selectedReceipt.status === 'APPROVED' ? styles.disabled : ''}`}
                  onClick={() => openEditModal(selectedReceipt)}
                  disabled={selectedReceipt.status === 'APPROVED'}
                  title={selectedReceipt.status === 'APPROVED' ? '승인된 영수증은 편집할 수 없습니다' : ''}
                >
                  <FaEdit /> {selectedReceipt.status === 'APPROVED' ? '승인 완료' : '편집'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 뷰어 모달 */}
      {imageViewerOpen && (
        <div className={styles.image_viewer_overlay} onClick={() => setImageViewerOpen(false)}>
          <div className={styles.image_viewer_container} onClick={(e) => e.stopPropagation()}>
            <div className={styles.image_viewer_header}>
              <h3>영수증 이미지</h3>
              <button 
                className={styles.image_viewer_close}
                onClick={() => setImageViewerOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.image_viewer_content}>
              <img 
                src={currentImageUrl} 
                alt="영수증 이미지"
                className={styles.receipt_image}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">이미지를 불러올 수 없습니다.</div>'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts; 