import { View, StyleSheet, Dimensions } from 'react-native'
import React from 'react'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Ripple from 'react-native-material-ripple'
import { useNavigation } from '@react-navigation/native'

import { Text } from '../../components'
import { Colors, Fonts } from '../../res'
import { Typography, wp } from '../../global'
import { CheckRtl, LanguageKeys } from '../../languages'

const SearchProfileSection = (props: any) => {
    const Rtl = CheckRtl()
    const navigation: any = useNavigation()
    const {
        activeOptionButton = {}
    } = props

    const onSeachPress = () => {
        navigation.navigate('SearchProfiles')
    }
    return (
        <View style={[Styles.container, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}>
            <Text style={Styles.heading}
                numberOfLines={1}
            >
                {activeOptionButton?.value === '-1' ?
                    LanguageKeys.recommendedForYou :
                    activeOptionButton?.name}
            </Text>
            <View style={Styles.searchButtonCon}>
                <Ripple style={Styles.searchButton}
                    onPress={onSeachPress}
                >
                    <View>
                        <Text style={Styles.searchText}>Search</Text>
                    </View>
                    <FontAwesome name='sliders' size={wp(4.5)} color={Colors.color2} />
                </Ripple>
            </View>
        </View>
    )
}

export default SearchProfileSection

const { width } = Dimensions.get('window')
const Styles = StyleSheet.create({
    container: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 40
    },
    heading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_SB,
        includeFontPadding: false,
        fontSize: Typography.small3,
        alignSelf: 'center',
        maxWidth: wp(54),
        marginHorizontal: wp(0.6),
    },
    searchButtonCon: {
        borderRadius: 30,
    },
    searchButton: {
        flexDirection: 'row',
        backgroundColor: Colors.theme,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: width * 0.25,
        height: width * 1 * 0.08,
        borderRadius: width * 1 * 0.08 / 2,
        paddingHorizontal: 10,
    },
    searchText: {
        color: 'white',
        fontSize: Typography.small1,
        fontFamily: Fonts.APPFONT_R,
        paddingTop: 2
    },
    buttonText: {
        color: Colors.color2,
        includeFontPadding: false,
        fontFamily: Fonts.APPFONT_SB,
        fontSize: 10,
        alignSelf: 'center'
    }
})