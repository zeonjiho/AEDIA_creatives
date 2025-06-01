import baseURL from "./baseURL";

const getProjectThumbnail = (name) => {
    if (!name) {
        return;
    }
    return `${baseURL}/uploads/product/${name}`;
};

export default getProjectThumbnail;