"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import ReactCrop, {
  Crop as CropType,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { InlineSpinner } from "@/components/ui/inline-spinner";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedUrl: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ImageEditor({
  imageUrl,
  onSave,
  onCancel,
  isLoading = false,
}: ImageEditorProps) {
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [rotation, setRotation] = useState(0);
  const [modalSize, setModalSize] = useState({ width: 800, height: 600 });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [imgReady, setImgReady] = useState(false);
  const [scale, setScale] = useState(0.8);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Track if user has modified the crop
  const [hasModifiedCrop, setHasModifiedCrop] = useState(false);

  // Load image dimensions before rendering
  useEffect(() => {
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
  }, [imageUrl]);

  // Calculate ideal modal size based on image and viewport
  const calculateModalSize = useCallback((width: number, height: number) => {
    // Fixed heights for header, footer and controls
    const HEADER_HEIGHT = 60;
    const CONTROLS_HEIGHT = 64;
    const FOOTER_HEIGHT = 80;
    const FIXED_HEIGHT = HEADER_HEIGHT + CONTROLS_HEIGHT + FOOTER_HEIGHT + 20; // +20 for margins

    // Get viewport dimensions with a small margin
    const viewportWidth = window.innerWidth * 0.9;
    const viewportHeight = window.innerHeight * 0.9;

    // Maximum available space for the image
    const maxImageWidth = viewportWidth - 40; // 20px padding on each side
    const maxImageHeight = viewportHeight - FIXED_HEIGHT;

    // Calculate aspect ratio
    const imgAspect = width / height;

    // Determine dimensions to fit within constraints
    let imgWidth = width;
    let imgHeight = height;

    // Scale down if needed
    if (imgWidth > maxImageWidth) {
      imgWidth = maxImageWidth;
      imgHeight = imgWidth / imgAspect;
    }

    if (imgHeight > maxImageHeight) {
      imgHeight = maxImageHeight;
      imgWidth = imgHeight * imgAspect;
    }

    // Final modal size (image area + fixed elements)
    const finalWidth = Math.max(Math.round(imgWidth) + 40, 400); // min width 400px
    const finalHeight = Math.round(imgHeight) + FIXED_HEIGHT;

    setModalSize({
      width: Math.min(finalWidth, viewportWidth),
      height: Math.min(finalHeight, viewportHeight),
    });
  }, []);

  // Handle image load
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const { naturalWidth, naturalHeight } = e.currentTarget;

      setNaturalWidth(naturalWidth);
      setNaturalHeight(naturalHeight);
      setImageSize({ width, height });
      setImgReady(true);

      // Reset crop when loading a new image
      setCrop(undefined);
      setHasModifiedCrop(false);

      // Set initial completedCrop to entire image dimensions
      const initialCrop: PixelCrop = {
        x: 0,
        y: 0,
        width,
        height,
        unit: "px",
      };

      setCompletedCrop(initialCrop);
    },
    []
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (naturalWidth && naturalHeight) {
        // For rotated image, swap dimensions
        if (rotation % 180 !== 0) {
          calculateModalSize(naturalHeight, naturalWidth);
        } else {
          calculateModalSize(naturalWidth, naturalHeight);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [naturalWidth, naturalHeight, calculateModalSize, rotation]);

  // Rotate image
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);

    // Reset crop when rotating
    setCrop(undefined);
    setHasModifiedCrop(false);

    // When rotating, swap dimensions for modal size calculation
    if (naturalWidth && naturalHeight) {
      // If we're going from landscape to portrait or vice versa, swap dimensions
      const isCurrentlyLandscape =
        rotation % 180 === 0
          ? naturalWidth > naturalHeight
          : naturalHeight > naturalWidth;

      const willBeLandscape =
        (rotation + 90) % 180 === 0
          ? naturalWidth > naturalHeight
          : naturalHeight > naturalWidth;

      if (isCurrentlyLandscape !== willBeLandscape) {
        calculateModalSize(naturalHeight, naturalWidth);
      }
    }
  }, [naturalWidth, naturalHeight, calculateModalSize, rotation]);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  }, []);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // Handle slider change
  const handleSliderChange = useCallback((values: number[]) => {
    if (!values || values.length === 0) return;
    setScale(values[0]);
  }, []);

  // When scale changes, reset crop
  useEffect(() => {
    if (hasModifiedCrop) {
      // If user has already set a crop, don't reset it
      return;
    }

    // Reset crop only if it's not been explicitly set by user
    setCrop(undefined);
  }, [scale, hasModifiedCrop]);

  // Save the edited image
  const handleSave = useCallback(() => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const image = imgRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get natural dimensions of the image
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      // Get the displayed dimensions of the image (before scaling and rotation)
      const displayedWidth = image.width;
      const displayedHeight = image.height;

      // Calculate the ratio between natural and displayed dimensions
      const scaleRatioX = naturalWidth / displayedWidth;
      const scaleRatioY = naturalHeight / displayedHeight;

      // If user has made a crop selection
      if (hasModifiedCrop && completedCrop) {
        // Convert crop from display coordinates to natural image coordinates
        // We need to account for the current scale factor
        const sourceX = Math.round((completedCrop.x / scale) * scaleRatioX);
        const sourceY = Math.round((completedCrop.y / scale) * scaleRatioY);
        const sourceWidth = Math.round(
          (completedCrop.width / scale) * scaleRatioX
        );
        const sourceHeight = Math.round(
          (completedCrop.height / scale) * scaleRatioY
        );

        // Output dimensions for the cropped image
        let targetWidth = sourceWidth;
        let targetHeight = sourceHeight;

        // If rotated by 90 or 270 degrees, swap width and height
        if (rotation % 180 !== 0) {
          [targetWidth, targetHeight] = [targetHeight, targetWidth];
        }

        // Create canvas with correct dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Enable high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw the cropped image with rotation
        if (rotation > 0) {
          // For rotation, we need to:
          // 1. Translate to the center of the canvas
          // 2. Rotate by the specified angle
          // 3. Draw the image with correct offsets
          // 4. Restore the context

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);

          const rotatedOffsetX =
            rotation % 180 !== 0 ? -sourceHeight / 2 : -sourceWidth / 2;
          const rotatedOffsetY =
            rotation % 180 !== 0 ? -sourceWidth / 2 : -sourceHeight / 2;

          ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            rotatedOffsetX,
            rotatedOffsetY,
            sourceWidth,
            sourceHeight
          );

          ctx.restore();
        } else {
          // No rotation - simple draw
          ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );
        }
      } else {
        // Use the full image
        const sourceX = 0;
        const sourceY = 0;
        const sourceWidth = naturalWidth;
        const sourceHeight = naturalHeight;

        // Get output dimensions, accounting for rotation
        let targetWidth = sourceWidth;
        let targetHeight = sourceHeight;

        if (rotation % 180 !== 0) {
          [targetWidth, targetHeight] = [targetHeight, targetWidth];
        }

        // Set canvas size
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Apply rotation if needed
        if (rotation > 0) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate((rotation * Math.PI) / 180);

          const rotatedOffsetX =
            rotation % 180 !== 0 ? -sourceHeight / 2 : -sourceWidth / 2;
          const rotatedOffsetY =
            rotation % 180 !== 0 ? -sourceWidth / 2 : -sourceHeight / 2;

          ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            rotatedOffsetX,
            rotatedOffsetY,
            sourceWidth,
            sourceHeight
          );

          ctx.restore();
        } else {
          // No rotation - simple draw
          ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );
        }
      }

      // Create a high-quality JPEG data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      onSave(dataUrl);
    } catch (error) {
      console.error("Error saving edited image:", error);
    }
  }, [imgRef, completedCrop, rotation, onSave, hasModifiedCrop, scale]);

  // Handle crop change with scale adjustment
  const handleCropChange = useCallback((c: CropType) => {
    // Store the crop coordinates as they are shown on screen
    setCrop(c);
    setHasModifiedCrop(true);
  }, []);

  // Store the final crop coordinates, adjusted for scale
  const handleCropComplete = useCallback((c: PixelCrop) => {

    // Store the completed crop as-is (in screen coordinates)
    // The scale adjustment will happen when saving
    setCompletedCrop(c);
  }, []);

  const getEditorAreaStyle = () => {
    // Calculate the available height for the image area
    // Modal height minus header (60px), controls (64px), footer (80px), and some padding
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
        {/* Header */}
        <div className="p-4 flex justify-between items-center h-[60px]">
          <h2 className="text-xl font-medium">Editar foto</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Image editor area */}
        <div
          ref={containerRef}
          style={getEditorAreaStyle()}
          className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center p-2"
        >
          {imgReady && (
            <ReactCrop
              crop={crop}
              onChange={handleCropChange}
              onComplete={handleCropComplete}
              aspect={undefined}
              minWidth={10}
              minHeight={10}
              className="flex items-center justify-center max-h-full max-w-full"
              keepSelection={true}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Editable"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                  transition: "transform 0.2s ease",
                }}
                onLoad={onImageLoad}
                crossOrigin="anonymous"
                className="object-contain max-h-full max-w-full"
              />
            </ReactCrop>
          )}
          {!imgReady && (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#478C5C]"></div>
            </div>
          )}
          <canvas ref={previewCanvasRef} className="hidden" />
        </div>

        {/* Controls bar */}
        <div className="border-t border-gray-300 h-[64px]">
          <div className="flex h-full">
            {/* Rotate button */}
            <div className="flex-none w-52 border-r border-gray-300">
              <button
                onClick={handleRotate}
                className="flex items-center justify-center h-full w-full gap-2 text-gray-700 hover:bg-gray-100"
              >
                <RotateCw size={20} />
                <span className="font-medium">Girar</span>
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex-1 flex items-center justify-center px-4">
              <button
                onClick={handleZoomOut}
                className="text-gray-500 hover:text-gray-900 p-2"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-5 w-5 flex-shrink-0" />
              </button>
              <div className="w-[60%] mx-4">
                <Slider
                  defaultValue={[scale]}
                  value={[scale]}
                  min={0.5}
                  max={3}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  className="[&_.relative]:h-8 [&_[data-orientation=horizontal]]:h-[4px] [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-black"
                />
              </div>
              <button
                onClick={handleZoomIn}
                className="text-gray-500 hover:text-gray-900 p-2"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-5 w-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Save button */}
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
