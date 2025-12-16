import React, { useState } from 'react';
import { ScrollView, StatusBar, Text as ReactText, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconInput } from '../../components';
import { CheckRtl } from '../../languages';
import { Colors } from '../../res';
import Styles from './Styles';

type SignupStepInputProps = {
  navigation?: any;
  route?: any;
};

const SignupStepInput = (props: SignupStepInputProps) => {
  const Rtl = CheckRtl();
  const { navigation } = props;
  const [inputValue, setInputValue] = useState('');

  const question = 'What is your full name?';
  const title = 'Step 1 of 5';

  const onChangeInput = (text: string) => {
    setInputValue(text);
  };

  const onNextPress = () => {
    // Handle next button press
    if (navigation) {
      navigation.navigate('SignupStepRadio');
    }
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

        {/* Text Input */}
        <View style={Styles.inputContainer}>
          <IconInput
            label=""
            placeholder="Enter your answer"
            value={inputValue}
            onChangeText={onChangeInput}
            inputStyle={Styles.textInput}
            containerStyle={Styles.inputWrapper}
          />
        </View>
      </ScrollView>

      {/* Bottom Next Button */}
      <View style={Styles.buttonContainer}>
        <Button
          text="Next"
          onPress={onNextPress}
          buttonStyle={Styles.nextButton}
          disabled={!inputValue.trim()}
        />
      </View>
    </SafeAreaView>
  );
};

export default SignupStepInput;
