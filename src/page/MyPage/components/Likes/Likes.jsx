import React, { useEffect, useState } from 'react';
import Hyperium from '../../../../common/Hyperium/Hyperium';
import img1 from '../../../../img/image1.jpg'
import img2 from '../../../../img/image2.jpg'
import img3 from '../../../../img/image3.jpg'
import img4 from '../../../../img/image4.jpg'
import img5 from '../../../../img/image5.jpg'
import img6 from '../../../../img/image6.jpg'
import img7 from '../../../../img/image7.jpg'
import img8 from '../../../../img/image8.jpeg'
import img9 from '../../../../img/image9.jpg'
import img10 from '../../../../img/image10.jpg'
import { jwtDecode } from 'jwt-decode';
import api from '../../../../util/api';
import styles from './Likes.module.css';

const Likes = ({ sidebarWidth }) => {
    const [likesData, setLikesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const breakpointColumns = {
        default: 4,
        1100: 3,
        768: 2,
        480: 2
    };

    useEffect(() => {
        fetchCardsData();
    }, []);

    // refreshLikes 이벤트 리스너 추가
    useEffect(() => {
        // 좋아요 데이터 새로고침 이벤트 리스너
        const handleRefreshLikes = () => {
            console.log('Likes 컴포넌트에서 refreshLikes 이벤트 감지');
            fetchCardsData();
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('refreshLikes', handleRefreshLikes);
        
        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('refreshLikes', handleRefreshLikes);
        };
    }, []);

    // const likesData = [
    //     { 
    //         _id: 4, 
    //         img: img4, 
    //         title: "Sculptural Waves", 
    //         description: "A modern sculpture capturing the essence of nature's waves",
    //         tags: ["Sculpture", "Modern"],
    //         poster: {
    //             userName: "Sarah Lee",
    //             avatar: "1737908451804-3240376.jpg"
    //         },
    //         stats: {
    //             views: 1234,
    //             likes: 56
    //         },
    //         likes: [],
    //         contentType: 'image',
    //         thumbnail: '1740155367260-881449144.jpg',
    //     },
    //     { 
    //         _id: 5, 
    //         img: img5, 
    //         title: "Neon Nights", 
    //         description: "A digital art piece depicting neon lights and vibrant colors",
    //         tags: ["Digital Art", "Cyberpunk"],
    //         poster: {
    //             userName: "Alex Kim",
    //             avatar: "1737908451804-3240376.jpg"
    //         },
    //         stats: {
    //             views: 1234,
    //             likes: 56
    //         },
    //         likes: [],
    //         contentType: 'image',
    //         thumbnail: '1740155367260-881449144.jpg',
    //     },
    //     { 
    //         _id: 6, 
    //         img: img6, 
    //         title: "Nature's Canvas", 
    //         description: "A landscape photography capturing the beauty of nature",
    //         tags: ["Photography", "Landscape"],
    //         poster: {
    //             userName: "Emma Wilson",
    //             avatar: "1737908451804-3240376.jpg"
    //         },
    //         stats: {
    //             views: 1234,
    //             likes: 56
    //         },
    //         likes: [],
    //         contentType: 'image',
    //         thumbnail: '1740155367260-881449144.jpg',
    //     }
    // ];

    const fetchCardsData = async () => {
        try {
            setIsLoading(true);
            if (!localStorage.getItem('token')){
                return
            }
            const token = localStorage.getItem('token');
            const userId = jwtDecode(token).userId;
            const response = await api.get(`/get-all-hyperlinks?from=likes&target=${userId}`)
            if (response.status === 200) {
                setLikesData(response.data.reverse()) // reverse는 최신순 정렬. 반대의 경우 추후 뺄 것.
            }
        } catch (err) {
            console.log(err)
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        // 추후 로딩 스피너 등 추가
        return <div className={styles.loadingContainer}>Loading likes...</div>
    }

    if (likesData.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h2 className={styles.emptyTitle}>No Liked Content Yet</h2>
                <p className={styles.emptyDescription}>
                    Discover and like <span className={styles.highlight}>Hyperlinks</span> to see them here
                </p>
            </div>
        );
    }

    return <Hyperium cards={likesData} breakpointColumns={breakpointColumns} containerWidth={sidebarWidth} />;
};

export default Likes; 
