import { useCallback } from 'react';
import { toast } from 'sonner';

// Simple "ding" sound as a base64 string to avoid external dependencies
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder, will replace with real base64 chime

// Actually, let's use a slightly longer real beep base64 for better effect.
// This is a simple 'glass ping' sound effect.
const GLASS_PING = "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkwgAHUwdPQAAAA//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkwgAHUwdPQAAAA//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkwgAHUwdPQAAAA//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkwgAHUwdPQAAAA//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkwgAHUwdPQAAAA=="; // Use specific tool to generate later if needed, but for now let's use a standard implementation logic.

export const useSoundNotification = () => {
    const playSound = useCallback(() => {
        try {
            // Use a standard browser notification sound or a silent fallback if strict
            // For this demo, let's create a real oscillator beep since base64 strings are long
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    }, []);

    const notify = useCallback((title: string, description?: string) => {
        playSound();
        toast(title, {
            description,
            duration: 5000,
        });
    }, [playSound]);

    return { notify, playSound };
};
