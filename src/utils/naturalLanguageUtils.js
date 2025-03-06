/**
 * 자연어 처리 유틸리티 함수
 * 자연어로 입력받아 처리하는 유틸리티 함수를 만듭니다.
 */

/**
 * 자연어로 입력된 할 일 텍스트를 분석하여 할 일 내용과 날짜/시간 정보를 추출합니다.
 * @param {string} text - 자연어로 입력된 할 일 텍스트
 * @returns {Object} - { text: 할 일 내용, dueDate: 날짜, dueTime: 시간 }
 */
export const parseNaturalLanguageTodo = (text) => {
  if (!text || !text.trim()) {
    return { text: '', dueDate: null, dueTime: null };
  }

  // 결과 객체 초기화
  const result = {
    text: text.trim(),
    dueDate: null,
    dueTime: null
  };

  // 날짜 관련 키워드
  const dateKeywords = {
    '오늘': 0,
    '내일': 1,
    '모레': 2,
    '다음주': 7,
    '다음 주': 7,
    '이번주': 0,
    '이번 주': 0,
    '이번주 금요일': getNextDayOfWeek(5),
    '이번주 목요일': getNextDayOfWeek(4),
    '이번주 수요일': getNextDayOfWeek(3),
    '이번주 화요일': getNextDayOfWeek(2),
    '이번주 월요일': getNextDayOfWeek(1),
    '이번주 일요일': getNextDayOfWeek(0),
    '이번주 토요일': getNextDayOfWeek(6),
    '다음주 금요일': getNextDayOfWeek(5, 7),
    '다음주 목요일': getNextDayOfWeek(4, 7),
    '다음주 수요일': getNextDayOfWeek(3, 7),
    '다음주 화요일': getNextDayOfWeek(2, 7),
    '다음주 월요일': getNextDayOfWeek(1, 7),
    '다음주 일요일': getNextDayOfWeek(0, 7),
    '다음주 토요일': getNextDayOfWeek(6, 7),
    '월요일': getNextDayOfWeek(1),
    '화요일': getNextDayOfWeek(2),
    '수요일': getNextDayOfWeek(3),
    '목요일': getNextDayOfWeek(4),
    '금요일': getNextDayOfWeek(5),
    '토요일': getNextDayOfWeek(6),
    '일요일': getNextDayOfWeek(0)
  };

  // 시간 패턴 (예: 오전 9시, 오후 3시, 9시, 15시, 3시 30분 등)
  const timePatterns = [
    { regex: /오전\s*(\d{1,2})시\s*(\d{1,2})?분?/, formatter: (h, m) => ({ hour: parseInt(h), minute: m ? parseInt(m) : 0 }) },
    { regex: /오후\s*(\d{1,2})시\s*(\d{1,2})?분?/, formatter: (h, m) => ({ hour: parseInt(h) + 12, minute: m ? parseInt(m) : 0 }) },
    { regex: /(\d{1,2})시\s*(\d{1,2})?분?/, formatter: (h, m) => {
      const hour = parseInt(h);
      return { 
        hour: hour < 12 && text.includes('오후') ? hour + 12 : hour, 
        minute: m ? parseInt(m) : 0 
      };
    }},
    { regex: /(\d{1,2}):(\d{1,2})/, formatter: (h, m) => ({ hour: parseInt(h), minute: parseInt(m) }) }
  ];

  // 날짜 추출
  for (const [keyword, daysToAdd] of Object.entries(dateKeywords)) {
    if (text.includes(keyword)) {
      const date = new Date();
      if (typeof daysToAdd === 'function') {
        // 함수인 경우 (요일 계산)
        result.dueDate = daysToAdd();
      } else {
        // 숫자인 경우 (일수 추가)
        date.setDate(date.getDate() + daysToAdd);
        result.dueDate = date.toISOString().split('T')[0];
      }
      
      // 날짜 키워드 제거
      result.text = result.text.replace(keyword, '').trim();
      break;
    }
  }

  // 날짜 패턴 (예: 2023-12-31, 2023/12/31, 12/31, 12월 31일 등)
  const datePatterns = [
    { 
      regex: /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, 
      formatter: (y, m, d) => `${y}-${padZero(m)}-${padZero(d)}` 
    },
    { 
      regex: /(\d{1,2})[-\/](\d{1,2})/, 
      formatter: (m, d) => {
        const year = new Date().getFullYear();
        return `${year}-${padZero(m)}-${padZero(d)}`;
      } 
    },
    { 
      regex: /(\d{1,2})월\s*(\d{1,2})일/, 
      formatter: (m, d) => {
        const year = new Date().getFullYear();
        return `${year}-${padZero(m)}-${padZero(d)}`;
      } 
    }
  ];

  // 날짜 패턴 추출
  if (!result.dueDate) {
    for (const pattern of datePatterns) {
      const match = result.text.match(pattern.regex);
      if (match) {
        result.dueDate = pattern.formatter(...match.slice(1));
        // 날짜 패턴 제거
        result.text = result.text.replace(match[0], '').trim();
        break;
      }
    }
  }

  // 시간 추출
  for (const pattern of timePatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const { hour, minute } = pattern.formatter(...match.slice(1));
      result.dueTime = `${padZero(hour)}:${padZero(minute)}`;
      
      // 시간 패턴 제거
      result.text = result.text.replace(match[0], '').trim();
      break;
    }
  }

  // 기본 날짜 설정 (지정되지 않은 경우 오늘)
  if (!result.dueDate) {
    result.dueDate = new Date().toISOString().split('T')[0];
  }

  return result;
};

/**
 * 다음 특정 요일의 날짜를 계산합니다.
 * @param {number} dayOfWeek - 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)
 * @param {number} addWeeks - 추가할 주 수 (기본값: 0)
 * @returns {function} - 날짜를 반환하는 함수
 */
function getNextDayOfWeek(dayOfWeek, addWeeks = 0) {
  return () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    let daysToAdd = dayOfWeek - currentDayOfWeek;
    
    if (daysToAdd <= 0 && addWeeks === 0) {
      daysToAdd += 7; // 이번 주의 해당 요일이 이미 지났으면 다음 주로
    } else {
      daysToAdd += (addWeeks * 7);
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate.toISOString().split('T')[0];
  };
}

/**
 * 숫자를 2자리 문자열로 변환 (앞에 0 추가)
 * @param {number} num - 변환할 숫자
 * @returns {string} - 2자리 문자열
 */
function padZero(num) {
  return num.toString().padStart(2, '0');
}

/**
 * 자연어로 입력된 할 일을 분석하여 사용자 친화적인 메시지로 변환합니다.
 * @param {Object} parsedTodo - parseNaturalLanguageTodo 함수의 결과
 * @returns {string} - 사용자 친화적인 메시지
 */
export const formatParsedTodo = (parsedTodo) => {
  if (!parsedTodo || !parsedTodo.text) {
    return '';
  }

  let message = `"${parsedTodo.text}"`;

  if (parsedTodo.dueDate) {
    const date = new Date(parsedTodo.dueDate);
    const formattedDate = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    message += ` (${formattedDate}`;
    
    if (parsedTodo.dueTime) {
      const [hour, minute] = parsedTodo.dueTime.split(':');
      const timeStr = `${hour}시 ${minute !== '00' ? minute + '분' : ''}`;
      message += ` ${timeStr}`;
    }
    
    message += ')';
  }

  return message;
}; 