import React, { useState, useEffect } from 'react';
import styles from './DeleteWarning.module.css';

const DeleteWarning = ({ isOpen, onClose, onConfirm, itemName }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(onConfirm, 300);
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.overlay} ${isClosing ? styles.closing : ''}`}>
      <div className={`${styles.modal} ${isClosing ? styles.closing : ''}`}>
        <h2 className={styles.title}>Delete Confirmation</h2>
        <p className={styles.message}>
          Are you sure you want to delete{' '}
          <span className={styles.highlight}>{itemName}</span>?
          <br />
          This action cannot be undone.
        </p>
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className={`${styles.button} ${styles.deleteButton}`}
            onClick={handleConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteWarning; 