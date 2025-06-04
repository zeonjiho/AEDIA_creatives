import React, { useState, useRef, useEffect } from 'react';
import styles from './StepperModal.module.css';
import StaffSearchModal from '../StaffSearchModal/StaffSearchModal';

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
const StepperModal = ({ isOpen, onClose, onSubmit }) => {
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
      participants: [{ person: null, amount: '' }],
      attachedFiles: []
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

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState(null);

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

  // 컴포넌트가 열릴 때 저장된 데이터 복원
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

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
        
        // 다중 인원, 외부인원, 분할결제의 경우 참가자 정보 검증
        const isMultiPersonPayment = ['다중 인원', '외부인원', '분할결제'].includes(formData.paymentMethod);
        if (isMultiPersonPayment) {
          const hasValidParticipants = formData.participants.some(p => p.person && p.amount > 0);
          if (!hasValidParticipants) {
            showToast('참가자 정보를 올바르게 입력해주세요.');
            return false;
          }
          
          // 모든 참가자가 인물과 금액을 가지고 있는지 확인
          const invalidParticipants = formData.participants.filter(p => p.person || p.amount).filter(p => !p.person || !p.amount || p.amount <= 0);
          if (invalidParticipants.length > 0) {
            showToast('모든 참가자의 인물과 금액을 올바르게 입력해주세요.');
            return false;
          }
        }
        return true;

      case 3:
        // 3단계는 사진이 선택사항이므로 항상 통과
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
        info.push(formData.project);
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

  const handleParticipantAmountChange = (index, value) => {
    const newParticipants = [...formData.participants];
    newParticipants[index].amount = value;
    setFormData(prev => ({
      ...prev,
      participants: newParticipants
    }));
  };

  const handleStaffSelect = (selectedStaff) => {
    if (selectedStaff.length > 0) {
      const staff = selectedStaff[0]; // 단일 선택
      const newParticipants = [...formData.participants];
      
      if (editingParticipantIndex !== null) {
        newParticipants[editingParticipantIndex].person = staff;
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

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { person: null, amount: '' }]
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

  const handleSubmit = () => {
    // 최종 검증 (모든 단계)
    for (let step = 1; step <= 2; step++) {
      if (!validateStep(step)) {
        return;
      }
    }

    stopCamera(); // 제출 시 카메라 정리
    clearStorage(); // 성공적으로 제출하면 저장된 데이터 삭제
    onSubmit(formData);
    onClose();
  };

  // 데이터가 입력되어 있는지 확인하는 함수
  const hasFormData = () => {
    return formData.category || 
           formData.amount || 
           formData.project || 
           formData.paymentMethod || 
           formData.participants.some(p => p.person || p.amount) ||
           formData.attachedFiles.length > 0;
  };

  const handleClose = () => {
    // 입력된 데이터가 있으면 확인 모달 표시
    if (hasFormData()) {
      setShowCloseConfirm(true);
      return;
    }
    
    // 데이터가 없으면 바로 닫기
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
      participants: [{ person: null, amount: '' }],
      attachedFiles: []
    });
    setCurrentStep(1);
    
    setShowCloseConfirm(false);
    onClose();
  };

  // 닫기 취소
  const handleCloseCancelConfirm = () => {
    setShowCloseConfirm(false);
  };

  const isMultiPersonPayment = ['다중 인원', '외부인원', '분할결제'].includes(formData.paymentMethod);

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
          <option value="교통비">교통비</option>
          <option value="숙박비">숙박비</option>
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
          <option value="프로젝트 A">프로젝트 A</option>
          <option value="프로젝트 B">프로젝트 B</option>
          <option value="프로젝트 C">프로젝트 C</option>
        </select>
      </div>

      <div className={styles.input_group}>
        <label>결제방법 <span className={styles.required}>*</span></label>
        <div className={styles.payment_options}>
          {['신용카드', '현금', '계좌이체', '다중 인원', '외부인원', '분할결제'].map((method) => (
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

      {isMultiPersonPayment && (
        <div className={styles.input_group}>
          <label>세부사항 <span className={styles.required}>*</span></label>
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
                        <span className={styles.person_role}>
                          ({participant.person.roles?.[0] || '직책 없음'})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className={styles.select_placeholder}>👤 인물 선택</span>
                  )}
                </button>
                
                <input
                  type="number"
                  placeholder="금액"
                  value={participant.amount}
                  onChange={(e) => handleParticipantAmountChange(index, e.target.value)}
                  min="1"
                  className={styles.amount_input}
                />
                
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
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.step_content}>
      <div className={styles.input_group}>
        <label>사진 촬영/첨부</label>
        
        {!isCamera ? (
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
        ) : (
          <div className={styles.camera_container}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={styles.camera_video}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className={styles.camera_controls}>
              <button 
                type="button" 
                className={styles.capture_btn}
                onClick={capturePhoto}
              >
                📷 촬영
              </button>
              <button 
                type="button" 
                className={styles.cancel_camera_btn}
                onClick={stopCamera}
              >
                취소
              </button>
            </div>
          </div>
        )}
        
        {formData.attachedFiles.length > 0 && (
          <div className={styles.attached_files}>
            <h4>첨부된 사진 ({formData.attachedFiles.length}개)</h4>
            <div className={styles.photo_grid}>
              {formData.attachedFiles.map((file, index) => (
                <div key={index} className={styles.photo_item}>
                  <img 
                    src={URL.createObjectURL(file)} 
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

  return (
    <div className={styles.modal_overlay}>
      <div className={styles.modal}>
        <div className={styles.modal_header}>
          <div className={styles.header_left}>
            <h2>지출 추가</h2>
            {getHeaderInfo() && (
              <div className={styles.header_info}>
                {getHeaderInfo()}
                {(formData.category || formData.amount || formData.project) && (
                  <span className={styles.saved_indicator}> • 자동저장됨</span>
                )}
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
            <button className={styles.submit_btn} onClick={handleSubmit}>
              완료
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
                  현재 작성된 시간으로 적용됩니다.<br/>
                  <strong>기준은 영수증에 찍힌 시간입니다.</strong><br/>
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
                  현재 작성 중인 내용을 임시 저장하시겠습니까?<br/>
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
      </div>

      <StaffSearchModal
        isOpen={showStaffModal}
        onClose={() => {
          setShowStaffModal(false);
          setEditingParticipantIndex(null);
        }}
        onSelect={handleStaffSelect}
        selectedPeople={[]}
        multiSelect={false}
        title="인물 선택"
        initialFilterType="all"
      />
    </div>
  );
};

export default StepperModal; 