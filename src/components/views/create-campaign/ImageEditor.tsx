"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { InlineSpinner } from "@/components/ui/inline-spinner";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedUrl: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type PanPosition = {
  x: number;
  y: number;
};

export function ImageEditor({
  imageUrl,
  onSave,
  onCancel,
  isLoading = false,
}: ImageEditorProps) {
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPan: PanPosition;
  } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [modalSize, setModalSize] = useState({ width: 800, height: 600 });
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [imgReady, setImgReady] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const scale = 1 + zoom;

  const calculateModalSize = useCallback((width: number, height: number) => {
    const HEADER_HEIGHT = 60;
    const CONTROLS_HEIGHT = 64;
    const FOOTER_HEIGHT = 80;
    const FIXED_HEIGHT = HEADER_HEIGHT + CONTROLS_HEIGHT + FOOTER_HEIGHT + 20;

    const viewportWidth = window.innerWidth * 0.9;
    const viewportHeight = window.innerHeight * 0.9;

    const maxImageWidth = viewportWidth - 40;
    const maxImageHeight = viewportHeight - FIXED_HEIGHT;
    const imgAspect = width / height;

    let imgWidth = width;
    let imgHeight = height;

    if (imgWidth > maxImageWidth) {
      imgWidth = maxImageWidth;
      imgHeight = imgWidth / imgAspect;
    }

    if (imgHeight > maxImageHeight) {
      imgHeight = maxImageHeight;
      imgWidth = imgHeight * imgAspect;
    }

    const finalWidth = Math.max(Math.round(imgWidth) + 40, 400);
    const finalHeight = Math.round(imgHeight) + FIXED_HEIGHT;

    setModalSize({
      width: Math.min(finalWidth, viewportWidth),
      height: Math.min(finalHeight, viewportHeight),
    });
  }, []);

  const clampPan = useCallback(
    (nextPan: PanPosition, nextScale = scale): PanPosition => {
      const image = imgRef.current;
      const container = containerRef.current;

      if (!image || !container || nextScale <= 1) {
        return { x: 0, y: 0 };
      }

      const containerRect = container.getBoundingClientRect();
      const displayedWidth = image.width;
      const displayedHeight = image.height;

      const maxX = Math.max(
        0,
        (displayedWidth * nextScale - containerRect.width) / 2,
      );
      const maxY = Math.max(
        0,
        (displayedHeight * nextScale - containerRect.height) / 2,
      );

      return {
        x: Math.min(maxX, Math.max(-maxX, nextPan.x)),
        y: Math.min(maxY, Math.max(-maxY, nextPan.y)),
      };
    },
    [scale],
  );

  useEffect(() => {
    setImgSrc(imageUrl);
    setImgReady(false);
    setRotation(0);
    setZoom(0);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      calculateModalSize(img.naturalWidth, img.naturalHeight);
      setImgReady(true);
    };
    img.onerror = () => {
      console.error("Failed to load image");
    };
    img.src = imageUrl;
  }, [imageUrl, calculateModalSize]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;

      setNaturalWidth(naturalWidth);
      setNaturalHeight(naturalHeight);
      setPan({ x: 0, y: 0 });
      setImgReady(true);
    },
    [],
  );

  useEffect(() => {
    const handleResize = () => {
      if (!naturalWidth || !naturalHeight) return;

      if (rotation % 180 !== 0) {
        calculateModalSize(naturalHeight, naturalWidth);
      } else {
        calculateModalSize(naturalWidth, naturalHeight);
      }

      setPan((currentPan) => clampPan(currentPan));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [naturalWidth, naturalHeight, calculateModalSize, rotation, clampPan]);

  useEffect(() => {
    setPan((currentPan) => clampPan(currentPan));
  }, [zoom, rotation, clampPan]);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
    setPan({ x: 0, y: 0 });

    if (naturalWidth && naturalHeight) {
      calculateModalSize(naturalHeight, naturalWidth);
    }
  }, [naturalWidth, naturalHeight, calculateModalSize]);

  const setZoomValue = useCallback(
    (nextZoom: number) => {
      const normalizedZoom = Math.min(Math.max(nextZoom, 0), 2);
      setZoom(normalizedZoom);
      setPan((currentPan) => clampPan(currentPan, 1 + normalizedZoom));
    },
    [clampPan],
  );

  const handleZoomIn = useCallback(() => {
    setZoomValue(zoom + 0.1);
  }, [setZoomValue, zoom]);

  const handleZoomOut = useCallback(() => {
    setZoomValue(zoom - 0.1);
  }, [setZoomValue, zoom]);

  const handleSliderChange = useCallback(
    (values: number[]) => {
      if (!values || values.length === 0) return;
      setZoomValue(values[0]);
    },
    [setZoomValue],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (scale <= 1) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPan: pan,
    };
    setIsPanning(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== e.pointerId) return;

    const nextPan = {
      x: dragState.startPan.x + e.clientX - dragState.startX,
      y: dragState.startPan.y + e.clientY - dragState.startY,
    };

    setPan(clampPan(nextPan));
  };

  const endPan = (e: React.PointerEvent<HTMLImageElement>) => {
    if (dragStateRef.current?.pointerId === e.pointerId) {
      dragStateRef.current = null;
      setIsPanning(false);
    }
  };

  const drawFullImage = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
  ) => {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    let targetWidth = sourceWidth;
    let targetHeight = sourceHeight;

    if (rotation % 180 !== 0) {
      [targetWidth, targetHeight] = [targetHeight, targetWidth];
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (rotation > 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        image,
        -sourceWidth / 2,
        -sourceHeight / 2,
        sourceWidth,
        sourceHeight,
      );
      ctx.restore();
      return;
    }

    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
  };

  const drawVisibleViewport = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    container: HTMLDivElement,
  ) => {
    const containerRect = container.getBoundingClientRect();
    const displayRatioX = image.naturalWidth / image.width;
    const displayRatioY = image.naturalHeight / image.height;

    canvas.width = Math.max(1, Math.round(containerRect.width * displayRatioX));
    canvas.height = Math.max(
      1,
      Math.round(containerRect.height * displayRatioY),
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.save();
    ctx.translate(
      canvas.width / 2 + pan.x * displayRatioX,
      canvas.height / 2 + pan.y * displayRatioY,
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(
      image,
      -image.naturalWidth / 2,
      -image.naturalHeight / 2,
      image.naturalWidth,
      image.naturalHeight,
    );
    ctx.restore();
  };

  const handleSave = useCallback(() => {
    const image = imgRef.current;
    const container = containerRef.current;
    if (!image || !container) return;

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (zoom === 0 && pan.x === 0 && pan.y === 0) {
        drawFullImage(canvas, ctx, image);
      } else {
        drawVisibleViewport(canvas, ctx, image, container);
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      onSave(dataUrl);
    } catch (error) {
      console.error("Error saving edited image:", error);
    }
  }, [onSave, pan, rotation, scale, zoom]);

  const getEditorAreaStyle = () => {
    const fixedHeight = 60 + 64 + 80 + 10;
    const imageAreaHeight = modalSize.height - fixedHeight;

    return {
      height: `${imageAreaHeight}px`,
      maxHeight: `${imageAreaHeight}px`,
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        style={{ width: modalSize.width, height: modalSize.height }}
        className="bg-white rounded-lg flex flex-col overflow-hidden max-w-[90vw] max-h-[90vh]"
      >
        <div className="p-4 flex justify-between items-center h-[60px]">
          <h2 className="text-xl font-medium">Editar foto</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div
          ref={containerRef}
          style={getEditorAreaStyle()}
          className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center p-2"
        >
          {imgReady && (
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Editable"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: "center",
                transition: isPanning ? "none" : "transform 0.18s ease",
                touchAction: "none",
              }}
              onLoad={onImageLoad}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              crossOrigin="anonymous"
              draggable={false}
              className={`object-contain max-h-full max-w-full select-none ${
                scale > 1
                  ? isPanning
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-default"
              }`}
            />
          )}
          {!imgReady && (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#478C5C]"></div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 h-[64px]">
          <div className="flex h-full">
            <div className="flex-none w-40 sm:w-52 border-r border-gray-300">
              <button
                onClick={handleRotate}
                className="flex items-center justify-center h-full w-full gap-2 text-gray-700 hover:bg-gray-100"
              >
                <RotateCw size={20} />
                <span className="font-medium">Girar</span>
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center px-3 sm:px-4">
              <button
                onClick={handleZoomOut}
                className="text-gray-500 hover:text-gray-900 p-2 disabled:opacity-40"
                aria-label="Zoom out"
                disabled={zoom === 0}
              >
                <ZoomOut className="h-5 w-5 flex-shrink-0" />
              </button>
              <div className="w-[60%] mx-2 sm:mx-4">
                <Slider
                  value={[zoom]}
                  min={0}
                  max={2}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  className="[&_.relative]:h-8 [&_[data-orientation=horizontal]]:h-[4px] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-black"
                />
              </div>
              <button
                onClick={handleZoomIn}
                className="text-gray-500 hover:text-gray-900 p-2 disabled:opacity-40"
                aria-label="Zoom in"
                disabled={zoom >= 2}
              >
                <ZoomIn className="h-5 w-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 flex justify-center border-t border-gray-300 h-[80px]">
          <Button
            onClick={handleSave}
            className="bg-[#478C5C] hover:bg-[#3a7049] text-white px-12 rounded-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <InlineSpinner className="text-white" />
                <span>Guardando...</span>
              </div>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
