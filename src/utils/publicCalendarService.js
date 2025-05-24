/**
 * 공개 구글 캘린더 서비스
 * API 키를 사용하여 공개 캘린더의 이벤트를 가져옵니다.
 */
class PublicCalendarServiceClass {
    constructor() {
        this.API_KEY = process.env.REACT_APP_GOOGLE_API_KEY
        this.CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID
        this.BASE_URL = 'https://www.googleapis.com/calendar/v3'
        this.isEnabled = !!this.API_KEY && !!this.CALENDAR_ID
    }

    /**
     * 공개 캘린더에서 이벤트 목록을 가져옵니다
     * @param {Date} startDate - 조회 시작 날짜
     * @param {Date} endDate - 조회 종료 날짜
     * @returns {Promise<Array>} 이벤트 목록
     */
    async getEvents(startDate = null, endDate = null) {
        if (!this.isEnabled) {
            console.warn('구글 캘린더 API 키 또는 캘린더 ID가 설정되지 않았습니다. 샘플 데이터를 반환합니다.')
            return this.getMockEvents()
        }

        try {
            // 기본 날짜 범위 설정 (현재 월)
            if (!startDate) {
                startDate = new Date()
                startDate.setDate(1)
                startDate.setHours(0, 0, 0, 0)
            }

            if (!endDate) {
                endDate = new Date(startDate)
                endDate.setMonth(endDate.getMonth() + 1)
                endDate.setDate(0)
                endDate.setHours(23, 59, 59, 999)
            }

            const params = new URLSearchParams({
                key: this.API_KEY,
                timeMin: startDate.toISOString(),
                timeMax: endDate.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 100
            })

            const url = `${this.BASE_URL}/calendars/${encodeURIComponent(this.CALENDAR_ID)}/events?${params}`

            console.log('구글 캘린더 API 호출:', url)

            const response = await fetch(url)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('구글 캘린더 API 오류:', response.status, errorText)
                throw new Error(`API 오류: ${response.status}`)
            }

            const data = await response.json()

            if (!data.items) {
                console.warn('이벤트 데이터가 없습니다.')
                return []
            }

            // 구글 캘린더 이벤트를 react-big-calendar 형식으로 변환
            const events = data.items.map(item => this.transformGoogleEvent(item))

            console.log(`구글 캘린더에서 ${events.length}개의 이벤트를 가져왔습니다.`)

            return events

        } catch (error) {
            console.error('구글 캘린더 이벤트 가져오기 실패:', error)
                // 오류 발생 시 샘플 데이터 반환
            return this.getMockEvents()
        }
    }

    /**
     * 구글 캘린더 이벤트를 react-big-calendar 형식으로 변환
     * @param {Object} googleEvent - 구글 캘린더 이벤트
     * @returns {Object} 변환된 이벤트
     */
    transformGoogleEvent(googleEvent) {
        let start, end, allDay = false

        // 종일 이벤트 처리
        if (googleEvent.start && googleEvent.start.date) {
            start = new Date(googleEvent.start.date)
            end = new Date((googleEvent.end && googleEvent.end.date) || googleEvent.start.date)
            allDay = true
        } else {
            // 시간이 있는 이벤트 처리
            start = new Date((googleEvent.start && googleEvent.start.dateTime) || (googleEvent.start && googleEvent.start.date))
            end = new Date((googleEvent.end && googleEvent.end.dateTime) || (googleEvent.end && googleEvent.end.date) || start)
        }

        return {
            id: googleEvent.id,
            title: this.addEventIcon(googleEvent.summary || '제목 없음'),
            start,
            end,
            allDay,
            location: googleEvent.location,
            description: googleEvent.description,
            attendees: googleEvent.attendees,
            type: this.getEventType(googleEvent),
            source: 'google'
        }
    }

    /**
     * 이벤트 제목에 적절한 아이콘을 추가합니다
     * @param {String} title - 원본 제목
     * @returns {String} 아이콘이 추가된 제목
     */
    addEventIcon(title) {
        const titleLower = title.toLowerCase()

        if (titleLower.includes('회의') || titleLower.includes('meeting')) {
            return `🏢 ${title}`
        } else if (titleLower.includes('점심') || titleLower.includes('lunch')) {
            return `🍽️ ${title}`
        } else if (titleLower.includes('휴가') || titleLower.includes('vacation')) {
            return `🏖️ ${title}`
        } else if (titleLower.includes('생일') || titleLower.includes('birthday')) {
            return `🎂 ${title}`
        } else if (titleLower.includes('프로젝트') || titleLower.includes('project')) {
            return `📋 ${title}`
        } else if (titleLower.includes('클라이언트') || titleLower.includes('client')) {
            return `🤝 ${title}`
        } else if (titleLower.includes('워크샵') || titleLower.includes('workshop')) {
            return `🎯 ${title}`
        } else if (titleLower.includes('발표') || titleLower.includes('presentation')) {
            return `📊 ${title}`
        }

        return `📅 ${title}`
    }

    /**
     * 이벤트 타입을 결정합니다
     * @param {Object} googleEvent - 구글 캘린더 이벤트
     * @returns {String} 이벤트 타입
     */
    getEventType(googleEvent) {
        const title = (googleEvent.summary || '').toLowerCase()

        if (title.includes('회의') || title.includes('meeting')) {
            return 'meeting'
        } else if (title.includes('마감') || title.includes('deadline')) {
            return 'deadline'
        } else if (title.includes('휴일') || title.includes('holiday')) {
            return 'holiday'
        } else if (title.includes('클라이언트') || title.includes('client')) {
            return 'client'
        } else if (title.includes('개인') || title.includes('personal')) {
            return 'personal'
        }

        return 'default'
    }

    /**
     * API가 비활성화된 경우 사용할 샘플 이벤트
     * @returns {Array} 샘플 이벤트 목록
     */
    getMockEvents() {
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()

        return [{
                id: 'mock-1',
                title: '🏢 팀 스탠드업 미팅',
                start: new Date(currentYear, currentMonth, 15, 9, 0),
                end: new Date(currentYear, currentMonth, 15, 9, 30),
                allDay: false,
                type: 'meeting',
                source: 'mock'
            },
            {
                id: 'mock-2',
                title: '📋 프로젝트 마감일',
                start: new Date(currentYear, currentMonth, 20),
                end: new Date(currentYear, currentMonth, 20),
                allDay: true,
                type: 'deadline',
                source: 'mock'
            },
            {
                id: 'mock-3',
                title: '🤝 클라이언트 프레젠테이션',
                start: new Date(currentYear, currentMonth, 18, 14, 0),
                end: new Date(currentYear, currentMonth, 18, 16, 0),
                allDay: false,
                type: 'client',
                source: 'mock'
            },
            {
                id: 'mock-4',
                title: '🎯 디자인 워크샵',
                start: new Date(currentYear, currentMonth, 22, 10, 0),
                end: new Date(currentYear, currentMonth, 22, 17, 0),
                allDay: false,
                type: 'meeting',
                source: 'mock'
            },
            {
                id: 'mock-5',
                title: '🍽️ 팀 점심식사',
                start: new Date(currentYear, currentMonth, 25, 12, 0),
                end: new Date(currentYear, currentMonth, 25, 13, 30),
                allDay: false,
                type: 'personal',
                source: 'mock'
            }
        ]
    }

    /**
     * 서비스 상태 확인
     * @returns {Object} 서비스 상태 정보
     */
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            hasApiKey: !!this.API_KEY,
            hasCalendarId: !!this.CALENDAR_ID,
            calendarId: this.CALENDAR_ID,
            message: this.isEnabled ?
                '구글 캘린더 연결됨' : 'API 키 또는 캘린더 ID가 설정되지 않음'
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const PublicCalendarService = new PublicCalendarServiceClass()

export default PublicCalendarService