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

const PrivatePhotoRequest = (props: any) => {
  const [loader, setLoader] = useState(true);
  const [selectedTopBarBtn, setSelectedTopBarBtn] = useState('othersRequests');
  const [othersRequests, setOthersRequests] = useState<any>([]);
  const [othersRequestsPage, setOthersRequestsPage] = useState<any>(1);
  const [yourRequests, setYourRequests] = useState<any>([]);
  const [yourRequestsPage, setYourRequestsPage] = useState<any>(1);
  const [loadMoreLoader, setLoadMoreLoader] = useState(false);

  const onTopBarPress = (btn: any) => setSelectedTopBarBtn(btn);

  const RenderOthersRequestedBtn = () => (
    <Ripple
      style={{
        ...Styles.topBarBtn,
        backgroundColor:
          selectedTopBarBtn === 'othersRequests' ? Colors.theme : Colors.color2,
      }}
      onPress={onTopBarPress.bind(null, 'othersRequests')}
    >
      <Text
        style={{
          ...Styles.topBarBtnTxt,
          color:
            selectedTopBarBtn === 'othersRequests'
              ? Colors.color2
              : Colors.color1,
        }}
      >
        {LanguageKeys.othersRequested}
      </Text>
    </Ripple>
  );

  const RenderYouRequested = () => (
    <Ripple
      style={{
        ...Styles.topBarBtn,
        backgroundColor:
          selectedTopBarBtn === 'yourRequests' ? Colors.theme : Colors.color2,
      }}
      onPress={onTopBarPress.bind(null, 'yourRequests')}
    >
      <Text
        style={{
          ...Styles.topBarBtnTxt,
          color:
            selectedTopBarBtn === 'yourRequests'
              ? Colors.color2
              : Colors.color1,
        }}
      >
        {LanguageKeys.youRequested}
      </Text>
    </Ripple>
  );

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
    <Container>
      <Header title="Private Photo request" navigation={props.navigation} />
      <View style={Styles.container}>
        <View style={Styles.topBarContainer}>
          <RenderOthersRequestedBtn />
          <RenderYouRequested />
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
  container: {
    paddingHorizontal: wp(4),
  },
  topBarContainer: {
    marginVertical: hp(1),
    borderRadius: 30,
    paddingVertical: hp(1),
    backgroundColor: Colors.color13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarBtn: {
    width: wp(40),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: hp(0.3),
    backgroundColor: Colors.color2,
    marginHorizontal: wp(2),
  },
  topBarBtnTxt: {
    color: Colors.color1,
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
