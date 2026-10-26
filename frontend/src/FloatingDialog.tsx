import React, { useState, useEffect, useRef } from 'react';
import { X, Type, Minus, Plus, LayoutPanelTop, ChevronLeft, ChevronRight, GripHorizontal, Square, Copy } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export interface DialogState {
  id: string;
  type: 'agent_result' | 'pdf_queue' | 'zip_queue' | 'txt_queue' | 'json';
  content?: string;
  filename: string;
  title: string;
  url?: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
  zIndex: number;
  fontSize: number;
  textColor: string;
  currentPage: number;
  scale: number;
  isMinimized?: boolean;
  isMaximized?: boolean;
  preMaximizedBounds?: { position: { x: number; y: number }; size: { w: number; h: number } };
}

interface FloatingDialogProps {
  dialog: DialogState;
  onClose: (id: string) => void;
  onUpdate: (id: string, partial: Partial<DialogState>) => void;
  bringToFront: (id: string) => void;
}

export function FloatingDialog({ dialog, onClose, onUpdate, bringToFront }: FloatingDialogProps) {
  const [content, setContent] = useState<string>('Loading...');
  const [numPages, setNumPages] = useState<number | null>(null);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  
  const isPdf = dialog.type === 'pdf_queue';

  useEffect(() => {
    if (dialog.content) {
      setContent(dialog.content);
      return;
    }
    if (!isPdf && dialog.url) {
      fetch(dialog.url)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch");
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return res.json().then(j => JSON.stringify(j, null, 2));
          }
          return res.text();
        })
        .then(text => setContent(text))
        .catch(err => setContent(`Error loading content: ${err.message}`));
    }
  }, [dialog.url, isPdf]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDownHeader = (e: React.PointerEvent) => {
    bringToFront(dialog.id);
    if (!dialogRef.current) return;
    const rect = dialogRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const maxY = typeof window !== 'undefined' ? window.innerHeight - 40 : 1000;
    onUpdate(dialog.id, {
      position: {
        x: e.clientX - dragOffset.x,
        y: Math.min(maxY, Math.max(0, e.clientY - dragOffset.y))
      }
    });
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const [isResizing, setIsResizing] = useState(false);
  
  const handlePointerDownResize = (e: React.PointerEvent) => {
    bringToFront(dialog.id);
    setIsResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  
  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isResizing || !dialogRef.current || dialog.isMinimized || dialog.isMaximized) return;
    const rect = dialogRef.current.getBoundingClientRect();
    onUpdate(dialog.id, {
      size: {
        w: Math.max(300, e.clientX - rect.left),
        h: Math.max(200, e.clientY - rect.top)
      }
    });
  };
  
  const handlePointerUpResize = (e: React.PointerEvent) => {
    setIsResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const [isResizingRight, setIsResizingRight] = useState(false);
  const handlePointerDownResizeRight = (e: React.PointerEvent) => {
    bringToFront(dialog.id);
    setIsResizingRight(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const handlePointerMoveResizeRight = (e: React.PointerEvent) => {
    if (!isResizingRight || !dialogRef.current || dialog.isMinimized || dialog.isMaximized) return;
    const rect = dialogRef.current.getBoundingClientRect();
    onUpdate(dialog.id, { size: { ...dialog.size, w: Math.max(300, e.clientX - rect.left) } });
  };
  const handlePointerUpResizeRight = (e: React.PointerEvent) => {
    setIsResizingRight(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const [isResizingBottom, setIsResizingBottom] = useState(false);
  const handlePointerDownResizeBottom = (e: React.PointerEvent) => {
    bringToFront(dialog.id);
    setIsResizingBottom(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const handlePointerMoveResizeBottom = (e: React.PointerEvent) => {
    if (!isResizingBottom || !dialogRef.current || dialog.isMinimized || dialog.isMaximized) return;
    const rect = dialogRef.current.getBoundingClientRect();
    onUpdate(dialog.id, { size: { ...dialog.size, h: Math.max(200, e.clientY - rect.top) } });
  };
  const handlePointerUpResizeBottom = (e: React.PointerEvent) => {
    setIsResizingBottom(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const handlePointerDownResizeLeft = (e: React.PointerEvent) => {
    bringToFront(dialog.id);
    setIsResizingLeft(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const handlePointerMoveResizeLeft = (e: React.PointerEvent) => {
    if (!isResizingLeft || !dialogRef.current || dialog.isMinimized || dialog.isMaximized) return;
    const rect = dialogRef.current.getBoundingClientRect();
    const newWidth = dialog.size.w + (rect.left - e.clientX);
    if (newWidth > 300) {
      onUpdate(dialog.id, { 
        position: { ...dialog.position, x: e.clientX },
        size: { ...dialog.size, w: newWidth } 
      });
    }
  };
  const handlePointerUpResizeLeft = (e: React.PointerEvent) => {
    setIsResizingLeft(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const [isResizingTop, setIsResizingTop] = useState(false);
  const handlePointerDownResizeTop = (e: React.PointerEvent) => {
    bringToFront(dialog.id);
    setIsResizingTop(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const handlePointerMoveResizeTop = (e: React.PointerEvent) => {
    if (!isResizingTop || !dialogRef.current || dialog.isMinimized || dialog.isMaximized) return;
    const rect = dialogRef.current.getBoundingClientRect();
    const newY = Math.max(0, e.clientY);
    const newHeight = dialog.size.h + (rect.top - newY);
    if (newHeight > 200) {
      onUpdate(dialog.id, { 
        position: { ...dialog.position, y: newY },
        size: { ...dialog.size, h: newHeight } 
      });
    }
  };
  const handlePointerUpResizeTop = (e: React.PointerEvent) => {
    setIsResizingTop(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!isPdf || !numPages || !dialogRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      let maxRatio = 0;
      let mostVisiblePage = dialog.currentPage;
      
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          const pageStr = entry.target.getAttribute('data-page');
          if (pageStr) mostVisiblePage = parseInt(pageStr, 10);
        }
      });
      
      if (mostVisiblePage !== dialog.currentPage && maxRatio > 0.1) {
        onUpdate(dialog.id, { currentPage: mostVisiblePage });
      }
    }, {
      root: dialogRef.current.querySelector('.pdf-scroll-container'),
      threshold: [0.1, 0.3, 0.5, 0.7, 0.9]
    });
    
    // Give time for pages to render before observing
    const timer = setTimeout(() => {
      if (!dialogRef.current) return;
      const pages = dialogRef.current.querySelectorAll('.pdf-page-container');
      pages.forEach(p => observer.observe(p));
    }, 500);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isPdf, numPages, dialog.id, dialog.currentPage]);

  const scrollToPage = (page: number) => {
    onUpdate(dialog.id, { currentPage: page });
    const pageEl = document.getElementById(`pdf-page-${dialog.id}-${page}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(dialog.id, { isMinimized: !dialog.isMinimized, isMaximized: false });
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dialog.isMaximized) {
      if (dialog.preMaximizedBounds) {
        onUpdate(dialog.id, { 
          isMaximized: false, 
          position: dialog.preMaximizedBounds.position,
          size: dialog.preMaximizedBounds.size
        });
      } else {
        onUpdate(dialog.id, { isMaximized: false });
      }
    } else {
      onUpdate(dialog.id, { 
        isMaximized: true, 
        isMinimized: false,
        preMaximizedBounds: { position: dialog.position, size: dialog.size } 
      });
    }
  };

  const effectiveStyle: React.CSSProperties = {
    position: 'fixed',
    left: dialog.isMaximized ? 0 : dialog.position.x,
    top: dialog.isMaximized ? 0 : dialog.position.y,
    width: dialog.isMinimized ? 100 : (dialog.isMaximized ? '100vw' : dialog.size.w),
    height: dialog.isMinimized ? 'auto' : (dialog.isMaximized ? '100vh' : dialog.size.h),
    maxWidth: '100vw',
    maxHeight: '100vh',
    zIndex: dialog.zIndex,
  };

  return (
    <div
      ref={dialogRef}
      onPointerDown={() => bringToFront(dialog.id)}
      style={effectiveStyle}
      className="bg-cyber-dark border border-cyber-neon shadow-[0_0_15px_rgba(0,255,255,0.2)] flex flex-col overflow-hidden"
    >
      <div
        className="bg-cyber-panel border-b border-cyber-border flex items-center justify-between px-3 py-2 cursor-move select-none touch-none"
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        onPointerCancel={handlePointerUpHeader}
      >
        <div className="flex items-center space-x-2 truncate pr-2">
          <LayoutPanelTop className="w-4 h-4 text-cyber-neon shrink-0" />
          <span className="text-xs font-bold text-cyber-text truncate">{dialog.title}</span>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleMinimize}
            className="text-cyber-muted hover:text-cyber-neon p-1"
            title={dialog.isMinimized ? "Restore" : "Minimize"}
          >
            {dialog.isMinimized ? <Copy className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>
          {!dialog.isMinimized && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleMaximize}
              className="text-cyber-muted hover:text-cyber-neon p-1"
              title={dialog.isMaximized ? "Restore" : "Maximize"}
            >
              {dialog.isMaximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(dialog.id); }}
            className="text-cyber-muted hover:text-red-400 p-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!dialog.isMinimized && (
        <>
          <div className="bg-cyber-panel bg-opacity-50 border-b border-cyber-border/40 px-3 py-1.5 flex items-center justify-between shrink-0">
        {!isPdf ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Type className="w-3.5 h-3.5 text-cyber-muted" />
              <input 
                type="range" min="10" max="36" 
                value={dialog.fontSize}
                onChange={(e) => onUpdate(dialog.id, { fontSize: parseInt(e.target.value) })}
                className="w-20 accent-cyber-neon"
                title="Font Size"
              />
              <span className="text-[10px] text-cyber-muted">{dialog.fontSize}px</span>
            </div>
            <div className="flex items-center space-x-2 border-l border-cyber-border/50 pl-4">
              <span className="text-[10px] text-cyber-muted uppercase font-bold tracking-wider">Color:</span>
              <input 
                type="color" 
                value={dialog.textColor} 
                onChange={(e) => onUpdate(dialog.id, { textColor: e.target.value })}
                className="w-5 h-5 rounded border-0 cursor-pointer p-0 bg-transparent"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => scrollToPage(Math.max(1, dialog.currentPage - 1))}
                disabled={dialog.currentPage <= 1}
                className="p-1 text-cyber-neon disabled:text-cyber-muted hover:bg-cyber-light/20 rounded cursor-pointer"
                ref={(_) => {}}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-cyber-text px-2">
                Page {dialog.currentPage} of {numPages || '?'}
              </span>
              <button 
                onClick={() => scrollToPage(Math.min(numPages || 1, dialog.currentPage + 1))}
                disabled={!numPages || dialog.currentPage >= numPages}
                className="p-1 text-cyber-neon disabled:text-cyber-muted hover:bg-cyber-light/20 rounded cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 border-l border-cyber-border/50 pl-3">
              <button onClick={() => onUpdate(dialog.id, { scale: Math.max(0.5, dialog.scale - 0.2) })} className="text-cyber-muted hover:text-cyber-neon cursor-pointer p-1">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-cyber-muted font-mono">{Math.round(dialog.scale * 100)}%</span>
              <button onClick={() => onUpdate(dialog.id, { scale: Math.min(3, dialog.scale + 0.2) })} className="text-cyber-muted hover:text-cyber-neon cursor-pointer p-1">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 bg-[#0a0a0f] relative custom-scrollbar pdf-scroll-container">
        {!isPdf ? (
          <textarea
            value={content}
            readOnly
            style={{ 
              fontSize: `${dialog.fontSize}px`,
              color: dialog.textColor,
            }}
            className="w-full h-full bg-transparent border-none outline-none resize-none font-mono leading-relaxed"
          />
        ) : (
          <div className="flex flex-col items-center min-w-full space-y-4">
            <Document
              file={dialog.url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(error) => console.error("❌ [PDF View] Failed to load document:", error, "| Requested URL:", dialog.url)}
              loading={<div className="text-cyber-neon text-xs animate-pulse p-4">Loading PDF...</div>}
              error={<div className="text-red-400 text-xs p-4">Error loading PDF: {dialog.url}</div>}
            >
              {Array.from(new Array(numPages || 0), (_, index) => {
                const pageNumber = index + 1;
                const isVisible = pageNumber >= dialog.currentPage - 1 && pageNumber <= dialog.currentPage + 1;
                return (
                  <div 
                    key={`page_${pageNumber}`} 
                    id={`pdf-page-${dialog.id}-${pageNumber}`} 
                    data-page={pageNumber} 
                    className="pdf-page-container mb-4 shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-white flex justify-center items-center overflow-hidden"
                    style={{ minHeight: isVisible ? 'auto' : `${842 * dialog.scale}px`, width: '100%' }}
                  >
                    {isVisible ? (
                      <Page 
                        pageNumber={pageNumber} 
                        scale={dialog.scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    ) : (
                      <div className="text-cyber-muted text-xs font-mono animate-pulse flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-cyber-neon border-t-transparent rounded-full animate-spin mb-2"></div>
                        Loading Page {pageNumber}...
                      </div>
                    )}
                  </div>
                );
              })}
            </Document>
          </div>
        )}
      </div>

      {!dialog.isMaximized && (
        <>
          <div 
            className="absolute top-0 right-0 w-2 h-full cursor-e-resize touch-none z-10"
            onPointerDown={handlePointerDownResizeRight}
            onPointerMove={handlePointerMoveResizeRight}
            onPointerUp={handlePointerUpResizeRight}
            onPointerCancel={handlePointerUpResizeRight}
          />
          <div 
            className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize touch-none z-10"
            onPointerDown={handlePointerDownResizeBottom}
            onPointerMove={handlePointerMoveResizeBottom}
            onPointerUp={handlePointerUpResizeBottom}
            onPointerCancel={handlePointerUpResizeBottom}
          />
          <div 
            className="absolute top-0 left-0 w-2 h-full cursor-w-resize touch-none z-10"
            onPointerDown={handlePointerDownResizeLeft}
            onPointerMove={handlePointerMoveResizeLeft}
            onPointerUp={handlePointerUpResizeLeft}
            onPointerCancel={handlePointerUpResizeLeft}
          />
          <div 
            className="absolute top-0 left-0 w-full h-2 cursor-n-resize touch-none z-10"
            onPointerDown={handlePointerDownResizeTop}
            onPointerMove={handlePointerMoveResizeTop}
            onPointerUp={handlePointerUpResizeTop}
            onPointerCancel={handlePointerUpResizeTop}
          />
          <div 
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 touch-none z-20"
            onPointerDown={handlePointerDownResize}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            onPointerCancel={handlePointerUpResize}
          >
            <GripHorizontal className="w-3 h-3 text-cyber-muted rotate-45 transform translate-x-1 translate-y-1" />
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}
