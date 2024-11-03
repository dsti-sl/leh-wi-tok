import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ViewStyle,
} from 'react-native';

import CModal from './CModal';
import Divider from './Divider';

import { Colors } from '@/constants/Colors';
import { Record } from '@/lib/types';

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
  showDivider = true,
  divider = <Divider />,
}) => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <View>
      {/* Select label */}
      <Text>{inputLabel}</Text>

      {/* Select field */}
      <TouchableOpacity
        onPress={() => setOpenModal(true)}
        style={styles.selectField}
      >
        <Text>
          {!selectedItem[valueField]
            ? placeholder
            : (selectedItem[valueField] as string)}
        </Text>
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
          keyExtractor={(item) => item.value as string}
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
});
