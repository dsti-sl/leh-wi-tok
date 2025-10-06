import React, { useState } from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';

import CModal from './CModal';
import Divider from './Divider';

interface SelectProps {
  inputLabel: string;
  selectItems: Record[];
  selectedItem: Record;
  labelField: string;
  valueField: string;
  placeholder: string;
  setSelectedItem: (_item: Record) => void;
  selectedItemStyle?: ViewStyle;
  selectItemsContainerStyle?: ViewStyle;
  selectContainer?: ViewStyle;
  placeholderStyle?: TextStyle;
  showDivider?: boolean;
  divider?: React.ReactNode;
}
const Select: React.FC<SelectProps> = ({
  inputLabel,
  selectItems,
  selectedItem,
  placeholder,
  labelField,
  valueField,
  setSelectedItem,
  selectedItemStyle = styles.selectItemStyle,
  selectItemsContainerStyle,
  selectContainer = {},
  placeholderStyle = {},
  showDivider = true,
  divider = <Divider />,
}) => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <View style={[styles.container, selectContainer]}>
      {/* Select label */}
      <Text>{inputLabel}</Text>

      {/* Select field */}
      <TouchableOpacity
        onPress={() => setOpenModal(true)}
        style={styles.selectField}
      >
        {!selectedItem[valueField] ? (
          <Text style={[styles.placeholderStyle, placeholderStyle]}>
            {placeholder}
          </Text>
        ) : (
          <Text>{selectedItem[valueField] as string}</Text>
        )}
        <Ionicons name="chevron-down" size={24} style={{ paddingLeft: 10 }} />
      </TouchableOpacity>

      {/*
      Select options

      TODO:
      - Add search functionality
      - Add multi-select
      - Add anchor ref
      */}
      <CModal
        open={openModal}
        setOpen={setOpenModal}
        modalContainerStyle={selectItemsContainerStyle}
      >
        <FlatList
          data={selectItems}
          keyExtractor={item => item.value as string}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.item,
                selectedItem[valueField] === item[valueField] &&
                  selectedItemStyle,
              ]}
              onPress={() => {
                setSelectedItem(item);
                setOpenModal(false);
              }}
            >
              <Text style={styles.itemText}>{item[labelField] as string}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => showDivider && divider}
        />
      </CModal>
    </View>
  );
};

export default Select;

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  selectItemStyle: {
    backgroundColor: '#F5F5F5',
  },
  selectField: {
    flexDirection: 'row',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    color: '#9EA0A4',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderStyle: {
    opacity: 0.3,
  },
});
