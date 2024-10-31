import React from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';

import lessonFillSeconday from '../../../assets/images/lesson-fill-secondary.png';
import questionMarkCircular from '../../../assets/images/question-mark-circular.png';
import usersOutlineFillSeconday from '../../../assets/images/users-outline-fill-secondary.png';
import volunteerOutlineFillSecondary from '../../../assets/images/volunteer-outline-fill-secondary.png';

import { HomeBanner } from '@/components/home/HomeBanner';
import HomeItem from '@/components/home/HomeItem';
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

      {/* Items */}
      <View style={styles.itemsContainer}>
        <HomeItem
          title="Tutorial"
          description="Find help from volunteers who are blah, blah and blah"
          image={questionMarkCircular as ImageSourcePropType}
          bgColor="#0d3a46"
        />
        <HomeItem
          title="Beginners Lessons"
          description="Get Started with our beginners lessons today."
          image={lessonFillSeconday as ImageSourcePropType}
          bgColor="#0f4c5c"
        />
        <HomeItem
          title="Common Words"
          description="Find frequently used words for instant communications "
          image={usersOutlineFillSeconday as ImageSourcePropType}
          bgColor="#1e1e1e"
        />
        <HomeItem
          title="Become a Volunteer"
          description="Join the community of sign language voluteers and be..."
          image={volunteerOutlineFillSecondary as ImageSourcePropType}
          bgColor="#1f1f39"
        />
      </View>
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
  itemsContainer: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 20,
  },
});
