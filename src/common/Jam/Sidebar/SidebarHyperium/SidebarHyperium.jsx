import React, { useState, useEffect } from 'react';
import ss from './SidebarHyperium.module.css';
import HyperlinkCard from '../../HyperlinkCard/HyperlinkCard';
import { jwtDecode } from 'jwt-decode';
import api from '../../../../util/api';

const SideMenuHyperium = ({ cards: externalCards, currentUser, onDragStart }) => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (externalCards && externalCards.length > 0) {
      setCards(externalCards);
      setIsLoading(false);
    } else {
      fetchHyperiumData();
    }
  }, [externalCards]);

  const fetchHyperiumData = async () => {
    try {
      setIsLoading(true);
      
      // 토큰이 없으면 빈 배열 반환
      if (!localStorage.getItem('token')) {
        setCards([]);
        setIsLoading(false);
        return;
      }

      // 현재 사용자 ID 가져오기
      const token = localStorage.getItem('token');
      const currentUserId = jwtDecode(token).userId;
      
      // 더미 데이터 (API가 작동하지 않을 경우를 대비)
      const dummyData = [
        {
          _id: '1',
          title: '디자인 시스템 구축하기',
          description: '효율적인 디자인 시스템 구축 방법에 대한 가이드',
          thumbnail: 'https://picsum.photos/id/1/300/200',
          type: 'collection',
          poster: {
            userName: 'designguru',
            avatar: 'https://i.pravatar.cc/150?img=1'
          }
        },
        {
          _id: '2',
          title: 'React 성능 최적화 기법',
          description: 'React 애플리케이션의 성능을 향상시키는 10가지 방법',
          thumbnail: 'https://picsum.photos/id/2/300/200',
          type: 'post',
          poster: {
            userName: 'reactmaster',
            avatar: 'https://i.pravatar.cc/150?img=2'
          }
        },
        {
          _id: '3',
          title: 'UX 디자인 트렌드 2023',
          description: '올해의 UX 디자인 트렌드와 사례 연구',
          thumbnail: 'https://picsum.photos/id/3/300/200',
          type: 'like',
          poster: {
            userName: 'uxexpert',
            avatar: 'https://i.pravatar.cc/150?img=3'
          }
        }
      ];
      
      try {
        // 실제 API 호출
        const [collectionsRes, likesRes, postsRes] = await Promise.all([
          api.get(`/get-all-hyperlinks?from=collections&target=${currentUserId}&currentUserId=${currentUserId}`),
          api.get(`/get-all-hyperlinks?from=likes&target=${currentUserId}&currentUserId=${currentUserId}`),
          api.get(`/get-all-hyperlinks?from=posts&target=${currentUserId}&currentUserId=${currentUserId}`)
        ]);
        
        // 각 응답에서 최신 2개씩만 선택
        const collections = collectionsRes.data.slice(0, 2).map(item => ({ ...item, type: 'collection' }));
        const likes = likesRes.data.slice(0, 2).map(item => ({ ...item, type: 'like' }));
        const posts = postsRes.data.slice(0, 2).map(item => ({ ...item, type: 'post' }));
        
        // 모든 데이터를 합치고 섞어서 표시
        const allCards = [...collections, ...likes, ...posts]
          .sort(() => Math.random() - 0.5)
          .slice(0, 6); // 최대 6개만 표시
        
        if (allCards.length > 0) {
          setCards(allCards);
        } else {
          // API 응답이 비어있으면 더미 데이터 사용
          setCards(dummyData);
        }
      } catch (error) {
        console.error('API 호출 실패, 더미 데이터 사용:', error);
        // API 호출 실패 시 더미 데이터 사용
        setCards(dummyData);
      }
    } catch (error) {
      console.error('Error fetching hyperium data:', error);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e, card) => {
    e.stopPropagation();
    const cardData = {
      ...card,
      x: 0,
      y: 0
    };
    e.dataTransfer.setData('application/json', JSON.stringify(cardData));
    if (onDragStart) {
      onDragStart(cardData);
    }
  };

  const processCard = (card) => {
    return {
      ...card,
      style: {
        width: '100%',
        height: '100%'
      },
      color: '#ffffff',
      backgroundColor: '#f0f0f0',
      opacity: 1,
      isCompact: true,
      showActions: false
    };
  };

  if (isLoading) {
    return <div className={ss.loading}>데이터를 불러오는 중...</div>;
  }

  if (!cards || cards.length === 0) {
    return <div className={ss.emptyState}>표시할 콘텐츠가 없습니다</div>;
  }

  return (
    <div className={ss.container}>
      <div className={ss.grid}>
        {cards.map((card) => {
          const processedCard = processCard(card);
          return (
            <div
              key={card._id}
              className={ss.cardWrapper}
              draggable
              onDragStart={(e) => handleDragStart(e, processedCard)}
            >
              <HyperlinkCard
                data={processedCard}
                isCompact={true}
                showActions={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SideMenuHyperium; 