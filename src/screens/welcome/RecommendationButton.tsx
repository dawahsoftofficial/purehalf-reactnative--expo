import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '../../components';
import { Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import { StorageManager } from '../../services';

const RecommendationButton = ({
  onPress,
}: {
  onPress: (value?: boolean) => void;
}) => {
  const { t }: any = useTranslation();
  const [isShow, setIsShow] = useState<boolean>(false);
  const [date, setDate] = useState<string>('');
  const Rtl = CheckRtl();

  useEffect(() => {
    checkRecommended();
  }, []);

  const checkRecommended = async () => {
    const currentTime = new Date();
    // currentTime.setHours(19, 30, 0);

    const startTime = new Date();
    startTime.setHours(18, 0, 0); // 6 pm

    const endTime = new Date();
    endTime.setHours(23, 59, 59); // 12 pm

    // Check if the current time is between 6 pm and 12 pm
    if (currentTime >= startTime && currentTime <= endTime) {
      setIsShow(true);
      onPress(true);
      const isRecommended = StorageManager.getString(
        StorageManager.storageKeys.IS_RECOMMENDED
      );
      if (isRecommended === 'false') {
        StorageManager.setString(
          StorageManager.storageKeys.IS_RECOMMENDED,
          'true'
        );
        onPress(true);
      }
    } else {
      setIsShow(false);
      if (currentTime < startTime) {
        // If before 7 pm, use today's date
        const day = currentTime.getDate().toString().padStart(2, '0');
        const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
        setDate(`${day}/${month}`);
      } else {
        // If after 7 pm, get the next day's date
        const nextDay = new Date(currentTime);
        nextDay.setDate(currentTime.getDate() + 1);
        const day = nextDay.getDate().toString().padStart(2, '0');
        const month = (nextDay.getMonth() + 1).toString().padStart(2, '0');
        setDate(`${day}/${month}`);
      }
    }
  };

  if (!isShow || isShow) {
    return null;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={isShow ? () => onPress() : () => {}}
    >
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
            <Text style={Styles.heading}>
              {isShow
                ? t('recommendationAvailable')
                : t('newRecommendation') + ' ' + date}
            </Text>
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
  },
  heading: {
    color: Colors.color22,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small1,
    includeFontPadding: false,
  },
});
