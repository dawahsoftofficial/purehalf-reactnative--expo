import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { AnimatedLoader, Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices } from '../../services';
import RequestedList from './RequestedList';

type TopBarButtonProps = {
  selectedTopBarBtn: string;
  onTopBarPress: (btn: string) => void;
  btnType: 'othersRequests' | 'yourRequests';
  label: string;
};

const RenderTopBarButton = ({
  selectedTopBarBtn,
  onTopBarPress,
  btnType,
  label,
}: TopBarButtonProps) => (
  <Ripple
    style={{
      ...Styles.topBarBtn,
      backgroundColor:
        selectedTopBarBtn === btnType ? Colors.theme : 'transparent',
    }}
    onPress={() => onTopBarPress(btnType)}
  >
    <Text
      style={{
        ...Styles.topBarBtnTxt,
        fontFamily:
          selectedTopBarBtn === btnType ? Fonts.APPFONT_SB : Fonts.APPFONT_R,
        color: selectedTopBarBtn === btnType ? Colors.color2 : Colors.ink,
      }}
    >
      {label}
    </Text>
  </Ripple>
);

const PrivatePhotoRequest = (props: any) => {
  const [loader, setLoader] = useState(true);
  const [selectedTopBarBtn, setSelectedTopBarBtn] = useState('othersRequests');
  const [othersRequests, setOthersRequests] = useState<any>([]);
  const [othersRequestsPage, setOthersRequestsPage] = useState<any>(1);
  const [yourRequests, setYourRequests] = useState<any>([]);
  const [yourRequestsPage, setYourRequestsPage] = useState<any>(1);
  const [loadMoreLoader, setLoadMoreLoader] = useState(false);

  const onTopBarPress = (btn: any) => setSelectedTopBarBtn(btn);

  const hideLoader = () => setLoader(false);

  const getOthersRequests = (
    params = { page: 1, type: 5 },
    othersRequestsList = othersRequests
  ) => {
    ApiServices.getUsers(params)
      .then((res: any) => {
        if (othersRequestsList.length === 0) {
          setOthersRequests(res);
        } else {
          othersRequestsList.push(...res);
          setOthersRequests(othersRequestsList);
        }
        setLoader(false);
        setLoadMoreLoader(false);
      })
      .catch(hideLoader);
  };

  const getYourRequests = (
    params = { page: 1, type: 6 },
    yourRequestsList = yourRequests
  ) => {
    ApiServices.getUsers(params)
      .then((res: any) => {
        if (yourRequestsList.length === 0) {
          setYourRequests(res);
        } else {
          yourRequestsList.push(...res);
          setYourRequests(yourRequestsList);
        }
        setLoader(false);
        setLoadMoreLoader(false);
      })
      .catch(hideLoader);
  };

  useEffect(() => {
    getOthersRequests();
    getYourRequests();
  }, []);

  const onLoadMoreOthersRequests = () => {
    setLoadMoreLoader(true);
    setOthersRequestsPage(othersRequestsPage + 1);
    const params = {
      page: othersRequestsPage + 1,
      type: 5,
    };
    getOthersRequests(params, othersRequests);
  };

  const onLoadMoreYourRequests = () => {
    setLoadMoreLoader(true);
    setYourRequestsPage(yourRequestsPage + 1);
    const params = {
      page: yourRequestsPage + 1,
      type: 6,
    };
    getYourRequests(params, yourRequests);
  };

  return (
    <Container style={Styles.screen}>
      <Header
        title="Private Photo request"
        navigation={props.navigation}
        titleVariant="display"
      />
      <View style={Styles.container}>
        <View style={Styles.topBarContainer}>
          <RenderTopBarButton
            selectedTopBarBtn={selectedTopBarBtn}
            onTopBarPress={onTopBarPress}
            btnType="othersRequests"
            label={LanguageKeys.othersRequested}
          />
          <RenderTopBarButton
            selectedTopBarBtn={selectedTopBarBtn}
            onTopBarPress={onTopBarPress}
            btnType="yourRequests"
            label={LanguageKeys.youRequested}
          />
        </View>
        {loader ? (
          <AnimatedLoader text="Loading..." style={Styles.loader} />
        ) : selectedTopBarBtn === 'othersRequests' ? (
          <RequestedList
            data={othersRequests}
            onLoadMorePress={onLoadMoreOthersRequests}
            loadMoreLoader={loadMoreLoader}
            from="othersRequests"
          />
        ) : (
          <RequestedList
            data={yourRequests}
            onLoadMorePress={onLoadMoreYourRequests}
            loadMoreLoader={loadMoreLoader}
            from="yourRequests"
          />
        )}
      </View>
    </Container>
  );
};

export default PrivatePhotoRequest;

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
  container: {
    paddingHorizontal: wp(4),
  },
  topBarContainer: {
    marginVertical: hp(1.5),
    borderRadius: 30,
    padding: wp(1.2),
    backgroundColor: Colors.lavender,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarBtn: {
    width: wp(43),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: hp(0.9),
    backgroundColor: 'transparent',
    marginHorizontal: wp(1),
  },
  topBarBtnTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    alignSelf: 'center',
  },
  badgeView: {
    width: width * 0.033,
    height: width * 1 * 0.033,
    borderRadius: (width * 1 * 0.033) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    backgroundColor: Colors.color24,
    top: hp(-0.5),
  },
  badgeTxt: {
    color: Colors.color2,
    fontSize: wp(2.6),
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    alignSelf: 'center',
  },
  loader: {
    marginTop: hp(30),
  },
});
