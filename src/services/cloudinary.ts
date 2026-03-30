export const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration is missing');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error(`El archivo o foto es demasiado pesado (${(file.size / 1024 / 1024).toFixed(1)}MB). El límite gratuito por archivo es 10MB. Por favor, comprimí el PDF o sacale una foto de menor resolución.`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error uploading image');
    }

    const data = await response.json();
    return data.secure_url;
};
