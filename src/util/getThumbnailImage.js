import baseURL from "./baseURL";

const getThumbnailImage = (thumbnail, mini) => {
    if (!thumbnail) return '';
    
    if (mini === 'mini') {
        // 확장자 앞에 '-thumb' 삽입
        const thumbFilename = thumbnail.replace(/(\.[^.]+)$/, '-thumb$1');
        return `${baseURL}/uploads/thumbnails/${thumbFilename}`;
    }
    
    return `${baseURL}/uploads/thumbnails/${thumbnail}`;
}

export default getThumbnailImage;