import { useState, useEffect } from 'react';

export const useDominantColor = (imageUrl: string | undefined) => {
    const [color, setColor] = useState<string>('#e11d48'); // Default to primary

    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 1;
            canvas.height = 1;

            // Draw image resized to 1x1 to average colors
            ctx.drawImage(img, 0, 0, 1, 1);

            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            setColor(`rgb(${r}, ${g}, ${b})`);
        };
    }, [imageUrl]);

    return color;
};
