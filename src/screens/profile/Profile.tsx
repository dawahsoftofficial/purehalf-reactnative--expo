/* eslint-disable @typescript-eslint/no-explicit-any */
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ScrollView } from 'react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loader, Text } from '../../components';
import { CheckRtl, LanguageKeys } from '../../languages';
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
import {
  type BlockPickerOption,
  BlockPickerSheet,
  ContentScroll,
  ErrorRetry,
  ScreenLoader,
  TaglineSection,
} from './profile-components';
import Styles from './Styles';

type LoaderState = { visible: boolean; message: string };

type PickerState = {
  pickerData: BlockPickerOption[];
  pickerHeaderTitle: string;
  visible: boolean;
  item: unknown;
  from: string;
};

type UserDetail = {
  tagline?: string;
  personality_id?: number[];
  height_scale?: string;
  height?: number;
  weight_scale?: string;
  weight?: number;
  personality_id_value?: unknown;
  gender?: string;
};

type User = {
  id?: number;
  detail?: UserDetail;
  blocked?: number;
  blocked_you?: number;
  match_percentage?: number;
  is_blur?: boolean;
};

type Conversation = {
  convDetails?: {
    participantsDeleteFlag: Record<string, unknown>;
    id?: string;
  };
  id?: string;
};

type ProfileProps = {
  navigation: any;
  route?: { params?: { scrollTo?: number } };
  userData?: User;
  fromUserProfile?: boolean;
};

type EditPayload = {
  data: unknown;
  from: string;
};

type EditCardState = {
  visible: boolean;
  data: any;
  from: string;
};

