import { View, StyleSheet } from 'react-native';
import React from 'react';

import { Text } from '../../components';
import { Colors, Fonts } from '../../res';
import { Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';

const CompleteProfile = () => {
    const Rtl = CheckRtl();

    return (
        <View
            style={[Styles.container, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}>
            <Text style={Styles.heading}>{LanguageKeys.profileInReview}</Text>
        </View>
    );
};

export default CompleteProfile;

const Styles = StyleSheet.create({
    container: {
        height: 28,
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        borderColor: Colors.color46,
        borderWidth: 1,
    },
    heading: {
        color: Colors.color46,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.tiny2,
        textAlignVertical: 'center',
        height: '100%',
        paddingTop: 3
    },
});
