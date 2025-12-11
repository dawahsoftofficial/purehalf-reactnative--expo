import { View, Modal, StyleSheet, FlatList } from 'react-native'
import React, { useState } from 'react'
import { Colors, Fonts } from '../../res'
import { Animation } from '../../animations'
import { hp, Typography, wp } from '../../global'
import Ripple from 'react-native-material-ripple'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { Button, HeightWeightPicker, IconInput, Picker, PickerButton, Text } from '../../components'
import { LanguageKeys, CheckRtl } from '../../languages'
import { useGlobalContext, StorageManager, ApiServices, flashSuccessMessage } from '../../services';
import { updateDetails } from './Funtions';

const EditInfoCardModal = (props: any) => {
  const [pickerDataLoader, setPickerDataLoader] = useState(false)
  const { currentUser, updateCurrentUser } = useGlobalContext()
  const { setData, storageKeys } = StorageManager
  const [updateLoader, setUpdateLoader] = useState(false)
  const Rtl = CheckRtl()
  const [focusedInput, setFocusedInput] = useState<any>({
    activeInputId: '',
    value: '',
    item: {}
  })

  const {
    details = {},
    onClose = () => null
  } = props

  const {
    visible = false,
    data = [],
    from = ''
  } = details

  const [heightWeightPicker, setHeightWeightPicker] = useState({
    visible: false,
    data: [],
    headerTitle: '',
    activePicker: '',
  })


  const onCloseHeightWeightPicker = () => setHeightWeightPicker({
    activePicker: '',
    headerTitle: '',
    visible: false,
    data: []
  })

  const openHeightWeightPicker = (data: any, headerTitle: any, activePicker: any) => {
    setHeightWeightPicker({
      visible: true,
      headerTitle: headerTitle,
      data: data,
      activePicker: activePicker
    })
  }


  const [picker, setPicker] = useState({
    visible: false,
    data: [],
    headerTitle: '',
    activePicker: ''
  })


  const onClosePicker = () => setPicker({
    visible: false,
    headerTitle: '',
    data: [],
    activePicker: ''
  })

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
  
  const openPicker = async (data: any, headerTitle: any, id: any) => {
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
            headerTitle: headerTitle,
            data: newData,
            activePicker: headerTitle
          })
          setPickerDataLoader(false)
        }
        else {
          setPickerDataLoader(false)
        }
      })
        .catch(() => setPickerDataLoader(false))
    }
    if (currentUser.gender === "male" && id === "martial-0") {
      setPicker({
        visible: true,
        headerTitle: headerTitle,
        data: data?.filter((val: any) => val?.value !== "Widowed"),
        activePicker: headerTitle
      })
    }
    else {
      setPicker({
        visible: true,
        headerTitle: headerTitle,
        data: data,
        activePicker: headerTitle
      })
    }
  }

  const onInputFocus = (id: any, value: any, item: any) => {
    setFocusedInput({
      activeInputId: id,
      value: value,
      item: item
    })
  }

  const onBlurInput = () => {
    const { activeInputId, item, value } = focusedInput
    const { category } = item
    data.forEach((element: any) => {
      if (element.id === activeInputId) {
        element.selected = {
          id: activeInputId,
          value: value,
          category: category,
        }
      }
    });
  }

  const onChangeInput = (text: any) => {
    setFocusedInput({
      ...focusedInput,
      value: text
    })
    data.forEach((element: any) => {
      if (element.title === focusedInput?.item?.title) {
        element.selected.value = text
      }
    });
  }

  const onPickerItemPress = (item: any) => {
    data.forEach((element: any) => {
      if (element.title === picker.activePicker) {
        element.selected = item
      }
    });
    onClosePicker()
  }

  const onHeightWeightPickerItemPress = (item: any) => {
    data.forEach((element: any) => {
      if (element.type === 'scalling') {
        if (heightWeightPicker.activePicker === element.title) {
          element.selected = {
            ...element.selected,
            value: item
          }
        }
        else if (heightWeightPicker.activePicker === `${element.title}Scale`) {
          element.selected = {
            value: element?.selected?.scale === item ? element?.selected?.value : null,
            scale: item
          }
        }
      }
    });
    onCloseHeightWeightPicker()
  }


  const onUpdatePress = async () => {
    setUpdateLoader(true)
    updateDetails(data).then(async (res: any) => {
      if (Object.keys(res).length !== 0) {
        currentUser.detail = res
        await setData(storageKeys.USER, currentUser)
        updateCurrentUser(currentUser)
      }
      flashSuccessMessage()
      setUpdateLoader(false)
      onClose()
    })
      .catch(() => setUpdateLoader(false))
  }

  const ScallingButton = ({ item }: any) => {
    const { data, title, selected } = item
    let { scale, value } = selected

    let scallingKeys: any = []
    data.forEach((element: any) => {
      scallingKeys.push(element?.scale)
    });
    let values = data[0]?.values

    if (scale && scale.length !== 0) {
      data.forEach((element: any) => {
        if (element?.scale === scale) {
          values = element?.values
        }
      })
    }

    return (
      <View style={Styles.scallingBtnOuterCon}>
        <PickerButton
          outerLabel={'Scale'}
          buttonText={scale && scale.length !== 0 ? scale : LanguageKeys.none}
          onPress={openHeightWeightPicker.bind(null, scallingKeys, title, `${title}Scale`)}
          buttonContainer={{ width: wp(30) }}
          outerLabelStyle={{ alignSelf: 'flex-start' }}
        />
        <PickerButton
          outerLabel={title}
          buttonText={value && value.length !== 0 ? JSON.stringify(value) : LanguageKeys.none}
          onPress={openHeightWeightPicker.bind(null, values, title, title)}
          buttonContainer={{ width: wp(45) }}
        />
      </View>

    )
  }

  const renderList = ({ item }: any) => {
    const { data, title, selected, type, placeholder, id } = item
    const { value } = selected
    const isMale = currentUser?.gender === 'female' ? false : true
    const hideItem = (id === 'doYouHaveABeard' && !isMale || id === 'hijab-0' && isMale)
    return (
      hideItem ? null :
        <View style={Styles.itemContainer}>
          {
            type === 'input' ?
              <IconInput
                label={title}
                outerLabelStyle={Styles.inputLabel}
                placeholder={placeholder}
                inputStyle={Styles.input}
                value={focusedInput.activeInputId === id ? focusedInput.value : value}
                onChangeText={onChangeInput}
                onFocus={onInputFocus.bind(null, id, value, item)}
                onBlur={onBlurInput}
              />
              :
              type === 'scalling' ?
                <ScallingButton
                  item={item}
                />
                :
                <PickerButton
                  outerLabel={title}
                  buttonText={
                    typeof (value) === 'number' ?
                      (
                        value === 1 ? 'Yes' :
                          value === 0 ? 'No' :
                            JSON.stringify(value)
                      )
                      :
                      value && value.length !== 0 ? value
                        :
                        LanguageKeys.notYetProvided
                  }
                  onPress={openPicker.bind(null, data, title, id)}
                />
          }
        </View>
    )
  }

  const renderListFooter = () => {
    return (
      <Button
        text={LanguageKeys.update}
        buttonStyle={Styles.updateBtn}
        onPress={onUpdatePress}
        disabled={updateLoader}
        loading={updateLoader}
        loadingMessage={LanguageKeys.updating}
      />
    )
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
    >
      <View style={Styles.container}>
        <Animation
          animation={"zoomIn"}
          style={Styles.innerCon}
        >
          <Ripple style={{ alignSelf: Rtl ? 'flex-start' : 'flex-end', marginHorizontal: wp(-2) }}
            onPress={onClose}
          >
            <AntDesign
              name='close'
              size={wp(8)}
              color={Colors.color1}
            />
          </Ripple>
          <Text style={Styles.header}>
            {from}
          </Text>
          <FlatList
            data={data}
            renderItem={renderList}
            contentContainerStyle={Styles.listContainer}
            showsVerticalScrollIndicator={false}
            // ListFooterComponent={renderListFooter}
            keyboardDismissMode={'none'}
          />
          {renderListFooter()}
        </Animation>

        <Picker
          visible={picker.visible}
          onClose={onClosePicker}
          onPress={onPickerItemPress}
          data={picker.data}
          headerTitle={picker.headerTitle}
          loader={pickerDataLoader}
        />
        <HeightWeightPicker
          visible={heightWeightPicker.visible}
          onClose={onCloseHeightWeightPicker}
          onPress={onHeightWeightPickerItemPress}
          data={heightWeightPicker.data}
          headerTitle={heightWeightPicker.headerTitle}
        />
      </View>
    </Modal>
  )
}

export default EditInfoCardModal

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.blackRGBA50,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  innerCon: {
    backgroundColor: Colors.color2,
    width: wp(90),
    borderRadius: 4,
    height: hp(80),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    marginVertical: hp(15)
  },
  header: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium2,
    lineHeight: wp(6.5),
    marginBottom: hp(1)
  },
  itemContainer: {
    marginTop: hp(4)
  },
  listContainer: {
    // paddingBottom: hp(10),
  },
  input: {
    width: wp(80),
  },
  inputLabel: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    lineHeight: wp(4.5)
  },
  updateBtn: {
    marginTop: hp(5)
  },
  scallingBtnOuterCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
})