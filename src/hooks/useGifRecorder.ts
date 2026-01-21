import { useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { encode } from 'modern-gif';

interface UseGifRecorderOptions {
  frameRate?: number; // frames per second
  width?: number;
  height?: number;
}

interface FrameData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function useGifRecorder(options: UseGifRecorderOptions = {}) {
  const { frameRate = 10, width, height } = options;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const framesRef = useRef<FrameData[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const startRecording = useCallback((element: HTMLElement) => {
    elementRef.current = element;
    framesRef.current = [];
    setIsRecording(true);
    setProgress(0);

    const captureFrame = async () => {
      if (!elementRef.current) return;
      
      try {
        const canvas = await html2canvas(elementRef.current, {
          backgroundColor: '#1a1a2e',
          scale: 1,
          logging: false,
          useCORS: true,
        });
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          framesRef.current.push({
            data: imageData.data,
            width: canvas.width,
            height: canvas.height,
          });
        }
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    };

    // Capture frames at specified rate
    intervalRef.current = setInterval(captureFrame, 1000 / frameRate);
  }, [frameRate]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRecording(false);
    setIsProcessing(true);

    const frames = framesRef.current;
    
    if (frames.length === 0) {
      setIsProcessing(false);
      return null;
    }

    try {
      const firstFrame = frames[0];
      const gifWidth = width || firstFrame.width;
      const gifHeight = height || firstFrame.height;
      
      // Prepare frames for modern-gif - use canvas elements
      const gifFrames = await Promise.all(frames.map(async (frame, index) => {
        setProgress(Math.round((index / frames.length) * 50));
        
        // Create canvas from frame data
        const canvas = document.createElement('canvas');
        canvas.width = frame.width;
        canvas.height = frame.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          const imageData = new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height);
          ctx.putImageData(imageData, 0, 0);
        }
        
        // Scale if needed
        if (frame.width !== gifWidth || frame.height !== gifHeight) {
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = gifWidth;
          scaledCanvas.height = gifHeight;
          const scaledCtx = scaledCanvas.getContext('2d');
          if (scaledCtx) {
            scaledCtx.drawImage(canvas, 0, 0, gifWidth, gifHeight);
            return {
              data: scaledCanvas as CanvasImageSource,
              delay: Math.round(1000 / frameRate),
            };
          }
        }
        
        return {
          data: canvas as CanvasImageSource,
          delay: Math.round(1000 / frameRate),
        };
      }));

      setProgress(60);
      
      const output = await encode({
        width: gifWidth,
        height: gifHeight,
        frames: gifFrames,
      });
      
      setProgress(100);
      setIsProcessing(false);
      
      return new Blob([output], { type: 'image/gif' });
    } catch (error) {
      console.error('Error creating GIF:', error);
      setIsProcessing(false);
      return null;
    }
  }, [frameRate, width, height]);

  const downloadGif = useCallback((blob: Blob, filename = 'conversation.gif') => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isRecording,
    isProcessing,
    progress,
    startRecording,
    stopRecording,
    downloadGif,
  };
}
