import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/common/Button';
import CAlert from '@/components/common/CAlert';
import CTextInput from '@/components/common/CTextInput';
import KeyboardAvoidingViewWrapper from '@/components/common/KeyboardAvoidingViewWrapper';
import Select from '@/components/common/Select';
import { Colors } from '@/constants/Colors';
import useSeekHelp from '@/hooks/useSeekHelp';
import { Record } from '@/lib/types';

const index = () => {
  const {
    helpReasons,
    selectedReason,
    setSelectedReason,
    helpTypes,
    selectedHelpType,
    setSelectedHelpType,
    helpDescription,
    setHelpDescription,
    loading,
    submitHelpRequest,
    isSubmitted,
    setIsSubmitted,
  } = useSeekHelp();
  return (
    <KeyboardAvoidingViewWrapper>
      <View style={styles.container}>
        {/* Header text */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Find volunteers</Text>
          <Text style={styles.headerTxt}>
            Volunteers on the platform will help to blah blah blah and blah and
            blah
          </Text>
        </View>

        {/* Forms fields */}
        <View style={styles.formContainer}>
          <Select
            inputLabel="Reason"
            selectItems={helpReasons as Record[]}
            selectedItem={selectedReason}
            setSelectedItem={setSelectedReason}
            labelField="label"
            valueField="value"
            placeholder="What is the reason of seeking help"
            showDivider={false}
          />
          <Select
            inputLabel="Type"
            selectItems={helpTypes as Record[]}
            selectedItem={selectedHelpType}
            setSelectedItem={setSelectedHelpType}
            labelField="label"
            valueField="value"
            placeholder="What type of help to do you seek"
            showDivider={false}
          />
          <CTextInput
            value={helpDescription}
            setValue={setHelpDescription}
            placeholder="Your description of issue "
            inputLabel="Description"
            multiline={true}
            maxLength={1000}
            showCounter={true}
            inputStyle={styles.inputStyle}
            defaultValue="This is just me testing"
          />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title="Cancel"
          onPress={() => console.log('Cancel')}
          buttonStyle={{ backgroundColor: '#f5f5f5', color: Colors.primary }}
        />
        <Button
          loadingIndicator={loading}
          title="Find Help"
          onPress={() => submitHelpRequest()}
          buttonStyle={{
            backgroundColor: Colors.primary,
            color: Colors.secondary,
          }}
        />
      </View>
      <CAlert
        open={isSubmitted}
        setOpen={() => {
          setIsSubmitted(false);
          router.back();
        }}
        title="Request Sent"
        message="Thank you for requesting help. We will connect you to a volunteer as soon as possible."
        btnText="Close"
        image={require('@/assets/images/mail.png')}
      />
    </KeyboardAvoidingViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 30,
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
  },
  headerContainer: {
    gap: 7,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.primary,
  },
  headerTxt: {
    opacity: 0.7,
  },
  formContainer: {
    flex: 1,
    height: '100%',
    gap: 40,
  },
  inputStyle: {
    borderColor: Colors.primary,
    padding: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
});
