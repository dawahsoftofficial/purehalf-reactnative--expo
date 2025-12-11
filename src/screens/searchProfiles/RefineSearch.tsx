import { View, StyleSheet, FlatList, Dimensions } from 'react-native'
import React, { useState, useReducer, useEffect } from 'react'
import Ripple from 'react-native-material-ripple'
import _ from 'lodash'
import { useNavigation } from '@react-navigation/native'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'

import AgeRange from './AgeRange'
import SaveAndSearchAlert from './SaveAndSearchAlert'
import { onSearch, saveAndSearch } from './Functions'
import ConfirmAlert from './ConfirmAlert'
import { Text, Picker, Button, Loader, ModalLoader } from '../../components'
import { Colors, Fonts } from '../../res'
import { hp, Typography, wp } from '../../global'
import { CheckRtl, LanguageKeys } from '../../languages'
import { ApiServices, flashErrorMessage, flashSuccessMessage, StorageManager, useGlobalContext } from '../../services'
import { filtersData } from './Data'
import CountryData from "../../components/pickers/country_picker/Countries"
import { Animation } from '../../animations'

const RefineSearch = () => {
    const Rtl = CheckRtl()
    const { currentUser } = useGlobalContext()
    const navigation: any = useNavigation()
    const [modalLoader, setModalLoader] = useState({
        visible: false,
        message: ''
    })
    const [peopleSearch, setPeopleSearch] = useState<string>('location')
    const [searchTitle, setSearchTitle] = useState('')
    const [minAge, setMinAge] = useState<any>(LanguageKeys.any)
    const [maxAge, setMaxAge] = useState<any>(LanguageKeys.any)
    const [confirmAlertVisible, setConfirmAlertVisible] = useState(false)
    const [saveAndSearchAlertVisble, setSaveAndSearchAlertVisble] = useState(false)
    const [filtersDataList, setFiltersDataList] = useState(filtersData)
    const [listLoader, setListLoader] = useState(true)
    const { getData, storageKeys } = StorageManager
    const [ignore, forceUpdate] = useReducer((x) => x + 1, 0);
    const [pickerDataLoader, setPickerDataLoader] = useState(false)
    const [picker, setPicker] = useState<any>({
        visible: false,
        data: [],
        headerTitle: '',
        activePicker: '',
        item: {}
    })


    const onClosePicker = () => setPicker({
        visible: false,
        headerTitle: '',
        data: [],
        activePicker: '',
        item: {}
    })


    const onRadioPress = (data: any, selectedElement: any, item: any) => {
        data.forEach((element: any) => {
            if (element.value === selectedElement.value) {
                if (element.id === "location" || element.id === "country") {
                    setPeopleSearch(element.id)
                }
                element.selected = true
                item.selected = { ...selectedElement }
            }
            else {
                element.selected = false
            }
        });
        forceUpdate()
    }

    const onRadioClearPress = (item: any) => {
        filtersDataList?.forEach((element: any) => {
            if (element?.id === item?.id) {
                element.selected = {}
            }
        });
        setFiltersDataList(filtersDataList)
        forceUpdate()
    }

    const renderRadioButtonsList = ({ item, index }: any) => {
        const { title, data } = item
        const { selected } = item
        return (
            <View style={{
                ...Styles.fieldItemCon,
                backgroundColor: index % 2 === 0 ? Colors.color31 : Colors.color2
            }}>
                <Text style={Styles.fieldHeading}>
                    {title}
                </Text>
                <View style={{ ...Styles.radioButtonOutercon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    {
                        data && data.length !== 0 && data.map((element: any, index: any) => {
                            return (
                                <Ripple style={{ ...Styles.radioButtonCon, marginRight: Rtl ? 0 : wp(4), marginLeft: Rtl ? wp(4) : 0 }}
                                    onPress={onRadioPress.bind(null, data, element, item)}
                                    key={index}
                                >
                                    <View style={{
                                        ...Styles.radioButton,
                                        backgroundColor: element?.id === selected?.id ? Colors.color1 : 'transparent'
                                    }} />
                                    <Text style={Styles.fieldDescription}>
                                        {element.value}
                                    </Text>
                                </Ripple>
                            )
                        })
                    }
                </View>
                <Ripple style={{ ...Styles.clearButton, alignSelf: Rtl ? 'flex-start' : 'flex-end' }}
                    onPress={onRadioClearPress.bind(null, item)}
                >
                    <Text style={Styles.clearButtonText}>
                        {LanguageKeys.clear}
                    </Text>
                </Ripple>
            </View>
        )
    }

    const getApiData = (id: any) => {
        return new Promise((resolve, reject) => {
            if (id === 'language') {
                ApiServices.getLanguages().then(async (data: any) => {
                    resolve(data)
                }).catch(() => reject(''))
            }
            else if (id === 'nationality') {
                ApiServices.getNationality().then(async (data: any) => {
                    resolve(data)
                }).catch(() => reject(''))
            }
            else {
                reject('')
            }
        })
    }

    const openPicker = async (item: any) => {

        const { data, title, id } = item
        if (id === 'language' || id === 'nationality') {
            setPickerDataLoader(true)
            getApiData(id).then(async (data: any) => {
                if (data) {
                    let newData: any = []
                    for await (const element of data) {
                        newData.push({
                            id: element?.id,
                            value: element?.name
                        })
                    }
                    setPicker({
                        visible: true,
                        headerTitle: title,
                        data: newData,
                        activePicker: title,
                        item: item
                    })
                    setPickerDataLoader(false)
                }
                else {
                    setPickerDataLoader(false)
                }
            })
                .catch(() => setPickerDataLoader(false))
        } else if (id === 'country') {
            setPickerDataLoader(true)
            let newData: any = []
            for await (const element of CountryData) {
                newData.push({
                    id: element?.name,
                    value: element?.name
                })
            }
            setPicker({
                visible: true,
                headerTitle: title,
                data: newData,
                activePicker: title,
                item: item
            })
            setPickerDataLoader(false)
        } else if (id === 'distance') {
            setPickerDataLoader(true)
            let newData: any = [
                {
                    id: 10,
                    value: LanguageKeys.upTo10KmAway
                },
                {
                    id: 50,
                    value: LanguageKeys.upTo50KmAway
                },
                {
                    id: 100,
                    value: LanguageKeys.upTo100KmAway
                },
                {
                    id: 250,
                    value: LanguageKeys.upTo250KmAway
                },
                {
                    id: 500,
                    value: LanguageKeys.upTo500KmAway
                },
            ]
            setPicker({
                visible: true,
                headerTitle: title,
                data: newData,
                activePicker: title,
                item: item
            })
            setPickerDataLoader(false)
        } else {
            setPicker({
                visible: true,
                headerTitle: title,
                data: data,
                activePicker: title,
                item: item
            })
        }
    }

    const onPickerItemPress = (item: any) => {
        picker.item.selected = item
        var index = _.findIndex(filtersDataList, { id: picker.item.id });
        filtersDataList?.splice(index, 1, picker.item);
        onClosePicker()
    }

    const onPickerClearPress = (item: any) => {
        item.selected = {}
        setFiltersDataList(filtersDataList)
        forceUpdate()
    }

    const renderDropDownList = ({ item, index }: any) => {
        const { title, selected } = item
        const value = selected?.value ? selected.value : ''
        if (peopleSearch === "location" && item?.id === "country") return null
        if (peopleSearch === "country" && item?.id === "distance") return null
        return (
            <Animation style={{
                ...Styles.fieldItemCon,
                backgroundColor: index % 2 === 0 ? Colors.color2 : item?.id === "distance" ? Colors.color2 : Colors.color31
            }}
                animation="fadeIn"
                duration={1000}
            >
                <Text style={Styles.fieldHeading}>
                    {title}
                </Text>
                <Ripple style={{ ...Styles.dropDownBtn, alignSelf: Rtl ? 'flex-end' : 'flex-start' }}
                    onPress={openPicker.bind(null, item)}
                    disabled={peopleSearch === "location" && item?.id === "country" || peopleSearch === "country" && item?.id === "distance"}
                >
                    <Text style={{ ...Styles.fieldDescription, ...Styles.dropDownBtnTxt }}>
                        {typeof (value) === 'number' ?
                            (
                                value === 1 ? 'Yes' :
                                    value === 0 ? 'No' :
                                        JSON.stringify(value)
                            )
                            :
                            value && value.length !== 0 ? value
                                :
                                LanguageKeys.notYetProvided}
                    </Text>
                    <View style={Styles.arrowBtn}>
                        <AntDesign
                            name='down'
                            color={Colors.color1}
                            size={wp(3)}
                        />
                    </View>

                </Ripple>
                <Ripple style={{ ...Styles.clearButton, alignSelf: Rtl ? 'flex-start' : 'flex-end' }}
                    onPress={onPickerClearPress.bind(null, item)}
                >
                    <Text style={Styles.clearButtonText}>
                        {LanguageKeys.clear}
                    </Text>
                </Ripple>
            </Animation>
        )
    }

    const setDropDownData = () => {
        getData(storageKeys.ATTRIBUTE).then(async (attributeRes: any) => {
            if (attributeRes) {
                for await (const element of filtersDataList) {

                    if (element?.fromAttribute) {
                        const result = attributeRes[element.category][element.id]
                        if (result) {
                            element.data = result
                        }
                    }
                }
                setFiltersDataList(filtersDataList)
                setListLoader(false)
            }
            else {
                setListLoader
            }
        })
            .catch(() => setListLoader(false))
    }



    const onSaveAndSearchPress = () => {
        setSaveAndSearchAlertVisble(true)
    }

    const closeSaveAndSearchAlert = () => {
        setSearchTitle('')
        setSaveAndSearchAlertVisble(false)
    }

    const closeConfirmAlert = () => {
        setSearchTitle('')
        setConfirmAlertVisible(false)
    }

    const hideModalLoader = () => {
        setModalLoader({
            visible: false,
            message: ''
        })
    }

    const onSearchPress = () => {
        setModalLoader({
            visible: true,
            message: LanguageKeys.searching
        })
        const ageRange = {
            minAge: minAge === LanguageKeys.any ? 1 : minAge,
            maxAge: maxAge === LanguageKeys.any ? 99 : maxAge
        }
        onSearch(ageRange, filtersDataList).then((res: any) => {
            navigation.navigate('SearchResults',
                { searchResults: res.data, urlParams: res.urlParams })
            hideModalLoader()
        })
            .catch(hideModalLoader)
    }

    const onSaveAndSearchAlertPress = (searchTitle: any) => {
        if (searchTitle.length === 0) {
            flashErrorMessage(LanguageKeys.searchTitleRequired)
            setSearchTitle('')
        }
        else {
            setSaveAndSearchAlertVisble(false)
            setConfirmAlertVisible(true)
            setSearchTitle(searchTitle)
        }
    }

    const onConfirmSaveandSearchAlertPress = () => {
        setConfirmAlertVisible(false)
        setModalLoader({
            visible: true,
            message: LanguageKeys.savingAndSearching
        })
        const ageRange = {
            minAge: minAge === LanguageKeys.any ? 1 : minAge,
            maxAge: maxAge === LanguageKeys.any ? 99 : maxAge
        }
        saveAndSearch(ageRange, filtersDataList, searchTitle).then((res: any) => {
            navigation.navigate('SearchResults',
                { searchResults: res.data, urlParams: res.urlParams })
            hideModalLoader()
        })
            .catch(hideModalLoader)
    }

    useEffect(() => {
        setDropDownData()
    }, [])

    const onMinAgeChange = (value: any) => setMinAge(value)
    const onMaxAgeChange = (value: any) => setMaxAge(value)

    const onClearAllPress = () => {
        setModalLoader({
            visible: true,
            message: LanguageKeys.clearingFilters
        })
        setMinAge(LanguageKeys.any)
        setMaxAge(LanguageKeys.any)
        filtersDataList.forEach((element: any) => {
            element.selected = {}
        })
        setFiltersDataList(filtersDataList)
        forceUpdate()
        hideModalLoader()
        flashSuccessMessage(LanguageKeys.allFiltersCleared)
    }

    const onAgeClearPress = () => {
        setMinAge(LanguageKeys.any)
        setMaxAge(LanguageKeys.any)
    }

    const renderList = ({ item, index }: any) => {
        const isMale = currentUser?.gender === 'female' ? false : true
        const hideItem = (item?.id === 'hijab-0' && !isMale || item?.id === 'is_wali' && !isMale)
        return (
            hideItem ? null :
                item?.type === 'dropDown' ?
                    renderDropDownList({ item, index })
                    :
                    renderRadioButtonsList({ item, index })
        )
    }

    return (
        <View style={Styles.container}>
            <Text style={Styles.heading}>
                {LanguageKeys.refineYourSearch}
            </Text>
            <Ripple style={{ ...Styles.clearAllButton, alignSelf: Rtl ? 'flex-start' : 'flex-end' }}
                onPress={onClearAllPress}
            >
                <Text style={Styles.clearButtonText}>
                    {LanguageKeys.clearAll}
                </Text>
            </Ripple>
            <View style={Styles.innerContainer}>
                <ModalLoader
                    visible={modalLoader.visible}
                    useModalLayout={true}
                    message={modalLoader.message}
                />
                <AgeRange
                    minAge={minAge}
                    maxAge={maxAge}
                    onMinAgeChange={onMinAgeChange}
                    onMaxAgeChange={onMaxAgeChange}
                    onClearPress={onAgeClearPress}
                />
                {
                    listLoader ?
                        <Loader /> :
                        <FlatList
                            data={filtersDataList}
                            renderItem={renderList}
                            scrollEnabled={false}
                        />
                }

                <Picker
                    visible={picker.visible}
                    onClose={onClosePicker}
                    onPress={onPickerItemPress}
                    data={picker.data}
                    headerTitle={picker.headerTitle}
                    loader={pickerDataLoader}
                />
                <SaveAndSearchAlert
                    visible={saveAndSearchAlertVisble}
                    onClose={closeSaveAndSearchAlert}
                    onPress={onSaveAndSearchAlertPress}
                />
                <ConfirmAlert
                    visible={confirmAlertVisible}
                    onClose={closeConfirmAlert}
                    onPress={onConfirmSaveandSearchAlertPress}
                />
            </View>

            <Button
                text={LanguageKeys.saveAndSearch}
                icon={<Feather name='search' color={Colors.color2} size={wp(5)} />}
                buttonStyle={Styles.saveSearchBtn}
                onPress={onSaveAndSearchPress}
            />
            <Button
                text={LanguageKeys.search}
                icon={<Feather name='search' color={Colors.color2} size={wp(5)} />}
                buttonStyle={Styles.searchBtn}
                onPress={onSearchPress}
            />
        </View >
    )
}

export default RefineSearch

const { width } = Dimensions.get('window')

const Styles = StyleSheet.create({
    container: {
        marginTop: hp(4),
    },
    innerContainer: {
        backgroundColor: Colors.color2,
        borderWidth: 0.5,
        borderColor: Colors.color27,
        overflow: 'hidden',
        borderRadius: 8,
    },
    heading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.small2,
        lineHeight: wp(5),
        marginBottom: hp(1.5)
    },
    fieldItemCon: {
        paddingVertical: hp(2),
        paddingHorizontal: wp(4)
    },
    fieldHeading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_M,
        fontSize: Typography.small1,
        includeFontPadding: false
    },
    radioButtonOutercon: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    radioButtonCon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: hp(1),
    },
    radioButton: {
        width: width * 0.035,
        height: width * 1 * 0.035,
        borderRadius: width * 1 * 0.035 / 2,
        borderWidth: 0.7,
    },
    fieldDescription: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_L,
        fontSize: Typography.small1,
        lineHeight: wp(4.8),
        alignSelf: 'center',
        marginHorizontal: wp(1)
    },
    saveSearchBtn: {
        marginTop: hp(5),
        marginHorizontal: wp(4),
        marginBottom: hp(2)
    },
    clearButton: {
        position: 'absolute',
        top: '35%',
        paddingHorizontal: wp(3),
    },
    clearButtonText: {
        fontFamily: Fonts.APPFONT_L,
        fontSize: Typography.tiny2,
        color: Colors.theme,
        includeFontPadding: false
    },
    dropDownBtn: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        marginTop: hp(1),
        alignItems: 'center',
        paddingHorizontal: wp(2),
        backgroundColor: Colors.color2,
        paddingVertical: hp(0.2),
        borderRadius: 4,

        shadowColor: Colors.color1,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
        borderWidth: 0.4,
        borderColor: Colors.color7
    },
    dropDownBtnTxt: {
        alignSelf: 'flex-start',
        marginHorizontal: 0,
    },
    arrowBtn: {
        marginLeft: wp(2)
    },
    searchBtn: {
        backgroundColor: Colors.color1,
        marginHorizontal: wp(4),
    },
    clearAllButton: {
        position: 'absolute',
        top: hp(0.2),
    }
})

