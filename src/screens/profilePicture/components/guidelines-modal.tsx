import React, { memo } from 'react';
import { Image, Modal, StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Button } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts, Images } from '../../../res';
import { isIOS } from '../../../services';

type User = {
  gender?: string;
  [key: string]: unknown;
};

type GuidelinesModalProps = {
  visible: boolean;
  user: User | null;
  onClose: () => void;
};

function GuidelinesModal({ visible, user, onClose }: GuidelinesModalProps) {
  const isFemale = user?.gender === 'female';

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={Styles.modalWrapper}>
        <Ripple style={Styles.closeWrapper} onPress={onClose}>
          <AntDesign name="close" size={wp(6)} color={Colors.color1} />
        </Ripple>
        <View style={Styles.tooltipTextWrapper}>
          <Text style={Styles.tooltipTitle}>Guildlines</Text>
          <Text style={Styles.guidelineText}>
            {`\u2022`} The picture quality should be high and not blurry. The
            picture should not be your whole body but only the face and upper
            portion of your body like a passport picture.
          </Text>
          <Text style={Styles.guidelineText}>
            {`\u2022`} The profile picture should be a front facing picture that
            is clearly visible, avoid sunglasses and should not be facing some
            other way.
          </Text>
          <Text style={Styles.guidelineText}>
            {`\u2022`} We have already added some instructions on the profile
            picture screen by clicking on the i icon.
          </Text>
          <View style={Styles.pfpContainer}>
            <View>
              <Text style={Styles.pfpText}>Incorrect</Text>
              <Image
                source={isFemale ? Images.wrongPFPFemale : Images.wrongPFP}
                style={Styles.pfpImage}
              />
            </View>
            <View>
              <Text style={Styles.pfpText}>Correct</Text>
              <Image
                source={isFemale ? Images.rightPfpFemale : Images.rightPfp}
                style={Styles.pfpImage}
              />
            </View>
          </View>
        </View>
        <Button
          text={LanguageKeys.close}
          onPress={onClose}
          buttonStyle={Styles.closeBtn}
          textStyle={Styles.closeBtnText}
        />
      </View>
    </Modal>
  );
}

export default memo(GuidelinesModal);

const Styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.color2,
  },
  closeWrapper: {
    alignSelf: 'flex-end',
    paddingRight: 10,
    marginTop: isIOS ? 45 : 5,
  },
  tooltipTextWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  tooltipTitle: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium2,
    marginTop: 20,
  },
  guidelineText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color22,
    marginTop: 5,
  },
  pfpContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 20,
  },
  pfpText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.color1,
  },
  pfpImage: {
    width: wp(42),
    height: hp(20),
    borderRadius: 5,
  },
  closeBtn: {
    backgroundColor: Colors.color2,
    borderWidth: 1,
    borderColor: Colors.greyRGBA61,
    marginBottom: hp(2),
    marginHorizontal: wp(5),
  },
  closeBtnText: {
    color: Colors.blackRGBA70,
  },
});
