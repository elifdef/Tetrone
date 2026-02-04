import { notifyError, notifyWarn } from "../components/Notify";
import { SERVER_STORAGE_URL, MAX_FILE_SIZE_KB } from "../config";

export const checkFileSize = (file) => {
    const maxBytes = MAX_FILE_SIZE_KB * 1024;

    if (file.size > maxBytes) {
        notifyWarn(`Файл занадто великий. Максимальний розмір: ${MAX_FILE_SIZE_KB / 1024} МБ.`);
        return false;
    }
    return true;
};

export const checkFileImage = (file) => {
    if (!file.type.startsWith('image/')) {
        notifyError('Будь ласка, завантажте зображення.');
        return false;
    }
    return true;
};

export const validateImageFile = (file) => {
    if (!checkFileImage(file)) return false;
    if (!checkFileSize(file)) return false;
    return true;
}

export const getFileUrl = (path) => {
    if (!path)
        return null;

    // якщо це вже повне посилання
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:'))
        return path;

    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${SERVER_STORAGE_URL}/${cleanPath}`;
}