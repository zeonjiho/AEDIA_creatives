import React, { useState, useEffect } from 'react';
import { FaCamera, FaFileUpload, FaKeyboard, FaCheck, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import { HiBookmark } from 'react-icons/hi';
import StepperModal from '../StepperModal/StepperModal';
import ProjectSelectModal from '../ProjectSelectModal/ProjectSelectModal';
import styles from './ReceiptStepper.module.css';
import { receiptCategories, receiptTypes, receiptStatuses, paymentMethods, projects } from '../../data/mockDatabase';
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
  const [currentStep, setCurrentStep] = useState(mode === 'edit' ? 2 : 1); // 편집 모드일 때는 바로 2단계로
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    amount: '',
    category: '',
    paymentMethod: 'CORPORATE_CARD',
    status: 'PENDING',
    type: 'OTHER',
    attachmentUrls: [], // 배열로 변경
    description: '',
    project: '',
    projectId: null,
    ...initialData
  });
  
  const [receiptImages, setReceiptImages] = useState([]); // 배열로 변경
  const [imagePreviews, setImagePreviews] = useState([]); // 배열로 변경
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // 처리 상태 메시지를 위한 상태 추가
  const [processingStatus, setProcessingStatus] = useState('');
  
  // 프로젝트 선택 모달 관련 상태
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const totalSteps = 4;
  
  // 편집 모드일 때 초기 데이터 로드
  useEffect(() => {
    if (mode === 'edit' && initialData && Object.keys(initialData).length > 0) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        title: '',
        amount: '',
        category: '',
        paymentMethod: 'CORPORATE_CARD',
        status: 'PENDING',
        type: 'OTHER',
        attachmentUrls: [],
        description: '',
        project: '',
        projectId: null,
        ...initialData,
        // amount는 문자열로 변환
        amount: initialData.amount ? initialData.amount.toString() : ''
      });
      setCurrentStep(2); // 편집 모드에서는 폼 입력 단계부터 시작
      
      // 기존 프로젝트 설정
      if (initialData.project) {
        setSelectedProject(initialData.project);
      }
      
      // 기존 첨부 이미지가 있으면 미리보기 설정
      if (initialData.attachmentUrls && initialData.attachmentUrls.length > 0) {
        setImagePreviews(initialData.attachmentUrls);
      }
    } else if (mode === 'add') {
      // 추가 모드일 때는 초기값으로 설정
      setFormData({
        date: new Date().toISOString().split('T')[0],
        title: '',
        amount: '',
        category: '',
        paymentMethod: 'CORPORATE_CARD',
        status: 'PENDING',
        type: 'OTHER',
        attachmentUrls: [],
        description: '',
        project: '',
        projectId: null
      });
      setCurrentStep(1); // 이미지 업로드 단계부터 시작
      setSelectedProject(null); // 프로젝트 선택 초기화
    }
  }, [mode, initialData, isOpen]);
  
  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(mode === 'edit' ? 2 : 1);
      if (imagePreviews && mode === 'add') {
        // 추가 모드일 때만 이미지 미리보기 정리 (편집 모드에서는 기존 이미지일 수 있음)
        revokeImagePreview(imagePreviews[0]);
      }
      if (mode === 'add') {
        setImagePreviews([]);
        setReceiptImages([]);
      }
      setIsProcessing(false);
      setProcessingError(null);
      setProcessingStatus('');
      setFormErrors({});
      
      // Tesseract 워커 정리
      terminateWorker().catch(e => console.error('워커 정리 실패:', e));
    }
  }, [isOpen, mode]);
  
  // 파일 변경 처리
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // 기존 이미지에 추가
      const newImage = file;
      const newPreview = createImagePreview(file);
      
      setReceiptImages(prev => [...prev, newImage]);
      setImagePreviews(prev => [...prev, newPreview]);
      
      // OCR 처리 (첫 번째 이미지가 없었을 때만)
      if (receiptImages.length === 0) {
        handleOcrProcessing(file);
      }
    }
    
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    event.target.value = '';
  };
  
  // 개별 이미지 제거
  const handleRemoveImage = (index) => {
    if (mode === 'add' && imagePreviews[index]) {
      revokeImagePreview(imagePreviews[index]);
    }
    
    setReceiptImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    
    if (index === 0) {
      setProcessingError(null);
    }
  };
  
  // 모든 이미지 제거
  const handleRemoveAllImages = () => {
    if (mode === 'add') {
      imagePreviews.forEach(preview => {
        revokeImagePreview(preview);
      });
    }
    setImagePreviews([]);
    setReceiptImages([]);
    setProcessingError(null);
  };
  
  // 프로젝트 선택 모달 열기
  const handleOpenProjectModal = () => {
    setIsProjectModalOpen(true);
  };
  
  // 프로젝트 선택 모달 닫기
  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
  };
  
  // 프로젝트 선택 처리
  const handleProjectSelect = (project) => {
    if (project) {
      setSelectedProject(project.title);
      setFormData(prev => ({
        ...prev,
        project: project.title,
        projectId: project.id
      }));
    } else {
      setSelectedProject(null);
      setFormData(prev => ({
        ...prev,
        project: '',
        projectId: null
      }));
    }
  };
  
  // 카메라로 촬영 처리
  const handleCameraCapture = async () => {
    try {
      const file = await takePicture();
      if (file) {
        const newPreview = createImagePreview(file);
        
        setReceiptImages(prev => [...prev, file]);
        setImagePreviews(prev => [...prev, newPreview]);
        
        // OCR 처리 (첫 번째 이미지가 없었을 때만)
        if (receiptImages.length === 0) {
          handleOcrProcessing(file);
        }
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
    const minStep = mode === 'edit' ? 2 : 1; // 편집 모드에서는 2단계가 최소
    if (currentStep > minStep) {
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
      attachmentUrls: imagePreviews
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
                {imagePreviews.length > 0 ? (
                  <div className={styles.preview_container}>
                    <img 
                      src={imagePreviews[0]} 
                      alt="Receipt preview" 
                      className={styles.image_preview} 
                    />
                    <div className={styles.preview_actions}>
                      <button 
                        type="button" 
                        className={styles.action_button}
                        onClick={() => {
                          revokeImagePreview(imagePreviews[0]);
                          setImagePreviews([]);
                          setReceiptImages([]);
                          setProcessingError(null);
                        }}
                      >
                        이미지 제거
                      </button>
                      
                      {processingError && (
                        <button
                          type="button"
                          className={styles.retry_button}
                          onClick={() => handleOcrProcessing(receiptImages[0])}
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
            
            {/* 이미지 관리 섹션 */}
            <div className={styles.image_management_section}>
              <div className={styles.section_header}>
                <h4 className={styles.section_title}>영수증 이미지</h4>
                {imagePreviews.length > 0 && (
                  <div className={styles.section_actions}>
                    <span className={styles.image_count}>
                      {imagePreviews.length}개 이미지
                    </span>
                    <button 
                      type="button" 
                      className={styles.remove_all_btn}
                      onClick={handleRemoveAllImages}
                      title="모든 이미지 제거"
                    >
                      <FaTrash /> 전체 삭제
                    </button>
                  </div>
                )}
              </div>
              
              {imagePreviews.length > 0 ? (
                <div className={styles.images_grid}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className={styles.image_item}>
                      <div className={styles.image_preview_wrapper}>
                        <img 
                          src={preview} 
                          alt={`영수증 이미지 ${index + 1}`} 
                          className={styles.current_image_preview} 
                        />
                        <button 
                          type="button" 
                          className={styles.remove_single_btn}
                          onClick={() => handleRemoveImage(index)}
                          title="이미지 제거"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <p className={styles.image_number}>이미지 {index + 1}</p>
                    </div>
                  ))}
                  
                  {/* 이미지 추가 카드 */}
                  <div className={styles.add_image_card}>
                    <label className={styles.add_image_btn} htmlFor="add-more-images">
                      <FaFileUpload size={24} />
                      <span>이미지 추가</span>
                    </label>
                    <input
                      type="file"
                      id="add-more-images"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={styles.file_input}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.no_image_container}>
                  <div className={styles.upload_placeholder}>
                    <FaFileUpload size={30} className={styles.upload_icon} />
                    <p>영수증 이미지가 없습니다</p>
                    <label className={styles.upload_image_btn} htmlFor="add-receipt-file">
                      첫 번째 이미지 업로드
                    </label>
                    <input
                      type="file"
                      id="add-receipt-file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={styles.file_input}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <p className={styles.image_note}>
                    💡 이미지를 업로드하면 금액과 날짜가 자동으로 인식됩니다
                  </p>
                </div>
              )}
              
              {/* OCR 처리 상태 표시 */}
              {isProcessing && (
                <div className={styles.processing_indicator}>
                  <div className={styles.spinner}></div>
                  <span>{processingStatus || '이미지 처리 중...'}</span>
                </div>
              )}
              
              {processingError && (
                <div className={styles.error_message}>
                  <FaExclamationTriangle /> {processingError}
                </div>
              )}
            </div>
            
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
                  <div className={styles.form_group}>
                    <label htmlFor="project">프로젝트</label>
                    <div className={styles.project_select_wrapper}>
                      <div className={styles.project_display}>
                        {selectedProject ? (
                          <div className={styles.selected_project}>
                            <HiBookmark className={styles.project_icon} />
                            <span>{selectedProject}</span>
                            <button
                              type="button"
                              className={styles.clear_project_btn}
                              onClick={() => handleProjectSelect(null)}
                              title="프로젝트 선택 해제"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className={styles.no_project}>
                            프로젝트가 선택되지 않았습니다
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.select_project_btn}
                        onClick={handleOpenProjectModal}
                      >
                        <HiBookmark />
                        프로젝트 선택
                      </button>
                    </div>
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
              {imagePreviews.length > 0 && (
                <div className={styles.receipt_preview}>
                  <h4>영수증 이미지 ({imagePreviews.length}개)</h4>
                  <div className={styles.receipt_images_grid}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className={styles.receipt_image_item}>
                        <img 
                          src={preview} 
                          alt={`영수증 ${index + 1}`} 
                          className={styles.receipt_image} 
                        />
                        <p className={styles.receipt_image_label}>이미지 {index + 1}</p>
                      </div>
                    ))}
                  </div>
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
                  <div className={styles.info_item}>
                    <strong>프로젝트:</strong> {
                      selectedProject || '선택되지 않음'
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
    const minStep = mode === 'edit' ? 2 : 1;
    
    switch (currentStep) {
      case 1:
        return {
          showPrevButton: false,
          showNextButton: !!imagePreviews.length,
          nextButtonText: '계속',
        };
        
      case 2:
        return {
          showPrevButton: currentStep > minStep, // 편집 모드에서는 2단계에서 이전 버튼 숨김
          prevButtonText: '이전',
          nextButtonText: '계속',
        };
        
      case 3:
        return {
          showPrevButton: true,
          prevButtonText: '수정',
          nextButtonText: mode === 'add' ? '추가' : '저장',
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
    <>
      <StepperModal
        isOpen={isOpen}
        onClose={handleCloseConfirm}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrevStep={handlePrevStep}
        onNextStep={getStepActions().onNextStep || handleNextStep}
        title={mode === 'add' ? '영수증 추가' : '영수증 편집'}
        showPrevButton={getStepActions().showPrevButton !== false}
        showNextButton={getStepActions().showNextButton !== false}
        prevButtonText={getStepActions().prevButtonText || '이전'}
        nextButtonText={getStepActions().nextButtonText || '다음'}
      >
        {renderStepContent()}
      </StepperModal>
      
      {/* 프로젝트 선택 모달 */}
      <ProjectSelectModal
        isOpen={isProjectModalOpen}
        projects={projects}
        selectedProject={selectedProject}
        onSelect={handleProjectSelect}
        onClose={handleCloseProjectModal}
      />
    </>
  );
};

export default ReceiptStepper; 