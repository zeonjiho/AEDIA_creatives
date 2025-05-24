import React, { useState } from 'react';
import styles from './AddProjectModal.module.css';
import { HiX } from 'react-icons/hi';

const AddProjectModal = ({ isOpen, onClose, onAddProject }) => {
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'concept',
    deadline: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProject.title) return;
    
    const projectToAdd = {
      ...newProject,
      id: Date.now(),
      progress: 0,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      tasks: [],
      team: []
    };
    
    onAddProject(projectToAdd);
    handleClose();
  };

  const handleClose = () => {
    setNewProject({
      title: '',
      description: '',
      status: 'concept',
      deadline: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.modal_background} onClick={handleClose}></div>
      <div className={styles.modal_panel}>
        <div className={styles.panel_header}>
          <div className={styles.panel_title}>
            <h2>새 프로젝트 추가</h2>
          </div>
          <button className={styles.close_button} onClick={handleClose}>
            <HiX />
          </button>
        </div>
        <div className={styles.panel_content}>
          <form onSubmit={handleSubmit}>
            <div className={styles.form_group}>
              <label>프로젝트명</label>
              <input 
                type="text" 
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className={styles.form_group}>
              <label>설명</label>
              <textarea 
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <div className={styles.form_row}>
              <div className={styles.form_group}>
                <label>상태</label>
                <select 
                  name="status"
                  value={newProject.status}
                  onChange={handleInputChange}
                >
                  <option value="concept">Concept</option>
                  <option value="development">Development</option>
                  <option value="pre_production">Pre-Production</option>
                  <option value="production">Production</option>
                  <option value="post_production">Post-Production</option>
                  <option value="vfx">VFX/CG</option>
                  <option value="sound_design">Sound Design</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div className={styles.form_group}>
                <label>마감일</label>
                <input 
                  type="date" 
                  name="deadline"
                  value={newProject.deadline}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>
            <div className={styles.form_actions}>
              <button type="button" className={styles.cancel_button} onClick={handleClose}>
                취소
              </button>
              <button type="submit" className={styles.save_button}>
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal; 