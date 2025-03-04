import React, { useEffect, useRef } from 'react'
import api from '../../../../util/api'

const MetadataFetcher = ({ url, onMetadataChange }) => {
  const prevUrlRef = useRef(url);

  useEffect(() => {
    if (prevUrlRef.current === url) {
      return;
    }
    prevUrlRef.current = url;

    const fetchMetadata = async () => {
      if (!url) return

      try {
        // console.log('메타데이터 요청 시작:', {
        //   url,
        //   endpoint: '/fetch-metadata',
        //   baseURL: api.defaults.baseURL
        // });
        
        // 소셜 미디어 URL 감지
        const isSocialMediaUrl = detectSocialMediaUrl(url);
        
        const response = await api.post('/fetch-metadata', { 
          url,
          extractMedia: isSocialMediaUrl // 소셜 미디어 URL인 경우 미디어 추출 옵션 추가
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 소셜 미디어 크롤링을 위해 타임아웃 증가
        });
        
        // console.log('메타데이터 응답:', response.data);
        
        if (response.data) {
          // 소셜 미디어 콘텐츠 처리
          const mediaContent = processSocialMediaContent(response.data, url);
          
          onMetadataChange({
            title: response.data.title || '',
            description: response.data.description || '',
            image: response.data.image || null,
            favicon: response.data.favicon || null,
            siteName: response.data.siteName || '',
            url: response.data.url || url,
            mediaContent: mediaContent // 소셜 미디어 콘텐츠 추가
          })
        }
      } catch (error) {
        console.error('메타데이터 가져오기 실패:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: url,
          stack: error.stack
        });
        
        onMetadataChange({
          title: '',
          description: '',
          image: null,
          favicon: null,
          siteName: '',
          url: url,
          mediaContent: null
        })
      }
    }

    if (url && url.startsWith('http')) {
      const timeoutId = setTimeout(() => {
        fetchMetadata()
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [url, onMetadataChange])
  
  // 소셜 미디어 URL 감지 함수
  const detectSocialMediaUrl = (url) => {
    if (!url) return false;
    
    const socialMediaPatterns = [
      /instagram\.com\/(p|reel)\/[^\/]+/i,  // 인스타그램 포스트/릴
      /facebook\.com\/[^\/]+\/posts\/|facebook\.com\/photo/i,  // 페이스북 포스트/사진
      /twitter\.com\/[^\/]+\/status\//i,  // 트위터 포스트
      /tiktok\.com\/@[^\/]+\/video\//i,  // 틱톡 비디오
    ];
    
    return socialMediaPatterns.some(pattern => pattern.test(url));
  };
  
  // 소셜 미디어 콘텐츠 처리 함수
  const processSocialMediaContent = (metadata, originalUrl) => {
    if (!metadata) return null;
    
    // 기본 미디어 콘텐츠 객체
    const mediaContent = {
      type: 'unknown',
      url: originalUrl,
      thumbnailUrl: metadata.image || null,
      embedHtml: null,
      mediaUrls: []
    };
    
    // 인스타그램 처리
    if (originalUrl.includes('instagram.com')) {
      mediaContent.type = 'instagram';
      
      // 인스타그램 oEmbed 데이터가 있는 경우
      if (metadata.oembed) {
        mediaContent.embedHtml = metadata.oembed.html;
      }
      
      // 미디어 URL 추출 (백엔드에서 제공한 경우)
      if (metadata.mediaUrls && metadata.mediaUrls.length > 0) {
        mediaContent.mediaUrls = metadata.mediaUrls;
      }
    }
    // 페이스북 처리
    else if (originalUrl.includes('facebook.com')) {
      mediaContent.type = 'facebook';
      
      if (metadata.oembed) {
        mediaContent.embedHtml = metadata.oembed.html;
      }
    }
    // 트위터 처리
    else if (originalUrl.includes('twitter.com')) {
      mediaContent.type = 'twitter';
      
      if (metadata.oembed) {
        mediaContent.embedHtml = metadata.oembed.html;
      }
    }
    // 틱톡 처리
    else if (originalUrl.includes('tiktok.com')) {
      mediaContent.type = 'tiktok';
      
      if (metadata.oembed) {
        mediaContent.embedHtml = metadata.oembed.html;
      }
    }
    
    return mediaContent;
  };

  return null
}

export default MetadataFetcher 