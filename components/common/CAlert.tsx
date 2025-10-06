import React from 'react';

import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/Colors';

import Button from './Button';
import CModal from './CModal';

interface CAlertProps {
  open: boolean;
  setOpen: (_open: boolean) => void;
  title: string;
  message: string;
  btnText: string;
  image: ImageSourcePropType;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  imageStyle?: ImageStyle;
  alertContainerStyles?: ViewStyle;
  btnStyle?: TextStyle;
}
const CAlert: React.FC<CAlertProps> = ({
  open,
  setOpen,
  title,
  message,
  btnText,
  image,
  titleStyle = {},
  messageStyle = {},
  imageStyle = {},
  alertContainerStyles = {},
  btnStyle = {},
}) => {
  return (
    <CModal
      open={open}
      setOpen={setOpen}
      animationType="slide"
      transparent={true}
      modalContainerStyle={{ maxWidth: 300, maxHeight: 250 }}
    >
      <View style={[styles.contentContainer, alertContainerStyles]}>
        <Image source={image} style={[styles.image, imageStyle]} />
        <View style={{ alignItems: 'center', gap: 3 }}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          <Text style={[styles.message, messageStyle]}>{message}</Text>
        </View>
        <Button
          title={btnText}
          onPress={() => setOpen(false)}
          buttonStyle={{ ...styles.btnStyle, ...btnStyle }}
        />
      </View>
    </CModal>
  );
};

export default CAlert;

const styles = StyleSheet.create({
  contentContainer: {
    gap: 20,
    alignItems: 'center',
    alignContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  message: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  image: {
    width: 80,
    height: 80,
  },
  btnStyle: {
    backgroundColor: Colors.primary,
    color: Colors.secondary,
    fontWeight: '600',
  },
});
