import React, { useState } from 'react';
import { ScrollView, StatusBar, Text as ReactText, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components';
import { wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors } from '../../res';
import Styles from './Styles';

type RadioOption = {
  id: string;
  label: string;
  value: string;
};

type SignupStepRadioProps = {
  navigation?: any;
  route?: any;
};

const SignupStepRadio = (props: SignupStepRadioProps) => {
  const Rtl = CheckRtl();
  const { navigation } = props;
  const [selectedValue, setSelectedValue] = useState<string>('');

  const question = 'What is your gender?';
  const title = 'Step 2 of 5';

  const radioOptions: RadioOption[] = [
    { id: '1', label: 'Male', value: 'male' },
    { id: '2', label: 'Female', value: 'female' },
    { id: '3', label: 'Other', value: 'other' },
  ];

  const onRadioPress = (value: string) => {
    setSelectedValue(value);
  };

  const onNextPress = () => {
    // Handle next button press
    if (navigation) {
      // Navigate to next step or submit
    }
  };

  const renderRadioButton = (option: RadioOption) => {
    const isSelected = selectedValue === option.value;
    return (
      <Ripple
        key={option.id}
        style={[
          Styles.radioTile,
          {
            backgroundColor: isSelected ? Colors.themeRGBA20 : Colors.color2,
            borderColor: isSelected ? Colors.theme : Colors.color27,
            marginRight: Rtl ? 0 : wp(2),
            marginLeft: Rtl ? wp(2) : 0,
          },
        ]}
        onPress={() => onRadioPress(option.value)}
      >
        <View
          style={[
            Styles.radioCircle,
            {
              backgroundColor: isSelected ? Colors.theme : 'transparent',
              borderColor: isSelected ? Colors.theme : Colors.color18,
            },
          ]}
        />
        <ReactText
          style={[
            Styles.radioLabel,
            { color: isSelected ? Colors.theme : Colors.color1 },
          ]}
        >
          {option.label}
        </ReactText>
      </Ripple>
    );
  };

  return (
    <SafeAreaView style={Styles.container}>
      <StatusBar backgroundColor={Colors.color1} barStyle={'dark-content'} />

      {/* Header with Title + "+1 Chat" brown gradient ribbon */}
      <View style={Styles.headerContainer}>
        <View
          style={[
            Styles.headerContent,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <ReactText style={Styles.headerTitle}>{title}</ReactText>
          <LinearGradient
            colors={[Colors.color47, Colors.color37, Colors.color38]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={Styles.chatRibbon}
          >
            <ReactText style={Styles.chatRibbonText}>+1 Chat</ReactText>
          </LinearGradient>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={Styles.scrollContent}
      >
        {/* Question */}
        <ReactText style={Styles.questionText}>{question}</ReactText>

        {/* Radio Buttons - Horizontal Tiles */}
        <View
          style={[
            Styles.radioContainer,
            // { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          {radioOptions.map((option) => renderRadioButton(option))}
        </View>
      </ScrollView>

      {/* Bottom Next Button */}
      <View style={Styles.buttonContainer}>
        <Button
          text="Next"
          onPress={onNextPress}
          buttonStyle={Styles.nextButton}
          disabled={!selectedValue}
        />
      </View>
    </SafeAreaView>
  );
};

export default SignupStepRadio;
