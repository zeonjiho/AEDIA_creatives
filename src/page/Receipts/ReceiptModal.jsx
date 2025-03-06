import React from 'react';
import styles from './Receipts.module.css';
import { receiptCategories, receiptTypes, receiptStatuses, paymentMethods } from '../../data/mockDatabase';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  handleInputChange, 
  handleSubmit, 
  modalMode 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modal_overlay}>
      <div className={`${styles.modal} ${styles.modal_mobile_fullscreen}`}>
        <div className={styles.modal_header}>
          <h2>{modalMode === 'add' ? '영수증 추가' : '영수증 편집'}</h2>
          <button className={styles.close_button} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.receipt_form}>
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
                />
              </div>
              <div className={styles.form_group}>
                <label htmlFor="title">제목</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="영수증 제목"
                  required
                />
              </div>
              <div className={styles.form_group}>
                <label htmlFor="amount">금액</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="금액"
                  required
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
                >
                  <option value="">카테고리 선택</option>
                  {receiptCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
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
                >
                  {receiptTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.nameEn} ({type.name})</option>
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
                >
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className={styles.form_group} style={{gridColumn: "1 / span 2"}}>
            <label htmlFor="status">상태</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              {receiptStatuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.form_group} style={{gridColumn: "1 / span 2"}}>
            <label htmlFor="attachment">영수증 첨부</label>
            <input
              type="file"
              id="attachment"
              name="attachment"
              accept="image/*,.pdf"
            />
          </div>
          <div className={styles.form_actions}>
            <button type="button" className={styles.cancel_button} onClick={onClose}>
              취소
            </button>
            <button type="submit" className={styles.submit_button}>
              {modalMode === 'add' ? '추가' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptModal; 