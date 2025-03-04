import React, { useEffect } from 'react';

/**
 * 복사된 콘텐츠를 감지하고 처리하는 컴포넌트
 * 
 * @param {Object} props
 * @param {Function} props.onPasteDetected - 복사된 콘텐츠가 감지되었을 때 호출되는 콜백 함수
 * @param {boolean} props.isActive - 복사 감지 활성화 여부
 * @returns {null} - 이 컴포넌트는 UI를 렌더링하지 않음
 */
const PasteDetector = ({ onPasteDetected, isActive = true }) => {
  useEffect(() => {
    if (!isActive) return;

    const handlePaste = async (e) => {
      const isInputActive = e.target.matches('input, textarea, [contenteditable="true"]') ||
        e.target.closest('input, textarea, [contenteditable="true"]');

      if (!isInputActive) {
        e.preventDefault();
        const clipboardData = e.clipboardData || window.clipboardData;
        
        // 이미지 데이터 확인
        if (clipboardData.items) {
          for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            
            // 이미지 파일 확인
            if (item.type.indexOf('image') !== -1) {
              const blob = item.getAsFile();
              const reader = new FileReader();
              
              reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                  // 이미지 데이터와 함께 콜백 호출
                  onPasteDetected({
                    pastedContent: img.src,
                    contentType: 'image',
                    thumbnailImage: {
                      src: img.src,
                      width: img.width,
                      height: img.height
                    }
                  });
                };
                img.src = e.target.result;
              };
              
              reader.readAsDataURL(blob);
              return; // 이미지를 찾았으므로 더 이상 처리하지 않음
            }
          }
        }
        
        // 텍스트 데이터 확인
        const pastedText = clipboardData.getData('text');
        if (!pastedText) return;
        
        // URL 형식 조정
        let pastedData = pastedText.trim();
        const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        const isUrl = urlPattern.test(pastedData);
        
        if (isUrl && !pastedData.startsWith('http://') && !pastedData.startsWith('https://')) {
          pastedData = 'https://' + pastedData;
        }

        // 기본 콘텐츠 타입 설정
        let contentType = 'link';
        let detectedLanguage = 'javascript'; // 기본 언어
        
        // 유튜브, 비메오 등 비디오 URL 감지
        const videoUrlPattern = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv|tiktok\.com|vm\.tiktok\.com)/i;
        if (isUrl && videoUrlPattern.test(pastedData)) {
          contentType = 'video';
        }
        
        // 음악 URL 감지 - Spotify URL 패턴 개선
        const spotifyPattern = /spotify\.com\/(track|album|playlist|artist|show|episode)/i;
        const otherMusicPattern = /(soundcloud\.com|apple\.com\/music|music\.apple\.com|tidal\.com)/i;
        if (isUrl && (spotifyPattern.test(pastedData) || otherMusicPattern.test(pastedData))) {
          contentType = 'music';
        }
        
        // 이미지 URL 감지
        const imageUrlPattern = /\.(jpeg|jpg|gif|png|webp|tif|heic|heif|heif-sequence|heic-sequence|heif-sequence-image|heic-sequence-image)(\?.*)?$/i;
        if (isUrl && imageUrlPattern.test(pastedData)) {
          contentType = 'image';
          
          // 이미지 URL인 경우 썸네일 정보 추가
          try {
            const img = new Image();
            img.onload = () => {
              onPasteDetected({
                pastedContent: pastedData,
                contentType: 'image',
                thumbnailImage: {
                  src: pastedData,
                  width: img.width,
                  height: img.height
                }
              });
            };
            img.onerror = () => {
              // 이미지 로드 실패 시 일반 URL로 처리
              onPasteDetected({
                pastedContent: pastedData,
                contentType: 'link'
              });
            };
            img.src = pastedData;
            return; // 이미지 로드 중이므로 여기서 종료
          } catch (error) {
            console.error('이미지 로드 실패:', error);
            // 실패 시 일반 URL로 처리
            contentType = 'link';
          }
        }
        
        // 코드 감지 및 언어 감지
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
        const isMultiline = pastedData.includes('\n');
        const hasBraces = /[{}\[\]();]/.test(pastedData);
        
        // 언어 감지 로직
        let maxMatches = 0;
        let detectedLang = 'javascript'; // 기본값
        
        for (const [lang, patterns] of Object.entries(languagePatterns)) {
          let matches = 0;
          
          // 키워드 매칭
          patterns.keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const keywordMatches = (pastedData.match(regex) || []).length;
            matches += keywordMatches;
          });
          
          // 패턴 매칭
          patterns.patterns.forEach(pattern => {
            const patternMatches = (pastedData.match(pattern) || []).length;
            matches += patternMatches * 2; // 패턴 매치에 더 높은 가중치 부여
          });
          
          // 파일 확장자 힌트가 있는 경우 (예: ```python 또는 ```js)
          const fileExtHint = pastedData.match(/```(\w+)/);
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
        
        if (isCode && !isUrl) {
          contentType = 'code';
          detectedLanguage = detectedLang;
        }

        console.log('감지된 콘텐츠 타입:', contentType, '언어:', detectedLanguage, '데이터:', pastedData);

        // 부모 컴포넌트에 감지된 데이터 전달
        onPasteDetected({
          pastedContent: pastedData,
          contentType: contentType,
          code: contentType === 'code' ? pastedData : '',
          language: detectedLanguage
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onPasteDetected, isActive]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
};

export default PasteDetector; 