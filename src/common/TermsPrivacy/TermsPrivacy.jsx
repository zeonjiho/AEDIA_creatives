import React, { useState, useEffect } from 'react';
import ss from './TermsPrivacy.module.css';

const TermsPrivacy = ({ type, onClose }) => {
    const [language, setLanguage] = useState('en');
    const [isClosing, setIsClosing] = useState(false);
    
    useEffect(() => {
        // 모달이 열릴 때 body 스크롤 방지
        document.body.style.overflow = 'hidden';
        
        // 컴포넌트가 언마운트될 때 (모달이 닫힐 때) body 스크롤 복원
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300); // 애니메이션 지속 시간과 동일하게 설정
    };

    const getTitle = () => {
        if (type === 'terms') {
            return language === 'en' ? 'Terms of Service' : '이용약관';
        }
        return language === 'en' ? 'Privacy Policy' : '개인정보 처리방침';
    };

    return (
        <div className={`${ss.modal_overlay} ${isClosing ? ss.closing : ''}`} onClick={handleClose}>
            <div className={ss.modal_content} onClick={e => e.stopPropagation()}>
                <div className={ss.modal_header_fixed}>
                    <div className={ss.modal_header}>
                        <div className={ss.header_content}>
                            <h2>{getTitle()}</h2>
                            <div className={ss.language_selector}>
                                <button 
                                    className={`${ss.lang_btn} ${language === 'en' ? ss.active : ''}`}
                                    onClick={() => setLanguage('en')}
                                >
                                    EN
                                </button>
                                <button 
                                    className={`${ss.lang_btn} ${language === 'ko' ? ss.active : ''}`}
                                    onClick={() => setLanguage('ko')}
                                >
                                    KO
                                </button>
                            </div>
                        </div>
                        <button className={ss.modal_close} onClick={handleClose}>×</button>
                    </div>
                </div>
                <div className={ss.modal_body_wrapper}>
                    <div className={ss.modal_body}>
                        {type === 'terms' ? (
                            language === 'en' ? (
                                // English Terms of Service
                                <div>
                                    <h3>1. Service Introduction</h3>
                                    <p>HYPER is a platform where users can collect, share, and curate hyperlinks online. We provide a space where users can create and share their own digital archives. Users can gather and manage interesting websites, useful resources, and inspiring content in one place and share them with others.</p>

                                    <h3>2. Terms of Use</h3>
                                    <p>By using this service, you agree to the following:</p>
                                    <ul>
                                        <li>Respect copyright laws and intellectual property rights of collected links</li>
                                        <li>Maintain a respectful attitude to foster a healthy community culture</li>
                                        <li>Prohibit sharing illegal or harmful content and report such content when found</li>
                                        <li>Avoid actions that interfere with stable service operation</li>
                                        <li>Do not collect or share others' personal information without permission</li>
                                    </ul>

                                    <h3>3. Content Policy</h3>
                                    <p>HYPER allows sharing the following content:</p>
                                    <ul>
                                        <li>Useful website links (technical blogs, news sites, educational materials, etc.)</li>
                                        <li>Interesting articles or blog posts (trends, insights, analysis, etc.)</li>
                                        <li>Digital content that inspires (design, art, creations, etc.)</li>
                                        <li>Educational materials (lectures, tutorials, documents, etc.)</li>
                                        <li>Tools or services for productivity enhancement</li>
                                        <li>Reference materials or research results in specialized fields</li>
                                    </ul>

                                    <h3>4. Content Restriction</h3>
                                    <p>The following content is prohibited from sharing:</p>
                                    <ul>
                                        <li>Copyright infringement content</li>
                                        <li>Illegal or harmful content</li>
                                        <li>False information or misleading content</li>
                                        <li>Hateful speech or discriminatory content</li>
                                        <li>Spam or advertising content</li>
                                        <li>Content containing personal information</li>
                                    </ul>

                                    <h3>5. Service Use Rules</h3>
                                    <p>Please follow the following to effectively use the service:</p>
                                    <ul>
                                        <li>Use appropriate tags and categories for content classification</li>
                                        <li>Share content clearly and with a title</li>
                                        <li>Avoid sharing duplicate links</li>
                                        <li>Regular content updates and management</li>
                                        <li>Participate in constructive feedback and discussion</li>
                                    </ul>

                                    <h3>6. Limitation of Liability</h3>
                                    <p>HYPER is not liable for the following:</p>
                                    <ul>
                                        <li>Direct responsibility for content shared by users</li>
                                        <li>Availability or stability of external sites</li>
                                        <li>Disputes or conflicts between users</li>
                                        <li>Service interruptions or errors</li>
                                    </ul>
                                    <p>However, illegal or harmful content reported will be reviewed and addressed immediately.</p>
                                </div>
                            ) : (
                                // Korean Terms of Service
                                <div>
                                    <h3>1. 서비스 소개</h3>
                                    <p>HYPER는 사용자들이 온라인상의 하이퍼링크를 수집, 공유, 큐레이션할 수 있는 플랫폼입니다. 우리는 사용자들이 자신만의 디지털 아카이브를 만들고 공유할 수 있는 공간을 제공합니다.</p>

                                    <h3>2. 이용 약관</h3>
                                    <p>본 서비스를 이용함으로써, 사용자는 다음 사항에 동의하게 됩니다:</p>
                                    <ul>
                                        <li>수집된 링크의 저작권 및 관련 법률을 준수하며, 타인의 지적 재산권을 존중합니다</li>
                                        <li>건전한 커뮤니티 문화 조성을 위해 노력하며, 타인을 존중하는 태도를 유지합니다</li>
                                        <li>불법적이거나 유해한 콘텐츠의 공유를 금지하며, 이를 발견 시 신고합니다</li>
                                        <li>서비스의 안정적 운영을 방해하는 행위를 하지 않습니다</li>
                                        <li>타인의 개인정보를 무단으로 수집하거나 공유하지 않습니다</li>
                                    </ul>

                                    <h3>3. 콘텐츠 정책</h3>
                                    <p>HYPER에서는 다음과 같은 콘텐츠를 공유할 수 있습니다:</p>
                                    <ul>
                                        <li>유용한 웹사이트 링크 (기술 블로그, 뉴스 사이트, 교육 자료 등)</li>
                                        <li>흥미로운 아티클이나 블로그 포스트 (트렌드, 인사이트, 분석 등)</li>
                                        <li>영감을 주는 디지털 콘텐츠 (디자인, 아트, 창작물 등)</li>
                                        <li>교육적 가치가 있는 자료 (강의, 튜토리얼, 문서 등)</li>
                                        <li>생산성 향상을 위한 도구나 서비스</li>
                                        <li>전문 분야의 참고 자료나 연구 결과</li>
                                    </ul>

                                    <h3>4. 콘텐츠 제한 사항</h3>
                                    <p>다음과 같은 콘텐츠는 공유가 제한됩니다:</p>
                                    <ul>
                                        <li>저작권 침해 콘텐츠</li>
                                        <li>불법적이거나 유해한 콘텐츠</li>
                                        <li>허위 정보나 기만적인 콘텐츠</li>
                                        <li>혐오 발언이나 차별적 내용</li>
                                        <li>스팸이나 광고성 콘텐츠</li>
                                        <li>타인의 개인정보가 포함된 콘텐츠</li>
                                    </ul>

                                    <h3>5. 서비스 이용 규칙</h3>
                                    <p>효과적인 서비스 이용을 위해 다음 사항을 준수해 주시기 바랍니다:</p>
                                    <ul>
                                        <li>적절한 태그와 카테고리 사용으로 콘텐츠 분류</li>
                                        <li>명확한 설명과 제목으로 콘텐츠 공유</li>
                                        <li>중복된 링크 공유 자제</li>
                                        <li>정기적인 콘텐츠 업데이트 및 관리</li>
                                        <li>건설적인 피드백과 토론 참여</li>
                                    </ul>

                                    <h3>6. 책임 제한</h3>
                                    <p>HYPER는 다음과 같은 사항에 대해 책임을 제한합니다:</p>
                                    <ul>
                                        <li>사용자가 공유한 외부 링크의 내용에 대한 직접적인 책임</li>
                                        <li>외부 사이트의 가용성이나 안정성</li>
                                        <li>사용자 간 발생하는 분쟁이나 갈등</li>
                                        <li>불가항력적인 서비스 중단이나 오류</li>
                                    </ul>
                                    <p>단, 신고된 불법 또는 유해 콘텐츠는 즉시 검토 후 조치됩니다.</p>
                                </div>
                            )
                        ) : (
                            language === 'en' ? (
                                // English Privacy Policy
                                <div>
                                    <h3>1. Information We Collect</h3>
                                    <ul className={ss.grid_list}>
                                        <li>Essential Account Information
                                            <ul>
                                                <li>Email address</li>
                                                <li>Username</li>
                                                <li>Password (encrypted)</li>
                                            </ul>
                                        </li>
                                        <li>Optional Profile Information
                                            <ul>
                                                <li>Profile image</li>
                                                <li>Bio</li>
                                                <li>Areas of interest</li>
                                                <li>Social media links</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>2. Information Use Purpose</h3>
                                    <p>Collected information is used for the following purposes:</p>
                                    <ul>
                                        <li>Service provision and improvement
                                            <ul>
                                                <li>Account creation and authentication</li>
                                                <li>Providing service features</li>
                                                <li>Technical problem resolution</li>
                                                <li>Service improvement and optimization</li>
                                            </ul>
                                        </li>
                                        <li>Customized experience provision
                                            <ul>
                                                <li>Personalized content recommendation</li>
                                                <li>Customized notification provision</li>
                                                <li>User experience optimization</li>
                                            </ul>
                                        </li>
                                        <li>Security and safety
                                            <ul>
                                                <li>Account security maintenance</li>
                                                <li>Fraud prevention</li>
                                                <li>Service abuse prevention</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>3. Information Protection Measures</h3>
                                    <p>Collected information is protected by the following methods:</p>
                                    <ul>
                                        <li>Technical protection measures
                                            <ul>
                                                <li>SSL encrypted communication</li>
                                                <li>Data encrypted storage</li>
                                                <li>Firewall and security system operation</li>
                                                <li>Regular security updates</li>
                                            </ul>
                                        </li>
                                        <li>Management protection measures
                                            <ul>
                                                <li>Access authority management</li>
                                                <li>Regular security education</li>
                                                <li>Internal security policy operation</li>
                                                <li>Security audit</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>4. User Rights</h3>
                                    <p>Users have the following rights and can exercise them at any time:</p>
                                    <ul>
                                        <li>Information access right
                                            <ul>
                                                <li>View collected personal information</li>
                                                <li>Check information collection and use history</li>
                                            </ul>
                                        </li>
                                        <li>Information control right
                                            <ul>
                                                <li>Personal information modification and deletion</li>
                                                <li>Information use consent withdrawal</li>
                                                <li>Data moving request</li>
                                            </ul>
                                        </li>
                                        <li>Marketing-related rights
                                            <ul>
                                                <li>Marketing reception refusal</li>
                                                <li>Customized advertisement refusal</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>5. Cookie Policy</h3>
                                    <p>HYPER uses cookies for service improvement:</p>
                                    <ul>
                                        <li>Essential cookies: Provide basic service features</li>
                                        <li>Analytical cookies: Analyze and improve service</li>
                                        <li>Functional cookies: Save user preferences</li>
                                        <li>Advertising cookies: Provide customized advertisement (optional)</li>
                                    </ul>

                                    <h3>6. Information Sharing</h3>
                                    <p>User information is shared with third parties only in the following cases:</p>
                                    <ul>
                                        <li>When there is explicit consent from the user</li>
                                        <li>When necessary to comply with legal obligations</li>
                                        <li>Sharing with necessary cooperating companies for service provision</li>
                                    </ul>

                                    <h3>7. AI and Data Analysis</h3>
                                    <p>HYPER utilizes AI technology to provide improved service and personalized experience:</p>
                                    <ul>
                                        <li>AI data collection and utilization
                                            <ul>
                                                <li>User interest analysis for content recommendation system improvement</li>
                                                <li>Search pattern learning for search result optimization</li>
                                                <li>User behavior pattern analysis for service quality improvement</li>
                                                <li>Data collection for spam and malicious content filtering</li>
                                            </ul>
                                        </li>
                                        <li>AI learning data
                                            <ul>
                                                <li>Shared link metadata and category information</li>
                                                <li>Language pattern in tags and description text</li>
                                                <li>Content consumption pattern and interaction data</li>
                                                <li>Search term and filter use pattern</li>
                                            </ul>
                                        </li>
                                        <li>Data anonymization and protection
                                            <ul>
                                                <li>Collected data is used after removing personal identification information</li>
                                                <li>AI learning data is encrypted and securely stored</li>
                                                <li>Data sharing with third parties must be anonymized</li>
                                                <li>Regular data security audit</li>
                                            </ul>
                                        </li>
                                        <li>User control
                                            <ul>
                                                <li>Selectable AI-based recommendation service usage</li>
                                                <li>Requestable AI learning data viewing</li>
                                                <li>Requestable AI learning exclusion for specific data</li>
                                                <li>Provide AI-based recommendation service deactivation option</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>8. AI Ethics and Responsibility</h3>
                                    <p>HYPER adheres to the following principles in utilizing AI technology:</p>
                                    <ul>
                                        <li>Transparency
                                            <ul>
                                                <li>AI system usage indication</li>
                                                <li>Data collection and utilization process disclosure</li>
                                                <li>Possible explanation of AI decision-making process</li>
                                            </ul>
                                        </li>
                                        <li>Fairness
                                            <ul>
                                                <li>Non-biased algorithm design</li>
                                                <li>Fair service provision for various user groups</li>
                                                <li>Regular algorithm bias review</li>
                                            </ul>
                                        </li>
                                        <li>Safety
                                            <ul>
                                                <li>Regular AI system safety check</li>
                                                <li>Monitoring for misuse prevention</li>
                                                <li>Manual intervention system construction</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                // Korean Privacy Policy
                                <div>
                                    <h3>1. 수집하는 정보</h3>
                                    <ul className={ss.grid_list}>
                                        <li>필수 계정 정보
                                            <ul>
                                                <li>이메일 주소</li>
                                                <li>사용자명</li>
                                                <li>비밀번호 (암호화 저장)</li>
                                            </ul>
                                        </li>
                                        <li>선택적 프로필 정보
                                            <ul>
                                                <li>프로필 이미지</li>
                                                <li>자기소개</li>
                                                <li>관심 분야</li>
                                                <li>소셜 미디어 링크</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>2. 정보 사용 목적</h3>
                                    <p>수집된 정보는 다음과 같은 목적으로 사용됩니다:</p>
                                    <ul>
                                        <li>서비스 제공 및 개선
                                            <ul>
                                                <li>계정 생성 및 인증</li>
                                                <li>서비스 기능 제공</li>
                                                <li>기술적 문제 해결</li>
                                                <li>서비스 개선 및 최적화</li>
                                            </ul>
                                        </li>
                                        <li>맞춤형 경험 제공
                                            <ul>
                                                <li>관심 기반 콘텐츠 추천</li>
                                                <li>맞춤형 알림 제공</li>
                                                <li>사용자 경험 최적화</li>
                                            </ul>
                                        </li>
                                        <li>보안 및 안전
                                            <ul>
                                                <li>계정 보안 유지</li>
                                                <li>사기 행위 방지</li>
                                                <li>서비스 악용 방지</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>3. 정보 보호 조치</h3>
                                    <p>사용자의 정보는 다음과 같은 방식으로 보호됩니다:</p>
                                    <ul>
                                        <li>기술적 보호 조치
                                            <ul>
                                                <li>SSL 암호화 통신</li>
                                                <li>데이터 암호화 저장</li>
                                                <li>방화벽 및 보안 시스템 운영</li>
                                                <li>정기적인 보안 업데이트</li>
                                            </ul>
                                        </li>
                                        <li>관리적 보호 조치
                                            <ul>
                                                <li>접근 권한 관리</li>
                                                <li>정기적인 보안 교육</li>
                                                <li>내부 보안 정책 운영</li>
                                                <li>보안 감사 실시</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>4. 사용자 권리</h3>
                                    <p>사용자는 다음과 같은 권리를 가지며, 언제든지 행사할 수 있습니다:</p>
                                    <ul>
                                        <li>정보 접근 권리
                                            <ul>
                                                <li>수집된 개인정보 열람</li>
                                                <li>정보 수집 및 사용 내역 확인</li>
                                            </ul>
                                        </li>
                                        <li>정보 통제 권리
                                            <ul>
                                                <li>개인정보 수정 및 삭제</li>
                                                <li>정보 이용 동의 철회</li>
                                                <li>데이터 이동 요청</li>
                                            </ul>
                                        </li>
                                        <li>마케팅 관련 권리
                                            <ul>
                                                <li>마케팅 수신 거부</li>
                                                <li>맞춤형 광고 거부</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>5. 쿠키 정책</h3>
                                    <p>HYPER는 서비스 개선을 위해 쿠키를 사용합니다:</p>
                                    <ul>
                                        <li>필수 쿠키: 서비스 기본 기능 제공</li>
                                        <li>분석 쿠키: 사용자 행동 분석 및 서비스 개선</li>
                                        <li>기능 쿠키: 사용자 선호도 저장</li>
                                        <li>광고 쿠키: 맞춤형 광고 제공 (선택적)</li>
                                    </ul>

                                    <h3>6. 제3자 정보 공유</h3>
                                    <p>사용자 정보는 다음과 같은 경우에만 제3자와 공유됩니다:</p>
                                    <ul>
                                        <li>사용자의 명시적 동의가 있는 경우</li>
                                        <li>법적 의무 준수를 위해 필요한 경우</li>
                                        <li>서비스 제공을 위해 필요한 협력업체와의 공유</li>
                                    </ul>

                                    <h3>7. AI 및 데이터 분석</h3>
                                    <p>HYPER는 서비스 개선과 개인화된 경험을 제공하기 위해 AI 기술을 활용합니다:</p>
                                    <ul>
                                        <li>AI 데이터 수집 및 활용
                                            <ul>
                                                <li>콘텐츠 추천 시스템 개선을 위한 사용자 관심사 분석</li>
                                                <li>검색 결과 최적화를 위한 검색 패턴 학습</li>
                                                <li>서비스 품질 향상을 위한 사용자 행동 패턴 분석</li>
                                                <li>스팸 및 악성 콘텐츠 필터링을 위한 데이터 수집</li>
                                            </ul>
                                        </li>
                                        <li>AI 학습 데이터
                                            <ul>
                                                <li>공유된 링크의 메타데이터 및 카테고리 정보</li>
                                                <li>태그 및 설명 텍스트의 언어 패턴</li>
                                                <li>콘텐츠 소비 패턴 및 상호작용 데이터</li>
                                                <li>검색어 및 필터 사용 패턴</li>
                                            </ul>
                                        </li>
                                        <li>데이터 익명화 및 보호
                                            <ul>
                                                <li>수집된 데이터는 개인 식별 정보 제거 후 활용</li>
                                                <li>AI 학습용 데이터는 암호화되어 안전하게 보관</li>
                                                <li>제3자와의 데이터 공유 시 익명화 처리 필수</li>
                                                <li>정기적인 데이터 보안 감사 실시</li>
                                            </ul>
                                        </li>
                                        <li>사용자 통제권
                                            <ul>
                                                <li>AI 기반 추천 서비스 사용 여부 선택 가능</li>
                                                <li>수집된 AI 학습 데이터 열람 요청 가능</li>
                                                <li>특정 데이터의 AI 학습 제외 요청 가능</li>
                                                <li>개인화된 추천 서비스 비활성화 옵션 제공</li>
                                            </ul>
                                        </li>
                                    </ul>

                                    <h3>8. AI 윤리 및 책임</h3>
                                    <p>HYPER는 AI 기술 활용에 있어 다음과 같은 원칙을 준수합니다:</p>
                                    <ul>
                                        <li>투명성
                                            <ul>
                                                <li>AI 시스템 사용 여부 명시</li>
                                                <li>데이터 수집 및 활용 과정 공개</li>
                                                <li>AI 의사결정 과정의 설명 가능성 확보</li>
                                            </ul>
                                        </li>
                                        <li>공정성
                                            <ul>
                                                <li>편향되지 않은 알고리즘 설계</li>
                                                <li>다양한 사용자 그룹에 대한 공평한 서비스 제공</li>
                                                <li>정기적인 알고리즘 편향성 검토</li>
                                            </ul>
                                        </li>
                                        <li>안전성
                                            <ul>
                                                <li>AI 시스템의 안전성 정기 점검</li>
                                                <li>오남용 방지를 위한 모니터링</li>
                                                <li>비상시 수동 개입 체계 구축</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPrivacy; 