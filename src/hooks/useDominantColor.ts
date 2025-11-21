import { useState, useEffect } from 'react';

function getLuminance(r: number, g: number, b: number): number {
    // Convert RGB to relative luminance (0-1)
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function adjustColorForContrast(r: number, g: number, b: number): string {
    const luminance = getLuminance(r, g, b);

    // If color is too light (luminance > 0.6), darken it significantly
    // This ensures it's visible against dark backgrounds
    if (luminance > 0.6) {
        const factor = 0.4; // Darken to 40% of original
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    // If too dark (luminance < 0.15), brighten it
    if (luminance < 0.15) {
        const boost = 1.8;
        const newR = Math.min(255, Math.round(r * boost));
        const newG = Math.min(255, Math.round(g * boost));
        const newB = Math.min(255, Math.round(b * boost));
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    return `rgb(${r}, ${g}, ${b})`;
}

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

            // Adjust for contrast
            const adjustedColor = adjustColorForContrast(r, g, b);
            setColor(adjustedColor);
        };

        img.onerror = () => {
            setColor('#e11d48'); // Fallback to primary red
        };
    }, [imageUrl]);

    return color;
};
