import React, { useEffect, useState } from 'react'
import Hyperium from '../../../../common/Hyperium/Hyperium'
import img1 from '../../../../img/image1.jpg'
import img3 from '../../../../img/image3.jpg'
import img5 from '../../../../img/image5.jpg'
import img7 from '../../../../img/image7.jpg'
import img9 from '../../../../img/image9.jpg'
import api from '../../../../util/api'
import { useParams } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import styles from './Collections.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'

const Collections = ({ onCollectionClick, sidebarWidth }) => {
    const [collectionsData, setCollectionsData] = useState([])
    const [isLoading, setIsLoading] = useState(true);
    const { userNameOnUrl } = useParams()


    useEffect(() => {
        fetchCollectionsData()
    }, [userNameOnUrl])

    // refreshCollections 이벤트 리스너 추가
    useEffect(() => {
        // 컬렉션 데이터 새로고침 이벤트 리스너
        const handleRefreshCollections = () => {
            console.log('Collections 컴포넌트에서 refreshCollections 이벤트 감지');
            fetchCollectionsData();
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('refreshCollections', handleRefreshCollections);
        
        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('refreshCollections', handleRefreshCollections);
        };
    }, []);

    const fetchCollectionsData = async () => {
        try {
            setIsLoading(true);
            let currentUserId;
            if (localStorage.getItem('token')) {
                currentUserId = jwtDecode(localStorage.getItem('token')).userId;
            }
            const userName = userNameOnUrl.replace('@', '');
            const response = await api.get(`/get-all-hyperlinks?from=collections&target=${userName}&currentUserId=${currentUserId}`)
            if (response.status === 200) {
                setCollectionsData(response.data.reverse())
            }
        } catch (err) {
            console.log(err)
        } finally {
            setIsLoading(false);
        }
    }
    //     const collectionsData = [
    //         {
    //             _id: 1,
    //             img: img1,
    //             title: "Abstract Harmony",
    //             dataType: 'collection',
    //             description: "A digital exploration of abstract forms and harmonious colors",
    //             tags: ["Digital Art", "Abstract"],
    //             poster: {
    //                 userName: "John Doe",
    //                 avatar: "1737908451804-3240376.jpg"
    //             },
    //             stats: {
    //                 views: 1234,
    //                 likes: 856432
    //             },
    //             likes: [],
    //             contentType: 'image',
    //             thumbnail: '1740155367260-881449144.jpg',
    //         },
    //         {
    //             _id: 3,
    //             img: img3,
    //             title: "Chromatic Dreams",
    //             dataType: 'collection',
    //             description: "A painting exploring the harmonious blend of colors",
    //             tags: ["Painting", "Contemporary"],
    //             poster: {
    //                 userName: "Mike Johnson",
    //                 avatar: "1737908451804-3240376.jpg"
    //             },
    //             stats: {
    //                 views: 1234,
    //                 likes: 234567
    //             },
    //             likes: [],
    //             contentType: 'image',
    //             thumbnail: '1740155367260-881449144.jpg',
    //         },
    //         {
    //             _id: 5,
    //             img: img5,
    //             title: "Neon Nights",
    //             dataType: 'collection',
    //             description: "A digital art piece depicting neon lights and vibrant colors",
    //             tags: ["Digital Art", "Cyberpunk"],
    //             poster: {
    //                 userName: "Alex Kim",
    //                 avatar: "1737908451804-3240376.jpg"
    //             },
    //             stats: {
    //                 views: 1234,
    //                 likes: 56
    //             },
    //             likes: [],
    //             contentType: 'image',
    //             thumbnail: '1740155367260-881449144.jpg',
    //         },
    //         {
    //             _id: 7,
    //             img: img7,
    //             title: "Geometric Fusion",
    //             dataType: 'collection',
    //             description: "A digital art piece exploring geometric forms and harmonious colors",
    //             tags: ["Digital Art", "Minimalist"],
    //             poster: {
    //                 userName: "David Park",
    //                 avatar: "1737908451804-3240376.jpg"
    //             },
    //             stats: {
    //                 views: 1234,
    //                 likes: 56
    //             },
    //             likes: [],
    //             contentType: 'image',
    //             thumbnail: '1740155367260-881449144.jpg',
    //         },
    //         {
    //             _id: 9,
    //             img: img9,
    //             title: "Ethereal Motion",
    //             dataType: 'collection',
    //             description: "An animation exploring the essence of motion",
    //             tags: ["Animation", "Abstract"],
    //             poster: {
    //                 userName: "Tom Brown",
    //                 avatar: "1737908451804-3240376.jpg"
    //             },
    //             stats: {
    //                 views: 1234,
    //                 likes: 56
    //             },
    //             likes: [],
    //             contentType: 'image',
    //             thumbnail: '1740155367260-881449144.jpg',
    //         },
    //         {
    //             _id: 12,
    //             title: "Recursive Function Example",
    //             dataType: 'collection',
    //             description: "A JavaScript example of a recursive function",
    //             tags: ["Code", "JavaScript"],
    //             poster: {
    //                 userName: "Alice Cooper",
    //                 avatar: "1737908451804-3240376.jpg"
    //             },
    //             stats: {
    //                 views: 1567,
    //                 likes: 23
    //             },
    //             likes: [],
    //             contentType: 'code',
    //             // thumbnail: '1740155367260-881449144.jpg',
    //             preview: {
    //                 language: "javascript",
    //                 code: `function factorial(n) {
    //   if (n <= 1) return 1;
    //   return n * factorial(n - 1);
    // }`,
    //                 lineCount: 4
    //             }
    //         }
    //     ];

    if (isLoading) {
        return <div className={styles.loadingContainer}>Loading collections...</div>;
    }

    if (collectionsData.length === 0) {
        return (
            <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faFolderOpen} className={styles.emptyIcon} />
                <h2 className={styles.emptyTitle}>No Collections Yet</h2>
                <p className={styles.emptyDescription}>
                    Create and organize <span className={styles.highlight}>Collections</span> to showcase your favorite content
                </p>
                <p className={styles.emptySubtext}>
                    Collections help you group related content together for easy access and sharing
                </p>
            </div>
        );
    }

    return <Hyperium cards={collectionsData} onCardClick={onCollectionClick} containerWidth={sidebarWidth} />;
};

export default Collections 