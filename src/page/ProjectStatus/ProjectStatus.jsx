import React, { useState, useEffect } from 'react';
import styles from './ProjectStatus.module.css';
import { 
    getProjects, 
    addProject, 
    updateProject, 
    deleteProject,
    addTask,
    updateTask,
    deleteTask
} from '../../data/mockDatabase';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ProjectStatus = () => {
    const [projects, setProjects] = useState([]);
    const [expandedProject, setExpandedProject] = useState(null);
    const [newProject, setNewProject] = useState({ title: '', description: '', deadline: '', status: '진행 중' });
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [newTask, setNewTask] = useState({ title: '', assignee: '', deadline: '', status: '할 일' });
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    // 프로젝트 상태 옵션
    const projectStatusOptions = ['계획', '진행 중', '완료', '보류'];
    // 작업 상태 옵션
    const taskStatusOptions = ['할 일', '진행 중', '검토 중', '완료'];

    useEffect(() => {
        // 프로젝트 데이터 로드
        const loadProjects = async () => {
            try {
                const projectsData = await getProjects();
                setProjects(projectsData);
            } catch (error) {
                console.error('프로젝트 로드 실패:', error);
            }
        };
        
        loadProjects();
    }, []);

    // 프로젝트 확장/축소 토글
    const toggleProject = (projectId) => {
        setExpandedProject(expandedProject === projectId ? null : projectId);
    };

    // 새 프로젝트 추가 폼 토글
    const toggleAddProject = () => {
        setIsAddingProject(!isAddingProject);
        setNewProject({ title: '', description: '', deadline: '', status: '진행 중' });
    };

    // 프로젝트 추가 처리
    const handleAddProject = async () => {
        if (!newProject.title) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const projectToAdd = {
                ...newProject,
                deadline: newProject.deadline || today,
                createdAt: today,
                tasks: []
            };
            
            const addedProject = await addProject(projectToAdd);
            setProjects([...projects, addedProject]);
            toggleAddProject();
        } catch (error) {
            console.error('프로젝트 추가 실패:', error);
        }
    };

    // 프로젝트 수정 시작
    const handleStartEditProject = (project) => {
        setEditingProject({ ...project });
    };

    // 프로젝트 수정 취소
    const handleCancelEditProject = () => {
        setEditingProject(null);
    };

    // 프로젝트 수정 저장
    const handleSaveProject = async () => {
        if (!editingProject || !editingProject.title) return;
        
        try {
            const updatedProject = await updateProject(editingProject.id, editingProject);
            setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
            setEditingProject(null);
        } catch (error) {
            console.error('프로젝트 수정 실패:', error);
        }
    };

    // 프로젝트 삭제
    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) return;
        
        try {
            await deleteProject(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
        } catch (error) {
            console.error('프로젝트 삭제 실패:', error);
        }
    };

    // 새 작업 추가 폼 토글
    const toggleAddTask = (projectId) => {
        setIsAddingTask(isAddingTask === projectId ? null : projectId);
        setNewTask({ title: '', assignee: '', deadline: '', status: '할 일' });
    };

    // 작업 추가 처리
    const handleAddTask = async (projectId) => {
        if (!newTask.title) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const taskToAdd = {
                ...newTask,
                deadline: newTask.deadline || today,
                createdAt: today
            };
            
            const updatedProject = await addTask(projectId, taskToAdd);
            setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
            toggleAddTask(null);
        } catch (error) {
            console.error('작업 추가 실패:', error);
        }
    };

    // 작업 수정 시작
    const handleStartEditTask = (projectId, task) => {
        setEditingTask({ projectId, ...task });
    };

    // 작업 수정 취소
    const handleCancelEditTask = () => {
        setEditingTask(null);
    };

    // 작업 수정 저장
    const handleSaveTask = async () => {
        if (!editingTask || !editingTask.title) return;
        
        try {
            const { projectId, ...taskData } = editingTask;
            const updatedProject = await updateTask(projectId, taskData.id, taskData);
            setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
            setEditingTask(null);
        } catch (error) {
            console.error('작업 수정 실패:', error);
        }
    };

    // 작업 삭제
    const handleDeleteTask = async (projectId, taskId) => {
        if (!window.confirm('정말로 이 작업을 삭제하시겠습니까?')) return;
        
        try {
            const updatedProject = await deleteTask(projectId, taskId);
            setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
        } catch (error) {
            console.error('작업 삭제 실패:', error);
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // 남은 일수 계산
    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    };

    // 상태에 따른 색상 클래스 반환
    const getStatusClass = (status, type = 'project') => {
        if (type === 'project') {
            switch (status) {
                case '계획': return styles.status_planned;
                case '진행 중': return styles.status_in_progress;
                case '완료': return styles.status_completed;
                case '보류': return styles.status_on_hold;
                default: return '';
            }
        } else {
            switch (status) {
                case '할 일': return styles.status_todo;
                case '진행 중': return styles.status_in_progress;
                case '검토 중': return styles.status_review;
                case '완료': return styles.status_completed;
                default: return '';
            }
        }
    };

    return (
        <div className={styles.project_status_container}>
            <div className={styles.header}>
                <h1>프로젝트 현황</h1>
                <button 
                    className={styles.add_button}
                    onClick={toggleAddProject}
                >
                    <FaPlus /> 새 프로젝트
                </button>
            </div>

            {/* 새 프로젝트 추가 폼 */}
            {isAddingProject && (
                <div className={styles.add_form}>
                    <h3>새 프로젝트 추가</h3>
                    <div className={styles.form_group}>
                        <label>제목</label>
                        <input 
                            type="text" 
                            value={newProject.title}
                            onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                            placeholder="프로젝트 제목"
                        />
                    </div>
                    <div className={styles.form_group}>
                        <label>설명</label>
                        <textarea 
                            value={newProject.description}
                            onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                            placeholder="프로젝트 설명"
                        />
                    </div>
                    <div className={styles.form_row}>
                        <div className={styles.form_group}>
                            <label>마감일</label>
                            <input 
                                type="date" 
                                value={newProject.deadline}
                                onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                            />
                        </div>
                        <div className={styles.form_group}>
                            <label>상태</label>
                            <select 
                                value={newProject.status}
                                onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                            >
                                {projectStatusOptions.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.form_actions}>
                        <button 
                            className={styles.cancel_button}
                            onClick={toggleAddProject}
                        >
                            취소
                        </button>
                        <button 
                            className={styles.save_button}
                            onClick={handleAddProject}
                        >
                            저장
                        </button>
                    </div>
                </div>
            )}

            {/* 프로젝트 목록 */}
            <div className={styles.projects_list}>
                {projects.length === 0 ? (
                    <div className={styles.no_projects}>
                        <p>등록된 프로젝트가 없습니다. 새 프로젝트를 추가해보세요.</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <div 
                            key={project.id} 
                            className={`${styles.project_card} ${expandedProject === project.id ? styles.expanded : ''}`}
                        >
                            {/* 프로젝트 헤더 */}
                            <div 
                                className={styles.project_header}
                                onClick={() => toggleProject(project.id)}
                            >
                                {editingProject && editingProject.id === project.id ? (
                                    // 프로젝트 수정 모드
                                    <div className={styles.project_edit_form}>
                                        <div className={styles.form_group}>
                                            <input 
                                                type="text" 
                                                value={editingProject.title}
                                                onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
                                                placeholder="프로젝트 제목"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className={styles.form_row}>
                                            <div className={styles.form_group}>
                                                <input 
                                                    type="date" 
                                                    value={editingProject.deadline}
                                                    onChange={(e) => setEditingProject({...editingProject, deadline: e.target.value})}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className={styles.form_group}>
                                                <select 
                                                    value={editingProject.status}
                                                    onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {projectStatusOptions.map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className={styles.edit_actions} onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                className={styles.cancel_button}
                                                onClick={handleCancelEditProject}
                                            >
                                                <FaTimes />
                                            </button>
                                            <button 
                                                className={styles.save_button}
                                                onClick={handleSaveProject}
                                            >
                                                <FaCheck />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // 프로젝트 보기 모드
                                    <>
                                        <div className={styles.project_info}>
                                            <h3>{project.title}</h3>
                                            <div className={styles.project_meta}>
                                                <span className={styles.deadline}>
                                                    마감일: {formatDate(project.deadline)}
                                                    {getDaysRemaining(project.deadline) !== null && (
                                                        <span className={getDaysRemaining(project.deadline) < 0 ? styles.overdue : getDaysRemaining(project.deadline) <= 3 ? styles.due_soon : ''}>
                                                            ({getDaysRemaining(project.deadline) < 0 ? `${Math.abs(getDaysRemaining(project.deadline))}일 지남` : `${getDaysRemaining(project.deadline)}일 남음`})
                                                        </span>
                                                    )}
                                                </span>
                                                <span className={`${styles.status} ${getStatusClass(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.project_actions} onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                className={styles.edit_button}
                                                onClick={() => handleStartEditProject(project)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className={styles.delete_button}
                                                onClick={() => handleDeleteProject(project.id)}
                                            >
                                                <FaTrash />
                                            </button>
                                            {expandedProject === project.id ? <FaChevronUp /> : <FaChevronDown />}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 프로젝트 상세 내용 */}
                            {expandedProject === project.id && (
                                <div className={styles.project_details}>
                                    <div className={styles.project_description}>
                                        <h4>프로젝트 설명</h4>
                                        <p>{project.description || '설명이 없습니다.'}</p>
                                    </div>

                                    {/* 작업 목록 */}
                                    <div className={styles.tasks_section}>
                                        <div className={styles.tasks_header}>
                                            <h4>작업 목록</h4>
                                            <button 
                                                className={styles.add_task_button}
                                                onClick={() => toggleAddTask(project.id)}
                                            >
                                                <FaPlus /> 작업 추가
                                            </button>
                                        </div>

                                        {/* 새 작업 추가 폼 */}
                                        {isAddingTask === project.id && (
                                            <div className={styles.add_task_form}>
                                                <div className={styles.form_group}>
                                                    <label>작업명</label>
                                                    <input 
                                                        type="text" 
                                                        value={newTask.title}
                                                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                                        placeholder="작업명"
                                                    />
                                                </div>
                                                <div className={styles.form_group}>
                                                    <label>담당자</label>
                                                    <input 
                                                        type="text" 
                                                        value={newTask.assignee}
                                                        onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                                                        placeholder="담당자"
                                                    />
                                                </div>
                                                <div className={styles.form_row}>
                                                    <div className={styles.form_group}>
                                                        <label>마감일</label>
                                                        <input 
                                                            type="date" 
                                                            value={newTask.deadline}
                                                            onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                                                        />
                                                    </div>
                                                    <div className={styles.form_group}>
                                                        <label>상태</label>
                                                        <select 
                                                            value={newTask.status}
                                                            onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                                                        >
                                                            {taskStatusOptions.map(status => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className={styles.form_actions}>
                                                    <button 
                                                        className={styles.cancel_button}
                                                        onClick={() => toggleAddTask(null)}
                                                    >
                                                        취소
                                                    </button>
                                                    <button 
                                                        className={styles.save_button}
                                                        onClick={() => handleAddTask(project.id)}
                                                    >
                                                        저장
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 작업 목록 테이블 */}
                                        {project.tasks && project.tasks.length > 0 ? (
                                            <div className={styles.tasks_table_container}>
                                                <table className={styles.tasks_table}>
                                                    <thead>
                                                        <tr>
                                                            <th>작업명</th>
                                                            <th>담당자</th>
                                                            <th>마감일</th>
                                                            <th>상태</th>
                                                            <th>작업</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {project.tasks.map(task => (
                                                            <tr key={task.id}>
                                                                {editingTask && editingTask.id === task.id ? (
                                                                    // 작업 수정 모드
                                                                    <>
                                                                        <td>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editingTask.title}
                                                                                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input 
                                                                                type="text" 
                                                                                value={editingTask.assignee}
                                                                                onChange={(e) => setEditingTask({...editingTask, assignee: e.target.value})}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input 
                                                                                type="date" 
                                                                                value={editingTask.deadline}
                                                                                onChange={(e) => setEditingTask({...editingTask, deadline: e.target.value})}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <select 
                                                                                value={editingTask.status}
                                                                                onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                                                                            >
                                                                                {taskStatusOptions.map(status => (
                                                                                    <option key={status} value={status}>{status}</option>
                                                                                ))}
                                                                            </select>
                                                                        </td>
                                                                        <td>
                                                                            <div className={styles.task_actions}>
                                                                                <button 
                                                                                    className={styles.cancel_button}
                                                                                    onClick={handleCancelEditTask}
                                                                                >
                                                                                    <FaTimes />
                                                                                </button>
                                                                                <button 
                                                                                    className={styles.save_button}
                                                                                    onClick={handleSaveTask}
                                                                                >
                                                                                    <FaCheck />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </>
                                                                ) : (
                                                                    // 작업 보기 모드
                                                                    <>
                                                                        <td>{task.title}</td>
                                                                        <td>{task.assignee || '-'}</td>
                                                                        <td>
                                                                            {formatDate(task.deadline)}
                                                                            {getDaysRemaining(task.deadline) !== null && (
                                                                                <span className={getDaysRemaining(task.deadline) < 0 ? styles.overdue : getDaysRemaining(task.deadline) <= 3 ? styles.due_soon : ''}>
                                                                                    ({getDaysRemaining(task.deadline) < 0 ? `${Math.abs(getDaysRemaining(task.deadline))}일 지남` : `${getDaysRemaining(task.deadline)}일 남음`})
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            <span className={`${styles.task_status} ${getStatusClass(task.status, 'task')}`}>
                                                                                {task.status}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <div className={styles.task_actions}>
                                                                                <button 
                                                                                    className={styles.edit_button}
                                                                                    onClick={() => handleStartEditTask(project.id, task)}
                                                                                >
                                                                                    <FaEdit />
                                                                                </button>
                                                                                <button 
                                                                                    className={styles.delete_button}
                                                                                    onClick={() => handleDeleteTask(project.id, task.id)}
                                                                                >
                                                                                    <FaTrash />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className={styles.no_tasks}>
                                                <p>등록된 작업이 없습니다. 새 작업을 추가해보세요.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectStatus; 