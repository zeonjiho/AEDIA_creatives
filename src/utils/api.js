import axios from "axios";
import baseURL from "./baseURL";
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
    baseURL: baseURL
})

// 자동 로그아웃 관련 상태
let sessionCheckInterval = null;
let isSessionChecking = false;
let isInitialSessionChecked = false; // 초기 세션 체크 완료 여부

// 요청 인터셉터 - 활동 시간 업데이트
api.interceptors.request.use(
    async (config) => {
        // 로그인, 회원가입 등 인증이 필요없는 요청은 제외
        const authExcludedPaths = ['/login', '/signup', '/slack/code', '/slack/code/verify', '/update-last-activity', '/check-session'];
        const isExcluded = authExcludedPaths.some(path => config.url.includes(path));
        
        if (!isExcluded) {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const decoded = jwtDecode(token);
                    const userId = decoded.userId;
                    
                    // 초기 세션 체크가 완료된 경우에만 활동 시간 업데이트
                    if (isInitialSessionChecked) {
                        // 활동 시간 업데이트 (백그라운드에서 실행)
                        api.post('/update-last-activity', { userId }).catch(err => {
                            console.warn('활동 시간 업데이트 실패:', err);
                        });
                    }
                }
            } catch (error) {
                console.warn('토큰 디코딩 실패:', error);
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 세션 유효성 체크
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // 401 에러 시 자동 로그아웃 처리
        if (error.response?.status === 401) {
            handleAutoLogout('인증이 만료되었습니다.');
        }
        return Promise.reject(error);
    }
);

// 자동 로그아웃 처리 함수
const handleAutoLogout = (message) => {
    // 중복 실행 방지
    if (isSessionChecking) return;
    isSessionChecking = true;
    
    // 세션 체크 인터벌 정리
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        sessionCheckInterval = null;
    }
    
    // 초기 세션 체크 상태 리셋
    isInitialSessionChecked = false;
    
    // 로컬 스토리지 정리
    localStorage.removeItem('token');
    
    // 로그인 페이지로 리다이렉트
    if (window.location.pathname !== '/login') {
        alert(message || '자동 로그아웃되었습니다.');
        window.location.href = '/login';
    }
    
    isSessionChecking = false;
};

// 초기 세션 체크 (페이지 진입 시)
export const checkInitialSession = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        const decoded = jwtDecode(token);
        const userId = decoded.userId;
        
        const response = await api.get(`/check-session/${userId}`);
        
        if (!response.data.isValid) {
            handleAutoLogout(response.data.message);
            return false;
        }
        
        // 세션이 유효한 경우 초기 세션 체크 완료 표시
        isInitialSessionChecked = true;
        return true;
        
    } catch (error) {
        console.warn('초기 세션 체크 실패:', error);
        if (error.response?.status === 401 || error.response?.status === 404) {
            handleAutoLogout('세션 검증에 실패했습니다.');
        }
        return false;
    }
};

// 세션 유효성 주기적 체크 시작
export const startSessionCheck = () => {
    // 기존 인터벌 정리
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
    }
    
    // 5분마다 세션 체크 (300,000ms)
    sessionCheckInterval = setInterval(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const decoded = jwtDecode(token);
            const userId = decoded.userId;
            
            const response = await api.get(`/check-session/${userId}`);
            
            if (!response.data.isValid) {
                handleAutoLogout(response.data.message);
            }
        } catch (error) {
            console.warn('세션 체크 실패:', error);
            // 에러 발생 시에도 로그아웃 처리
            if (error.response?.status === 401 || error.response?.status === 404) {
                handleAutoLogout('세션 검증에 실패했습니다.');
            }
        }
    }, 300000); // 5분
    // }, 5000); // 5초
};

// 세션 체크 중지
export const stopSessionCheck = () => {
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        sessionCheckInterval = null;
    }
    isInitialSessionChecked = false;
};

export default api;