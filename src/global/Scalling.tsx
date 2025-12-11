import { Dimensions, PixelRatio } from 'react-native';

let screenWidth = Dimensions.get('window').width;
let screenHeight = Dimensions.get('window').height;

const widthPercentageToDP = (widthPercent: any) => {
    const elemWidth = typeof widthPercent === "number" ? widthPercent : parseFloat(widthPercent);
    return PixelRatio.roundToNearestPixel(screenWidth * elemWidth / 100);
};

const heightPercentageToDP = (heightPercent: any) => {
    const elemHeight = typeof heightPercent === "number" ? heightPercent : parseFloat(heightPercent);
    return PixelRatio.roundToNearestPixel(screenHeight * elemHeight / 100);
};

const listenOrientationChange = (setOrientation: React.Dispatch<React.SetStateAction<string>>) => {
    const updateOrientation = () => {
        const { width, height } = Dimensions.get('window');
        const newOrientation = width < height ? 'portrait' : 'landscape';
        setOrientation(newOrientation);
    };

    Dimensions.addEventListener('change', updateOrientation);
};


export {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
    listenOrientationChange
};
