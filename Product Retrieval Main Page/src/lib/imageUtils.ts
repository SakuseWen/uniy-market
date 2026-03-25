/**
 * 客户端图片压缩工具
 * 在上传前将大图片缩放到合理尺寸，避免后端验证失败
 */

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const QUALITY = 0.85;

/**
 * 压缩单张图片
 */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // 非图片文件直接返回
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 如果图片尺寸在限制内且文件小于 2MB，不压缩
      if (img.width <= MAX_WIDTH && img.height <= MAX_HEIGHT && file.size <= 2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      // 计算缩放比例
      let { width, height } = img;
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          console.log(`Image compressed: ${file.name} ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB (${width}x${height})`);
          resolve(compressed);
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
}

/**
 * 批量压缩图片
 */
export async function compressImages(files: File[]): Promise<File[]> {
  const results = await Promise.all(files.map(compressImage));
  return results;
}
