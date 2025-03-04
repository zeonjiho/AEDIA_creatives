import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const ClipboardAnalyzer = ({ 
  onContentDetected, 
  onTypeDetected, 
  onThumbnailDetected,
  enabled = true,
  activeContentType = null
}) => {
  // 클립보드 내용 분석 함수
  const analyzeClipboardContent = async (clipboardData) => {
    try {
      // 현재 활성화된 콘텐츠 타입이 이미지인 경우 클립보드 분석 중지
      if (activeContentType === 'image') {
        console.log('이미지 업로더가 활성화되어 있어 클립보드 분석을 중지합니다.');
        return;
      }
      
      // 텍스트 데이터 확인
      if (clipboardData.types.includes('text/plain')) {
        const text = clipboardData.getData('text/plain');
        
        // URL 패턴 확인
        const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        const isUrl = urlPattern.test(text.trim());
        
        // 언어별 패턴 정의
        const languagePatterns = {
          javascript: {
            keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'class', 'extends', 'import', 'export', 'default', 'new', 'this', 'super', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'async', 'await'],
            fileExtensions: ['.js', '.jsx', '.mjs'],
            patterns: [/\bconst\b|\blet\b|\bvar\b|\bfunction\b|\bimport\b|\bexport\b|\basync\b|\bawait\b/]
          },
          typescript: {
            keywords: ['interface', 'type', 'namespace', 'enum', 'implements', 'declare', 'readonly', 'private', 'protected', 'public', 'as', 'is'],
            fileExtensions: ['.ts', '.tsx'],
            patterns: [/\binterface\b|\btype\b|\bnamespace\b|\benum\b|\bimplements\b|\bdeclare\b/]
          },
          python: {
            keywords: ['def', 'class', 'if', 'else', 'elif', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'for', 'while', 'in', 'is', 'not', 'and', 'or', 'pass', 'break', 'continue', 'raise', 'with', 'async', 'await', 'lambda'],
            fileExtensions: ['.py', '.pyw'],
            patterns: [/\bdef\b|\bclass\b|\bimport\b|\bfrom\b|\bif\b.*\:|\bfor\b.*\:|\bwhile\b.*\:/, /^\s*#.*$/m]
          },
          java: {
            keywords: ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'extends', 'implements', 'enum', 'void', 'new', 'this', 'super', 'package', 'import'],
            fileExtensions: ['.java'],
            patterns: [/\bpublic\b|\bprivate\b|\bprotected\b|\bclass\b|\binterface\b|\benum\b|\bpackage\b|\bimport\b/]
          },
          cpp: {
            keywords: ['class', 'struct', 'template', 'namespace', 'using', 'public', 'private', 'protected', 'virtual', 'const', 'static', 'void', 'int', 'float', 'double', 'bool', 'char', 'auto', 'new', 'delete'],
            fileExtensions: ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
            patterns: [/\bclass\b|\bstruct\b|\btemplate\b|\bnamespace\b|\busing\b|\bpublic\b|\bprivate\b|\bprotected\b/]
          },
          csharp: {
            keywords: ['using', 'namespace', 'class', 'interface', 'struct', 'enum', 'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const', 'void', 'var', 'new', 'this', 'base', 'async', 'await'],
            fileExtensions: ['.cs'],
            patterns: [/\busing\b|\bnamespace\b|\bclass\b|\binterface\b|\bstruct\b|\benum\b|\bpublic\b|\bprivate\b|\bprotected\b/]
          },
          php: {
            keywords: ['function', 'class', 'interface', 'trait', 'extends', 'implements', 'public', 'private', 'protected', 'static', 'const', 'namespace', 'use', 'require', 'include', 'echo', 'print', 'new', 'this'],
            fileExtensions: ['.php'],
            patterns: [/\bfunction\b|\bclass\b|\binterface\b|\btrait\b|\bnamespace\b|\buse\b|\brequire\b|\binclude\b/, /^\s*<\?php/]
          },
          ruby: {
            keywords: ['def', 'class', 'module', 'if', 'else', 'elsif', 'unless', 'case', 'when', 'while', 'until', 'for', 'begin', 'rescue', 'ensure', 'end', 'do', 'yield', 'return', 'require', 'include', 'extend'],
            fileExtensions: ['.rb'],
            patterns: [/\bdef\b|\bclass\b|\bmodule\b|\brequire\b|\binclude\b|\bextend\b/, /\bdo\b|\|.*\|/, /\bend\b/]
          },
          swift: {
            keywords: ['func', 'class', 'struct', 'enum', 'protocol', 'extension', 'var', 'let', 'if', 'else', 'guard', 'switch', 'case', 'for', 'while', 'repeat', 'import', 'return', 'throws', 'throw', 'try', 'catch'],
            fileExtensions: ['.swift'],
            patterns: [/\bfunc\b|\bclass\b|\bstruct\b|\benum\b|\bprotocol\b|\bextension\b|\bimport\b/]
          },
          go: {
            keywords: ['func', 'package', 'import', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'defer', 'if', 'else', 'switch', 'case', 'for', 'range', 'var', 'const', 'return'],
            fileExtensions: ['.go'],
            patterns: [/\bfunc\b|\bpackage\b|\bimport\b|\btype\b|\bstruct\b|\binterface\b|\bgo\b|\bdefer\b/]
          },
          rust: {
            keywords: ['fn', 'struct', 'enum', 'trait', 'impl', 'pub', 'use', 'mod', 'let', 'mut', 'if', 'else', 'match', 'for', 'while', 'loop', 'return', 'unsafe', 'where', 'self', 'Self'],
            fileExtensions: ['.rs'],
            patterns: [/\bfn\b|\bstruct\b|\benum\b|\btrait\b|\bimpl\b|\bpub\b|\buse\b|\bmod\b/]
          },
          sql: {
            keywords: ['select', 'from', 'where', 'insert', 'update', 'delete', 'create', 'alter', 'drop', 'table', 'view', 'index', 'join', 'inner', 'outer', 'left', 'right', 'group', 'order', 'by', 'having', 'union', 'all', 'as'],
            fileExtensions: ['.sql'],
            patterns: [/\bselect\b.*\bfrom\b|\bcreate\b.*\btable\b|\binsert\b.*\binto\b|\bupdate\b.*\bset\b|\bdelete\b.*\bfrom\b/i]
          },
          vex: {
            keywords: ['if', 'else', 'for', 'while', 'return', 'break', 'continue'],
            declarations: ['float', 'vector', 'int', 'string', 'void', 'matrix'],
            patterns: [/\bvector\b|\bfloat\b|\bint\b|\bmatrix\b|\bvoid\b|\@/, /\bset\b|\baddpoint\b|\baddprim\b|\bsetprimgroup\b/]
          }
        };
        
        // 코드 감지 로직
        const isMultiline = text.includes('\n');
        const hasBraces = /[{}\[\]();]/.test(text);
        
        // 언어 감지 로직
        let maxMatches = 0;
        let detectedLang = 'javascript'; // 기본값
        
        for (const [lang, patterns] of Object.entries(languagePatterns)) {
          let matches = 0;
          
          // 키워드 매칭
          patterns.keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const keywordMatches = (text.match(regex) || []).length;
            matches += keywordMatches;
          });
          
          // 패턴 매칭
          if (patterns.patterns) {
            patterns.patterns.forEach(pattern => {
              const patternMatches = (text.match(pattern) || []).length;
              matches += patternMatches * 2; // 패턴 매치에 더 높은 가중치 부여
            });
          }
          
          // 파일 확장자 힌트가 있는 경우 (예: ```python 또는 ```js)
          const fileExtHint = text.match(/```(\w+)/);
          if (fileExtHint && fileExtHint[1]) {
            const hintLang = fileExtHint[1].toLowerCase();
            if (lang.toLowerCase().includes(hintLang) || 
                (hintLang === 'js' && lang === 'javascript') ||
                (hintLang === 'py' && lang === 'python') ||
                (hintLang === 'ts' && lang === 'typescript')) {
              matches += 10; // 파일 확장자 힌트에 높은 가중치 부여
            }
          }
          
          if (matches > maxMatches) {
            maxMatches = matches;
            detectedLang = lang;
          }
        }
        
        // 코드로 판단하는 조건
        const isCode = isMultiline || hasBraces || maxMatches >= 2;
        
        // 비디오 URL 패턴 확인
        const videoUrlPattern = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv)/i;
        const isVideoUrl = isUrl && videoUrlPattern.test(text);
        
        // 음악 URL 패턴 확인
        const musicUrlPattern = /(spotify\.com|soundcloud\.com|apple\.com\/music|music\.apple\.com|tidal\.com)/i;
        const isMusicUrl = isUrl && musicUrlPattern.test(text);
        
        // 이미지 URL 패턴 확인
        const imageUrlPattern = /\.(jpeg|jpg|gif|png|webp|tif|tiff)(\?.*)?$/i;
        const isImageUrl = isUrl && imageUrlPattern.test(text);
        
        // 타입 결정
        let detectedType = 'link'; // 기본값
        let detectedData = null;
        
        if (isVideoUrl) {
          detectedType = 'video';
        } else if (isMusicUrl) {
          detectedType = 'music';
        } else if (isImageUrl) {
          detectedType = 'image';
        } else if (isCode && !isUrl) {
          detectedType = 'code';
          detectedData = {
            code: text,
            language: detectedLang
          };
        } else if (isUrl) {
          detectedType = 'link';
        } else {
          detectedType = 'text'; // 일반 텍스트
        }
        
        // 콜백 호출
        onTypeDetected(detectedType, detectedData);
        
        // URL 형식 조정
        let formattedContent = text.trim();
        if (isUrl && !formattedContent.startsWith('http://') && !formattedContent.startsWith('https://')) {
          formattedContent = 'https://' + formattedContent;
        }
        
        onContentDetected(formattedContent);
        
        // URL인 경우 썸네일 가져오기 시도
        if (isUrl && (detectedType === 'link' || detectedType === 'image')) {
          try {
            // 이미지 URL인 경우 직접 썸네일로 사용
            if (isImageUrl) {
              const img = new Image();
              img.onload = () => {
                const thumbnailData = {
                  src: formattedContent,
                  width: img.width,
                  height: img.height
                };
                
                onThumbnailDetected(thumbnailData);
                // 이미지 URL이 확인되면 타입을 이미지로 변경
                onTypeDetected('image', { thumbnailImage: thumbnailData });
              };
              img.src = formattedContent;
            }
          } catch (error) {
            console.error('썸네일 생성 실패:', error);
          }
        }
      }
      
      // 이미지 데이터 확인
      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          
          // 이미지 파일 확인
          if (item.type.startsWith('image/')) {
            // 이미지 타입이 활성화되어 있으면 처리하지 않음
            if (activeContentType === 'image') {
              console.log('이미지 업로더가 활성화되어 있어 이미지 감지를 중지합니다.');
              return;
            }
            
            // 이미지 파일을 Base64로 변환
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const thumbnailData = {
                  src: e.target.result,
                  width: img.width,
                  height: img.height
                };
                
                onThumbnailDetected(thumbnailData);
                onContentDetected(e.target.result);
                onTypeDetected('image', { thumbnailImage: thumbnailData });
              };
              img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            return; // 이미지를 찾았으므로 더 이상 처리하지 않음
          }
        }
      }
      
      // 파일 데이터 확인
      if (clipboardData.types.includes('Files')) {
        const files = clipboardData.files;
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // 비디오 파일 확인
          if (file.type.startsWith('video/')) {
            onTypeDetected('video');
            
            // 비디오 파일 URL 생성
            const videoUrl = URL.createObjectURL(file);
            onContentDetected(videoUrl);
            
            // 비디오 썸네일 생성 (첫 프레임)
            try {
              const video = document.createElement('video');
              video.preload = 'metadata';
              video.onloadedmetadata = () => {
                video.currentTime = 1; // 첫 프레임 이후로 설정
              };
              video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnailUrl = canvas.toDataURL('image/jpeg');
                
                onThumbnailDetected({
                  src: thumbnailUrl,
                  width: video.videoWidth,
                  height: video.videoHeight
                });
              };
              video.src = videoUrl;
            } catch (error) {
              console.error('비디오 썸네일 생성 실패:', error);
            }
            break;
          }
          
          // 오디오 파일 확인
          if (file.type.startsWith('audio/')) {
            onTypeDetected('music');
            const audioUrl = URL.createObjectURL(file);
            onContentDetected(audioUrl);
            break;
          }
        }
      }
    } catch (error) {
      console.error('클립보드 분석 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    // 활성화되지 않았거나 이미지 타입이 활성화된 경우 이벤트 리스너를 등록하지 않음
    if (!enabled || activeContentType === 'image') {
      console.log('ClipboardAnalyzer 비활성화됨:', !enabled ? '기본 비활성화' : '이미지 타입 활성화');
      return;
    }

    // 클립보드 이벤트 리스너 등록
    const handlePaste = (e) => {
      // 입력 필드에서 붙여넣기 이벤트가 발생한 경우 무시
      const isInputActive = e.target.matches('input, textarea, [contenteditable="true"]') ||
        e.target.closest('input, textarea, [contenteditable="true"]');
      
      if (isInputActive) return;
      
      // 클립보드 데이터 분석
      const clipboardData = e.clipboardData || window.clipboardData;
      if (clipboardData) {
        analyzeClipboardContent(clipboardData);
      }
    };
    
    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [enabled, activeContentType]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
};

ClipboardAnalyzer.propTypes = {
  onContentDetected: PropTypes.func.isRequired,
  onTypeDetected: PropTypes.func.isRequired,
  onThumbnailDetected: PropTypes.func.isRequired,
  enabled: PropTypes.bool,
  activeContentType: PropTypes.string
};

export default ClipboardAnalyzer; 