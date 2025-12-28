import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { wp } from '../../../global';
import { CheckRtl } from '../../../languages';
import { Colors } from '../../../res';

type PhoneHeaderProps = {
  top: number;
  onGoBack: () => void;
};

function PhoneHeader({ top, onGoBack }: PhoneHeaderProps) {
  const Rtl = CheckRtl();

  return (
    <View
      style={[
        Styles.container,
        {
          top,
          left: wp(4),
        },
      ]}
    >
      <TouchableOpacity onPress={onGoBack}>
        <AntDesign
          name={Rtl ? 'arrowright' : 'arrowleft'}
          color={Colors.color1}
          size={wp(6)}
        />
      </TouchableOpacity>
    </View>
  );
}

export default memo(PhoneHeader);

const Styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
});
