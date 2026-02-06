import React, { useState, useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile } from '@tauri-apps/plugin-fs';
import { Skeleton } from 'antd';
import './localImage.scss'

// Global cache for blob URLs to avoid re-reading files when scrolling back
const blobCache = new Map<string, string>();

export interface LocalImageProps {
  path: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onError?: (e: any) => void;
}

export const LocalImage: React.FC<LocalImageProps> = ({
  path,
  title,
  className,
  style,
  onClick,
}) => {
  const [src, setSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const mountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Preload when within 200px of viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      mountedRef.current = false;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;

    let isCurrent = true;
    setIsLoading(true);
    setHasError(false);

    const load = async () => {
      // Check cache first
      if (blobCache.has(path)) {
        if (isCurrent) {
          setSrc(blobCache.get(path)!);
          // Small delay to ensure render happens before turning off loading for transition
          setTimeout(() => {
            if (isCurrent && mountedRef.current) setIsLoading(false);
          }, 50);
        }
        return;
      }

      // Try asset protocol first
      const assetUrl = convertFileSrc(path);
      // console.log(`[LocalImage] Loading: ${path} -> ${assetUrl}`);

      if (isCurrent) {
        setSrc(assetUrl);
      }
    };

    load();

    return () => {
      isCurrent = false;
    };
  }, [path, shouldLoad]);

  const handleLoad = () => {
    if (mountedRef.current) setIsLoading(false);
  };

  const handleError = async (e: any) => {
    console.warn(`[LocalImage] Error loading ${src}:`, e);

    if (src.startsWith('blob:')) {
      if (mountedRef.current) {
        setHasError(true);
        setIsLoading(false);
      }
      return;
    }

    // Try fallback
    try {
      if (blobCache.has(path)) {
        setSrc(blobCache.get(path)!);
        return;
      }

      console.warn(
        `[LocalImage] Asset protocol failed for ${path}, trying fs.readFile fallback...`
      );
      const fileBytes = await readFile(path);
      console.log(`[LocalImage] Read file success, bytes: ${fileBytes.length}`);

      const ext = path.split('.').pop()?.toLowerCase();
      let mime = 'image/jpeg';
      if (ext === 'png') mime = 'image/png';
      else if (ext === 'webp') mime = 'image/webp';
      else if (ext === 'gif') mime = 'image/gif';
      else if (ext === 'svg') mime = 'image/svg+xml';
      else if (ext === 'bmp') mime = 'image/bmp';

      const blob = new Blob([fileBytes], { type: mime });
      const url = URL.createObjectURL(blob);

      blobCache.set(path, url);

      if (mountedRef.current) {
        setSrc(url);
        // Don't set isLoading(false) yet, wait for new src to load
      }
    } catch (e) {
      console.error(`Fallback load failed for ${path}:`, e);
      if (mountedRef.current) {
        setHasError(true);
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style, position: 'relative', overflow: 'hidden', width: '100%', minHeight: 120 }}
      onClick={onClick}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'var(--ant-color-bg-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Skeleton.Image active style={{ width: '100%', height: '100%', minHeight: 120 }} />
        </div>
      )}

      {!hasError ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          style={{
            width: '100%',
            height: 'auto',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            display: 'block',
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div
          style={{
            width: '100%',
            minHeight: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            color: '#ccc',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
      )}
    </div>
  );
};
