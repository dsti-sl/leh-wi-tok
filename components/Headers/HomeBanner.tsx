import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface BannerProps {
  title: string;
}
export const HomeBanner = ({ title }: BannerProps) => {
  /* TODO:
    - Implement Banner component
    - Three level depth component
    - one for home, one for lessions, one for messages and one for others
  */
  return (
    <View style={styles.container}>
      <Text style={styles.titleTxt}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
