import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HomeBanner } from '@/components/home/HomeBanner';
import InitialVideoCard from '@/components/home/InitialVideoCard';
import useTutorials from '@/hooks/useTutorials';
import { Record } from '@/lib/types';

const index = () => {
  const { defaultTutorial, user } = useTutorials();

  if (!user) return;
  return (
    <View style={styles.container}>
      {/* Banner */}
      <HomeBanner user={user as Record} />

      {/* Video container */}
      {defaultTutorial && (
        <InitialVideoCard defaultTutorial={defaultTutorial as Record} />
      )}

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
  },
});
