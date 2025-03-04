## 업데이트 필요(예정) 항목
- server.js /user/login 라우트에서 로그인 성공 시 토큰 발급 로직 추가
- Login.jsx에서 로그인 성공 시 토큰 저장 로직 추가
- AppLayout에서 autoLoginAndLogout 함수 기능 완성 후 적용
- Signup.jsx 이메일/userName 실시간 중복 체크 로직 추가 + 엔터키 바인딩
- 비로그인 상태에서 마이페이지 등 로그인 필요한 페이지 접속 시 튕겨내기
- DescriptionEditor.jsx 마크다운 툴팁 자연스럽게 수정
- DescriptionEditor.jsx 마크다운 디자인 편집기 자체에서 렌더링 지원
- 마크다운 활용하여 노션처럼 포스트도 작성 가능하도록 함
- 아이템 타입 추가 (이미지, 텍스트, 링크, 영상, 파일)
- 아이템 타입 별 디자인 커스터마이징 가능하도록 함
- hyperium 카드 드래그 기능
- AI 탭 제작



## 기타 메모

### autoLoginAndLogout 관련
현재 AppLayout의 autoLoginAndLogout 함수는 AppLayout 컴포넌트 렌더링 및 pathname 변경 시 실행되며, 토큰 확인 후 마지막 활동일로부터 7일이 경과되었는지를 기준으로
자동 로그아웃 로직 실행. 토큰이 있으며 7일 이내에 재로그인으로 확인될 경우 서버에 요청 보내서 status 정상인지 검증하고 lastVisit 업데이트 하도록 함.

AppLayout에서 autoLoginAndLogout 함수로 인한 성능 저하가 의심될 경우 로직 수정 필요.

server.js에서도 /user/validation-user-status-and-update-last-visit 라우트 성능 저하 시 로직 수정 필요.


## 빌드 시 체크 사항
- baseURL.js에서 baseURL 로컬/서버 설정 확인
- server.js에서 express listen 함수 로컬/서버 설정 확인
- (추가 시 기재)



## DescriptionEditor.jsx Test 텍스트
 # Heading 1
## Heading 2
### Heading 3
basic **bold** *italic* `code` [link](url)
* list
- list 2