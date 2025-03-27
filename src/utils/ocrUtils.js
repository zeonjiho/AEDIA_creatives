/**
 * OCR(Optical Character Recognition) 관련 유틸리티 함수
 */
import { createWorker } from 'tesseract.js';

// 전역 워커 인스턴스
let worker = null;
let isWorkerReady = false;

// 로그 처리 함수 - Worker 외부에서 실행됨
const logProgress = (progress) => {
  if (progress.status === 'recognizing text') {
    console.log(`인식 진행률: ${(progress.progress * 100).toFixed(1)}%`);
  } else {
    console.log(`상태: ${progress.status}, 진행률: ${(progress.progress * 100).toFixed(1)}%`);
  }
};

/**
 * Tesseract 워커를 초기화합니다.
 * 
 * @returns {Promise<object>} - 초기화된 워커 객체
 */
const initWorker = async () => {
  try {
    // 워커가 이미 있으면 반환
    if (worker) {
      return worker;
    }
    
    console.log('새 Tesseract 워커 초기화 중...');
    
    // Tesseract.js v6 스타일로 워커 생성
    // 언어 데이터 'kor+eng'를 직접 createWorker에 전달
    worker = await createWorker('kor+eng');
    
    console.log('Tesseract 워커 준비 완료');
    return worker;
  } catch (error) {
    console.error('Tesseract 워커 초기화 실패:', error);
    // 실패 시 상태 초기화
    worker = null;
    throw error;
  }
};

/**
 * 워커 정리 함수
 */
export const terminateWorker = async () => {
  if (worker) {
    try {
      await worker.terminate();
      console.log('Tesseract 워커 정리 완료');
    } catch (e) {
      console.error('워커 종료 중 오류:', e);
    }
    worker = null;
  }
};

/**
 * 이미지에서 영수증 데이터를 추출합니다.
 * 
 * @param {File} imageFile - 영수증 이미지 파일
 * @returns {Promise<Object>} - 추출된 영수증 데이터
 */
export const extractReceiptData = async (imageFile) => {
  try {
    // 이미지 파일을 데이터 URL로 변환
    const imageDataUrl = await fileToDataUrl(imageFile);
    
    console.log('OCR 처리 시작...');
    
    // 워커 초기화
    const workerInstance = await initWorker();
    
    // 이미지에서 텍스트 인식
    console.log('이미지 인식 중...');
    const result = await workerInstance.recognize(imageDataUrl);
    const text = result.data.text;
    
    console.log('텍스트 인식 완료. 길이:', text.length);
    console.log('인식된 텍스트 샘플:', text.slice(0, 100) + '...');
    
    // 인식된 텍스트에서 영수증 데이터 추출
    const extractedData = parseReceiptText(text);
    
    return extractedData;
  } catch (error) {
    console.error('영수증 처리 중 오류 발생:', error);
    throw new Error('영수증 인식에 실패했습니다: ' + error.message);
  }
};

/**
 * 파일을 DataURL로 변환합니다.
 * 
 * @param {File} file - 변환할 파일
 * @returns {Promise<string>} - 데이터 URL
 */
const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 인식된 텍스트에서 영수증 데이터를 추출합니다.
 * 
 * @param {string} text - OCR로 인식된 텍스트
 * @returns {Object} - 추출된 영수증 데이터
 */
