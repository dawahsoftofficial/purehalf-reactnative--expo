import { View, StyleSheet, Modal, FlatList, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts, Images } from '../../res'
import { Text } from '..'
import { CheckRtl, LanguageKeys } from '../../languages'
import Ripple from 'react-native-material-ripple';
import Constants from '../../global/Constants'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import i18next from '../../languages/i18n'
import { Animation } from '../../animations'
import { isIOS, StorageManager, useGlobalContext } from '../../services'


const LanguagePicker = () => {
    const Rtl = CheckRtl()
    const { updateDirection, language } = useGlobalContext()
    const { setData, storageKeys } = StorageManager
    const [languageModalVisible, setLanguageModalVisible] = useState(false)
    const [languages, setLanguages] = useState([
        {
            label: LanguageKeys.english, value: 'en', id: '1', selected: Rtl ? false : true
        },
        // {
        //     label: LanguageKeys.urdu, value: 'ur', id: '2', selected: Rtl ? true : false
        // }
    ])


    const onLanguagePress = (item: any) => {
        languages.forEach((element) => {
            if(element.value === item.value) {
                element.selected = true
                i18next.changeLanguage(item.value).then(() => {
                    setData(storageKeys.LANGUAGE, element.value).then(() => {
                        if(element.value === 'ur') {
                            updateDirection('rtl', 'ur')
                        }
                        else {
                            updateDirection('ltr', 'en')
                        }
                    })
                })
            }
            else {
                element.selected = false
            }
        })
        setLanguages(languages)
        setLanguageModalVisible(false)
    }

    const renderLanguages = ({ item }: any) => {
        return (
            <TouchableOpacity style={{
                ...Styles.itemContainer,
                flexDirection: Rtl ? 'row-reverse' : 'row'
            }}
                onPress={onLanguagePress.bind(null, item)}
                activeOpacity={0.5}
            >
                {item.selected ?
                    <Ionicons name='radio-button-on' size={wp(4.5)} color={Colors.theme} />
                    :
                    <Ionicons name='radio-button-off' size={wp(4.5)} color={Colors.theme} />}
                <Text style={Styles.itemLabel}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        )
    }


    const showLanguageModal = () => setLanguageModalVisible(true)
    const closeLanguageModal = () => setLanguageModalVisible(false)

    return (
        <View>
            <Ripple
                style={{ ...Styles.container, flexDirection: Rtl ? 'row-reverse' : 'row' }}
                onPress={showLanguageModal}
            >
                <View style={{ ...Styles.innerContainer, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <Image
                        source={Images.globe}
                        resizeMode='contain'
                        style={Styles.globeIcon}
                    />
                    {
                        language === 'en' ?
                            <Text style={Styles.outerBtnLabel}>{LanguageKeys.english}</Text>
                            : <Text style={Styles.outerBtnLabel}>{LanguageKeys.urdu}</Text>
                    }
                </View>
                <AntDesign name='down' size={wp(3.5)} color={Colors.color4} />
            </Ripple>
            <Modal
                visible={languageModalVisible}
                transparent={true}
            >
                <TouchableOpacity style={Styles.modalContainer}
                    activeOpacity={1}
                    onPress={closeLanguageModal}
                >
                    <Animation
                        style={Styles.listContainer}
                        duration={300}
                    >
                        <FlatList
                            data={languages}
                            renderItem={renderLanguages}
                        />
                    </Animation>
                </TouchableOpacity>
            </Modal>
        </View>

    )
}

export default LanguagePicker

const Styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.color3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: wp(12),
        paddingHorizontal: wp(2),
        borderBottomWidth: 0.7,
        borderColor: Colors.color1,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: hp(6)
    },
    globeIcon: {
        width: wp(4.5),
        height: hp(4)
    },
    outerBtnLabel: {
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color1,
        fontSize: Typography.small,
        marginTop: !isIOS ? hp(0.35) : 0,
        alignSelf: 'center',
        marginHorizontal: wp(2)
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0,0.5)',
        justifyContent: 'flex-end'
    },
    listContainer: {
        width: wp(100),
        paddingVertical: hp(2),
        paddingHorizontal: wp(4),
        backgroundColor: Colors.color2,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
    },
    itemContainer: {
        paddingVertical: hp(1.4),
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemLabel: {
        marginHorizontal: wp(1),
        fontSize: Typography.medium,
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        marginBottom: Constants.fontFamilyMarginBottom,
    }
})