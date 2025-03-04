import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faHeart,
  faPaperPlane,
  faLink,
  faDownload,
  faFolderPlus,
  faPaperPlane as faComment
} from '@fortawesome/free-solid-svg-icons';
import Hyperium from '../../common/Hyperium/Hyperium';
import ss from './ArtworkDetail.module.css';

const ArtworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [similarArtworks, setSimilarArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comment, setComment] = useState('');
  const [showToast, setShowToast] = useState(false);

  // 브라우저 뒤로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = () => {
      navigate('/');
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 실제 API 호출로 대체해야 함
        const mockArtwork = {
          id,
          title: `Artwork ${id}`,
          description: "This is a detailed description of the artwork. It explains the creative process, inspiration, and techniques used in creating this piece.",
          img: `https://picsum.photos/seed/${id}/1200/800`,
          author: {
            name: "Artist Name",
            avatar: "https://i.pravatar.cc/150"
          },
          tags: ["design", "illustration", "digital"],
          stats: {
            likes: 1234,
            views: 5678
          }
        };

        // 비슷한 작품 20개 생성
        const mockSimilar = Array.from({ length: 20 }, (_, i) => ({
          id: `similar-${i}`,
          title: `Similar Artwork ${i + 1}`,
          description: "A similar artwork with comparable style and elements...",
          img: `https://picsum.photos/seed/${id}-${i}/800/600`,
          author: {
            name: `Artist ${i + 1}`,
            avatar: `https://i.pravatar.cc/150?img=${i + 1}`
          },
          tags: ["design", "art"],
          stats: {
            likes: Math.floor(Math.random() * 1000),
            views: Math.floor(Math.random() * 5000)
          },
          type: 'image'
        }));

        setArtwork(mockArtwork);
        setSimilarArtworks(mockSimilar);
      } catch (error) {
        console.error('Error fetching artwork:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      // TODO: API 호출
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking artwork:', error);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: artwork.title,
        text: artwork.description,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
      })
      .catch(err => console.error('Error copying link:', err));
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(artwork.img);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${artwork.title}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleSaveToCollection = async (e) => {
    e.stopPropagation();
    try {
      // TODO: API 호출
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving to collection:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      // TODO: API 호출
      console.log('댓글 작성:', comment);
      setComment(''); // 입력창 초기화
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (loading) {
    return (
      <div className={ss.loadingContainer}>
        <div className={ss.loadingSpinner}></div>
        <p>Loading artwork...</p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className={ss.errorContainer}>
        <h2>Artwork Not Found</h2>
        <p>The requested artwork might have been removed or doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className={ss.container}>
      <button onClick={handleBack} className={ss.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
        <span>Back</span>
      </button>
      
      <div className={ss.artworkDetail}>
        <div className={ss.imageSection}>
          <img src={artwork.img} alt={artwork.title} className={ss.mainImage} />
          {showToast && (
            <div className={ss.toast}>
              <FontAwesomeIcon icon={faLink} />
              Link copied to clipboard
            </div>
          )}
          <div className={ss.actionButtons}>
            <button 
              onClick={handleLike} 
              className={`${ss.actionButton} ${isLiked ? ss.liked : ''}`}
            >
              <FontAwesomeIcon icon={faHeart} />
            </button>
            <button onClick={handleShare} className={ss.actionButton}>
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
            <button onClick={handleCopyLink} className={ss.actionButton}>
              <FontAwesomeIcon icon={faLink} />
            </button>
            <button onClick={handleDownload} className={ss.actionButton}>
              <FontAwesomeIcon icon={faDownload} />
            </button>
            <button 
              onClick={handleSaveToCollection} 
              className={`${ss.actionButton} ${isSaved ? ss.saved : ''}`}
            >
              <FontAwesomeIcon icon={faFolderPlus} />
            </button>
          </div>
        </div>
        
        <div className={ss.infoSection}>
          <div className={ss.header}>
            <h1 className={ss.title}>{artwork.title}</h1>
            <div className={ss.authorInfo}>
              <img src={artwork.author.avatar} alt="" className={ss.authorAvatar} />
              <span className={ss.authorName}>{artwork.author.name}</span>
            </div>
          </div>

          <p className={ss.description}>{artwork.description}</p>
          
          <div className={ss.tags}>
            {artwork.tags.map((tag, i) => (
              <span key={i} className={ss.tag}>#{tag}</span>
            ))}
          </div>

          <div className={ss.stats}>
            <button 
              className={`${ss.actionButton} ${isLiked ? ss.liked : ''}`}
              onClick={handleLike}
            >
              <svg 
                className={ss.likeIcon} 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                  fill="currentColor"
                />
              </svg>
              {artwork.stats.likes.toLocaleString()}
            </button>
            <button 
              className={ss.actionButton}
              onClick={handleShare}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              Share
            </button>
            <button 
              className={ss.actionButton}
              onClick={handleCopyLink}
            >
              <FontAwesomeIcon icon={faLink} />
              Link
            </button>
            <span className={ss.viewCount}>
              {artwork.stats.views.toLocaleString()} views
            </span>
          </div>

          <form onSubmit={handleCommentSubmit} className={ss.commentForm}>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className={ss.commentInput}
            />
            <button type="submit" className={ss.commentSubmit}>
              <FontAwesomeIcon icon={faComment} />
            </button>
          </form>
        </div>
      </div>

      <div className={ss.similarSection}>
        <h2 className={ss.sectionTitle}>Similar Artworks</h2>
        <div className={ss.similarGrid}>
          <Hyperium cards={similarArtworks} />
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail; 