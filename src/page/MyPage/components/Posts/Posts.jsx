import React, { useEffect, useState } from 'react'
import Hyperium from '../../../../common/Hyperium/Hyperium.jsx'
import api from '../../../../util/api.js'
import { useParams } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import styles from './Posts.module.css'

const Posts = ({ sidebarWidth }) => {
    const [postsData, setPostsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userNameOnUrl } = useParams()

    const breakpointColumns = {
        default: 4,
        1100: 3,
        768: 2,
        480: 2
    };

    useEffect(() => {
        fetchCardsData()
    }, [userNameOnUrl])

    // refreshPosts 이벤트 리스너 추가
    useEffect(() => {
        // 포스트 데이터 새로고침 이벤트 리스너
        const handleRefreshPosts = () => {
            console.log('Posts 컴포넌트에서 refreshPosts 이벤트 감지');
            fetchCardsData();
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('refreshPosts', handleRefreshPosts);
        
        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('refreshPosts', handleRefreshPosts);
        };
    }, []);

    // const postsData = [
    //     { 
    //         _id: 1, 
    //         img: img1, 
    //         title: "Abstract Harmony", 
    //         description: "A digital exploration of abstract forms and harmonious colors",
    //         tags: ["Digital Art", "Abstract"],
    //         poster: {
    //             userName: "John Doe",
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
    //         _id: 2, 
    //         img: img2, 
    //         title: "Urban Perspective", 
    //         description: "A street photography capturing the essence of urban life",
    //         tags: ["Photography", "Street"],
    //         poster: {
    //             userName: "Jane Smith",
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
    //         _id: 3, 
    //         img: img3, 
    //         title: "Chromatic Dreams", 
    //         description: "A painting exploring the harmonious blend of colors",
    //         tags: ["Painting", "Contemporary"],
    //         poster: {
    //             userName: "Mike Johnson",
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
    // ]

    const fetchCardsData = async () => {
        try {
            setIsLoading(true);
            let currentUserId;
            if (localStorage.getItem('token')) {
                currentUserId = jwtDecode(localStorage.getItem('token')).userId;
            }
            const userName = userNameOnUrl.replace('@', '');
            const response = await api.get(`/get-all-hyperlinks?from=posts&target=${userName}&currentUserId=${currentUserId}`)
            if (response.status === 200) {
                setPostsData(response.data.reverse())
            }
        } catch (err) {
            console.log(err)
        } finally {
            setIsLoading(false);
        }
    }


    if (isLoading) {
        // 추후 로딩 스피너 등 추가
        return <div className={styles.loadingContainer}>Loading posts...</div>
    }

    if (postsData.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h2 className={styles.emptyTitle}>Start Your Creative Journey</h2>
                <p className={styles.emptyDescription}>
                    Share your first <span className={styles.highlight}>Hyperlink</span>
                </p>
            </div>
        );
    }

    return <Hyperium cards={postsData} breakpointColumns={breakpointColumns} containerWidth={sidebarWidth} />
}

export default Posts