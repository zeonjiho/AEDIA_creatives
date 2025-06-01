import baseURL from "./baseURL";

const getProjectThumbnail = (name) => {
    if (!name) {
        return `${baseURL}/uploads/product/default_thumbnail.jpeg`;
    }
    return `${baseURL}/uploads/product/${name}`;
};

export default getProjectThumbnail;