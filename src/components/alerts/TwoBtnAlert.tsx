import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LanguageKeys } from '../../languages'

const TwoBtnAlert = (props: any): any => {
    const { t }: any = useTranslation()
    const {
        title = LanguageKeys.alert,
        message = "",
        onCancelPress = () => null,
        onOkPress = () => null,
        leftButtonText = LanguageKeys.no,
        rightButtonText = LanguageKeys.yes
    } = props
    return (
        Alert.alert(
            t(title),
            t(message),
            [
                {
                    text: t(leftButtonText),
                    onPress: onCancelPress,
                    style: "cancel"
                },
                { text: t(rightButtonText), onPress: onOkPress }
            ]
        )
    )
}

export default TwoBtnAlert