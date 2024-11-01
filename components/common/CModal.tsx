import React from 'react';
import {
  Modal,
  ModalProps,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

// TODO: To be fine turn later
interface CModalProps extends ModalProps {
  open: boolean;
  setOpen: (_open: boolean) => void;
  children: React.ReactNode;
  modalContainerStyle?: ViewStyle;
}
const CModal: React.FC<CModalProps> = ({
  open,
  setOpen,
  children,
  transparent = true,
  animationType = 'fade',
  modalContainerStyle = {},
  ...props
}) => {
  return (
    <Modal
      visible={open}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={() => setOpen(false)}
      {...props}
    >
      <TouchableOpacity
        style={styles.modalBackground}
        onPress={() => setOpen(false)}
      >
        <View style={[styles.modalContainer, modalContainerStyle]}>
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '50%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
});
