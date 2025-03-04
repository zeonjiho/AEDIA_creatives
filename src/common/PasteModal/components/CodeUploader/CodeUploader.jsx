import React, { useState, useEffect } from 'react'
import ss from './CodeUploader.module.css'
import CodeEditor from '../../../Components/CodeEditor/CodeEditor'

const CodeUploader = ({ onCodeChange, onLanguageChange, initialCode = '', initialLanguage = 'javascript' }) => {
  const [code, setCode] = useState(initialCode)
  const [language, setLanguage] = useState(initialLanguage)
  const [reference, setReference] = useState('');
  const [references, setReferences] = useState([]);
  const [showReferenceForm, setShowReferenceForm] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode)
    }
    if (initialLanguage) {
      setLanguage(initialLanguage)
    }
  }, [initialCode, initialLanguage])

  const handleCodeChange = (newCode) => {
    setCode(newCode)
    if (onCodeChange) {
      onCodeChange(newCode)
    }
  }

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    if (onLanguageChange) {
      onLanguageChange(newLanguage)
    }
  }

  const handleReferenceChange = (e) => {
    setReference(e.target.value);
  };
  
  const addReference = (e) => {
    e.preventDefault();
    if (reference.trim()) {
      setReferences([...references, reference.trim()]);
      setReference('');
    }
  };
  
  const removeReference = (index) => {
    const newReferences = [...references];
    newReferences.splice(index, 1);
    setReferences(newReferences);
  };

  return (
    <div className={ss.codeUploaderContainer}>
      <div className={ss.codeUploaderEditorContainer}>
        <CodeEditor
          code={code}
          onChange={handleCodeChange}
          language={language}
          onLanguageChange={handleLanguageChange}
          showLineNumbers={true}
          theme="light"
          fontSize="14px"
        />
      </div>
      <div className={ss.codeUploaderFooter}>
        <div className={ss.languageInfo}>
          {/* <span>Selected Language: {language}</span> */}
        </div>
        <div className={ss.codeStats}>
          <span>{code.split('\n').length} lines</span>
          <span>{code.length} characters</span>
        </div>
      </div>
      
      <div className={ss.referenceSection}>
        <div className={ss.referenceHeader}>
          <div className={ss.titleGroup}>
            <h3 className={ss.referenceTitle}>References</h3>
          </div>
          <div className={ss.referenceControls}>
            {!showReferenceForm && (
              <button 
                className={ss.addReferenceButton}
                onClick={() => setShowReferenceForm(true)}
              >
                Add Reference
              </button>
            )}
            {showReferenceForm && (
              <button 
                className={ss.deleteButton}
                onClick={() => setShowReferenceForm(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        
        {showReferenceForm && (
          <div className={ss.referenceWrapper}>
            <form className={ss.referenceForm} onSubmit={addReference}>
              <input
                type="text"
                className={ss.referenceInput}
                placeholder="Enter reference URL or description"
                value={reference}
                onChange={handleReferenceChange}
              />
              <button 
                type="submit" 
                className={ss.submitButton}
                disabled={!reference.trim()}
              >
                Add
              </button>
            </form>
          </div>
        )}
        
        {references.length > 0 && (
          <div className={ss.referenceList}>
            {references.map((ref, index) => (
              <div key={index} className={ss.referenceItem}>
                <span className={ss.referenceText}>{ref}</span>
                <button 
                  className={ss.deleteButton}
                  onClick={() => removeReference(index)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeUploader 