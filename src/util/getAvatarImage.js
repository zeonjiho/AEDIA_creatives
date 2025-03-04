import baseURL from "./baseURL";

const getAvatarImage = (avatar) => {
    return `${baseURL}/uploads/avatar/${avatar}`;
}

export default getAvatarImage;