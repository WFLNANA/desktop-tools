import React, { useState, useRef, useEffect } from 'react';
import { CardProps } from '../../types';
import styles from './styles.module.scss';
import classNames from 'classnames';

export const WoodenFishCard = React.memo<CardProps>(({ card, onUpdate, size = 'medium' }) => {
    const config = card.parsedConfig || {};
    const [count, setCount] = useState(config.count || 0);
    const [isKnocking, setIsKnocking] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize audio context
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playSound = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Wooden fish sound simulation
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            
            // Envelope
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    };

    const knock = () => {
        if (isKnocking) return;
        
        setIsKnocking(true);
        const newCount = count + 1;
        setCount(newCount);
        
        // Update config to persist count
        // Using requestAnimationFrame to avoid blocking UI, though state update is async
        onUpdate?.({ ...config, count: newCount });
        
        playSound();
        
        setTimeout(() => {
            setIsKnocking(false);
        }, 150);
    };

    return (
        <div 
            className={classNames(styles.container, styles[size])}
            onClick={knock}
            role="button"
            tabIndex={0}
            aria-label={`敲电子木鱼，当前功德 ${count}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    knock();
                }
            }}
        >
            <div className={styles.fishWrapper}>
                 <div className={classNames(styles.stick, { [styles.knocking]: isKnocking })}>
                    {/* Stick SVG */}
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="40" y="10" width="20" height="80" rx="10" fill="#8B4513" />
                        <circle cx="50" cy="15" r="12" fill="#D2691E" />
                    </svg>
                </div>
                
                {/* Fish SVG */}
                <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" 
                     style={{ transform: isKnocking ? 'scale(0.95)' : 'scale(1)' }}>
                    <path d="M10 40C10 20 30 5 50 5C80 5 95 25 95 40C95 60 75 75 50 75C25 75 10 60 10 40Z" fill="#D2691E" stroke="#8B4513" strokeWidth="3"/>
                    <path d="M20 40C20 30 30 20 40 20" stroke="#8B4513" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="70" cy="30" r="5" fill="#333"/>
                    <path d="M85 40H60" stroke="#3E2723" strokeWidth="4" strokeLinecap="round"/>
                </svg>
            </div>
            
            <div className={styles.count}>功德 +{count}</div>
            <div className={styles.label}>点击积攒功德</div>
        </div>
    );
});
