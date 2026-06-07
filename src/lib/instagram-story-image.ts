"use client";

export interface InstagramStoryImageData {
  title: string;
  campaignUrl: string;
  imageUrl?: string | null;
}

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const GREEN = "#2c6e49";
const DARK_GREEN = "#0f3524";
const LIGHT_GREEN = "#d9ead7";
const CREAM = "#f5f7e9";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
      continue;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;

    if (lines.length === maxLines) break;
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines && words.length > 0) {
    const lastIndex = lines.length - 1;
    while (
      ctx.measureText(`${lines[lastIndex]}...`).width > maxWidth &&
      lines[lastIndex].length > 0
    ) {
      lines[lastIndex] = lines[lastIndex].slice(0, -1).trim();
    }
    lines[lastIndex] = `${lines[lastIndex]}...`;
  }

  return lines;
}

function drawStoryLayout(
  ctx: CanvasRenderingContext2D,
  data: InstagramStoryImageData,
  campaignImage?: HTMLImageElement | null,
) {
  const gradient = ctx.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT);
  gradient.addColorStop(0, DARK_GREEN);
  gradient.addColorStop(0.62, GREEN);
  gradient.addColorStop(1, "#9dbc91");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  ctx.fillStyle = "rgba(245, 247, 233, 0.12)";
  ctx.beginPath();
  ctx.arc(930, 180, 280, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = CREAM;
  ctx.font = "700 64px Arial, sans-serif";
  ctx.fillText("MINKA", 86, 150);

  const imageBox = { x: 96, y: 250, width: 888, height: 760 };
  ctx.save();
  drawRoundedRect(
    ctx,
    imageBox.x,
    imageBox.y,
    imageBox.width,
    imageBox.height,
    48,
  );
  ctx.clip();
  if (campaignImage) {
    drawImageCover(
      ctx,
      campaignImage,
      imageBox.x,
      imageBox.y,
      imageBox.width,
      imageBox.height,
    );
  } else {
    ctx.fillStyle = LIGHT_GREEN;
    ctx.fillRect(imageBox.x, imageBox.y, imageBox.width, imageBox.height);
    ctx.fillStyle = GREEN;
    ctx.font = "700 52px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Campaña Minka", STORY_WIDTH / 2, imageBox.y + 330);
    ctx.textAlign = "left";
  }
  ctx.restore();

  ctx.fillStyle = CREAM;
  ctx.font = "700 76px Arial, sans-serif";
  const titleLines = wrapText(ctx, data.title, 880, 3);
  const titleStartY = 1165;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, 96, titleStartY + index * 90);
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = "500 42px Arial, sans-serif";
  const ctaStartY = titleStartY + titleLines.length * 90 + 82;
  const ctaLines = wrapText(
    ctx,
    "Conoce la historia y dona directamente en Minka.",
    780,
    2,
  );
  ctaLines.forEach((line, index) => {
    ctx.fillText(line, 96, ctaStartY + index * 58);
  });

  ctx.fillStyle = CREAM;
  drawRoundedRect(ctx, 96, 1610, 560, 112, 56);
  ctx.fill();
  ctx.fillStyle = DARK_GREEN;
  ctx.font = "700 44px Arial, sans-serif";
  ctx.fillText("Donar ahora", 240, 1682);

  ctx.strokeStyle = "rgba(245, 247, 233, 0.9)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(718, 1640);
  ctx.lineTo(820, 1640);
  ctx.lineTo(820, 1742);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(778, 1608);
  ctx.lineTo(844, 1608);
  ctx.lineTo(844, 1674);
  ctx.stroke();

  ctx.fillStyle = "rgba(245, 247, 233, 0.92)";
  ctx.font = "500 34px Arial, sans-serif";
  ctx.fillText("Agrega el enlace en el sticker de Instagram", 96, 1810);
  ctx.font = "500 30px Arial, sans-serif";
  ctx.fillText("minka-comunidad.org", 96, 1865);
}

export async function createInstagramStoryImage(
  data: InstagramStoryImageData,
  options: { includeCampaignImage?: boolean } = {},
) {
  const includeCampaignImage = options.includeCampaignImage !== false;
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No se pudo crear la imagen de historia.");
  }

  const campaignImage =
    includeCampaignImage && data.imageUrl
      ? await loadImage(data.imageUrl).catch(() => null)
      : null;

  drawStoryLayout(ctx, data, campaignImage);

  try {
    return canvas.toDataURL("image/png");
  } catch (error) {
    if (includeCampaignImage) {
      return createInstagramStoryImage(data, {
        includeCampaignImage: false,
      });
    }
    throw error;
  }
}

export async function dataUrlToPngFile(
  dataUrl: string,
  filename: string,
) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: "image/png" });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getInstagramStoryFilename(title?: string | null) {
  const safeTitle =
    title
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 42) || "campana";

  return `historia-minka-${safeTitle}.png`;
}
