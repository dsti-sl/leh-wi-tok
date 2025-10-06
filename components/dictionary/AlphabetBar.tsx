import React from 'react';

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';

interface AlphabetBarProps {
  onPressLetter?: (letter: string) => void;
  activeLetter?: string;
}

const alphabetImages: { [key: string]: any } = {
  A: require('@/assets/images/Alphabets/A.png'),
  B: require('@/assets/images/Alphabets/B.png'),
  C: require('@/assets/images/Alphabets/C.png'),
  D: require('@/assets/images/Alphabets/D.png'),
  E: require('@/assets/images/Alphabets/E.png'),
  F: require('@/assets/images/Alphabets/F.png'),
  G: require('@/assets/images/Alphabets/G.png'),
  H: require('@/assets/images/Alphabets/H.png'),
  I: require('@/assets/images/Alphabets/I.png'),
  J: require('@/assets/images/Alphabets/J.png'),
  K: require('@/assets/images/Alphabets/K.png'),
  L: require('@/assets/images/Alphabets/L.png'),
  M: require('@/assets/images/Alphabets/M.png'),
  N: require('@/assets/images/Alphabets/N.png'),
  O: require('@/assets/images/Alphabets/O.png'),
  P: require('@/assets/images/Alphabets/P.png'),
  Q: require('@/assets/images/Alphabets/Q.png'),
  R: require('@/assets/images/Alphabets/R.png'),
  S: require('@/assets/images/Alphabets/S.png'),
  T: require('@/assets/images/Alphabets/T.png'),
  U: require('@/assets/images/Alphabets/U.png'),
  V: require('@/assets/images/Alphabets/V.png'),
  W: require('@/assets/images/Alphabets/W.png'),
  X: require('@/assets/images/Alphabets/X.png'),
  Y: require('@/assets/images/Alphabets/Y.png'),
  Z: require('@/assets/images/Alphabets/Z.png'),
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const AlphabetBar: React.FC<AlphabetBarProps> = ({ onPressLetter }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alphabet.map(letter => (
          <TouchableOpacity
            key={letter}
            style={styles.letterButton}
            onPress={() => onPressLetter && onPressLetter(letter)}
          >
            {alphabetImages[letter] ? (
              <Image
                source={alphabetImages[letter]}
                style={styles.letterImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.letterText}>{letter}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    backgroundColor: 'fff',
    paddingVertical: 10,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E0E0E0',
  },
  scrollContent: {
    alignItems: 'center',
  },
  letterButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  letterImage: {
    width: '100%',
    height: '100%',
  },
  letterText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

export default AlphabetBar;
