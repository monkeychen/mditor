import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface ImageLightboxProps {
  isOpen: boolean;
  src: string;
  alt?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  src,
  alt = '',
  naturalWidth,
  naturalHeight,
  onClose,
}) => {
  const [scale, setScale] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 });
  const [imgSize, setImgSize] = useState({ width: naturalWidth, height: naturalHeight });

  // 每次重新打开时重置缩放与偏移
  useEffect(() => {
    if (isOpen) {
      setScale(1.0);
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, src]);

  // 全局 Escape 键监听
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(5.0, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.25, Number((prev - 0.25).toFixed(2))));
  };

  const handleReset = () => {
    setScale(1.0);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((prev) => Math.max(0.25, Math.min(5.0, Number((prev + delta).toFixed(2)))));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset({
      x: dragStartRef.current.startOffsetX + dx,
      y: dragStartRef.current.startOffsetY + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const displayWidth = imgSize.width || naturalWidth;
  const displayHeight = imgSize.height || naturalHeight;

  return (
    <div
      data-testid="image-lightbox"
      onWheel={handleWheel}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      {/* 背景遮罩层，点击退出 */}
      <div
        data-testid="lightbox-backdrop"
        onClick={onClose}
        className="absolute inset-0 z-0"
      />

      {/* 顶部状态与关闭按钮 */}
      <div className="absolute top-4 right-6 flex items-center space-x-3 text-stone-300 text-xs z-10">
        <span
          data-testid="lightbox-scale-badge"
          className="bg-white/10 px-3 py-1 rounded-full text-stone-200 font-mono"
        >
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          data-testid="lightbox-close-btn"
          onClick={onClose}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition cursor-pointer"
          title="关闭 (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 图片展示与拖拽交互容器 */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden z-10 pointer-events-none"
      >
        <img
          data-testid="lightbox-image"
          src={src}
          alt={alt}
          onLoad={(e) => {
            const target = e.currentTarget;
            setImgSize({ width: target.naturalWidth, height: target.naturalHeight });
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleReset}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          className={`max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-75 shadow-2xl pointer-events-auto rounded-lg ${
            isDragging ? 'select-none' : ''
          }`}
        />
      </div>

      {/* 底部浮动控制栏 */}
      <div className="absolute bottom-6 bg-stone-900/90 border border-white/15 px-4 py-2 rounded-2xl flex items-center space-x-4 text-white text-xs shadow-2xl z-10">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            data-testid="lightbox-zoom-out"
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
            title="缩小 (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="lightbox-zoom-reset"
            onClick={handleReset}
            className="px-2 py-0.5 rounded hover:bg-white/10 font-mono text-[11px] text-stone-300 hover:text-white transition cursor-pointer"
            title="复位 100%"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
            <span>复位</span>
          </button>
          <button
            type="button"
            data-testid="lightbox-zoom-in"
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
            title="放大 (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        {(displayWidth || displayHeight) && (
          <>
            <div className="h-3.5 w-[1px] bg-white/20" />
            <div className="text-[11px] text-stone-400 font-mono">
              {displayWidth && displayHeight ? `${displayWidth} × ${displayHeight}` : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageLightbox;
