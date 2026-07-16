import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';

import { Animation } from '../../animations';
import { Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { stripLeadingEmoji } from '../../lib/utils/profile-utils';
import { Colors, Fonts } from '../../res';
import { flashErrorMessage } from '../../services';

type InterestItem = { id: string; value: string; selected?: boolean };

type InterestsPickerModalProps = {
  visible: boolean;
  data: InterestItem[];
  saving?: boolean;
  privacyVisible?: boolean;
  privacyUpdating?: boolean;
  onPrivacyChange?: () => void;
  onClose: () => void;
  onSave: (ids: string[]) => void;
};

const InterestsPickerModal = ({
  visible,
  data,
  saving = false,
  privacyVisible = true,
  privacyUpdating = false,
  onPrivacyChange,
  onClose,
  onSave,
}: InterestsPickerModalProps) => {
  const Rtl = CheckRtl();
  const { t } = useTranslation();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setIds(
        (data ?? []).filter((item) => item?.selected).map((item) => item?.id)
      );
    }
  }, [visible, data]);

  const toggleId = useCallback((interestId: string) => {
    setIds((prev) => {
      const index = prev.indexOf(interestId);
      if (index !== -1) {
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      }
      if (prev.length >= 10) {
        flashErrorMessage(LanguageKeys.interestAndHobbiesLimit);
        return prev;
      }
      return [...prev, interestId];
    });
  }, []);

  const selectedItems = (data ?? []).filter((item) => ids.includes(item?.id));
  const unselectedItems = (data ?? []).filter(
    (item) => !ids.includes(item?.id)
  );
  const rowDirection = { flexDirection: Rtl ? 'row-reverse' : 'row' } as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar
        backgroundColor={Colors.blackRGBA50}
        barStyle="light-content"
      />
      <TouchableOpacity
        style={Styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animation style={Styles.sheet}>
          <TouchableOpacity activeOpacity={1} style={Styles.sheetContent}>
            <View style={Styles.headerCon}>
              <Text style={Styles.headerTxt} numberOfLines={1}>
                {LanguageKeys.myInterestAndHobbies}
              </Text>
              <AntDesign
                name="closecircle"
                color={Colors.color1}
                size={wp(6)}
                style={Styles.closeBtn}
                onPress={onClose}
              />
            </View>
            <View style={Styles.subHead}>
              <Text style={Styles.subtitle}>
                {`${t(LanguageKeys.interestAndHobbiesLimit)} · ${ids.length}/10`}
              </Text>
              {onPrivacyChange ? (
                <Ripple
                  onPress={onPrivacyChange}
                  disabled={privacyUpdating}
                  style={Styles.privacyToggle}
                >
                  <Entypo
                    name={privacyVisible ? 'eye' : 'eye-with-line'}
                    size={wp(3.6)}
                    color={Colors.primary}
                  />
                  <Text style={Styles.privacyToggleTxt}>
                    {privacyVisible
                      ? LanguageKeys.hideField
                      : LanguageKeys.unhideField}
                  </Text>
                </Ripple>
              ) : null}
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={Styles.list}
              contentContainerStyle={Styles.listContent}
            >
              {selectedItems.length > 0 ? (
                <>
                  <Text style={Styles.groupLabel}>
                    {LanguageKeys.selectedSectionLabel}
                  </Text>
                  <View style={[Styles.pills, rowDirection]}>
                    {selectedItems.map((item) => (
                      <Ripple
                        key={item.id}
                        onPress={() => toggleId(item.id)}
                        style={[Styles.pill, Styles.pillOn]}
                      >
                        <Text style={[Styles.pillTxt, Styles.pillTxtOn]}>
                          {stripLeadingEmoji(item?.value ?? '')}
                        </Text>
                      </Ripple>
                    ))}
                  </View>
                  <View style={Styles.divider} />
                </>
              ) : null}
              {unselectedItems.length > 0 ? (
                <>
                  <Text style={Styles.groupLabel}>
                    {LanguageKeys.otherOptionsLabel}
                  </Text>
                  <View style={[Styles.pills, rowDirection]}>
                    {unselectedItems.map((item) => (
                      <Ripple
                        key={item.id}
                        onPress={() => toggleId(item.id)}
                        style={Styles.pill}
                      >
                        <Text style={Styles.pillTxt}>
                          {stripLeadingEmoji(item?.value ?? '')}
                        </Text>
                      </Ripple>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>
            <View style={Styles.footer}>
              <Button
                text={LanguageKeys.update}
                onPress={saving ? undefined : () => onSave(ids)}
                disabled={saving}
                loading={saving}
                loadingMessage={LanguageKeys.updating}
              />
            </View>
          </TouchableOpacity>
        </Animation>
      </TouchableOpacity>
    </Modal>
  );
};

export default InterestsPickerModal;

const Styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Colors.blackRGBA50,
    justifyContent: 'flex-end',
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.color2,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    maxHeight: hp(86),
  },
  sheetContent: {
    flexShrink: 1,
  },
  headerCon: {
    borderBottomWidth: 0.2,
    borderBottomColor: Colors.color4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingVertical: hp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color8,
  },
  headerTxt: {
    color: Colors.color1,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    lineHeight: wp(5),
    maxWidth: wp(80),
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: hp(1),
    position: 'absolute',
    paddingHorizontal: wp(2),
  },
  subHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingTop: hp(1.2),
    paddingBottom: hp(0.8),
  },
  subtitle: {
    flex: 1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.muted,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  privacyToggleTxt: {
    alignSelf: 'center',
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  list: {
    paddingHorizontal: wp(3),
    flexShrink: 1,
  },
  listContent: {
    paddingTop: hp(0.5),
    paddingBottom: hp(3),
  },
  groupLabel: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.muted,
    paddingHorizontal: wp(1),
    marginTop: hp(1),
    marginBottom: hp(0.8),
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    marginTop: hp(1.2),
    marginHorizontal: wp(1),
  },
  pills: {
    flexWrap: 'wrap',
    paddingHorizontal: wp(1),
  },
  pill: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.1),
    margin: hp(0.6),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  pillOn: {
    backgroundColor: Colors.primary,
  },
  pillTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  pillTxtOn: {
    color: Colors.color2,
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    backgroundColor: Colors.color2,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
});
