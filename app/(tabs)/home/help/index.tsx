import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Select from '@/components/common/Select';
import { Colors } from '@/constants/Colors';
import useSeekHelp from '@/hooks/useSeekHelp';
import { Record } from '@/lib/types';

const index = () => {
  const { helpReasons, selectedReason, setSelectedReason } = useSeekHelp();
  return (
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
        />
      </View>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 30,
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
    gap: 10,
  },
});
