import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { createWorker } from 'tesseract.js';

// Tesseract.js v6 CDN 경로 설정
window.Tesseract = {
  workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v6.0.0/dist/worker.min.js',
  langPath: 'https://tessdata.projectnaptha.com/4.0.0'
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// 앱 시작 시 Tesseract 초기 인스턴스 미리 생성 (성능 향상)
const preloadTesseract = async () => {
  try {
    console.log('Tesseract.js v6 사전 로드 시작...');

    // Tesseract.js v6 API - 직접 언어 지정
    const worker = await createWorker('eng');
    
    // 테스트 인식
    console.log('초기 워커 테스트 중...');
    await worker.recognize('data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
    
    // 워커 종료
    await worker.terminate();

    console.log('Tesseract.js 사전 로드 완료');
  } catch (error) {
    console.error('Tesseract.js 사전 로드 실패:', error);
    console.error('오류 세부 정보:', error.stack || error);
  }
};

// 사용자 상호작용 감지 후 지연 로드
document.addEventListener('click', function initTesseract() {
  document.removeEventListener('click', initTesseract);
  console.log('사용자 상호작용 감지됨, Tesseract 초기화 시작...');
  
  // 지연 로드 (브라우저 렌더링 우선)
  setTimeout(() => {
    preloadTesseract();
  }, 2000);
}, { once: true });

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
