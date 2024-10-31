import React from 'react';
import { StyleSheet, Text, Image, TouchableOpacity, View } from 'react-native';

import { HomeBanner } from '@/components/Headers/HomeBanner';

const index = () => {
  return (
    <View style={styles.container}>
      <HomeBanner user={user as Record} />
      <Text>Home</Text>
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