const parseReceiptText = (text) => {
  console.log('영수증 텍스트 분석 시작');
  console.log('원본 텍스트:', text);
  
  // 텍스트 정규화: 공백 및 줄바꿈 정리
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  console.log('분석할 텍스트 라인 수:', lines.length);
  if (lines.length > 0) {
    console.log('첫 번째 라인:', lines[0]);
  }
  
  // 초기 반환 데이터
  const result = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'MEAL',  // 기본값
    type: 'MEAL',      // 기본값
    paymentMethod: 'CORPORATE_CARD',  // 기본값
    description: '',
  };
  
  // 합계 금액 추출 (한국 영수증에서는 보통 '합계', '총액', '총 금액', '결제금액' 등으로 표시)
  let totalAmount = '';
  const totalKeywords = ['합계', '총액', '총 금액', '결제금액', '총 합계', '최종금액'];
  
  for (const line of lines) {
    // 숫자만 추출하는 정규식
    const numbers = line.match(/[\d,]+/g);
    
    // 합계 키워드 확인
    for (const keyword of totalKeywords) {
      if (line.includes(keyword)) {
        console.log('합계 라인 발견:', line);
        // 이 라인에서 숫자만 추출
        if (numbers && numbers.length > 0) {
          // 가장 큰 숫자가 합계일 가능성이 높음
          const amount = Math.max(...numbers.map(n => parseInt(n.replace(/,/g, ''), 10)));
          totalAmount = amount.toString();
          console.log('합계 금액 추출:', totalAmount);
          break;
        }
      }
    }
    
    // 합계를 찾았으면 반복 중단
    if (totalAmount) break;
  }
  
  // 합계를 못 찾았다면 마지막 숫자들 중 가장 큰 값을 찾기
  if (!totalAmount) {
    let maxNumber = 0;
    for (const line of lines) {
      const numbers = line.match(/[\d,]+/g);
      if (numbers) {
        for (const num of numbers) {
          const parsedNum = parseInt(num.replace(/,/g, ''), 10);
          if (parsedNum > maxNumber) {
            maxNumber = parsedNum;
            totalAmount = maxNumber.toString();
          }
        }
      }
    }
    if (totalAmount) {
      console.log('최대 금액으로 대체:', totalAmount);
    }
  }
  
  // 상호명 추출 (보통 영수증 상단에 위치)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    // 짧은 라인이나 숫자/기호로만 구성된 라인은 제외
    if (line.length > 2 && !/^[\d\s,.:\-\*\/\\]+$/.test(line)) {
      result.title = line;
      console.log('상호명 추출:', result.title);
      break;
    }
  }
  
  // 상호명이 없으면 첫 번째 의미 있는 텍스트 사용
  if (!result.title) {
    for (const line of lines) {
      if (line.length > 2 && !/^[\d\s,.:\-\*\/\\]+$/.test(line)) {
        result.title = line;
        console.log('대체 상호명 추출:', result.title);
        break;
      }
    }
  }
  
  // 날짜 추출
  const datePatterns = [
    /(\d{4})[-\.\/\s](\d{1,2})[-\.\/\s](\d{1,2})/,  // yyyy-mm-dd
    /(\d{1,2})[-\.\/\s](\d{1,2})[-\.\/\s](\d{4})/,  // dd-mm-yyyy
    /(\d{2})[\.\s](\d{2})[\.\s](\d{2,4})/           // yy.mm.dd 또는 mm.dd.yy
  ];
  
  for (const line of lines) {
    let dateFound = false;
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        let year, month, day;
        
        if (pattern === datePatterns[0]) {
          [, year, month, day] = match;
        } else if (pattern === datePatterns[1]) {
          [, day, month, year] = match;
        } else {
          // yy.mm.dd 형식이라 가정
          [, year, month, day] = match;
          if (year.length === 2) {
            year = '20' + year; // 20xx 년도 가정
          }
        }
        
        // 월과 일이 한 자리 수인 경우 앞에 0 추가
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');
        
        result.date = `${year}-${month}-${day}`;
        console.log('날짜 추출:', result.date);
        dateFound = true;
        break;
      }
    }
    if (dateFound) break;
  }
  
  // 결제 수단 추출
  const paymentKeywords = {
    'CORPORATE_CARD': ['법인', '기업', '회사', 'corporate'],
    'PERSONAL_PAYMENT': ['개인', '신용', '체크', '카드', 'personal', 'credit'],
    'CASH': ['현금', '캐쉬', 'cash'],
    'BANK_TRANSFER': ['계좌', '이체', '송금', 'transfer', 'bank']
  };
  
  for (const [method, keywords] of Object.entries(paymentKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.toLowerCase().includes(keyword.toLowerCase())) {
        result.paymentMethod = method;
        console.log('결제 수단 추출:', result.paymentMethod);
        break;
      }
    }
  }
  
  // 금액 설정
  result.amount = totalAmount;
  
  // 카테고리 추출
  const categoryKeywords = {
    'MEAL': ['식당', '레스토랑', '카페', '음료', '식사', '식비', '커피', '음식', '배달', '까페', '베이커리', '빵집'],
    'TRANSPORTATION': ['택시', '교통', '운송', '기차', '버스', '지하철', '철도'],
    'ACCOMMODATION': ['숙박', '호텔', '모텔', '리조트', '게스트']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.toLowerCase().includes(keyword.toLowerCase())) {
        result.category = category;
        console.log('카테고리 추출:', result.category);
        break;
      }
    }
  }
  
  // 특수한 경우 처리 (식비 항목들)
  const foodItems = ['떡볶이', '치킨', '피자', '햄버거', '아메리카노', '라떼', '스타벅스', '메뉴', '주문'];
  for (const item of foodItems) {
    if (normalizedText.toLowerCase().includes(item.toLowerCase())) {
      result.category = 'MEAL';
      result.type = 'MEAL';
      console.log('음식 항목 발견:', item);
      break;
    }
  }
  
  // 제목이 없거나 너무 짧을 경우 기본값 설정
  if (!result.title || result.title.length < 2) {
    result.title = result.category === 'MEAL' ? '식비 영수증' : 
                   result.category === 'TRANSPORTATION' ? '교통비 영수증' : 
                   '경비 영수증';
  }
  
  // 설명 필드 설정
  result.description = `${result.title} 관련 비용`;
  
  console.log('영수증 데이터 분석 완료:', result);
  return result;
};

