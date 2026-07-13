import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '../../components';
import { Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';

const RecommendationButton = ({
  onPress,
}: {
  onPress: (value?: boolean) => void;
}) => {
  const Rtl = CheckRtl();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress()}>
      <View
        style={[
          Styles.container,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View
          style={{
            flexDirection: Rtl ? 'row-reverse' : 'row',
            alignItems: 'center',
          }}
        >
          <View>
            <Text style={Styles.heading}>Top recommendations available</Text>
          </View>
        </View>
        <AntDesign
          name={Rtl ? 'arrowleft' : 'arrowright'}
          size={wp(5)}
          color={Colors.color22}
        />
      </View>
    </TouchableOpacity>
  );
};

export default RecommendationButton;

const Styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 30,
    flexDirection: 'row',
    paddingHorizontal: wp(4),
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    borderColor: Colors.color47,
    borderWidth: 1,
    backgroundColor: Colors.color57,
    marginHorizontal: wp(3),
  },
  heading: {
    color: Colors.color22,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small1,
    includeFontPadding: false,
  },
});
