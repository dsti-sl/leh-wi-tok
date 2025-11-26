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
import { typography } from '@/constants/Typography';

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
    ...typography.subheading,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: '#333',
    opacity: 0.9,
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