/**
 * 모바일 카메라에 접근하여 이미지를 촬영합니다.
 * 
 * @returns {Promise<File|null>} - 촬영된 이미지 파일 또는 취소 시 null
 */
export const takePicture = async () => {
  return new Promise((resolve, reject) => {
    try {
      // 카메라 접근 권한 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('카메라에 접근할 수 없습니다. 브라우저가 지원하지 않거나 권한이 없습니다.');
      }

      // 카메라 UI 생성
      const videoContainer = document.createElement('div');
      videoContainer.style.position = 'fixed';
      videoContainer.style.top = '0';
      videoContainer.style.left = '0';
      videoContainer.style.width = '100%';
      videoContainer.style.height = '100%';
      videoContainer.style.backgroundColor = 'black';
      videoContainer.style.zIndex = '9999';
      videoContainer.style.display = 'flex';
      videoContainer.style.flexDirection = 'column';
      
      // 비디오 요소 생성
      const video = document.createElement('video');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.style.width = '100%';
      video.style.height = 'calc(100% - 70px)';
      video.style.objectFit = 'cover';
      
      // 버튼 컨테이너
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-around';
      buttonContainer.style.padding = '10px';
      buttonContainer.style.backgroundColor = '#111';
      buttonContainer.style.height = '70px';
      
      // 촬영 버튼
      const captureButton = document.createElement('button');
      captureButton.textContent = '촬영';
      captureButton.style.padding = '10px 20px';
      captureButton.style.backgroundColor = '#4285F4';
      captureButton.style.color = 'white';
      captureButton.style.border = 'none';
      captureButton.style.borderRadius = '4px';
      captureButton.style.fontSize = '16px';
      
      // 취소 버튼
      const cancelButton = document.createElement('button');
      cancelButton.textContent = '취소';
      cancelButton.style.padding = '10px 20px';
      cancelButton.style.backgroundColor = '#f5f5f5';
      cancelButton.style.color = '#333';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.fontSize = '16px';
      
      // 캔버스 요소 생성 (이미지 캡처용)
      const canvas = document.createElement('canvas');
      
      // UI 구성
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(captureButton);
      videoContainer.appendChild(video);
      videoContainer.appendChild(buttonContainer);
      document.body.appendChild(videoContainer);
      
      // 미디어 스트림 가져오기
      let stream;
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },  // 후면 카메라 사용
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      .then(_stream => {
        stream = _stream;
        video.srcObject = stream;
        
        // 취소 버튼 클릭 처리
        cancelButton.onclick = () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          document.body.removeChild(videoContainer);
          resolve(null);
        };
        
        // 촬영 버튼 클릭 처리
        captureButton.onclick = () => {
          // 비디오 크기에 맞게 캔버스 설정
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // 비디오 프레임을 캔버스에 그리기
          const context = canvas.getContext('2d');
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 스트림 중지
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          
          // UI 제거
          document.body.removeChild(videoContainer);
          
          // 캔버스의 이미지를 Blob으로 변환
          canvas.toBlob(blob => {
            if (blob) {
              // Blob을 File 객체로 변환
              const file = new File([blob], 'receipt-image.jpg', { type: 'image/jpeg' });
              resolve(file);
            } else {
              reject(new Error('이미지 캡처에 실패했습니다.'));
            }
          }, 'image/jpeg', 0.95);
        };
      })
      .catch(err => {
        if (document.body.contains(videoContainer)) {
          document.body.removeChild(videoContainer);
        }
        reject(new Error('카메라 접근에 실패했습니다: ' + err.message));
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 이미지 파일을 미리보기 URL로 변환합니다.
 * 
 * @param {File} file - 이미지 파일
 * @returns {string} - 미리보기 URL
 */
export const createImagePreview = (file) => {
  if (!file) return null;
  return URL.createObjectURL(file);
};

/**
 * 이미지 미리보기 URL을 해제합니다.
 * 
 * @param {string} url - 미리보기 URL
 */
export const revokeImagePreview = (url) => {
  if (url) URL.revokeObjectURL(url);
}; 