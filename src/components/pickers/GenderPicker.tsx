import { View, StyleSheet, Modal, FlatList, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts, Images } from '../../res'
import { Text } from '..'
import { LanguageKeys, CheckRtl } from '../../languages'
import Ripple from 'react-native-material-ripple';
import Constants from '../../global/Constants'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { Animation } from '../../animations'
import { isIOS } from '../../services'

const GenderPicker = (props: any) => {
    const Rtl = CheckRtl()
    const {
        value = '',
        outerLabelStyle = {},
        disabled = false
    } = props
    const [genderModalVisible, setGenderModalVisible] = useState(false)
    const [genders, setGenders] = useState([
        {
            label: LanguageKeys.male, value: LanguageKeys.male, id: '1', selected: value === 'male' ? true : false
        },
        {
            label: LanguageKeys.female, value: LanguageKeys.female, id: '2', selected: value === 'female' ? true : false
        }
    ])
    const [activeGender, setActiveGender] = useState(value)

    const renderRadio = (item: any) => {
        return (
            item.selected ?
                <Ionicons name='radio-button-on' size={wp(4.5)} color={Colors.theme} />
                :
                <Ionicons name='radio-button-off' size={wp(4.5)} color={Colors.theme} />
        )
    }

    const onGenderPress = (item: any) => {
        genders.forEach((element) => {
            if(element.value === item.value) {
                element.selected = true
                setActiveGender(element.value)
                props.onSelect(element.value)
            }
            else {
                element.selected = false
            }
        })
        setGenders(genders)
        setGenderModalVisible(false)
    }

    const renderGenders = ({ item }: any) => {
        return (
            <TouchableOpacity style={{ ...Styles.itemContainer, justifyContent: Rtl ? 'flex-end' : 'flex-start' }}
                onPress={onGenderPress.bind(null, item)}
                activeOpacity={0.5}
            >
                {!Rtl && renderRadio(item)}
                <Text style={Styles.itemLabel}>
                    {item.label}
                </Text>
                {Rtl && renderRadio(item)}
            </TouchableOpacity>
        )
    }

    const RenderDownIcon = () => (
        <AntDesign name='down' size={wp(3.5)} color={Colors.color4} />
    )
    const RenderGroupImage = () => (
        <Image
            source={Images.groupUser}
            resizeMode='contain'
            style={Styles.groupUserIcon}
        />
    )
    const RenderGenderText = () => (
        activeGender.length !== 0 ?
            <Text style={Styles.outerBtnLabel}>{activeGender}</Text>
            : <Text style={{ ...Styles.outerBtnLabel, color: Colors.color28 }}>
                {LanguageKeys.selectGender}
            </Text>
    )
    const showGenderModal = () => setGenderModalVisible(true)
    const closeGenderModal = () => setGenderModalVisible(false)

    return (
        <View>
            <Text style={[Styles.label, outerLabelStyle]}>
                {LanguageKeys.gender}
            </Text>
            <Ripple
                style={[Styles.container, { flexDirection: Rtl ? 'row-reverse' : 'row', backgroundColor: disabled ? Colors.color54 : Colors.color3 }]}
                onPress={showGenderModal}
                disabled={disabled}
            >
                <View style={[Styles.innerContainer, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}>
                    <RenderGroupImage />
                    <RenderGenderText />
                </View>
                <RenderDownIcon />
            </Ripple>

            <Modal
                visible={genderModalVisible}
                transparent={true}
            >
                <TouchableOpacity style={Styles.modalContainer}
                    activeOpacity={1}
                    onPress={closeGenderModal}
                >
                    <Animation
                        style={Styles.listContainer}
                        duration={300}
                    >
                        <FlatList
                            data={genders}
                            renderItem={renderGenders}
                        />
                    </Animation>


                </TouchableOpacity>
            </Modal>
        </View>

    )
}

export default GenderPicker

const Styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.color3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: hp(6.3),
        paddingLeft: wp(2),
        paddingRight: wp(5),
        borderBottomWidth: 0.7,
        borderColor: Colors.color1,
        marginTop: hp(0.8),
    },
    label: {
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_R,
        marginBottom: Constants.fontFamilyMarginBottom,
        color: Colors.color1
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: hp(6),
    },
    groupUserIcon: {
        width: wp(4.5),
        height: hp(4)
    },
    outerBtnLabel: {
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color1,
        fontSize: Typography.small3,
        marginTop: !isIOS ? hp(0.35) : 0,
        alignSelf: 'center',
        marginHorizontal: wp(3)
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