import { View, Modal, StyleSheet, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import Ripple from 'react-native-material-ripple'
import AntDesign from 'react-native-vector-icons/AntDesign'

import { Button, Text } from '../../components'
import { Animation } from '../../animations'
import { Colors, Fonts } from '../../res'
import { hp, Typography, wp } from '../../global'
import { LanguageKeys, CheckRtl } from '../../languages'
import { useGlobalContext, StorageManager, flashSuccessMessage, flashErrorMessage } from '../../services';
import { updateDetails } from './Funtions';

const EditInterestCardModal = (props: any) => {
  const Rtl = CheckRtl()
  const { setData, storageKeys } = StorageManager
  const { currentUser, updateCurrentUser } = useGlobalContext()
  const [ids, setIds] = useState<string[]>([])
  const [updateLoader, setUpdateLoader] = useState(false)

  const {
    details = {},
    onClose = () => null,
    fetchData = () => null
  } = props

  const {
    visible = false,
    data = [],
    from = ''
  } = details

  useEffect(() => {
    setIds(data.filter((item: any) => item?.selected).map((item: any) => item?.id))
  }, [data])

  const onUpdatePress = async () => {
    setUpdateLoader(true)
    updateDetails({ interestAndHobbies: ids }).then(async (res: any) => {
      if (Object.keys(res).length !== 0) {
        currentUser.detail = res
        await setData(storageKeys.USER, currentUser)
        updateCurrentUser(currentUser)
      }
      fetchData()
      flashSuccessMessage()
      setUpdateLoader(false)
      onClose()
    })
      .catch(() => setUpdateLoader(false))
  }

  const updateIdArray = (interestId: string) => {
    if (ids?.length >= 10) {
      return flashErrorMessage(LanguageKeys.interestAndHobbiesLimit)
    }
    setIds((prevState: string[]) => {
      const index = prevState.indexOf(interestId);

      if (index !== -1) {
        const newState = [...prevState.slice(0, index), ...prevState.slice(index + 1)];
        return newState;
      } else {
        return [...prevState, interestId];
      }
    });
  };

  const RenderListFooter = () => {
    return (
      <Button
        text={LanguageKeys.update}
        buttonStyle={Styles.updateBtn}
        onPress={!updateLoader ? onUpdatePress : null}
        disabled={updateLoader}
        loading={updateLoader}
        loadingMessage={LanguageKeys.updating}
      />
    )
  }

  return (
    <Modal visible={visible} transparent={true}>
      <View style={Styles.container}>
        <Animation animation={'zoomIn'} style={Styles.innerCon}>
          <Ripple
            style={{
              alignSelf: Rtl ? 'flex-start' : 'flex-end',
              marginHorizontal: wp(-2),
            }}
            onPress={onClose}>
            <AntDesign name="close" size={wp(8)} color={Colors.color1} />
          </Ripple>
          <Text style={Styles.header}>
            {from}
          </Text>
          <ScrollView
            contentContainerStyle={{
              flexDirection: Rtl ? 'row-reverse' : 'row',
              flexWrap: 'wrap',
            }}>
            {data?.map((item: any, index: number) => {
              let isSelected = ids.includes(item?.id)
              return (
                <Ripple
                  key={index}
                  onPress={() => updateIdArray(item?.id)}
                  style={{
                    ...Styles.item,
                    backgroundColor: isSelected ? Colors.color59 : Colors.color3,
                  }}>
                  <Text style={Styles.itemText}>{item?.value}</Text>
                </Ripple>
              )
            })}
          </ScrollView>
          <RenderListFooter />
        </Animation>
      </View>
    </Modal>
  );
}

export default EditInterestCardModal

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
  item: {
    paddingHorizontal: wp(2),
    paddingVertical: hp(1),
    margin: hp(0.5),
    borderRadius: 50,
    borderColor: Colors.color4,
    borderWidth: 1,
  },
  itemText: { color: Colors.color1, fontSize: Typography.tiny },
  updateBtn: {
    marginTop: hp(5)
  },
})