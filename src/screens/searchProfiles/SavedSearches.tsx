import { View, FlatList, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Constants, hp, Typography, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import { DeletePicker, ModalLoader, Text } from '../../components'
import { ApiServices, flashSuccessMessage } from '../../services'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import Entypo from 'react-native-vector-icons/Entypo'
import { getFilterItemLabel } from './Functions'
import _ from 'lodash'
import { CheckRtl, LanguageKeys } from '../../languages'

const SavedSearches = () => {
    const Rtl = CheckRtl()
    const navigation: any = useNavigation()
    const [loader, setLoader] = useState(true)
    const [deleteAlert, setDeleteAlert] = useState({
        visible: false,
        from: ''
    })
    const [modalLoader, setModalLoader] = useState({
        visible: false,
        message: 'Loading...'
    })

    const [savedSearches, setSavedSearches] = useState([])

    const hideModalLoader = () => {
        setModalLoader({
            visible: false,
            message: ''
        })
    }
    const hideLoader = () => setLoader(false)

    const getSavedFilters = () => {
        ApiServices.getSearchFilters().then((res: any) => {
            setSavedSearches(res)
            setLoader(false)
        })
            .catch(hideLoader)
    }


    useFocusEffect(
        React.useCallback(() => {
            setLoader(true)
            getSavedFilters()
        }, [])
    );




    const RenderFilterTxt = ({ item }: any) => (
        <View style={Styles.filterListCon}>
            {
                Object.keys(item).map((element, index) => {
                    return (
                        <View style={{
                            ...Styles.filterItemCon,
                            flexDirection: Rtl ? 'row-reverse' : 'row',
                            backgroundColor: index % 2 === 0 ? Colors.color31 : Colors.color2
                        }} key={index}>
                            <Text style={{
                                ...Styles.filterItemHeading,
                                textAlign: Rtl ? 'right' : 'left'
                            }}>
                                {getFilterItemLabel(element)}
                            </Text>
                            <Text style={{
                                ...Styles.filterItemValue,
                                textAlign: Rtl ? 'right' : 'left'
                            }}>
                                {
                                    element === 'min_age' && item[element] === 1 ?
                                        LanguageKeys.any
                                        :
                                        element === 'max_age' && item[element] === 99 ?
                                            LanguageKeys.any
                                            :
                                            item[element]
                                }
                            </Text>
                        </View >
                    )
                })
            }
        </View >
    )

    const onItemPress = (item: any) => {
        setModalLoader({
            visible: true,
            message: LanguageKeys.searching
        })
        const { apply } = item
        let urlParams = ''
        for(let element in apply) {
            urlParams = urlParams + `&${element}=${apply[element]}`
        }
        ApiServices.searchFilterApply(urlParams).then((res) => {
            navigation.navigate('SearchResults',
                { searchResults: res, urlParams: urlParams })
        })
            .finally(hideModalLoader)
    }

    const onDeletePress = (item: any) => {
        const id = item?.id
        setDeleteAlert({
            visible: true,
            from: id
        })
    }

    const onDeleteAlertDeletePress = () => {
        setDeleteAlert({
            visible: false,
            from: ''
        })
        setModalLoader({
            visible: true,
            message: LanguageKeys.deleting
        })
        ApiServices.deleteSearchFilter(deleteAlert?.from).then(() => {
            _.remove(savedSearches, (item: any) => item.id === deleteAlert?.from)
            setSavedSearches(savedSearches)
            flashSuccessMessage(LanguageKeys.deleted)
        })
            .finally(hideModalLoader)
    }

    const hideDeleteAlert = () => setDeleteAlert({
        visible: false,
        from: ''
    })


    const renderList = ({ item }: any) => {
        const { view, title } = item
        return (
            <TouchableOpacity style={Styles.itemCon}
                activeOpacity={Constants.btnActiveOpacity}
                onPress={onItemPress.bind(null, item)}
            >
                <View style={{ ...Styles.itemConHeader, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <Text style={Styles.heading} numberOfLines={1}>
                        {LanguageKeys.filter}: {title}
                    </Text>
                    <Menu>
                        <MenuTrigger>
                            <Entypo
                                name="dots-three-vertical"
                                color={Colors.color1}
                                size={wp(4)}
                                style={{ ...Styles.dotButton, marginRight: Rtl ? 0 : wp(-3), marginLeft: Rtl ? wp(-3) : 0 }}
                            />
                        </MenuTrigger>
                        <MenuOptions
                            optionsContainerStyle={Styles.menuCon}
                        >
                            <MenuOption
                                onSelect={onDeletePress.bind(null, item)}
                                style={Styles.menuButton}
                            >
                                <Text style={Styles.menuText}>
                                    {LanguageKeys.delete}
                                </Text>
                            </MenuOption>
                        </MenuOptions>
                    </Menu>
                </View>

                <RenderFilterTxt
                    item={view}
                    title={title}
                />
            </TouchableOpacity>
        )
    }

    const renderEmptyList = () => (
        <View style={Styles.emptyListCon}>
            <Text style={Styles.emptyListText}>
                {LanguageKeys.noSaveSearches}
            </Text>
        </View>
    )
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
        >
            <ModalLoader
                visible={modalLoader.visible}
                message={modalLoader.message}
                useModalLayout={true}
            />
            {
                loader ?
                    <ActivityIndicator color={Colors.theme} size={'small'} />
                    :
                    <FlatList
                        data={savedSearches}
                        renderItem={renderList}
                        contentContainerStyle={{ ...Styles.listContainer, paddingTop: savedSearches.length === 0 ? hp(1) : hp(1) }}
                        scrollEnabled={false}
                        ListEmptyComponent={renderEmptyList}
                    />
            }
            <DeletePicker
                visible={deleteAlert?.visible}
                onClose={hideDeleteAlert}
                onDeletePress={onDeleteAlertDeletePress}
                onCancelPress={hideDeleteAlert}
                useCustomModal={true}
            />
        </ScrollView>
    )
}

export default SavedSearches

const Styles = StyleSheet.create({
    listContainer: {
        width: wp(92),
        alignSelf: 'center',
    },
    itemCon: {
        marginBottom: hp(2),
        borderRadius: 8,
        backgroundColor: Colors.color2,
        borderWidth: 0.5,
        borderColor: Colors.color27,
        overflow: 'hidden'
    },
    itemConHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: hp(1.5),
        paddingBottom: hp(3),
        paddingHorizontal: wp(2.5),
    },
    heading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_SB,
        fontSize: Typography.small1,
        includeFontPadding: false,
        maxWidth: wp(80)
    },
    emptyListCon: {
        borderWidth: 0,
        marginBottom: hp(2)
    },
    emptyListText: {
        color: Colors.color28,
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        fontSize: Typography.small
    },
    menuCon: {
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: Colors.theme,
        marginLeft: wp(-4),
        width: wp(25),
    },
    menuButton: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    menuText: {
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        fontSize: Typography.small1,
        textAlign: 'center',
        color: Colors.color1,
        alignSelf: 'center'
    },
    filterListCon: {
        width: wp(92)
    },
    filterItemCon: {
        paddingHorizontal: wp(4),
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: hp(1),
    },
    filterItemHeading: {
        width: wp(45),
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small,
        includeFontPadding: false,
    },
    filterItemValue: {
        width: wp(39),
        color: Colors.color11,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small1,
        marginBottom: Constants.fontFamilyMarginBottom,
    },
    dotButton: {
        paddingHorizontal: wp(2),
        paddingVertical: hp(1),
        marginTop: hp(-1),
    }
})