const Profile = ({
  navigation,
  route,
  userData: propUserData,
  fromUserProfile = false,
}: ProfileProps) => {
  const { currentUser, updateCurrentUser, conversations } = useGlobalContext();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const Rtl = CheckRtl();
  const isFocused = useIsFocused();
  const [tagLineInputVisible, setTagLineInputVisible] = useState(false);
  const [tagLineInput, setTagLineInput] = useState('');
  const [error, setError] = useState<boolean>(false);
  const [userConversation, setUserConversation] = useState<Conversation | null>(
    null
  );

  const [loader, setLoader] = useState<LoaderState>({
    visible: true,
    message: LanguageKeys.loading,
  });

  const [buttonPickerVisible, setButtonPickerVisible] = useState<PickerState>({
    pickerData: [],
    pickerHeaderTitle: '',
    visible: false,
    item: '',
    from: '',
  });

  const { getData, storageKeys, setData } = StorageManager;

  const [editInfoCard, setEditInfoCard] = useState<EditCardState>({
    visible: false,
    data: [],
    from: '',
  });

  const [editInterestCard, setEditInterestCard] = useState<EditCardState>({
    visible: false,
    data: [],
    from: '',
  });

  const [userData, setUserData] = useState<User>(
    propUserData ? propUserData : currentUser
  );
  const [interestAndHobbies, setIinterestAndHobbies] = useState<any[]>([]);
  const [isBlockedByYou, setIsBlockedByYou] = useState(false);
  const [isBlockedYou, setIsBlockedYou] = useState(false);
  const [categoriesData, setCategoriesData] = useState<any>({});
  const [matchingData, setMatchingData] = useState<any>({});
  const [dataLoader, setDataLoader] = useState(true);

  const blockPickerData: BlockPickerOption[] = useMemo(
    () =>
      isBlockedByYou
        ? [
            { label: LanguageKeys.unBlock, value: 'unBlock' },
            { label: LanguageKeys.cancel, value: 'cancel' },
          ]
        : [
            { label: LanguageKeys.block, value: 'block' },
            { label: LanguageKeys.reportAndBlock, value: 'blockAndReport' },
            { label: LanguageKeys.cancel, value: 'cancel' },
          ],
    [isBlockedByYou]
  );

  const scrollToSection = useCallback(() => {
    if (route?.params?.scrollTo && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: route.params.scrollTo,
        animated: true,
      });
    }
  }, [route?.params?.scrollTo]);

  const getUserConversation = useCallback(() => {
    const conversationData = conversations.filter((element: Conversation) => {
      const deleteFlag = element.convDetails?.participantsDeleteFlag ?? {};
      return Object.prototype.hasOwnProperty.call(
        deleteFlag,
        JSON.stringify(userData?.id)
      );
    });
    if (conversationData && conversationData.length !== 0) {
      const conversation = conversationData[0];
      if (conversation?.convDetails) {
        setUserConversation(
          conversation.convDetails as unknown as Conversation
        );
      }
      return;
    }
    Firebase.getSingleConversation(currentUser?.id, userData?.id).then(
      (data: unknown) => {
        const conversationList = data as Conversation[];
        if (conversationList && conversationList.length !== 0) {
          const firstConv = conversationList[0];
          if (firstConv?.convDetails) {
            setUserConversation(
              firstConv.convDetails as unknown as Conversation
            );
          }
        }
      }
    );
  }, [conversations, currentUser?.id, userData?.id]);

  useEffect(() => {
    scrollToSection();
  }, [scrollToSection]);

  useFocusEffect(
    React.useCallback(() => {
      if (userData?.id !== currentUser?.id) {
        ApiServices.getUserDetail(userData?.id).then((res) => {
          setUserData(res as User);
        });
      }
    }, [currentUser?.id, userData?.id])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (fromUserProfile) {
        getUserConversation();
      }
    }, [fromUserProfile, getUserConversation])
  );

  // Sync userData with currentUser when viewing own profile for immediate updates
  useEffect(() => {
    if (
      !fromUserProfile &&
      currentUser?.id === userData?.id &&
      currentUser?.detail
    ) {
      setUserData((prevUserData) => ({
        ...prevUserData,
        detail: currentUser.detail,
        is_blur: currentUser.is_blur,
      }));
      if (currentUser?.detail?.tagline) {
        setTagLineInput(currentUser.detail.tagline);
      }
    }
  }, [
    currentUser?.detail,
    currentUser?.id,
    currentUser?.is_blur,
    fromUserProfile,
    userData?.id,
  ]);

  const hideButtonPicker = useCallback(() => {
    setButtonPickerVisible({
      visible: false,
      item: '',
      from: '',
      pickerData: [],
      pickerHeaderTitle: '',
    });
  }, []);

  const closeEditInfoCard = useCallback(() => {
    setEditInfoCard({
      visible: false,
      data: [],
      from: '',
    });
  }, []);

  const onInfoCardEdit = ({ data, from }: EditPayload) => {
    setEditInfoCard({
      visible: true,
      data: data,
      from: from,
    });
  };

  const closeEditInterestCard = useCallback(() => {
    setEditInterestCard({
      visible: false,
      data: [],
      from: '',
    });
  }, []);

  const onInterestCardEdit = ({ data, from }: EditPayload) => {
    setEditInterestCard({
      visible: true,
      data: data,
      from: from,
    });
  };

  const getAttribute = useCallback(
    (Data: any, nextUserData: User) => {
      getData(storageKeys.ATTRIBUTE).then((attributeRes: any) => {
        if (attributeRes) {
          if (attributeRes.hasOwnProperty('personality-0')) {
            const interest = attributeRes['personality-0'] as any[];
            interest?.forEach((element: any) => {
              if (nextUserData?.detail?.personality_id?.includes(element.id)) {
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
                nextUserData?.detail &&
                Object.keys(nextUserData?.detail).length !== 0
              ) {
                const value = (nextUserData?.detail as any)[element.apiKey];

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
                    if (element.id === 'height') {
                      element.selected = {
                        scale: nextUserData?.detail?.height_scale,
                        value: nextUserData?.detail?.height,
                      };
                    } else {
                      element.selected = {
                        scale: nextUserData?.detail?.weight_scale,
                        value: nextUserData?.detail?.weight,
                      };
                    }
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
    },
    [getData, storageKeys.ATTRIBUTE]
  );

  const fetchData = useCallback(async () => {
    const data = await getData(storageKeys.PROFILE_DETAIL_LOCAL);
    setError(false);
    if (data) {
      if (fromUserProfile) {
        try {
          setLoader({
            visible: true,
            message: LanguageKeys.loading,
          });
          const user = (await ApiServices.getUserDetail(userData?.id)) as User;
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
        } catch {
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
          const userData = await ApiServices.getCurrentUserDetail();
          const user: User = {
            ...userData,
            is_blur: userData.is_blur === 1,
            detail: userData.detail ?? undefined,
            match_percentage: userData.match_percentage ?? undefined,
          };
          setUserData(user);
          if (user?.detail?.tagline) {
            setTagLineInput(user.detail.tagline);
          }
          getAttribute(data, user);
        } catch {
          setError(true);
          setDataLoader(false);
          hideLoader();
        }
      }
    }
    setDataLoader(false);
    hideLoader();
  }, [
    fromUserProfile,
    getAttribute,
    getData,
    storageKeys.PROFILE_DETAIL_LOCAL,
    userData?.id,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData, isFocused]);

  const onBlockPress = useCallback(() => {
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
  }, [blockPickerData, isBlockedByYou, userData]);

  const onLikeUnlikePress = (value: boolean) => {
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

  const onButtonPickerButtonPress = (item: BlockPickerOption) => {
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
          const nextUser = { ...userData, blocked: value === 'block' ? 1 : 0 };
          setIsBlockedByYou(!isBlockedByYou);
          setUserData(nextUser as User);
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
          const nextUser = { ...userData, blocked: 1 };
          setIsBlockedByYou(!isBlockedByYou);
          setUserData(nextUser as User);
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
        const updatedUser = { ...currentUser, detail: res };
        await setData(storageKeys.USER, updatedUser);
        updateCurrentUser(updatedUser);
        setUserData(updatedUser);
        fetchData();
        flashSuccessMessage(LanguageKeys.submitted);
        // hideLoader()
        hideTagLineInput();
      })
      .catch(hideLoader);
  };

  const onChangeTagLine = (text: string) => setTagLineInput(text);

  const isOwnProfile = !fromUserProfile;
  return (
    <SafeAreaView style={Styles.container}>
      <ScreenLoader visible={loader.visible} message={loader.message} />
      {/* {currentUser?.membership_status === 0 && <PremiumButton />} */}
      <View style={{ flex: 1 }}>
        <ContentScroll scrollRef={scrollViewRef}>
          <Header
            navigation={navigation}
            fromUserProfile={fromUserProfile}
            userData={userData}
            onBlockPress={onBlockPress}
            onLikeUnlikePress={onLikeUnlikePress}
            isBlockedYou={isBlockedYou}
          />
          {isBlockedYou ? (
            <Text style={Styles.userNotAvailDes}>
              {LanguageKeys.userBlockedYouDes}
            </Text>
          ) : (
            <>
              <TaglineSection
                rtl={Rtl}
                tagline={userData?.detail?.tagline}
                isEditing={tagLineInputVisible}
                inputValue={tagLineInput}
                onChange={onChangeTagLine}
                onSubmit={onTagLineSubmit}
                onEditPress={showTagLineInput}
                onCancel={hideTagLineInput}
                isOwnProfile={isOwnProfile}
              />
              {dataLoader ? (
                <Loader />
              ) : (
                <View>
                  {error ? (
                    <ErrorRetry onRetry={fetchData} />
                  ) : (
                    <>
                      <InterestAndHobbyCardStatic
                        data={matchingData}
                        headerHeading={LanguageKeys.matching}
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
                      <InfoCard
                        data={categoriesData?.waliInformation}
                        headerHeading={LanguageKeys.waliInformation}
                        onEditPress={onInfoCardEdit}
                        fromUserProfile={fromUserProfile}
                        from={'waliInformation'}
                      />
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
                        userData={{ gender: userData?.detail?.gender }}
                      />
                    </>
                  )}
                </View>
              )}
            </>
          )}
        </ContentScroll>

        <EditInfoCardModal
          fetchData={fetchData}
          details={editInfoCard}
          onClose={closeEditInfoCard}
        />
        <EditInterestCardModal
          fetchData={fetchData}
          details={editInterestCard}
          onClose={closeEditInterestCard}
        />
      </View>

      <BlockPickerSheet
        onClose={hideButtonPicker}
        visible={buttonPickerVisible.visible}
        data={buttonPickerVisible.pickerData}
        onButtonPress={onButtonPickerButtonPress}
        headerTitle={buttonPickerVisible.pickerHeaderTitle}
      />
    </SafeAreaView>
  );
};
export default Profile;
