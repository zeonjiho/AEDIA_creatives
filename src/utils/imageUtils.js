/**
 * 이미지 리사이징 및 압축 유틸리티
 */

/**
 * 이미지 파일을 리사이징하고 압축합니다
 * @param {File} file - 원본 이미지 파일
 * @param {Object} options - 리사이징 옵션
 * @param {number} options.maxWidth - 최대 가로 크기 (기본값: 1920)
 * @param {number} options.maxHeight - 최대 세로 크기 (기본값: 1920)
 * @param {number} options.quality - 압축 품질 (0.1 ~ 1.0, 기본값: 0.8)
 * @param {string} options.outputFormat - 출력 형식 (기본값: 'image/jpeg')
 * @returns {Promise<File>} 리사이즈된 이미지 파일
 */
export const resizeImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    outputFormat = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // 이미지 객체 생성
    const img = new Image();
    
    img.onload = () => {
      try {
        // 원본 크기
        const { width: originalWidth, height: originalHeight } = img;
        
        // 리사이징이 필요한지 확인
        if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
          // 리사이징이 필요없지만 품질 최적화는 진행
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = originalWidth;
          canvas.height = originalHeight;
          
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('이미지 압축에 실패했습니다.'));
            }
          }, outputFormat, quality);
          
          return;
        }
        
        // 비율을 유지하면서 크기 계산
        const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
        const newWidth = Math.floor(originalWidth * ratio);
        const newHeight = Math.floor(originalHeight * ratio);
        
        // 캔버스 생성 및 리사이징
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 고품질 리사이징 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Blob으로 변환
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: outputFormat,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('이미지 리사이징에 실패했습니다.'));
          }
        }, outputFormat, quality);
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('이미지를 불러올 수 없습니다.'));
    };
    
    // 이미지 로드
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 파일 크기에 따라 자동으로 품질을 조정합니다
 * @param {number} fileSize - 파일 크기 (bytes)
 * @returns {number} 권장 품질 (0.1 ~ 1.0)
 */
export const getOptimalQuality = (fileSize) => {
  const MB = 1024 * 1024;
  
  if (fileSize < 1 * MB) return 0.9;      // 1MB 미만: 높은 품질
  if (fileSize < 3 * MB) return 0.8;      // 1-3MB: 보통 품질
  if (fileSize < 5 * MB) return 0.7;      // 3-5MB: 약간 낮은 품질
  if (fileSize < 10 * MB) return 0.6;     // 5-10MB: 낮은 품질
  return 0.5;                             // 10MB 이상: 매우 낮은 품질
};

/**
 * 이미지 파일을 최적화합니다 (자동 품질 조정)
 * @param {File} file - 원본 이미지 파일
 * @param {Object} options - 최적화 옵션
 * @returns {Promise<File>} 최적화된 이미지 파일
 */
export const optimizeImage = async (file, options = {}) => {
  try {
    // 파일 크기에 따른 자동 품질 조정
    const optimalQuality = getOptimalQuality(file.size);
    
    // 기본 옵션과 병합
    const finalOptions = {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: optimalQuality,
      outputFormat: 'image/jpeg',
      ...options
    };
    
    console.log(`이미지 최적화 시작:`, {
      originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      fileName: file.name,
      quality: finalOptions.quality
    });
    
    const optimizedFile = await resizeImage(file, finalOptions);
    
    console.log(`이미지 최적화 완료:`, {
      originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      optimizedSize: `${(optimizedFile.size / (1024 * 1024)).toFixed(2)}MB`,
      reduction: `${(((file.size - optimizedFile.size) / file.size) * 100).toFixed(1)}%`
    });
    
    return optimizedFile;
    
  } catch (error) {
    console.error('이미지 최적화 실패:', error);
    // 최적화 실패 시 원본 파일 반환
    return file;
  }
};

/**
 * 여러 이미지 파일을 동시에 최적화합니다
 * @param {File[]} files - 이미지 파일 배열
 * @param {Object} options - 최적화 옵션
 * @returns {Promise<File[]>} 최적화된 이미지 파일 배열
 */
export const optimizeImages = async (files, options = {}) => {
  try {
    const promises = files.map(file => optimizeImage(file, options));
    return await Promise.all(promises);
  } catch (error) {
    console.error('다중 이미지 최적화 실패:', error);
    return files; // 실패 시 원본 파일들 반환
  }
}; 