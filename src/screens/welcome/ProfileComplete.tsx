import { StyleSheet, FlatList, View, Dimensions } from "react-native";
import { useState, useReducer, useCallback } from 'react'
import { hp, Typography, wp } from "../../global";
import { LanguageKeys, CheckRtl } from "../../languages";
import { Text } from '../../components'
import { Colors, Fonts } from "../../res";
import { useGlobalContext, StorageManager, LOG, isIOS } from '../../services'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Animation } from "../../animations";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const ProfileComplete = () => {
    const navigation: any = useNavigation()
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const { storageKeys, getData } = StorageManager
    const { currentUser } = useGlobalContext()
    const [profileCompleteProgress, setProfileCompleteProgress] = useState([
        {
            label: LanguageKeys.profileImage,
            id: 'primary_image',
            navigation: 'PhotosAndVideos',
            completed: false
        },
        {
            label: LanguageKeys.coverImage,
            id: 'cover_image',
            navigation: 'PhotosAndVideos',
            completed: false
        },
        {
            label: LanguageKeys.tagline,
            id: 'tagline',
            navigation: 'Profile',
            scrollTo: isIOS ? hp(2) : 10,
            completed: false
        },
        {
            label: LanguageKeys.appearanceHealth,
            id: 'appearance-0',
            navigation: 'Profile',
            scrollTo: hp(80),
            completed: false
        },
        {
            label: LanguageKeys.familyBackground,
            id: 'familybg-0',
            navigation: 'Profile',
            scrollTo: hp(120),
            completed: false
        },
        {
            label: LanguageKeys.lifeStyle,
            id: 'life-0',
            navigation: 'Profile',
            scrollTo: hp(160),
            completed: false
        },
        {
            label: LanguageKeys.personalityRequirements,
            id: 'personality-0',
            navigation: 'Profile',
            scrollTo: hp(210),
            completed: false
        },
        {
            label: LanguageKeys.islamicValues,
            id: 'islamicval-0',
            navigation: 'Profile',
            scrollTo: hp(250),
            completed: false
        },
        {
            label: LanguageKeys.futurePlans,
            id: 'futurePlans-0',
            navigation: 'Profile',
            scrollTo: hp(280),
            completed: false
        },
        {
            label: LanguageKeys.myInterestAndHobbies,
            id: 'myInterestAndHobbies-0',
            navigation: 'Profile',
            scrollTo: hp(30),
            completed: false
        }
    ])
    const Rtl = CheckRtl()

    const RenderProfileCompDot = ({ item }: any) => {
        return (
            <View style={{
                ...Styles.profileComDot,
                marginRight: Rtl ? 0 : wp(1),
                marginLeft: Rtl ? wp(1) : 0,
                backgroundColor: item.completed ? Colors.color1 : Colors.color18
            }}
            />
        )
    }

    const compare = (a: any, b: any) => {
        if (a.completed === b.completed) {
            return 0;
        }
        if (a.completed) {
            return -1;
        }
        return 1;
    }


    const handleProfileCompleteData = async () => {
        let keysData: any = {
            "primary_image": currentUser?.media?.primary_image ? true : false,
            "cover_image": currentUser?.media?.cover_image ? true : false,
            "tagline": currentUser?.detail?.tagline ? true : false,
            "appearance-0": true,
            "familybg-0": true,
            "life-0": true,
            "islamicval-0": true,
            "personality-0": true,
            "futurePlans-0": (currentUser?.detail?.family_plan_id && currentUser?.detail?.marriage_plan_id &&
                currentUser?.detail?.relocation_plan_id) ? true : false,
            "myInterestAndHobbies-0": currentUser?.detail?.personality_id?.length ? true : false
        }

        await getData(storageKeys.PROFILE_DETAIL_LOCAL).then(async (data: any) => {
            let islamicCount = 0;
            for (let child in data) {
                data[child].forEach((element: any) => {
                    if (
                        currentUser?.detail
                        && Object.keys(currentUser?.detail).length !== 0
                    ) {
                        const value = currentUser?.detail[element.apiKey]
                        if (value === null || value === undefined) {
                            keysData[element?.category] = false
                        }
                        if (element?.category === "islamicval-0" && (value !== null || value !== undefined)) {
                            islamicCount++
                        }
                        if (islamicCount < 4) {
                            keysData["islamicval-0"] = true
                        }
                    }
                    else {
                        keysData[element?.category] = false
                    }
                })
            }
        })
        profileCompleteProgress.forEach((element) => {
            if (keysData[element?.id] === true) {
                element.completed = true
            }
            else { element.completed = false }
        })
        profileCompleteProgress.sort(compare)
        setProfileCompleteProgress(profileCompleteProgress)
        forceUpdate()
    }


    useFocusEffect(
        useCallback(() => {
            handleProfileCompleteData()
        }, [])
    );


    const RenderCompleteProfileInner = () => (
        <View>
            <Text style={Styles.completeProfileDes}>
                {LanguageKeys.completeProfDes}
            </Text>
            <FlatList
                data={profileCompleteProgress}
                renderItem={RenderProfileCompDot}
                contentContainerStyle={Styles.profileComDotList}
                horizontal
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    )

    const onInfoItemPress = (item: any) => {
        navigation.navigate(item?.navigation, { scrollTo: item?.scrollTo })
    }

    const renderInfoList = ({ item, index }: any) => {
        const { completed, label } = item
        return (
            <MenuOption
                onSelect={onInfoItemPress.bind(null, item)}
                disabled={completed ? true : false}
            >
                <Animation
                    animation={'fadeInLeft'}
                    duration={index < 2 ? 500 : index < 4 ? 700 : index < 6 ? 900 : 1100}
                >
                    <View style={{ ...Styles.infoItemCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                        <View style={{ ...Styles.checkCircle, backgroundColor: completed ? Colors.theme : 'transparent' }}>
                            {completed && <AntDesign name="check" color={Colors.color2} size={wp(4)} />}
                        </View>
                        <Text style={Styles.infoItemLabel}>
                            {label}
                        </Text>
                    </View>
                </Animation>
            </MenuOption>

        )
    }

    return (

        <Menu>
            <MenuTrigger>
                <View style={{ ...Styles.completeProfileCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <RenderCompleteProfileInner />
                    <MaterialIcons
                        name={Rtl ? "keyboard-arrow-left" : "keyboard-arrow-right"}
                        color={Colors.color1}
                        size={wp(6)}
                        style={{ marginRight: wp(-1.5) }}
                    />
                </View>
            </MenuTrigger>
            <MenuOptions
                optionsContainerStyle={{ ...Styles.menuCon, marginLeft: Rtl ? wp(8) : wp(isIOS ? 0 : 8) }}
            >
                <FlatList
                    data={profileCompleteProgress}
                    renderItem={renderInfoList}
                />
            </MenuOptions>
        </Menu>
    )
}

export default ProfileComplete

const { width } = Dimensions.get('window')

const Styles = StyleSheet.create({
    completeProfileCon: {
        paddingVertical: hp(1.3),
        paddingHorizontal: wp(1.5),
        backgroundColor: Colors.color7,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    completeProfileDes: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_SB,
        fontSize: wp(2.2),
        includeFontPadding: false,
    },
    profileComDotList: {
        marginTop: hp(0.7),
        marginHorizontal: wp(1),
    },
    profileComDot: {
        backgroundColor: Colors.color1,
        height: hp(0.3),
        borderColor: Colors.color1,
        borderRadius: 30,
        width: wp(4)
    },
    menuCon: {
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.theme,
        width: wp(80),
        marginLeft: wp(-8),
        paddingVertical: hp(2),
        marginTop: hp(2)
    },
    infoItemCon: {
        paddingVertical: hp(1),
        alignItems: 'center',
        paddingHorizontal: wp(3)
    },
    checkCircle: {
        width: width * 0.06,
        height: width * 1 * 0.06,
        borderRadius: width * 1 * 0.06 / 2,
        borderWidth: 2,
        borderColor: Colors.theme,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoItemLabel: {
        alignSelf: 'center',
        marginHorizontal: wp(3),
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
        maxWidth: wp(67)
    }
})