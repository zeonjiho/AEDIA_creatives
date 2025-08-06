import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './StepperModal.module.css';
import StaffSearchModal from '../StaffSearchModal/StaffSearchModal';
import api from '../../utils/api';
import baseURL from '../../utils/baseURL';
import { jwtDecode } from 'jwt-decode';

/**
 * 단계별 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 여부
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {number} props.currentStep - 현재 단계 (1부터 시작)
 * @param {number} props.totalSteps - 전체 단계 수
 * @param {Function} props.onPrevStep - 이전 단계로 이동 함수
 * @param {Function} props.onNextStep - 다음 단계로 이동 함수
 * @param {string} props.title - 모달 제목
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {boolean} props.showPrevButton - 이전 버튼 표시 여부 (기본값: true)
 * @param {boolean} props.showNextButton - 다음 버튼 표시 여부 (기본값: true)
 * @param {string} props.nextButtonText - 다음 버튼 텍스트 (기본값: '다음')
 * @param {string} props.prevButtonText - 이전 버튼 텍스트 (기본값: '이전')
 */
const StepperModal = ({ isOpen, onClose, onSubmit, title = '지출 추가', mode = 'add', initialData = {} }) => {
  // sessionStorage 키
  const STORAGE_KEY = 'stepperModal_formData';
  const STORAGE_STEP_KEY = 'stepperModal_currentStep';

  // 현재 날짜/시간 가져오기
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
      hour: now.getHours().toString().padStart(2, '0'),
      minute: now.getMinutes().toString().padStart(2, '0')
    };
  };

  // sessionStorage에서 데이터 복원
  const getStoredFormData = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedData = JSON.parse(stored);
        return {
          ...parsedData,
          // attachedFiles는 직렬화할 수 없으므로 빈 배열로 초기화
          attachedFiles: []
        };
      }
    } catch (error) {
      console.error('저장된 데이터 복원 실패:', error);
    }
    return {
      category: '',
      dateTime: getCurrentDateTime(),
      amount: '',
      project: '',
      paymentMethod: '',
      participants: [{ person: null, project: '' }],
      attachedFiles: [],
      myAmount: '', // 분할결제용 내가 낸 금액 추가
      isSplitPayment: false, // 분할결제 체크박스 상태 추가
      isMultiPersonPayment: false, // 다중인원 체크박스 상태 추가
      cardType: '', // 법인카드/개인카드 선택 추가
      creditCardId: '', // 법인카드 ID 추가
      bankName: '', // 은행명 추가
      bankNameOther: '', // 기타 은행 직접입력 추가
      accountNumber: '', // 계좌번호 추가
      description: '', // 메모 필드 추가
      taxiReason: '', // 택시비 사유 추가
      mealReason: '' // 식비 사유 추가
    };
  };

  const getStoredStep = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_STEP_KEY);
      return stored ? parseInt(stored) : 1;
    } catch (error) {
      console.error('저장된 단계 복원 실패:', error);
      return 1;
    }
  };

  const [currentStep, setCurrentStep] = useState(getStoredStep);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [showDateConfirm, setShowDateConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingParticipantIndex, setEditingParticipantIndex] = useState(null);
  const [formData, setFormData] = useState(getStoredFormData);
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 중 로딩 상태 추가

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [showCorporateCardModal, setShowCorporateCardModal] = useState(false);

  const [projects, setProjects] = useState([]);
  const [corporateCards, setCorporateCards] = useState([]);

  // 택시비 관련 상태 추가
  const [taxiWorkHours, setTaxiWorkHours] = useState(null);
  const [isEligibleForTaxi, setIsEligibleForTaxi] = useState(true);
  const [taxiReason, setTaxiReason] = useState('');
  const [checkingWorkHours, setCheckingWorkHours] = useState(false);

  // 식비 관련 상태 추가
  const [mealAttendanceStatus, setMealAttendanceStatus] = useState(null);
  const [isEligibleForMeal, setIsEligibleForMeal] = useState(true);
  const [mealReason, setMealReason] = useState('');
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  // ObjectId를 프로젝트 이름으로 변환하는 헬퍼 함수
  const getProjectName = (projectId) => {
    if (!projectId) return '';
    const project = projects.find(p => p._id === projectId);
    return project ? project.title : projectId;
  };

  // 택시비 근무 시간 체크 함수
  const checkTaxiWorkHours = async () => {
    try {
      setCheckingWorkHours(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      
      // 퇴근 날짜는 선택된 날짜로 설정
      const { year, month, day } = formData.dateTime;
      const checkDate = `${year}-${month}-${day}`;

      const response = await api.get('/attendance/work-hours-for-taxi', {
        params: {
          userId: userId,
          date: checkDate
        }
      });

      if (response.status === 200) {
        const data = response.data;
        setTaxiWorkHours(data.workHoursFormatted);
        setIsEligibleForTaxi(data.isEligibleForTaxi);
        
        if (!data.isEligibleForTaxi) {
          showToast(`근무 시간이 ${data.workHoursFormatted}으로 9시간 미만입니다. 사유를 입력해주세요.`);
        }
      }
    } catch (error) {
      console.error('택시비 근무 시간 체크 실패:', error);
      showToast('근무 시간 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingWorkHours(false);
    }
  };

  // 식비 출퇴근 기록 체크 함수
  const checkMealAttendance = async () => {
    try {
      setCheckingAttendance(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      
      // 선택된 날짜
      const { year, month, day } = formData.dateTime;
      const checkDate = `${year}-${month}-${day}`;

      const response = await api.get('/attendance/check-attendance-for-meal', {
        params: {
          userId: userId,
          date: checkDate
        }
      });

      if (response.status === 200) {
        const data = response.data;
        setMealAttendanceStatus(data);
        setIsEligibleForMeal(data.isEligibleForMeal);
        
        if (!data.isEligibleForMeal) {
          showToast('해당 날짜에 출퇴근 기록이 없습니다. 사유를 입력해주세요.');
        }
      }
    } catch (error) {
      console.error('식비 출퇴근 기록 체크 실패:', error);
      showToast('출퇴근 기록 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingAttendance(false);
    }
  };

  // 데이터 저장 함수
  const saveToStorage = (data, step = null) => {
    try {
      // formData 저장 (File 객체 제외)
      const dataToSave = {
        ...data,
        attachedFiles: [] // File 객체는 저장하지 않음
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      // 현재 단계 저장
      if (step !== null) {
        sessionStorage.setItem(STORAGE_STEP_KEY, step.toString());
      }
    } catch (error) {
      console.error('데이터 저장 실패:', error);
    }
  };

  // 저장된 데이터 삭제
  const clearStorage = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_STEP_KEY);
    } catch (error) {
      console.error('저장된 데이터 삭제 실패:', error);
    }
  };

  // 프로젝트 리스트와 법인카드 리스트 서버에서 가져오기
  useEffect(() => {
    const fetchProjects = async () => {
      const response = await api.get('/projects');
      if (response.status === 200) {
        const result = response.data.filter((item, idx) => 
          item.status !== 'deleted' && !item.isHide // 숨겨진 프로젝트 제외
        )
        setProjects(result);
      }
    }
    const fetchCorporateCards = async () => {
      const response = await api.get('/credit-cards');
      if (response.status === 200) {
        setCorporateCards(response.data);
      }
    }
    fetchProjects();
    fetchCorporateCards();
  }, [])

  // formData 변경시마다 저장
  useEffect(() => {
    if (isOpen) {
      saveToStorage(formData);
    }
  }, [formData, isOpen]);

  // currentStep 변경시마다 저장
  useEffect(() => {
    if (isOpen) {
      saveToStorage(formData, currentStep);
    }
  }, [currentStep, isOpen]);

  // 컴포넌트가 열릴 때 저장된 데이터 복원 또는 편집 데이터 설정
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData && Object.keys(initialData).length > 0) {
        // 편집 모드에서 초기 데이터 설정
        const editDateTime = initialData.date ? 
          (() => {
            const date = new Date(initialData.date);
            return {
              year: date.getFullYear().toString(),
              month: (date.getMonth() + 1).toString().padStart(2, '0'),
              day: date.getDate().toString().padStart(2, '0'),
              hour: date.getHours().toString().padStart(2, '0'),
              minute: date.getMinutes().toString().padStart(2, '0')
            };
          })() : getCurrentDateTime();
        
        // 카테고리 매핑 (서버에서 온 카테고리를 StepperModal 형식으로 변환)
        let mappedCategory = '';
        if (initialData.category) {
          switch (initialData.category) {
            case 'MEAL':
            case '식비':
              mappedCategory = '식비';
              break;
            case 'TAXI':
            case '택시비':
              mappedCategory = '택시비';
              break;
            case 'OFFICE':
            case '사무용품':
              mappedCategory = '사무용품';
              break;
            case 'MARKETING':
            case '마케팅':
              mappedCategory = '마케팅';
              break;
            case 'ENTERTAINMENT':
            case '접대비':
              mappedCategory = '접대비';
              break;
            case 'EDUCATION':
            case '교육비':
              mappedCategory = '교육비';
              break;
            case 'OTHER':
            case '기타':
              mappedCategory = '기타';
              break;
            default:
              mappedCategory = initialData.category;
          }
        }

        // 기존 이미지 URL들을 가상의 파일 객체로 변환
        let existingFiles = [];
        if (initialData.attachmentUrls && initialData.attachmentUrls.length > 0) {
          existingFiles = initialData.attachmentUrls.map((url, index) => {
            // URL이 baseURL을 포함하지 않으면 추가
            const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
            
            // 가상의 파일 객체 생성 (기존 이미지임을 표시)
            return {
              name: `기존이미지_${index + 1}.jpg`,
              size: 0,
              type: 'image/jpeg',
              isExistingImage: true,
              url: fullUrl,
              originalUrl: url // 원본 서버 URL 보존
            };
          });
        }

        // 프로젝트 ID 처리 (ObjectId._id 또는 projectId 자체)
        const projectId = initialData.projectId?._id || initialData.projectId || '';
        
        // 결제 방법 변환
        let paymentMethodText = '신용카드';
        let cardTypeText = '법인카드';
        
        if (initialData.paymentMethod === 'CORPORATE_CARD') {
          paymentMethodText = '신용카드';
          cardTypeText = '법인카드';
        } else if (initialData.paymentMethod === 'PERSONAL_CARD') {
          paymentMethodText = '신용카드';
          cardTypeText = '개인카드';
        } else if (initialData.paymentMethod === 'CASH') {
          paymentMethodText = '현금/계좌이체';
          cardTypeText = '';
        }

        const editFormData = {
          category: mappedCategory,
          dateTime: editDateTime,
          amount: initialData.amount ? initialData.amount.toString() : '',
          project: projectId,
          paymentMethod: paymentMethodText,
          participants: [{ person: null, project: '' }],
          attachedFiles: existingFiles, // 기존 이미지들을 포함
          myAmount: '',
          isSplitPayment: false,
          isMultiPersonPayment: false,
          cardType: cardTypeText,
          creditCardId: '',
          bankName: '',
          bankNameOther: '',
          accountNumber: '',
          description: initialData.description || ''
        };
        
        setFormData(editFormData);
        setCurrentStep(2); // 편집 모드에서는 2단계부터 시작
      } else {
        // 추가 모드 - 기존 로직
        const storedData = getStoredFormData();
        const storedStep = getStoredStep();

        // 저장된 데이터가 있으면 복원, 없으면 현재 시간으로 초기화
        if (storedData.category || storedData.amount || storedData.project) {
          // 기존에 입력된 데이터가 있으면 복원
          setFormData(storedData);
          setCurrentStep(storedStep);
        } else {
          // 새로 시작하는 경우 현재 시간으로 초기화
          setFormData(prev => ({
            ...prev,
            dateTime: getCurrentDateTime()
          }));
        }
      }
    }
  }, [isOpen, mode, initialData]);
  
  // 모달이 닫힐 때 모든 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      // sessionStorage 완전 삭제
      clearStorage();
      
      // 폼 데이터 초기화
      setFormData({
        category: '',
        dateTime: getCurrentDateTime(),
        amount: '',
        project: '',
        paymentMethod: '',
        participants: [{ person: null, project: '' }],
        attachedFiles: [],
        myAmount: '',
        isSplitPayment: false,
        isMultiPersonPayment: false,
        cardType: '',
        creditCardId: '',
        bankName: '',
        bankNameOther: '',
        accountNumber: '',
        description: ''
      });
      
      // 단계 초기화
      setCurrentStep(1);
      
      // 기타 상태 초기화
      setToast({ show: false, message: '' });
      setShowDateConfirm(false);
      setShowCloseConfirm(false);
      setShowStaffModal(false);
      setEditingParticipantIndex(null);
      setShowCorporateCardModal(false);
      
      // 카메라 정리 (안전하게)
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [isOpen, stream]);

  // 브라우저 창 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        // 창 크기 변경 시 현재 데이터 저장
        saveToStorage(formData, currentStep);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [formData, currentStep, isOpen]);

  // 브라우저 기본 beforeunload alert 완전 차단
  useEffect(() => {
    if (isOpen) {
      // 기존 beforeunload 핸들러 저장
      const originalOnBeforeUnload = window.onbeforeunload;

      // beforeunload 완전 차단
      window.onbeforeunload = null;

      // 모든 beforeunload 이벤트 리스너를 무효화하는 핸들러 설정
      const blockBeforeUnload = () => {
        // 아무것도 하지 않음으로써 기본 동작 차단
        return undefined;
      };

      window.addEventListener('beforeunload', blockBeforeUnload);

      return () => {
        // 정리: 원본 핸들러 복원
        window.onbeforeunload = originalOnBeforeUnload;
        window.removeEventListener('beforeunload', blockBeforeUnload);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 토스트 표시 함수
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  // 날짜/시간 형식화 함수
  const formatDateTime = (dateTime) => {
    return `${dateTime.year}년 ${parseInt(dateTime.month)}월 ${parseInt(dateTime.day)}일 ${dateTime.hour}시 ${dateTime.minute}분`;
  };

  // 각 단계별 필수 필드 검증
  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.category) {
          showToast('카테고리를 선택해주세요.');
          return false;
        }
        if (!formData.amount || formData.amount <= 0) {
          showToast('금액을 올바르게 입력해주세요.');
          return false;
        }
        // 택시비 선택 시 9시간 미만이면 사유 필수
        if (formData.category === '택시비' && !isEligibleForTaxi) {
          if (!formData.taxiReason || formData.taxiReason.trim() === '') {
            showToast('9시간 미만 근무 시 택시비 사용 사유를 입력해주세요.');
            return false;
          }
        }
        // 식비 선택 시 출퇴근 기록이 없으면 사유 필수
        if (formData.category === '식비' && !isEligibleForMeal) {
          if (!formData.mealReason || formData.mealReason.trim() === '') {
            showToast('출퇴근 기록이 없을 시 식비 사용 사유를 입력해주세요.');
            return false;
          }
        }
        return true;

      case 2:
        if (!formData.project) {
          showToast('프로젝트를 선택해주세요.');
          return false;
        }
        if (!formData.paymentMethod) {
          showToast('결제방법을 선택해주세요.');
          return false;
        }

        // 신용카드 선택시 카드 유형 검증
        if (formData.paymentMethod === '신용카드') {
          if (!formData.cardType) {
            showToast('카드 유형을 선택해주세요.');
            return false;
          }
          // 법인카드인 경우 creditCardId 검증
          if (formData.cardType === '법인카드') {
            if (!formData.creditCardId) {
              showToast('법인카드를 선택해주세요.');
              return false;
            }
          }
        }

        // 현금/계좌이체 선택시 은행명과 계좌번호 검증 (계좌이체인 경우에만)
        if (formData.paymentMethod === '현금/계좌이체') {
          // 은행명이나 계좌번호가 입력된 경우에만 검증 (계좌이체로 판단)
          if (formData.bankName || formData.accountNumber) {
            if (!formData.bankName) {
              showToast('은행을 선택해주세요.');
              return false;
            }
            if (formData.bankName === '기타' && !formData.bankNameOther) {
              showToast('은행명을 직접 입력해주세요.');
              return false;
            }
            if (!formData.accountNumber || formData.accountNumber.length < 10) {
              showToast('계좌번호를 올바르게 입력해주세요.');
              return false;
            }
          }
        }

        // 다중인원의 경우 참가자 정보 검증
        if (formData.isMultiPersonPayment) {
          // 실제로 입력된 참가자들만 필터링 (person이나 project 중 하나라도 있는 경우)
          const filledParticipants = formData.participants.filter(p => p.person || p.project);

          // 입력된 참가자가 하나도 없으면 에러
          if (filledParticipants.length === 0) {
            showToast('참가자 정보를 올바르게 입력해주세요.');
            return false;
          }

          // 입력된 참가자들 중에서 인물과 프로젝트가 모두 완성된 참가자가 있는지 확인
          const validParticipants = filledParticipants.filter(p => p.person && p.project);
          if (validParticipants.length === 0) {
            showToast('모든 참가자의 인물과 프로젝트를 올바르게 입력해주세요.');
            return false;
          }

          // 입력된 참가자들 중에서 불완전한 참가자가 있는지 확인
          const incompleteParticipants = filledParticipants.filter(p => !p.person || !p.project);
          if (incompleteParticipants.length > 0) {
            showToast('모든 참가자의 인물과 프로젝트를 올바르게 입력해주세요.');
            return false;
          }
        }

        // 분할결제가 체크된 경우 내가 낸 금액 검증
        if (formData.isSplitPayment) {
          if (!formData.myAmount || formData.myAmount <= 0) {
            showToast('내가 낸 금액을 올바르게 입력해주세요.');
            return false;
          }
          if (parseFloat(formData.myAmount) > parseFloat(formData.amount)) {
            showToast('내가 낸 금액이 총 금액보다 클 수 없습니다.');
            return false;
          }
        }
        return true;

      case 3:
        // 3단계는 사진 첨부가 필수
        if (formData.attachedFiles.length === 0) {
          showToast('사진을 최소 1개 이상 첨부해주세요.');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // 헤더에 표시할 간략한 정보 생성
  const getHeaderInfo = () => {
    const info = [];

    // 1단계 정보
    if (formData.category) {
      info.push(formData.category);
    }
    if (formData.amount) {
      info.push(`${parseInt(formData.amount).toLocaleString()}원`);
    }
    if (formData.dateTime.month && formData.dateTime.day) {
      info.push(`${parseInt(formData.dateTime.month)}/${parseInt(formData.dateTime.day)}`);
    }

    // 2단계 정보 (currentStep >= 2일 때)
    if (currentStep >= 2) {
      if (formData.project) {
        info.push(getProjectName(formData.project));
      }
      if (formData.paymentMethod) {
        info.push(formData.paymentMethod);
      }
    }

    // 3단계 정보 (currentStep >= 3일 때)
    if (currentStep >= 3 && formData.attachedFiles.length > 0) {
      info.push(`사진 ${formData.attachedFiles.length}개`);
    }

    return info.join(' • ');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // 카테고리가 변경될 때 택시비/식비 관련 처리
      if (field === 'category') {
        if (value === '택시비') {
          // 택시비 선택 시 근무 시간 체크
          setTimeout(() => checkTaxiWorkHours(), 100); // 상태 업데이트 후 실행
          // 식비 관련 상태 초기화
          setMealAttendanceStatus(null);
          setIsEligibleForMeal(true);
          setMealReason('');
          newData.mealReason = '';
        } else if (value === '식비') {
          // 식비 선택 시 출퇴근 기록 체크
          setTimeout(() => checkMealAttendance(), 100); // 상태 업데이트 후 실행
          // 택시비 관련 상태 초기화
          setTaxiWorkHours(null);
          setIsEligibleForTaxi(true);
          setTaxiReason('');
          newData.taxiReason = '';
        } else {
          // 다른 카테고리 선택 시 모든 관련 상태 초기화
          setTaxiWorkHours(null);
          setIsEligibleForTaxi(true);
          setTaxiReason('');
          newData.taxiReason = '';
          setMealAttendanceStatus(null);
          setIsEligibleForMeal(true);
          setMealReason('');
          newData.mealReason = '';
        }
      }
      
      // 결제방법이 변경될 때 cardType도 함께 업데이트
      if (field === 'paymentMethod') {
        if (value === '현금/계좌이체') {
          newData.cardType = ''; // 현금 선택 시 cardType 초기화
        } else if (value === '신용카드') {
          // 신용카드 선택 시 기본값 설정 (기존 값이 없으면 법인카드)
          if (!prev.cardType || prev.cardType === '') {
            newData.cardType = '법인카드';
          }
        }
      }
      
      // 프로젝트가 변경될 때 모든 인원의 프로젝트도 함께 업데이트
      if (field === 'project') {
        if (prev.participants && prev.participants.length > 0) {
          newData.participants = prev.participants.map(participant => ({
            ...participant,
            project: value // 모든 인원의 프로젝트를 새로 선택된 프로젝트로 업데이트
          }));
          console.log('프로젝트 변경으로 모든 인원의 프로젝트 업데이트:', value);
        }
      }
      
      return newData;
    });
  };

  const handleDateTimeChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        dateTime: {
          ...prev.dateTime,
          [field]: value
        }
      };
      return newData;
    });
  };

  const handleParticipantProjectChange = (index, value) => {
    const newParticipants = [...formData.participants];
    newParticipants[index].project = value;
    setFormData(prev => ({
      ...prev,
      participants: newParticipants
    }));
  };

  // 참가자가 추가될 때 기본 프로젝트 설정을 확실히 하는 함수
  const ensureParticipantProject = (index) => {
    const participant = formData.participants[index];
    if (!participant.project && formData.project) {
      handleParticipantProjectChange(index, formData.project);
    }
  };

  const handleStaffSelect = (selectedStaff) => {
    if (selectedStaff.length > 0) {
      const newParticipants = [...formData.participants];

      if (editingParticipantIndex !== null) {
        // 현재 로그인한 사용자 ID 가져오기
        const currentUserId = localStorage.getItem('token') ? 
          jwtDecode(localStorage.getItem('token')).userId : null;

        // 중복 제거된 새로운 인원들만 필터링
        const uniqueNewStaff = selectedStaff.filter(newPerson => {
          const newPersonId = newPerson._id ? newPerson._id.toString() : (newPerson.id ? newPerson.id.toString() : null);
          
          // 본인인지 확인
          if (currentUserId && newPersonId === currentUserId.toString()) {
            console.log('본인 제외:', newPerson.name);
            return false;
          }
          
          // 이미 추가된 인원인지 확인
          const isAlreadyAdded = newParticipants.some(p => {
            if (!p.person) return false;
            const existingPersonId = p.person._id ? p.person._id.toString() : (p.person.id ? p.person.id.toString() : null);
            return existingPersonId === newPersonId;
          });
          
          if (isAlreadyAdded) {
            console.log('이미 추가된 인원 제외:', newPerson.name);
            return false;
          }
          
          return true;
        });

        if (uniqueNewStaff.length > 0) {
          // 현재 선택된 프로젝트 가져오기
          const currentProject = formData.project || '';
          
          // 첫 번째 인원은 현재 편집 중인 항목에 교체 (프로젝트도 함께 설정)
          newParticipants[editingParticipantIndex] = {
            person: uniqueNewStaff[0],
            project: currentProject
          };
          
          // 나머지 인원들은 새로 추가
          for (let i = 1; i < uniqueNewStaff.length; i++) {
            newParticipants.push({
              person: uniqueNewStaff[i],
              project: currentProject
            });
          }
          
          console.log('추가된 인원들:', uniqueNewStaff.map(p => p.name));
          console.log('설정된 프로젝트:', currentProject);
        } else {
          console.log('추가할 수 있는 새로운 인원이 없습니다.');
        }
      }

      setFormData(prev => ({
        ...prev,
        participants: newParticipants
      }));
    }

    setShowStaffModal(false);
    setEditingParticipantIndex(null);
  };

  const openStaffModal = (index) => {
    setEditingParticipantIndex(index);
    setShowStaffModal(true);
  };

  // 이미 선택된 인물들을 가져오는 함수
  const getSelectedPeople = () => {
    return formData.participants
      .filter(p => p.person)
      .map(p => p.person);
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { person: null, project: prev.project || '' }]
    }));
  };

  const removeParticipant = (index) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const handleFileAttach = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      attachedFiles: [...prev.attachedFiles, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((_, i) => i !== index)
    }));
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setIsCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('카메라 접근 오류:', error);
      showToast('카메라에 접근할 수 없습니다.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFormData(prev => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, file]
      }));
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const nextStep = () => {
    // 현재 단계 검증
    if (!validateStep(currentStep)) {
      return;
    }

    // 1단계에서 2단계로 넘어갈 때 날짜 확인 모달 표시
    if (currentStep === 1) {
      setShowDateConfirm(true);
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const confirmDateTime = () => {
    setShowDateConfirm(false);
    setCurrentStep(2);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // 3단계에서 2단계로 갈 때 카메라 정리
      if (currentStep === 3) {
        stopCamera();
      }
    }
  };

  const handleSubmit = async () => {
    // 최종 검증 (모든 단계)
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        return;
      }
    }

    setIsSubmitting(true); // 로딩 시작

    try {
      // 검증 통과 시 ReceiptStepper의 handleSubmit을 호출하기 위해 
      // 특별한 플래그와 함께 onSubmit 호출
      await onSubmit({ ...formData, _fromStepperModal: true });
    } catch (error) {
      console.error('영수증 제출 실패:', error);
    } finally {
      setIsSubmitting(false); // 로딩 종료
    }
  };

  // 제출 후 모달 닫기 (경고창 없음)
  const handleCloseAfterSubmit = () => {
    stopCamera();
    clearStorage();
    // 폼 데이터 초기화
    setFormData({
      category: '',
      dateTime: getCurrentDateTime(),
      amount: '',
      project: '',
      paymentMethod: '',
      participants: [{ person: null, project: '' }],
      attachedFiles: [],
      myAmount: '',
      isSplitPayment: false,
      isMultiPersonPayment: false,
      cardType: '',
      creditCardId: '',
      bankName: '',
      bankNameOther: '',
      accountNumber: '',
      description: '',
      taxiReason: '',
      mealReason: ''
    });
    // 택시비 관련 상태 초기화
    setTaxiWorkHours(null);
    setIsEligibleForTaxi(true);
    setCheckingWorkHours(false);
    // 식비 관련 상태 초기화
    setMealAttendanceStatus(null);
    setIsEligibleForMeal(true);
    setCheckingAttendance(false);
    
    setCurrentStep(1);
    onClose();
    
    // 성공 메시지 표시 (모달이 닫힌 후 약간 딜레이를 주어 자연스럽게 표시)
    setTimeout(() => {
      alert('영수증 등록에 성공했습니다.');
    }, 100);
  };

  // 데이터가 입력되어 있는지 확인하는 함수
  const hasFormData = () => {
    return formData.category ||
      formData.amount ||
      formData.project ||
      formData.paymentMethod ||
      formData.participants.some(p => p.person || p.project) ||
      formData.attachedFiles.length > 0 ||
      formData.myAmount ||
      formData.isSplitPayment ||
      formData.isMultiPersonPayment ||
      formData.cardType ||
      formData.creditCardId ||
      formData.bankName ||
      formData.bankNameOther ||
      formData.accountNumber ||
      formData.description; // 메모 필드도 확인
  };

  const handleClose = () => {
    // 경고창 없이 바로 닫기
    stopCamera();
    clearStorage();
    onClose();
  };

  // 임시 저장하고 닫기
  const handleCloseWithSave = () => {
    stopCamera();
    // 데이터는 보존 (이미 자동 저장됨)
    setShowCloseConfirm(false);
    onClose();
  };

  // 저장하지 않고 닫기
  const handleCloseWithoutSave = () => {
    stopCamera();
    clearStorage(); // 저장된 데이터 삭제

    // 폼 데이터도 초기화
    setFormData({
      category: '',
      dateTime: getCurrentDateTime(),
      amount: '',
      project: '',
      paymentMethod: '',
      participants: [{ person: null, project: '' }],
      attachedFiles: [],
      myAmount: '', // 분할결제용 내가 낸 금액 추가
      isSplitPayment: false, // 분할결제 체크박스 상태 추가
      isMultiPersonPayment: false, // 다중인원 체크박스 상태 추가
      cardType: '', // 법인카드/개인카드 선택 추가
      creditCardId: '', // 법인카드 ID 추가
      bankName: '', // 은행명 추가
      bankNameOther: '', // 기타 은행 직접입력 추가
      accountNumber: '', // 계좌번호 추가
      description: '' // 메모 필드 추가
    });
    setCurrentStep(1);

    setShowCloseConfirm(false);
    onClose();
  };

  // 닫기 취소
  const handleCloseCancelConfirm = () => {
    setShowCloseConfirm(false);
  };

  const isMultiPersonPayment = formData.isMultiPersonPayment;
  const isSplitPayment = formData.isSplitPayment;
  const isCardPayment = formData.paymentMethod === '신용카드';
  const isCashOrTransfer = formData.paymentMethod === '현금/계좌이체';
  const isCorporateCard = formData.cardType === '법인카드';
  const isOtherCard = formData.cardType === '개인카드';
  const isOtherBank = formData.bankName === '기타';

  // 분할결제용 내가 낸 금액 변경 핸들러 추가
  const handleMyAmountChange = (value) => {
    setFormData(prev => ({
      ...prev,
      myAmount: value
    }));
  };

  // 분할결제 체크박스 변경 핸들러 추가
  const handleSplitPaymentChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      isSplitPayment: checked,
      myAmount: checked ? prev.myAmount : '' // 체크 해제시 내가 낸 금액 초기화
    }));
  };

  // 다중인원 체크박스 변경 핸들러 추가
  const handleMultiPersonPaymentChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      isMultiPersonPayment: checked,
      participants: checked ? prev.participants : [{ person: null, project: '' }] // 체크 해제시 참가자 목록 초기화
    }));
  };

  // 법인카드 목록 (실제 카드번호 형식)
  const corporateCards2 = [
    { alias: '회사카드', number: 'A 2342 3402 4240 5540' },
    { alias: '출장용카드', number: 'B 1234 5678 9012 3456' },
    { alias: '팀카드', number: 'C 9876 5432 1098 7654' },
    { alias: '법인카드1', number: 'D 4567 8901 2345 6789' },
    { alias: '법인카드2', number: 'E 3456 7890 1234 5678' },
    { alias: '마케팅팀', number: 'F 6789 0123 4567 8901' },
    { alias: '개발팀', number: 'G 7890 1234 5678 9012' },
    { alias: '영업팀', number: 'H 0123 4567 8901 2345' },
    { alias: '기획팀', number: 'I 5678 9012 3456 7890' },
    { alias: '디자인팀', number: 'J 8901 2345 6789 0123' },
    { alias: '운영팀', number: 'K 2345 6789 0123 4567' },
    { alias: '회계팀', number: 'L 6789 0123 4567 8901' },
    { alias: '인사팀', number: 'M 0123 4567 8901 2345' },
    { alias: '총무팀', number: 'N 4567 8901 2345 6789' },
    { alias: '연구팀', number: 'O 7890 1234 5678 9012' },
    { alias: '품질팀', number: 'P 1234 5678 9012 3456' },
    { alias: '구매팀', number: 'Q 5678 9012 3456 7890' },
    { alias: '물류팀', number: 'R 9012 3456 7890 1234' },
    { alias: '고객팀', number: 'S 3456 7890 1234 5678' },
    { alias: '지원팀', number: 'T 7890 1234 5678 9012' }
  ];

  // 법인카드 번호 마스킹 함수
  const maskCorporateCardNumber = (cardNumber) => {
    // 숫자만 추출
    const numbersOnly = cardNumber.replace(/\D/g, '');
    
    // 8자리 이상인 경우 첫 4자리와 마지막 4자리만 보여주고 나머지는 마스킹
    if (numbersOnly.length >= 8) {
      const firstFour = numbersOnly.substring(0, 4);
      const lastFour = numbersOnly.substring(numbersOnly.length - 4);
      return `${firstFour} **** **** ${lastFour}`;
    }
    
    return cardNumber;
  };

  // 법인카드 선택 핸들러
  const handleCorporateCardSelect = (selectedCard) => {
    setFormData(prev => ({
      ...prev,
      creditCardId: selectedCard._id,
      cardType: '법인카드'
    }));
    setShowCorporateCardModal(false);
  };

  // 선택된 법인카드 정보 가져오기
  const getSelectedCardDisplay = () => {
    if (!formData.creditCardId) return null;
    const selectedCard = corporateCards.find(card => card._id === formData.creditCardId);
    return selectedCard ? 
      `${selectedCard.cardName} ${selectedCard.label} ${maskCorporateCardNumber(selectedCard.number)}` : 
      '법인카드 선택됨';
  };



  // 대한민국 은행 목록 (상위 15개)
  const koreanBanks = [
    // 주요 시중은행 (빅4)
    '국민은행', '신한은행', '하나은행', '우리은행',

    // 특수은행 (많이 사용됨)
    '농협은행', '기업은행', '수협은행',

    // 인터넷은행 (급성장)
    '카카오뱅크', '토스뱅크', '케이뱅크',

    // 외국계 은행
    'SC제일은행', '한국씨티은행',

    // 지방은행 (주요)
    '부산은행', '대구은행',

    // 정책금융기관
    '산업은행',

    // 기타 옵션
    '기타'
  ];

  const renderStep1 = () => (
    <div className={styles.step_content}>
      <div className={styles.input_group}>
        <label>카테고리 <span className={styles.required}>*</span></label>
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
        >
          <option value="">카테고리 선택</option>
          <option value="식비">식비</option>
          <option value="택시비">택시비</option>
          {/* <option value="숙박비">숙박비</option> */}
          <option value="기타">기타</option>
        </select>
      </div>

      <div className={styles.input_group}>
        <label>날짜 및 시간 <span className={styles.required}>*</span></label>
        <div className={styles.datetime_container}>
          <div className={styles.datetime_row}>
            <input
              type="number"
              placeholder="YYYY"
              value={formData.dateTime.year}
              onChange={(e) => handleDateTimeChange('year', e.target.value)}
              className={styles.year_input}
              min="2000"
              max="2099"
            />
            <span className={styles.datetime_separator}>년</span>

            <input
              type="number"
              placeholder="MM"
              value={formData.dateTime.month}
              onChange={(e) => handleDateTimeChange('month', e.target.value.padStart(2, '0'))}
              className={styles.month_input}
              min="1"
              max="12"
            />
            <span className={styles.datetime_separator}>월</span>

            <input
              type="number"
              placeholder="DD"
              value={formData.dateTime.day}
              onChange={(e) => handleDateTimeChange('day', e.target.value.padStart(2, '0'))}
              className={styles.day_input}
              min="1"
              max="31"
            />
            <span className={styles.datetime_separator}>일</span>
          </div>

          <div className={styles.datetime_row}>
            <input
              type="number"
              placeholder="HH"
              value={formData.dateTime.hour}
              onChange={(e) => handleDateTimeChange('hour', e.target.value.padStart(2, '0'))}
              className={styles.hour_input}
              min="0"
              max="23"
            />
            <span className={styles.datetime_separator}>시</span>

            <input
              type="number"
              placeholder="MM"
              value={formData.dateTime.minute}
              onChange={(e) => handleDateTimeChange('minute', e.target.value.padStart(2, '0'))}
              className={styles.minute_input}
              min="0"
              max="59"
            />
            <span className={styles.datetime_separator}>분</span>
          </div>
        </div>
      </div>

      <div className={styles.input_group}>
        <label>금액 <span className={styles.required}>*</span></label>
        <input
          type="number"
          placeholder="금액을 입력하세요"
          value={formData.amount}
          onChange={(e) => handleInputChange('amount', e.target.value)}
          min="1"
        />
      </div>

      <div className={styles.input_group}>
        <label>메모 <span className={styles.optional}>(선택사항)</span></label>
        <textarea
          placeholder="메모를 입력하세요 (선택사항)"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows="3"
        />
      </div>

      {/* 택시비 선택 시 근무 시간 정보 및 사유 입력 */}
      {formData.category === '택시비' && (
        <div className={styles.taxi_section}>
          {checkingWorkHours ? (
            <div className={styles.checking_status}>
              근무 시간을 확인하고 있습니다...
            </div>
          ) : taxiWorkHours ? (
            <div className={styles.work_hours_info}>
              <div className={`${styles.work_hours_status} ${isEligibleForTaxi ? styles.eligible : styles.not_eligible}`}>
                <strong>근무 시간:</strong> {taxiWorkHours}
                {isEligibleForTaxi ? (
                  <span className={styles.eligible_text}> ✓ 택시비 지원 가능</span>
                ) : (
                  <span className={styles.not_eligible_text}> ⚠ 9시간 미만 (사유 필요)</span>
                )}
              </div>
            </div>
          ) : null}

          {formData.category === '택시비' && !isEligibleForTaxi && (
            <div className={styles.input_group}>
              <label>사유 <span className={styles.required}>*</span></label>
                             <textarea
                 placeholder="9시간 미만 근무 시 택시비 사용 사유를 입력해주세요"
                 value={formData.taxiReason || ''}
                 onChange={(e) => handleInputChange('taxiReason', e.target.value)}
                 rows="2"
                 className={styles.taxi_reason_textarea}
               />
            </div>
                     )}
         </div>
       )}

      {/* 식비 선택 시 출퇴근 기록 정보 및 사유 입력 */}
      {formData.category === '식비' && (
        <div className={styles.taxi_section}>
          {checkingAttendance ? (
            <div className={styles.checking_status}>
              출퇴근 기록을 확인하고 있습니다...
            </div>
          ) : mealAttendanceStatus ? (
            <div className={styles.work_hours_info}>
              <div className={`${styles.work_hours_status} ${isEligibleForMeal ? styles.eligible : styles.not_eligible}`}>
                <strong>출퇴근 기록:</strong> 
                {mealAttendanceStatus.hasCheckIn && ' 출근'}{mealAttendanceStatus.hasCheckOut && ' 퇴근'}
                {!mealAttendanceStatus.hasCheckIn && !mealAttendanceStatus.hasCheckOut && ' 없음'}
                {isEligibleForMeal ? (
                  <span className={styles.eligible_text}> ✓ 식비 지원 가능</span>
                ) : (
                  <span className={styles.not_eligible_text}> ⚠ 출퇴근 기록 없음 (사유 필요)</span>
                )}
              </div>
            </div>
          ) : null}

          {formData.category === '식비' && !isEligibleForMeal && (
            <div className={styles.input_group}>
              <label>사유 <span className={styles.required}>*</span></label>
              <textarea
                placeholder="출퇴근 기록이 없을 시 식비 사용 사유를 입력해주세요"
                value={formData.mealReason || ''}
                onChange={(e) => handleInputChange('mealReason', e.target.value)}
                rows="2"
                className={styles.taxi_reason_textarea}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.step_content}>
      <div className={styles.input_group}>
        <label>프로젝트 <span className={styles.required}>*</span></label>
        <select
          value={formData.project}
          onChange={(e) => handleInputChange('project', e.target.value)}
        >
          <option value="">프로젝트 선택</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>{project.title}</option>
          ))}
        </select>
      </div>

      <div className={styles.input_group}>
        <label>결제방법 <span className={styles.required}>*</span></label>
        <div className={styles.payment_options}>
          {['신용카드', '현금/계좌이체'].map((method) => (
            <label key={method} className={styles.radio_option}>
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={formData.paymentMethod === method}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              />
              <span>{method}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 신용카드 상세 정보 */}
      {isCardPayment && (
        <div className={styles.input_group}>
          <label>카드 유형 <span className={styles.required}>*</span></label>
          <div className={styles.payment_options}>
            {['법인카드', '개인카드'].map((type) => (
              <label key={type} className={styles.radio_option}>
                <input
                  type="radio"
                  name="cardType"
                  value={type}
                  checked={formData.cardType === type}
                  onChange={(e) => handleInputChange('cardType', e.target.value)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 법인카드 선택 */}
      {isCorporateCard && (
        <div className={styles.input_group}>
          <label>법인카드 선택 <span className={styles.required}>*</span></label>
          <button
            type="button"
            className={styles.corporate_card_select_btn}
            onClick={() => setShowCorporateCardModal(true)}
          >
            {formData.creditCardId ? getSelectedCardDisplay() : '법인카드를 선택하세요'}
          </button>
        </div>
      )}

      {/* 현금/계좌이체 상세 정보 */}
      {/* {formData.paymentMethod === '현금/계좌이체' && (
        <div className={styles.input_group}>
          <label>계좌 정보 (선택사항)</label>
          <div className={styles.account_info_container}>
            <div className={styles.account_info_row}>
              <div className={styles.bank_select_wrapper}>
                <label className={styles.account_label}>은행명</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className={styles.bank_select}
                >
                  <option value="">은행 선택</option>
                  {koreanBanks.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div className={styles.account_number_wrapper}>
                <label className={styles.account_label}>계좌번호</label>
                <input
                  type="text"
                  placeholder="계좌번호를 입력하세요"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className={styles.account_number_input}
                />
              </div>
            </div>

            {isOtherBank && (
              <div className={styles.other_input_wrapper}>
                <label className={styles.account_label}>은행명 직접입력</label>
                <input
                  type="text"
                  placeholder="은행명을 입력하세요"
                  value={formData.bankNameOther}
                  onChange={(e) => handleInputChange('bankNameOther', e.target.value)}
                  className={styles.other_input}
                />
              </div>
            )}

            <div className={styles.account_info_description}>
              * 계좌이체인 경우에만 입력하세요. 현금인 경우 입력하지 않아도 됩니다.
            </div>
          </div>
        </div>
      )} */}

      <div className={styles.input_group}>
        <div className={styles.split_payment_checkbox_container}>
          <label className={styles.checkbox_option}>
            <input
              type="checkbox"
              checked={formData.isSplitPayment}
              onChange={(e) => handleSplitPaymentChange(e.target.checked)}
            />
            <span>분할결제</span>
          </label>
          <span className={styles.split_payment_description}>
            총 금액 중 일부만 내가 지불한 경우 체크하세요
          </span>
        </div>
      </div>

      <div className={styles.input_group}>
        <div className={styles.split_payment_checkbox_container}>
          <label className={styles.checkbox_option}>
            <input
              type="checkbox"
              checked={formData.isMultiPersonPayment}
              onChange={(e) => handleMultiPersonPaymentChange(e.target.checked)}
            />
            <span>다중인원 결제</span>
          </label>
          <span className={styles.split_payment_description}>
            여러 사람이 함께 참여한 경우 체크하세요
          </span>
        </div>
      </div>

      {isMultiPersonPayment && (
        <div className={styles.input_group}>
          <label>다중 인원 결제<span className={styles.required}>*</span></label>
          <div className={styles.participants_container}>
            {formData.participants.map((participant, index) => (
              <div key={index} className={styles.participant_row}>
                <button
                  type="button"
                  className={styles.person_select_btn}
                  onClick={() => openStaffModal(index)}
                >
                  {participant.person ? (
                    <div className={styles.selected_person}>
                      <div className={styles.person_profile}>
                        {participant.person.userType === 'internal' ? (
                          <div className={styles.profile_image}>
                            {participant.person.profileImage ? (
                              <img
                                src={participant.person.profileImage}
                                alt={participant.person.name}
                                className={styles.profile_img}
                              />
                            ) : (
                              <div className={styles.profile_placeholder}>
                                {participant.person.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={styles.external_profile}>
                            👤
                            <span className={styles.external_text}>(외부)</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.person_details}>
                        <span className={styles.person_name}>{participant.person.name}</span>
                      </div>
                    </div>
                  ) : (
                    <span className={styles.select_placeholder}>👤 인물 선택</span>
                  )}
                </button>

                <select
                  value={participant.project || formData.project || ""}
                  onChange={(e) => handleParticipantProjectChange(index, e.target.value)}
                  className={styles.project_input}
                >
                  <option value="">프로젝트 선택</option>
                  {formData.project && (
                    <option value={formData.project}>{getProjectName(formData.project)} (같음)</option>
                  )}
                  {projects.filter(p => p._id !== formData.project).map((project) => (
                    <option key={project._id} value={project._id}>{project.title}</option>
                  ))}
                </select>

                {formData.participants.length > 1 && (
                  <button
                    type="button"
                    className={styles.remove_btn}
                    onClick={() => removeParticipant(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className={styles.add_participant_btn}
              onClick={addParticipant}
            >
              + 인물 추가
            </button>
          </div>
        </div>
      )}

      {isSplitPayment && (
        <div className={styles.input_group}>
          <label>분할결제 정보 <span className={styles.required}>*</span></label>
          <div className={styles.split_payment_container}>
            <div className={styles.split_payment_row}>
              <div className={styles.split_payment_item}>
                <label className={styles.split_label}>내가 낸 금액</label>
                <input
                  type="number"
                  placeholder="내가 낸 금액"
                  value={formData.myAmount}
                  onChange={(e) => handleMyAmountChange(e.target.value)}
                  min="0"
                  max={formData.amount}
                  className={styles.my_amount_input}
                />
              </div>

              <div className={styles.split_payment_item}>
                <label className={styles.split_label}>총 금액</label>
                <div className={styles.total_amount_display}>
                  {formData.amount ? `${parseInt(formData.amount).toLocaleString()}원` : '0원'}
                </div>
              </div>
            </div>

            {formData.myAmount && formData.amount && (
              <div className={styles.difference_display}>
                <span className={styles.difference_label}>차액: </span>
                <span className={styles.difference_amount}>
                  {(parseFloat(formData.amount) - parseFloat(formData.myAmount || 0)).toLocaleString()}원
                </span>
                {parseFloat(formData.myAmount) > parseFloat(formData.amount) && (
                  <span className={styles.error_text}> (내가 낸 금액이 총 금액보다 큽니다)</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.step_content}>
      {/* 입력 정보 요약 */}
      <div className={styles.input_group}>
        <label>입력 정보 확인</label>
        <div className={styles.summary_container}>
          <div className={styles.summary_section}>
            <h4 className={styles.summary_title}>기본 정보</h4>
            <div className={styles.summary_item}>
              <span className={styles.summary_label}>카테고리:</span>
              <span className={styles.summary_value}>{formData.category}</span>
            </div>
            <div className={styles.summary_item}>
              <span className={styles.summary_label}>날짜/시간:</span>
              <span className={styles.summary_value}>{formatDateTime(formData.dateTime)}</span>
            </div>
            <div className={styles.summary_item}>
              <span className={styles.summary_label}>금액:</span>
              <span className={styles.summary_value}>{parseInt(formData.amount).toLocaleString()}원</span>
            </div>
            <div className={styles.summary_item}>
              <span className={styles.summary_label}>프로젝트:</span>
              <span className={styles.summary_value}>{getProjectName(formData.project)}</span>
            </div>
            {formData.description && (
              <div className={styles.summary_item}>
                <span className={styles.summary_label}>메모:</span>
                <span className={styles.summary_value}>{formData.description}</span>
              </div>
            )}
          </div>

          <div className={styles.summary_section}>
            <h4 className={styles.summary_title}>결제 정보</h4>
            <div className={styles.summary_item}>
              <span className={styles.summary_label}>결제방법:</span>
              <span className={styles.summary_value}>{formData.paymentMethod}</span>
            </div>

            {/* 신용카드 정보 */}
            {isCardPayment && (
              <>
                <div className={styles.summary_item}>
                  <span className={styles.summary_label}>카드 유형:</span>
                  <span className={styles.summary_value}>
                    {formData.cardType}
                  </span>
                </div>
                {formData.cardType === '법인카드' && formData.creditCardId && (
                  <div className={styles.summary_item}>
                    <span className={styles.summary_label}>법인카드:</span>
                    <span className={styles.summary_value}>
                      {getSelectedCardDisplay()}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* 현금/계좌이체 정보 */}
            {isCashOrTransfer && formData.bankName && (
              <>
                <div className={styles.summary_item}>
                  <span className={styles.summary_label}>은행:</span>
                  <span className={styles.summary_value}>
                    {formData.bankName === '기타' ? formData.bankNameOther : formData.bankName}
                  </span>
                </div>
                {formData.accountNumber && (
                  <div className={styles.summary_item}>
                    <span className={styles.summary_label}>계좌번호:</span>
                    <span className={styles.summary_value}>{formData.accountNumber}</span>
                  </div>
                )}
              </>
            )}

            {/* 분할결제 정보 */}
            {isSplitPayment && (
              <div className={styles.summary_item}>
                <span className={styles.summary_label}>분할결제:</span>
                <span className={styles.summary_value}>
                  내가 낸 금액: {parseInt(formData.myAmount).toLocaleString()}원 /
                  차액: {(parseFloat(formData.amount) - parseFloat(formData.myAmount)).toLocaleString()}원
                </span>
              </div>
            )}

            {/* 다중인원 정보 */}
            {isMultiPersonPayment && (
              <div className={styles.summary_item}>
                <span className={styles.summary_label}>참가자:</span>
                <span className={styles.summary_value}>
                  {formData.participants
                    .filter(p => p.person && p.project)
                    .map(p => `${p.person.name}(${getProjectName(p.project)})`)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.input_group}>
        <label>사진 촬영/첨부 <span className={styles.required}>*</span></label>

        <div className={styles.photo_actions}>
          <button
            type="button"
            className={styles.camera_btn}
            onClick={startCamera}
          >
            📷 카메라로 촬영
          </button>

          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileAttach}
            className={styles.file_input}
          />
          <label htmlFor="file-upload" className={styles.file_upload_btn}>
            📁 파일에서 선택
          </label>
        </div>

        {formData.attachedFiles.length > 0 && (
          <div className={styles.attached_files}>
            <h4>첨부된 사진 ({formData.attachedFiles.length}개)</h4>
            <div className={styles.photo_grid}>
              {formData.attachedFiles.map((file, index) => (
                <div key={index} className={styles.photo_item}>
                  <img
                    src={file.isExistingImage ? file.url : URL.createObjectURL(file)}
                    alt={`사진 ${index + 1}`}
                    className={styles.photo_preview}
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={styles.remove_photo_btn}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(
    <div className={styles.modal_overlay}>
      <div className={styles.modal}>
        <div className={styles.modal_header}>
          <div className={styles.header_left}>
            <h2>{title}</h2>
            {getHeaderInfo() && (
              <div className={styles.header_info}>
                {getHeaderInfo()}
                {/* {(formData.category || formData.amount || formData.project) && (
                  <span className={styles.saved_indicator}> • 자동저장됨</span>
                )} */}
              </div>
            )}
          </div>
          <button className={styles.close_btn} onClick={handleClose}>×</button>
        </div>

        <div className={styles.stepper}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''}`}>
            <div className={styles.step_number}>1</div>
            <span>기본 정보</span>
          </div>
          <div className={styles.step_divider}></div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''}`}>
            <div className={styles.step_number}>2</div>
            <span>상세 정보</span>
          </div>
          <div className={styles.step_divider}></div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
            <div className={styles.step_number}>3</div>
            <span>사진 촬영</span>
          </div>
        </div>

        <div className={styles.modal_content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className={styles.modal_footer_blur}>
          {currentStep > 1 && (
            <button className={styles.prev_btn} onClick={prevStep}>
              이전
            </button>
          )}

          {currentStep < 3 ? (
            <button className={styles.next_btn} onClick={nextStep}>
              다음
            </button>
          ) : (
            <button 
              className={styles.submit_btn} 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.spinner}></div>
                  등록 중...
                </>
              ) : (
                '완료'
              )}
            </button>
          )}
        </div>

        {toast.show && (
          <div className={styles.toast}>
            <div className={styles.toast_content}>
              <span className={styles.toast_icon}>⚠️</span>
              <span className={styles.toast_message}>{toast.message}</span>
            </div>
          </div>
        )}

        {showDateConfirm && (
          <div className={styles.confirm_overlay}>
            <div className={styles.confirm_modal}>
              <div className={styles.confirm_header}>
                <h3>날짜 및 시간 확인</h3>
              </div>

              <div className={styles.confirm_content}>
                <div className={styles.current_datetime}>
                  {formatDateTime(formData.dateTime)}
                </div>

                <p className={styles.confirm_message}>
                  현재 작성된 시간으로 적용됩니다.<br />
                  <strong>기준은 영수증에 찍힌 시간입니다.</strong><br />
                  다음으로 넘어가시겠습니까?
                </p>
              </div>

              <div className={styles.confirm_footer}>
                <button
                  className={styles.confirm_cancel_btn}
                  onClick={() => setShowDateConfirm(false)}
                >
                  수정하기
                </button>
                <button
                  className={styles.confirm_ok_btn}
                  onClick={confirmDateTime}
                >
                  다음 단계
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 닫기 확인 모달 */}
        {showCloseConfirm && (
          <div className={styles.confirm_overlay}>
            <div className={styles.confirm_modal}>
              <div className={styles.confirm_header}>
                <h3>작성 중인 내용이 있습니다</h3>
              </div>

              <div className={styles.confirm_content}>
                <p className={styles.confirm_message}>
                  현재 작성 중인 내용을 임시 저장하시겠습니까?<br />
                  임시 저장하면 다음에 다시 이어서 작성할 수 있습니다.
                </p>
              </div>

              <div className={styles.confirm_footer_multi}>
                <button
                  className={styles.confirm_cancel_btn}
                  onClick={handleCloseCancelConfirm}
                >
                  취소
                </button>
                <button
                  className={styles.confirm_delete_btn}
                  onClick={handleCloseWithoutSave}
                >
                  저장하지 않고 닫기
                </button>
                <button
                  className={styles.confirm_save_btn}
                  onClick={handleCloseWithSave}
                >
                  임시 저장하고 닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 법인카드 선택 모달 */}
        {showCorporateCardModal && (
          <div className={styles.confirm_overlay}>
            <div className={styles.corporate_card_modal}>
              <div className={styles.confirm_header}>
                <h3>법인카드 선택</h3>
              </div>

              <div className={styles.corporate_card_list}>
                {corporateCards.map((card, index) => (
                  <button
                    key={index}
                    className={styles.corporate_card_item}
                    onClick={() => handleCorporateCardSelect(card)}
                  >
                    <div className={styles.card_alias}>{card.cardName}</div>
                    <div className={styles.card_number}>{`${card.label} ${maskCorporateCardNumber(card.number)}`}</div>
                  </button>
                ))}
              </div>

              <div className={styles.confirm_footer}>
                <button
                  className={styles.confirm_cancel_btn}
                  onClick={() => setShowCorporateCardModal(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <StaffSearchModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          setEditingParticipantIndex(null);
        }}
        onSelect={handleStaffSelect}
        selectedPeople={getSelectedPeople()}
        multiSelect={true}
        title="인물 선택"
        initialFilterType="all"
        from="stepper_modal"
        disabledUsers={getSelectedPeople().map(p => p._id ? p._id.toString() : (p.id ? p.id.toString() : null))}
      />

      {/* 카메라 모달 */}
      {isCamera && (
        <div className={styles.camera_modal_overlay}>
          <div className={styles.camera_modal}>
            <div className={styles.camera_modal_header}>
              <h3>사진 촬영</h3>
              <button
                className={styles.camera_close_btn}
                onClick={stopCamera}
              >
                ×
              </button>
            </div>
            
            <div className={styles.camera_modal_content}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={styles.camera_modal_video}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <div className={styles.camera_modal_footer}>
              <button
                type="button"
                className={styles.camera_cancel_btn}
                onClick={stopCamera}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.camera_capture_btn}
                onClick={capturePhoto}
              >
                📷 촬영
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default StepperModal; 