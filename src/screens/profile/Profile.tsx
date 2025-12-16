import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text as ReactText,
  TextInput,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';

import {
  Button,
  ButtonPicker,
  Loader,
  ModalLoader,
  PremiumButton,
  Text,
} from '../../components';
import { hp, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import {
  ApiServices,
  Firebase,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import EditInfoCardModal from './EditInfoCardModal';
import EditInterestCardModal from './EditInterestCardModal';
import Header from './Header';
import InfoCard from './InfoCard';
import InterestAndHobbyCard from './InterestAndHobbyCard';
import InterestAndHobbyCardStatic from './InterestAndHobbyCardStatic';
import Styles from './Styles';

const Profile = (props: any) => {
  const { currentUser, updateCurrentUser, conversations } = useGlobalContext();
  const scrollViewRef: any = useRef(null);
  const Rtl = CheckRtl();
  const isFocused = useIsFocused();
  const [tagLineInputVisible, setTagLineInputVisible] = useState(false);
  const [tagLineInput, setTagLineInput] = useState('');
  const [error, setError] = useState<boolean>(false);
  const [userConversation, setUserConversation] = useState<any>(null);

  const [loader, setLoader] = useState({
    visible: true,
    message: LanguageKeys.loading,
  });

  const [buttonPickerVisible, setButtonPickerVisible] = useState<any>({
    pickerData: [],
    pickerHeaderTitle: '',
    visible: false,
    item: '',
    from: '',
  });

  const { getData, storageKeys, setData } = StorageManager;

  const { fromUserProfile = false } = props;

  const [editInfoCard, setEditInfoCard] = useState({
    visible: false,
    data: [],
    from: '',
  });

  const [editInterestCard, setEditInterestCard] = useState({
    visible: false,
    data: [],
    from: '',
  });

  const [userData, setUserData] = useState<any>(
    props?.userData ? props.userData : currentUser
  );
  const [interestAndHobbies, setIinterestAndHobbies] = useState([]);
  const [isBlockedByYou, setIsBlockedByYou] = useState(false);
  const [isBlockedYou, setIsBlockedYou] = useState(false);
  const [categoriesData, setCategoriesData] = useState<any>({});
  const [matchingData, setMatchingData] = useState<any>({});
  const [dataLoader, setDataLoader] = useState(true);

  let blockPickerData = [
    {
      label: LanguageKeys.block,
      value: 'block',
    },
    {
      label: LanguageKeys.reportAndBlock,
      value: 'blockAndReport',
    },
    {
      label: LanguageKeys.cancel,
      value: 'cancel',
    },
  ];

  if (isBlockedByYou) {
    blockPickerData = [
      {
        label: LanguageKeys.unBlock,
        value: 'unBlock',
      },
      {
        label: LanguageKeys.cancel,
        value: 'cancel',
      },
    ];
  }

  const scrollToSection = () => {
    scrollViewRef.current.scrollTo({
      y: props?.route.params?.scrollTo,
      animated: true,
    });
  };

  useEffect(() => {
    props?.route?.params?.scrollTo && scrollToSection();
  }, [props?.route?.params?.scrollTo]);

  useFocusEffect(
    React.useCallback(() => {
      if (userData?.id !== currentUser?.id) {
        ApiServices.getUserDetail(userData?.id).then((res) => {
          setUserData(res);
        });
      }
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (fromUserProfile) {
        getUserConversation();
      }
    }, [conversations])
  );

  const getUserConversation = () => {
    const conversationData = conversations.filter((element: any) => {
      const deleteFlag = element.convDetails.participantsDeleteFlag;
      return deleteFlag.hasOwnProperty(JSON.stringify(userData?.id));
    });
    if (conversationData && conversationData.length !== 0) {
      if (
        conversationData[0] &&
        Object.keys(conversationData[0]?.convDetails).length !== 0
      ) {
        const { convDetails } = conversationData[0];
        setUserConversation(convDetails);
      }
    } else {
      Firebase.getSingleConversation(currentUser?.id, userData?.id).then(
        (data: any) => {
          if (data && data?.length !== 0) {
            if (
              conversationData[0] &&
              Object.keys(conversationData[0]?.convDetails).length !== 0
            ) {
              const { convDetails } = conversationData[0];
              setUserConversation(convDetails);
            }
          }
        }
      );
      // .catch(() => setMessageButtonLoader(false))
    }
  };

  const hideButtonPicker = () => {
    setButtonPickerVisible({
      visible: false,
      item: '',
      from: '',
      pickerData: [],
      pickerHeaderTitle: '',
    });
  };

  const closeEditInfoCard = () => {
    setEditInfoCard({
      visible: false,
      data: [],
      from: '',
    });
  };

  const onInfoCardEdit = ({ data, from }: any) => {
    setEditInfoCard({
      visible: true,
      data: data,
      from: from,
    });
  };

  const closeEditInterestCard = () => {
    setEditInterestCard({
      visible: false,
      data: [],
      from: '',
    });
  };

  const onInterestCardEdit = ({ data, from }: any) => {
    setEditInterestCard({
      visible: true,
      data: data,
      from: from,
    });
  };

  const getAttribute = (Data: any, userData: any) => {
    getData(storageKeys.ATTRIBUTE).then((attributeRes: any) => {
      if (attributeRes) {
        if (attributeRes.hasOwnProperty('personality-0')) {
          const interest = attributeRes['personality-0'];
          interest?.forEach((element: any) => {
            if (userData?.detail?.personality_id?.includes(element.id)) {
              element.selected = true;
            }
          });
          setIinterestAndHobbies(interest);
        }
        const catData: any = {};
        for (const child in Data) {
          Data[child].forEach((element: any) => {
            if (child !== 'personalityRequirements') {
              const result = attributeRes[element.category][element.id];
              if (result) {
                element.data = result;
              }
            }
            if (
              userData?.detail &&
              Object.keys(userData?.detail).length !== 0
            ) {
              const value = userData?.detail[element.apiKey];

              if (value !== null && value !== undefined) {
                if (element.type === 'dropDown') {
                  const result = _.find(element?.data, function (n) {
                    if (n.id === value) {
                      return n;
                    }
                  });

                  if (result) {
                    element.selected = result;
                  } else if (
                    element.id === 'language' ||
                    element.id === 'nationality'
                  ) {
                    element.selected = {
                      id: value?.id,
                      value: value?.name,
                    };
                  }
                } else if (element.type === 'scalling') {
                  element.id === 'height'
                    ? (element.selected = {
                        scale: userData?.detail?.height_scale,
                        value: userData?.detail?.height,
                      })
                    : (element.selected = {
                        scale: userData?.detail?.weight_scale,
                        value: userData?.detail?.weight,
                      });
                } else {
                  element.selected = {
                    id: element?.id,
                    value: value,
                    category: element?.category,
                  };
                }
              }
            }
          });
          catData[child] = Data[child];
        }
        setCategoriesData(catData);
        setDataLoader(false);
      }
    });
  };

  const fetchData = async () => {
    const data = await getData(storageKeys.PROFILE_DETAIL_LOCAL);
    setError(false);
    if (data) {
      if (fromUserProfile) {
        try {
          setLoader({
            visible: true,
            message: LanguageKeys.loading,
          });
          const user: any = await ApiServices.getUserDetail(userData?.id);
          setUserData(user);
          if (user?.detail?.tagline) {
            setTagLineInput(user.detail.tagline);
          }
          setIsBlockedByYou(user?.blocked === 1);
          setIsBlockedYou(user?.blocked_you === 1);
          setMatchingData(user?.detail?.personality_id_value);
          if (user?.blocked_you !== 1) {
            getAttribute(data, user);
          } else {
            setDataLoader(false);
          }
        } catch (error) {
          setError(true);
          setDataLoader(false);
          hideLoader();
        }
      } else {
        try {
          setLoader({
            visible: true,
            message: LanguageKeys.loading,
          });
          const user: any = await ApiServices.getCurrentUserDetail();
          setUserData(user);
          if (user?.detail?.tagline) {
            setTagLineInput(user.detail.tagline);
          }
          getAttribute(data, user);
        } catch (error) {
          setError(true);
          setDataLoader(false);
          hideLoader();
        }
      }
    }
    setDataLoader(false);
    hideLoader();
  };

  useEffect(() => {
    fetchData();
  }, [isFocused]);

  const onBlockPress = () => {
    const pickerHeaderTitle = isBlockedByYou
      ? LanguageKeys.unBlockAlertSureDes
      : LanguageKeys.blockAlertSureDes;
    setButtonPickerVisible({
      visible: true,
      item: userData,
      from: 'block',
      pickerData: blockPickerData,
      pickerHeaderTitle: pickerHeaderTitle,
    });
  };

  const onLikeUnlikePress = (value: any) => {
    const params = {
      type: 2,
      action_user_id: userData?.id,
      allow_photo_request: 0,
    };
    ApiServices.interactionAction(params).then(() => {
      flashSuccessMessage(value ? LanguageKeys.liked : LanguageKeys.unLiked);
    });
  };

  const hideLoader = () => {
    setLoader({
      visible: false,
      message: '',
    });
  };

  const onButtonPickerButtonPress = (item: any) => {
    hideButtonPicker();
    const { value } = item;
    if (value === 'block' || value === 'unBlock') {
      setLoader({
        visible: true,
        message: isBlockedByYou
          ? LanguageKeys.unBlockingUser
          : LanguageKeys.blockingUser,
      });
      const params = {
        type: 7,
        action_user_id: userData?.id,
        allow_photo_request: 0,
      };
      ApiServices.interactionAction(params)
        .then(() => {
          Firebase.blockUnBlockConv(
            userConversation?.id,
            userData?.id,
            !isBlockedByYou
          )
            .then(() => {
              flashSuccessMessage(
                !isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked
              );
            })
            .catch();
          setIsBlockedByYou(!isBlockedByYou);
          userData.blocked = value === 'block' ? 1 : 0;
          // userData.block_by_you = value === 'block' ? 1 : 0
          setUserData(userData);
          hideLoader();
        })
        .catch(hideLoader);
    } else if (value === 'blockAndReport') {
      setLoader({
        visible: true,
        message: isBlockedByYou
          ? LanguageKeys.unBlockingUser
          : LanguageKeys.blockingUser,
      });
      const params = {
        type: 8,
        action_user_id: userData?.id,
        allow_photo_request: 0,
      };
      ApiServices.interactionAction(params)
        .then(() => {
          Firebase.blockUnBlockConv(
            userConversation?.id,
            userData?.id,
            !isBlockedByYou
          )
            .then(() => {
              flashSuccessMessage(
                !isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked
              );
            })
            .catch();
          setIsBlockedByYou(!isBlockedByYou);
          userData.blocked = value === 'block' ? 1 : 0;
          setUserData(userData);
          hideLoader();
        })
        .catch(hideLoader);
    }
  };

  const showTagLineInput = () => setTagLineInputVisible(true);
  const hideTagLineInput = () => {
    setTagLineInputVisible(false);
  };
  const onTagLineSubmit = () => {
    setLoader({
      visible: true,
      message: LanguageKeys.submitting,
    });
    ApiServices.updateDetails({ tagline: tagLineInput })
      .then(async (res) => {
        currentUser.detail = res;
        await setData(storageKeys.USER, currentUser);
        updateCurrentUser(currentUser);
        fetchData();
        flashSuccessMessage(LanguageKeys.submitted);
        // hideLoader()
        hideTagLineInput();
      })
      .catch(hideLoader);
  };

  const onChangeTagLine = (text: any) => setTagLineInput(text);

  return (
    // <SafeAreaView  style={[Styles.container , {backgroundColor:Colors.blackRGBA50}]} >

    <View style={Styles.container}>
      <StatusBar backgroundColor={Colors.color1} barStyle={'light-content'} />
      <ModalLoader visible={loader.visible} message={loader.message} />
      {currentUser?.membership_status === 0 && <PremiumButton />}
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
          <Header
            navigation={props.navigation}
            fromUserProfile={fromUserProfile}
            userData={userData}
            onBlockPress={onBlockPress}
            onLikeUnlikePress={onLikeUnlikePress}
            isBlockedYou={isBlockedYou}
          />
          {/* {
                        fromUserProfile &&
                        <View style={{ marginBottom: hp(5) }} />
                    } */}
          {isBlockedYou ? (
            <Text style={Styles.userNotAvailDes}>
              {LanguageKeys.userBlockedYouDes}
            </Text>
          ) : (
            <>
              {tagLineInputVisible ? (
                <View
                  style={{
                    ...Styles.tagLineOuterCon,
                    paddingHorizontal: wp(4),
                    flexDirection: Rtl ? 'row-reverse' : 'row',
                  }}
                >
                  <TextInput
                    style={{
                      ...Styles.tagLineInput,
                      textAlign: Rtl ? 'right' : 'left',
                    }}
                    placeholder={'Enter Tagline'}
                    placeholderTextColor={Colors}
                    onChangeText={onChangeTagLine}
                    value={tagLineInput}
                  />
                  <Ripple
                    style={Styles.tagLineSubmitBtn}
                    onPress={onTagLineSubmit}
                  >
                    <AntDesign name="check" color={Colors.theme} size={wp(6)} />
                  </Ripple>
                  <Ripple
                    style={{
                      ...Styles.tagLineSubmitBtn,
                      backgroundColor: Colors.blackRGBA25,
                    }}
                    onPress={hideTagLineInput}
                  >
                    <AntDesign
                      name="close"
                      color={Colors.color1}
                      size={wp(6)}
                    />
                  </Ripple>
                </View>
              ) : !fromUserProfile ? (
                <View
                  style={{
                    ...Styles.tagLineOuterCon,
                    flexDirection: Rtl ? 'row-reverse' : 'row',
                  }}
                >
                  {userData?.detail?.tagline ? (
                    <ReactText style={Styles.tagLineHeading} numberOfLines={1}>
                      {userData?.detail?.tagline}
                    </ReactText>
                  ) : (
                    <Text style={Styles.tagLineHeading}>
                      {LanguageKeys.tagline}
                    </Text>
                  )}
                  <Ripple style={Styles.editButton} onPress={showTagLineInput}>
                    <Feather name="edit-2" color={Colors.color1} size={wp(4)} />
                  </Ripple>
                </View>
              ) : userData?.detail?.tagline ? (
                <View
                  style={{
                    ...Styles.tagLineOuterCon,
                    flexDirection: Rtl ? 'row-reverse' : 'row',
                  }}
                >
                  <ReactText style={Styles.tagLineHeading} numberOfLines={1}>
                    {userData?.detail?.tagline}
                  </ReactText>
                </View>
              ) : (
                <View style={{ marginBottom: hp(5) }} />
              )}
              {dataLoader ? (
                <Loader />
              ) : (
                <View>
                  {error ? (
                    <View>
                      <Text style={Styles.somethingWentWrontText}>
                        {LanguageKeys.somethingWentWrong}
                      </Text>
                      <Button
                        text={LanguageKeys.tryAgain}
                        onPress={fetchData}
                        buttonStyle={Styles.tryAgainWrapper}
                        textStyle={Styles.tryAgainText}
                      />
                    </View>
                  ) : (
                    <>
                      <InterestAndHobbyCardStatic
                        data={matchingData}
                        headerHeading={LanguageKeys.matching}
                        onEditPress={onInterestCardEdit}
                        fromUserProfile={fromUserProfile}
                        matchPercentage={userData?.match_percentage}
                      />
                      <InterestAndHobbyCard
                        data={interestAndHobbies}
                        headerHeading={LanguageKeys.myInterestAndHobbies}
                        onEditPress={onInterestCardEdit}
                        fromUserProfile={fromUserProfile}
                      />
                      <InfoCard
                        data={categoriesData?.appearanceAndHealth}
                        headerHeading={LanguageKeys.appearanceHealth}
                        onEditPress={onInfoCardEdit}
                        fromUserProfile={fromUserProfile}
                      />
                      <InfoCard
                        data={categoriesData?.familyBackground}
                        headerHeading={LanguageKeys.familyBackground}
                        onEditPress={onInfoCardEdit}
                        fromUserProfile={fromUserProfile}
                      />
                      <InfoCard
                        data={categoriesData?.lifeStyle}
                        headerHeading={LanguageKeys.lifeStyle}
                        onEditPress={onInfoCardEdit}
                        fromUserProfile={fromUserProfile}
                      />
                      <InfoCard
                        data={categoriesData?.personalityRequirements}
                        headerHeading={LanguageKeys.personalityRequirements}
                        onEditPress={onInfoCardEdit}
                        fromUserProfile={fromUserProfile}
                      />
                      {/* <InfoCard
                                                data={categoriesData?.waliInformation}
                                                headerHeading={LanguageKeys.waliInformation}
                                                onEditPress={onInfoCardEdit}
                                                fromUserProfile={fromUserProfile}
                                                from={'waliInformation'}
                                            /> */}
                      <InfoCard
                        data={categoriesData?.islamicValues}
                        headerHeading={LanguageKeys.islamicValues}
                        onEditPress={onInfoCardEdit}
                        fromUserProfile={fromUserProfile}
                      />
                      <InfoCard
                        data={categoriesData?.futurePlan}
                        headerHeading={LanguageKeys.futurePlans}
                        onEditPress={onInfoCardEdit}
                        fromUserProfile={fromUserProfile}
                        userData={userData}
                      />
                    </>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>

        <EditInfoCardModal details={editInfoCard} onClose={closeEditInfoCard} />
        <EditInterestCardModal
          details={editInterestCard}
          onClose={closeEditInterestCard}
          fetchData={fetchData}
        />
      </View>

      {buttonPickerVisible.visible && (
        <ButtonPicker
          visible={true}
          data={buttonPickerVisible.pickerData}
          onClose={hideButtonPicker}
          headerTitle={buttonPickerVisible.pickerHeaderTitle}
          onButtonPress={onButtonPickerButtonPress}
        />
      )}
    </View>
    // </SafeAreaView>
  );
};
export default Profile;
