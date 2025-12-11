import { View, TextInput, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { Button } from '../buttons'
import { Typography, hp, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import { useTranslation } from 'react-i18next'
import { CheckRtl } from '../../languages'

const SearchBar = (props: any) => {
    const RTL = CheckRtl()
    const [searchValue, setSearchValue] = useState('')
    const { t }: any = useTranslation()

    const onChangeText = (text: any) => {
        setSearchValue(text)
        props?.onChangeText && props?.onChangeText(text)
    }

    const onSearchPress = () => {
        props?.onChangeText && props?.onChangeText(searchValue)
    }

    return (
        <View style={Styles.searchContainer}>
            <TextInput
                style={{ ...Styles.searchInput, textAlign: RTL ? 'right' : 'left' }}
                placeholder={t('search')}
                placeholderTextColor={Colors.color28}
                value={searchValue}
                onChangeText={onChangeText}
            />
            <Button
                text="search"
                buttonStyle={Styles.searchButton}
                textStyle={Styles.searchButtonText}
                onPress={onSearchPress}
            />
        </View>
    )
}

export default SearchBar

const Styles = StyleSheet.create({
    searchContainer: {
        paddingTop: hp(2),
        paddingBottom: hp(1),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(3),
    },
    searchInput: {
        width: wp(70),
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.5),
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: Colors.color27,
        backgroundColor: Colors.color7,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
        color: Colors.color1,
        includeFontPadding: false,
    },
    searchButton: {
        height: hp(5.5),
        width: wp(20)
    },
    searchButtonText: {
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
    }
})