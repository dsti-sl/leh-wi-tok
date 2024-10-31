import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ColorValue,
  ImageSourcePropType,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';

interface HomeItemProps {
  title: string;
  description: string;
  image: ImageSourcePropType;
  bgColor: ColorValue;
}
const HomeItem: React.FC<HomeItemProps> = ({
  title,
  description,
  image,
  bgColor,
}) => {
  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: bgColor }]}>
      <Image source={image} />
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{description}</Text>
        </View>
        <View style={styles.arrowContainer}>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={Colors.primary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HomeItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 15,
    padding: 15,
    gap: 10,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    gap: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    color: Colors.primary,
    backgroundColor: Colors.secondary,
    borderRadius: 20,
  },
});
