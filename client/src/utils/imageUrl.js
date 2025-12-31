export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Assuming server runs on port 5000 locally
    const BASE_URL = 'http://localhost:5000';
    return `${BASE_URL}${path}`;
};
