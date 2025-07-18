import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faFileExcel, faFilePdf, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { exportToPDF, exportToCSV } from '../../utils/exportUtils'
import ss from '../../page/Admin/CSS/AdminChart.module.css'

const ExportButton = ({ 
  chartRef, 
  chartTitle, 
  csvData, 
  reportInfo,
  buttonText = "Export",
  onExportStart, 
  onExportComplete 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // 차트가 있는지 확인
  const hasChart = chartRef && chartRef.current;

  const handleExportPDF = async () => {
    try {
      if (onExportStart) onExportStart('PDF');
      
      const result = await exportToPDF(chartRef.current, chartTitle);
      
      if (result.success) {
        setShowDropdown(false);
        if (onExportComplete) onExportComplete('PDF', true);
      } else {
        alert('PDF 내보내기에 실패했습니다: ' + result.error);
        if (onExportComplete) onExportComplete('PDF', false, result.error);
      }
    } catch (error) {
      alert('PDF 내보내기 중 오류가 발생했습니다.');
      if (onExportComplete) onExportComplete('PDF', false, error.message);
    }
  };

  const handleExportCSV = () => {
    try {
      if (onExportStart) onExportStart('CSV');
      
      const fileName = chartTitle.replace(/\s+/g, '_');
      // reportInfo가 있으면 csvData가 이미 reportInfo를 포함하고 있음
      // 없으면 일반 CSV 내보내기
      const result = exportToCSV(csvData, fileName);
      
      if (result.success) {
        setShowDropdown(false);
        if (onExportComplete) onExportComplete('CSV', true);
      } else {
        alert('CSV 내보내기에 실패했습니다: ' + result.error);
        if (onExportComplete) onExportComplete('CSV', false, result.error);
      }
    } catch (error) {
      alert('CSV 내보내기 중 오류가 발생했습니다.');
      if (onExportComplete) onExportComplete('CSV', false, error.message);
    }
  };

  return (
    <div className={ss.export_container}>
      <button 
        className={ss.export_button}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FontAwesomeIcon icon={faDownload} />
        {buttonText}
        <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '0.7rem' }} />
      </button>
      <div className={`${ss.export_dropdown} ${showDropdown ? ss.show : ''}`}>
        {hasChart && (
          <button 
            className={ss.export_option}
            onClick={handleExportPDF}
          >
            <FontAwesomeIcon icon={faFilePdf} style={{ color: '#e74c3c' }} />
            PDF로 내보내기
          </button>
        )}
        <button 
          className={ss.export_option}
          onClick={handleExportCSV}
        >
          <FontAwesomeIcon icon={faFileExcel} style={{ color: '#27ae60' }} />
          CSV로 내보내기
        </button>
      </div>
    </div>
  );
};

export default ExportButton; 