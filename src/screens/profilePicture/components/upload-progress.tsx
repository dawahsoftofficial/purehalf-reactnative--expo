import React from 'react';
import { StyleSheet, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

import { hp, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';

type UploadProgressProps = {
  progress: number;
};

function UploadProgress({ progress }: UploadProgressProps) {
  // Ensure progress is a valid number between 0 and 100
  const normalizedProgress = Math.min(Math.max(Number(progress) || 0, 0), 100);

  return (
    <View style={Styles.container}>
      <CircularProgress
        value={normalizedProgress}
        maxValue={100}
        radius={110}
        duration={100}
        progressValueColor={Colors.color1}
        title={normalizedProgress.toString()}
        titleColor={Colors.color1}
        subtitle="Uploading"
        titleStyle={Styles.titleStyle}
        progressValueStyle={Styles.progressValueStyle}
        inActiveStrokeColor={Colors.color18}
        activeStrokeColor={Colors.theme}
        showProgressValue={false}
      />
    </View>
  );
}

export default UploadProgress;

const Styles = StyleSheet.create({
  container: {
    marginTop: hp(3),
    width: wp(70),
    height: wp(70),
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  titleStyle: {
    fontSize: 25,
    fontFamily: Fonts.APPFONT_B,
  },
  progressValueStyle: {
    fontSize: 16,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
  },
});
