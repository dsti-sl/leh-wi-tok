import React from 'react';

import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';

interface CategoryCardProps {
  imageSource: ImageSourcePropType;
  categoryName: string;
  wordCount: number;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  imageSource,
  categoryName,
  wordCount,
  onPress,
}) => {
  const resolvedImageSource =
    typeof imageSource === 'string' ? { uri: imageSource } : imageSource;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={resolvedImageSource} style={styles.image} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <Text style={styles.wordCount}>{wordCount} words</Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryCard;

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 5,
    padding: 1,
  },
  image: {
    width: 50,
    height: 50,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  wordCount: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
});
