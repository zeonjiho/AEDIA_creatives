import React, { useState, useEffect } from 'react';
import { FaCamera, FaFileUpload, FaKeyboard, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import StepperModal from '../StepperModal/StepperModal';
import styles from './ReceiptStepper.module.css';
import { receiptCategories, receiptTypes, receiptStatuses, paymentMethods } from '../../data/mockDatabase';
import { takePicture, extractReceiptData, createImagePreview, revokeImagePreview, terminateWorker } from '../../utils/ocrUtils';

/**
 * 단계별 영수증 입력 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 여부
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Function} props.onSubmit - 제출 함수
 * @param {string} props.mode - 모달 모드 ('add' 또는 'edit')
 * @param {Object} props.initialData - 초기 데이터 (편집 모드에서 사용)
 */
const ReceiptStepper = ({ isOpen, onClose, onSubmit, mode = 'add', initialData = {} }) => {
  // 상태 관리
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    amount: '',
    category: '',
    paymentMethod: 'CORPORATE_CARD',
    status: 'PENDING',
    type: 'OTHER',
    attachmentUrl: null,
    description: '',
    ...initialData
  });
  
  const [receiptImage, setReceiptImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // 처리 상태 메시지를 위한 상태 추가
  const [processingStatus, setProcessingStatus] = useState('');
  
  const totalSteps = 4;
  
  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      if (imagePreview) {
        revokeImagePreview(imagePreview);
      }
      setImagePreview(null);
      setReceiptImage(null);
      setIsProcessing(false);
      setProcessingError(null);
      setProcessingStatus('');
      setFormErrors({});
      
      // Tesseract 워커 정리
      terminateWorker().catch(e => console.error('워커 정리 실패:', e));
    }
  }, [isOpen]);
  
  // 파일 변경 처리
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setReceiptImage(file);
      const preview = createImagePreview(file);
      setImagePreview(preview);
      
      // OCR 처리
      handleOcrProcessing(file);
    }
  };
  
  // 카메라로 촬영 처리
  const handleCameraCapture = async () => {
    try {
      const file = await takePicture();
      if (file) {
        setReceiptImage(file);
        const preview = createImagePreview(file);
        setImagePreview(preview);
        
        // OCR 처리
        handleOcrProcessing(file);
      }
    } catch (error) {
      setProcessingError(error.message);
    }
  };
  
  // OCR 처리
  const handleOcrProcessing = async (file) => {
    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      // 진행 상태 표시
      setProcessingStatus('이미지 처리 중...');
      
      // 로그 활성화로 디버깅 정보 확인
      console.log('OCR 처리 시작: ', file.name, file.size, file.type);
      
      // 파일 형식 및 크기 검증
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type.toLowerCase())) {
        throw new Error('지원되는 이미지 형식이 아닙니다. JPG, PNG, WebP, HEIC 형식만 사용 가능합니다.');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        throw new Error('이미지 크기가 너무 큽니다. 10MB 이하의 이미지만 사용 가능합니다.');
      }
      
      setProcessingStatus('OCR로 텍스트 인식 중...');
      console.log('Tesseract OCR 처리 시작...');
      
      try {
        const extractedData = await extractReceiptData(file);
        
        // 인식 결과가 너무 적을 경우 처리
        if (!extractedData || !extractedData.amount) {
          console.warn('OCR 인식 결과가 불충분합니다:', extractedData);
          // 기본 데이터 설정으로 시도
          setFormData(prev => ({
            ...prev,
            date: extractedData?.date || new Date().toISOString().split('T')[0],
            amount: extractedData?.amount || '',
            category: extractedData?.category || prev.category,
            type: extractedData?.type || prev.type,
            paymentMethod: extractedData?.paymentMethod || prev.paymentMethod,
            // 제목과 설명은 OCR에서 추출하지 않음
          }));
        } else {
          // 정상 인식 시 - 제목과 설명 제외
          console.log('OCR 인식 성공:', extractedData);
          setFormData(prev => ({
            ...prev,
            date: extractedData.date || prev.date,
            amount: extractedData.amount.toString(),
            category: extractedData.category || prev.category,
            type: extractedData.type || prev.type,
            paymentMethod: extractedData.paymentMethod || prev.paymentMethod,
            // 제목과 설명은 OCR에서 추출하지 않음
          }));
        }
        
        // 어떤 경우든 다음 단계로 진행
        setCurrentStep(2);
      } catch (ocrError) {
        console.error('Tesseract OCR 실행 중 오류:', ocrError);
        throw new Error(`OCR 처리 오류: ${ocrError.message}`);
      }
    } catch (error) {
      console.error('OCR 처리 실패:', error);
      
      // 자세한 오류 메시지 표시
      const errorMessage = error.message || '영수증 인식에 실패했습니다.';
      setProcessingError(`${errorMessage} 다시 시도하거나 직접 입력해주세요.`);
      
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };
  
  // 입력 필드 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 유효성 검사 오류 초기화
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // 직접 입력 이동
  const handleManualEntry = () => {
    setCurrentStep(2);
  };
  
  // 폼 유효성 검사
  const validateForm = () => {
    const errors = {};
    
    // 필수 필드 검사
    if (!formData.title?.trim()) {
      errors.title = '제목을 입력해주세요';
    }
    
    if (!formData.description?.trim()) {
      errors.description = '설명을 입력해주세요';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 다음 단계 이동
  const handleNextStep = () => {
    // 2단계(정보 입력) -> 3단계(정보 확인)로 넘어갈 때 유효성 검사
    if (currentStep === 2) {
      if (!validateForm()) {
        return; // 유효성 검사 실패 시 다음 단계로 넘어가지 않음
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // 이전 단계 이동
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // 제출 처리
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    // 제출 전 마지막 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    const submittedData = {
      ...formData,
      amount: parseInt(formData.amount, 10) || 0,
      attachmentUrl: imagePreview
    };
    
    onSubmit(submittedData);
    
    // 마지막 단계로 이동
    setCurrentStep(totalSteps);
  };
  
  // 모달 닫기 전 확인
  const handleCloseConfirm = () => {
    if (currentStep < totalSteps) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 닫으시겠습니까?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // 단계별 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.step_content}>
            <h3 className={styles.step_title}>영수증 캡처 또는 업로드</h3>
            
            {processingError && (
              <div className={styles.error_message}>
                <FaExclamationTriangle /> {processingError}
              </div>
            )}
            
            {isProcessing ? (
              <div className={styles.processing_container}>
                <div className={styles.spinner}></div>
                <p>{processingStatus || '영수증을 처리 중입니다...'}</p>
                <p className={styles.processing_tip}>
                  처리 시간은 이미지 크기와 품질에 따라 달라질 수 있습니다.
                </p>
              </div>
            ) : (
              <>
                {imagePreview ? (
                  <div className={styles.preview_container}>
                    <img 
                      src={imagePreview} 
                      alt="Receipt preview" 
                      className={styles.image_preview} 
                    />
                    <div className={styles.preview_actions}>
                      <button 
                        type="button" 
                        className={styles.action_button}
                        onClick={() => {
                          revokeImagePreview(imagePreview);
                          setImagePreview(null);
                          setReceiptImage(null);
                          setProcessingError(null);
                        }}
                      >
                        이미지 제거
                      </button>
                      
                      {processingError && (
                        <button
                          type="button"
                          className={styles.retry_button}
                          onClick={() => handleOcrProcessing(receiptImage)}
                        >
                          인식 재시도
                        </button>
                      )}
                    </div>
                    
                    {processingError && (
                      <div className={styles.manual_entry_link}>
                        <button
                          type="button" 
                          className={styles.text_button}
                          onClick={handleManualEntry}
                        >
                          직접 입력하기
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.capture_options}>
                    <div className={styles.option_card} onClick={handleCameraCapture}>
                      <FaCamera size={40} className={styles.option_icon} />
                      <p>카메라로 촬영</p>
                    </div>
                    
                    <div className={styles.option_card}>
                      <label htmlFor="receipt-file" className={styles.file_label}>
                        <FaFileUpload size={40} className={styles.option_icon} />
                        <p>파일 업로드</p>
                      </label>
                      <input
                        type="file"
                        id="receipt-file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.file_input}
                      />
                    </div>
                    
                    <div className={styles.option_card} onClick={handleManualEntry}>
                      <FaKeyboard size={40} className={styles.option_icon} />
                      <p>직접 입력</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className={styles.step_content}>
            <h3 className={styles.step_title}>영수증 정보 입력</h3>
            
            <form className={styles.form}>
              <div className={styles.form_grid}>
                <div className={styles.form_column}>
                  <div className={styles.form_group}>
                    <label htmlFor="date">날짜</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className={styles.form_input}
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label htmlFor="title">
                      제목 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="영수증 제목을 입력하세요"
                      required
                      className={`${styles.form_input} ${formErrors.title ? styles.input_error : ''}`}
                    />
                    {formErrors.title && (
                      <div className={styles.error_text}>
                        <FaExclamationTriangle /> {formErrors.title}
                      </div>
                    )}
                  </div>
                  <div className={styles.form_group}>
                    <label htmlFor="amount">금액</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="금액을 입력하세요"
                      required
                      className={styles.form_input}
                    />
                  </div>
                </div>
                <div className={styles.form_column}>
                  <div className={styles.form_group}>
                    <label htmlFor="category">카테고리</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className={styles.form_select}
                    >
                      <option value="">카테고리 선택</option>
                      {receiptCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.form_group}>
                    <label htmlFor="type">영수증 유형</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className={styles.form_select}
                    >
                      {receiptTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.nameEn} ({type.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.form_group}>
                    <label htmlFor="paymentMethod">결제 방법</label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      required
                      className={styles.form_select}
                    >
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className={styles.form_group} style={{ marginTop: '1rem' }}>
                <label htmlFor="description">
                  설명 <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="영수증에 대한 설명을 입력하세요"
                  rows={3}
                  required
                  className={`${styles.form_textarea} ${formErrors.description ? styles.input_error : ''}`}
                />
                {formErrors.description && (
                  <div className={styles.error_text}>
                    <FaExclamationTriangle /> {formErrors.description}
                  </div>
                )}
              </div>
              
              <div className={styles.form_tip}>
                <p><span className={styles.required}>*</span> 표시는 필수 입력 항목입니다.</p>
              </div>
            </form>
          </div>
        );
        
      case 3:
        return (
          <div className={styles.step_content}>
            <h3 className={styles.step_title}>정보 확인</h3>
            
            <div className={styles.preview_container}>
              {imagePreview && (
                <div className={styles.receipt_preview}>
                  <h4>영수증 이미지</h4>
                  <img 
                    src={imagePreview} 
                    alt="Receipt" 
                    className={styles.receipt_image} 
                  />
                </div>
              )}
              
              <div className={styles.info_preview}>
                <h4>영수증 정보</h4>
                
                <div className={styles.info_grid}>
                  <div className={styles.info_item}>
                    <strong>날짜:</strong> {formData.date}
                  </div>
                  <div className={styles.info_item}>
                    <strong>제목:</strong> {formData.title}
                  </div>
                  <div className={styles.info_item}>
                    <strong>금액:</strong> {parseInt(formData.amount, 10).toLocaleString()}원
                  </div>
                  <div className={styles.info_item}>
                    <strong>카테고리:</strong> {
                      receiptCategories.find(c => c.id === formData.category)?.name || '선택되지 않음'
                    }
                  </div>
                  <div className={styles.info_item}>
                    <strong>영수증 유형:</strong> {
                      receiptTypes.find(t => t.id === formData.type)?.name || '선택되지 않음'
                    }
                  </div>
                  <div className={styles.info_item}>
                    <strong>결제 방법:</strong> {
                      paymentMethods.find(m => m.id === formData.paymentMethod)?.name || '선택되지 않음'
                    }
                  </div>
                </div>
                
                {formData.description && (
                  <div className={styles.description_preview}>
                    <strong>설명:</strong> {formData.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className={styles.step_content}>
            <div className={styles.success_container}>
              <div className={styles.success_icon}>
                <FaCheck size={50} />
              </div>
              <h3 className={styles.success_title}>영수증 {mode === 'add' ? '추가' : '수정'}가 완료되었습니다!</h3>
              <p className={styles.success_message}>
                {mode === 'add' 
                  ? '새로운 영수증이 성공적으로 등록되었습니다.' 
                  : '영수증이 성공적으로 수정되었습니다.'}
              </p>
              <button 
                type="button" 
                className={styles.done_button}
                onClick={onClose}
              >
                확인
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // 단계별 버튼 및 액션 설정
  const getStepActions = () => {
    switch (currentStep) {
      case 1:
        return {
          showPrevButton: false,
          showNextButton: !!imagePreview,
          nextButtonText: '계속',
        };
        
      case 2:
        return {
          prevButtonText: '이전',
          nextButtonText: '계속',
        };
        
      case 3:
        return {
          prevButtonText: '수정',
          nextButtonText: '제출',
          onNextStep: handleSubmit,
        };
        
      case 4:
        return {
          showPrevButton: false,
          showNextButton: false,
        };
        
      default:
        return {};
    }
  };

  return (
    <StepperModal
      isOpen={isOpen}
      onClose={handleCloseConfirm}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onPrevStep={handlePrevStep}
      onNextStep={getStepActions().onNextStep || handleNextStep}
      title={mode === 'add' ? '새 영수증 추가' : '영수증 편집'}
      showPrevButton={getStepActions().showPrevButton !== false}
      showNextButton={getStepActions().showNextButton !== false}
      prevButtonText={getStepActions().prevButtonText || '이전'}
      nextButtonText={getStepActions().nextButtonText || '다음'}
    >
      {renderStepContent()}
    </StepperModal>
  );
};

export default ReceiptStepper; 