import { getFileUrl } from "./upload";

export const mapUser = (user) => {
    if (!user) return null;
    return {
        ...user,
        avatar: getFileUrl(user.avatar)
    };
};

export const mapComment = (comment) => {
    if (!comment) return null;
    return {
        ...comment,
        user: mapUser(comment.user)
    };
};

export const mapPost = (post) => {
    if (!post) return null;
    return {
        ...post,
        image: getFileUrl(post.image), 
        user: mapUser(post.user)
    };
};