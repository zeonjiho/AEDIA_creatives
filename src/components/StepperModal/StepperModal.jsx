import React from 'react';
import styles from './StepperModal.module.css';

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
const StepperModal = ({
  isOpen,
  onClose,
  currentStep,
  totalSteps,
  onPrevStep,
  onNextStep,
  title,
  children,
  showPrevButton = true,
  showNextButton = true,
  nextButtonText = '다음',
  prevButtonText = '이전',
}) => {
  if (!isOpen) return null;

  // 프로그레스 바 계산
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={styles.modal_overlay}>
      <div className={styles.modal}>
        <div className={styles.modal_header}>
          <h2>{title}</h2>
          <button className={styles.close_button} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.stepper_container}>
          {/* <div className={styles.stepper_progress}>
            <div 
              className={styles.stepper_progress_bar} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div> */}
          
          <div className={styles.stepper_steps}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div 
                key={i} 
                className={`${styles.stepper_step} ${i + 1 <= currentStep ? styles.active : ''}`}
              >
                <div className={styles.stepper_step_number}>{i + 1}</div>
                {i < totalSteps - 1 && <div className={styles.stepper_step_connector}></div>}
              </div>
            ))}
          </div>
          
          <div className={styles.step_indicator}>
            {currentStep} / {totalSteps}
          </div>
        </div>
        
        <div className={styles.modal_content}>
          {children}
        </div>
        
        <div className={styles.modal_footer}>
          {showPrevButton && currentStep > 1 && (
            <button 
              type="button" 
              className={styles.prev_button} 
              onClick={onPrevStep}
            >
              {prevButtonText}
            </button>
          )}
          
          {showNextButton && currentStep < totalSteps && (
            <button 
              type="button" 
              className={styles.next_button} 
              onClick={onNextStep}
            >
              {nextButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepperModal; 