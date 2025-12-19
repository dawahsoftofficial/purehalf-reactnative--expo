import ImageResizer from '@bam.tech/react-native-image-resizer';

const imageResizer = (params: any) => {
  return new Promise(async (resolve, reject) => {
    const { uri, width, height, fileSize, fileName } = params;
    let newWidth, newHeight;
    if (width > height) {
      newWidth = 1080;
      newHeight = Math.round((height / width) * newWidth);
    } else {
      newHeight = 1080;
      newWidth = Math.round((width / height) * newHeight);
    }
    ImageResizer.createResizedImage(uri, newWidth, newHeight, 'JPEG', 80, 0)
      .then((resizedImage) => {
        if (resizedImage.size < fileSize) {
          resolve(resizedImage);
        } else {
          const resizedImage = {
            height: height,
            width: width,
            uri: uri,
            name: fileName,
            size: fileSize,
          };
          resolve(resizedImage);
        }
      })
      .catch((error) => {
        console.error('error while reducing image size =>', error);
        reject('');
      });
  });
};

export { imageResizer };
