import ImageResizer from '@bam.tech/react-native-image-resizer';

const imageResizer = (params: any) => {
  return new Promise(async (resolve, reject) => {
    const { uri, path, width, height, fileSize, fileName } = params;
    // Android may provide path instead of uri; RN expects a single source
    const imageSource = uri ?? path;
    let newWidth, newHeight;
    if (width > height) {
      newWidth = 1080;
      newHeight = Math.round((height / width) * newWidth);
    } else {
      newHeight = 1080;
      newWidth = Math.round((width / height) * newHeight);
    }
    ImageResizer.createResizedImage(
      imageSource,
      newWidth,
      newHeight,
      'JPEG',
      80,
      0
    )
      .then((resizedImage) => {
        if (resizedImage.size < fileSize) {
          // Resizer may return path on Android; ensure uri for upload
          resolve({
            ...resizedImage,
            uri: resizedImage.uri ?? resizedImage.path ?? imageSource,
          });
        } else {
          resolve({
            height: height,
            width: width,
            uri: imageSource,
            name: fileName,
            size: fileSize,
          });
        }
      })
      .catch((error) => {
        console.error('error while reducing image size =>', error);
        reject('');
      });
  });
};

export { imageResizer };
