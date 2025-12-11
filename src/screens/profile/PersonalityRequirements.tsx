import { View, StyleSheet, FlatList } from 'react-native'
import React from 'react'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import Feather from 'react-native-vector-icons/Feather'
import Constants from '../../global/Constants'
import { Text } from '../../components'
import { Animation } from '../../animations'
import { CheckRtl } from '../../languages'
import Ripple from 'react-native-material-ripple'

const PersonalityRequirements = (props: any) => {
    const Rtl = CheckRtl()
    const {
        data = [],
        headerHeading = '',
        onEditPress = () => null
    } = props

    const RenderListItemInner = ({ item }: any) => (
        Rtl ?
            <View style={Styles.listItemInner}>
                <Ripple
                    onPress={onEditPress.bind(null, {
                        data: [item],
                        from: item.title
                    })}
                >
                    <Feather
                        name='edit-2'
                        color={Colors.color1}
                        size={wp(4)}
                        style={Styles.editIcon}
                    />
                </Ripple>

                <Text style={{ ...Styles.itemHeading, textAlign: Rtl ? 'right' : 'left', }}>
                    {item.title}
                </Text>
            </View>
            :
            <View style={Styles.listItemInner}>
                <Text style={{ ...Styles.itemHeading, textAlign: Rtl ? 'right' : 'left', }}>
                    {item.title}
                </Text>
                <Ripple
                    onPress={onEditPress.bind(null, {
                        data: [item],
                        from: item.title
                    })}
                >
                    <Feather
                        name='edit-2'
                        color={Colors.color1}
                        size={wp(4)}
                    />
                </Ripple>
            </View>
    )

    const RenderDecription = ({ item }: any) => (
        <Text style={{ ...Styles.itemDes, textAlign: Rtl ? 'right' : 'left', }}>
            {item.description}
        </Text>
    )

    const RenderList = ({ item }: any) => {
        return (
            Rtl ?
                <View style={Styles.listItemContainer}>
                    <RenderListItemInner item={item} />
                    <RenderDecription item={item} />
                </View>
                :
                <View style={Styles.listItemContainer}>
                    <RenderListItemInner item={item} />
                    <RenderDecription item={item} />
                </View>
        )
    }
    return (
        <View style={Styles.container}>
            <Text style={Styles.headerTxt}>
                {headerHeading}
            </Text>
            <Animation
                style={Styles.listContainer}
                animation={"fadeInDown"}
                duration={500}
            >
                <FlatList
                    data={data}
                    renderItem={RenderList}
                />
            </Animation>

        </View>
    )
}

export default PersonalityRequirements

const Styles = StyleSheet.create({
    container: {
        marginHorizontal: wp(4),
        backgroundColor: Colors.color2,
        paddingHorizontal: wp(4),
        paddingTop: hp(2.5),
        borderRadius: 10,
        marginBottom: hp(8)
    },
    headerTxt: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.large,
        marginBottom: Constants.fontFamilyMarginBottom
    },
    listContainer: {
        marginTop: hp(3)
    },
    listItemContainer: {
        marginBottom: hp(2.5)
    },
    listItemInner: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemHeading: {
        width: wp(78),
        color: Colors.color12,
        fontFamily: Fonts.APPFONT_SB,
        fontSize: Typography.small3,
        marginBottom: Constants.fontFamilyMarginBottom,
    },
    itemDes: {
        color: Colors.color11,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small3,
        marginBottom: Constants.fontFamilyMarginBottom,
        marginTop: hp(1),
        width: wp(78),
    },
    editIcon: {
        marginTop: hp(0.5)
    }
})