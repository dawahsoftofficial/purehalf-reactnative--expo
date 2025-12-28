import React, { memo } from 'react';
import { StyleSheet, Text as ReactText, View } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

import { hp, Typography, wp } from '../../../global';
import { Colors } from '../../../res';
import { isIOS } from '../../../services';

type OtpInputProps = {
  value: string;
  cellCount: number;
  textColor: string;
  onValueChange: (value: string) => void;
};

function OtpInput({
  value,
  cellCount,
  textColor,
  onValueChange,
}: OtpInputProps) {
  const ref = useBlurOnFulfill({ value, cellCount });
  const [propsCell, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue: onValueChange,
  });

  return (
    <View style={Styles.container}>
      <CodeField
        ref={ref}
        {...propsCell}
        caretHidden={false}
        value={value}
        onChangeText={onValueChange}
        cellCount={cellCount}
        rootStyle={Styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({ index, symbol, isFocused }) => (
          <ReactText
            key={index}
            style={[
              Styles.cell,
              isFocused && Styles.focusCell,
              { borderColor: textColor, color: textColor },
            ]}
            onLayout={getCellOnLayoutHandler(index)}
          >
            {symbol || (isFocused ? <Cursor /> : null)}
          </ReactText>
        )}
      />
    </View>
  );
}

export default memo(OtpInput);

const Styles = StyleSheet.create({
  container: {
    marginBottom: hp(3),
  },
  codeFieldRoot: {},
  cell: {
    width: wp(13),
    height: hp(6.5),
    lineHeight: wp(13),
    fontSize: Typography.large,
    borderBottomWidth: 1,
    borderColor: Colors.color2,
    borderWidth: !isIOS ? 0 : 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: Colors.color2,
    includeFontPadding: false,
  },
  focusCell: {
    color: Colors.color2,
  },
});
