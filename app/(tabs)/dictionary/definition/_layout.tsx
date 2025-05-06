import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

{
  /*

Check this out: 
- Ensure that the word replace the definition 
- Fix up the index page to work with the definition 
- Load difinition and its illustration and gesture images. 
- Retouch and Restyle 
*/
}

const _layout = () => {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSearchToggle = () => {
    setIsSearching((prev) => !prev);
    if (!isSearching) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      router.push({
        pathname: '/(tabs)/dictionary/definition',
        params: { query: '' },
      });
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    router.push({
      pathname: '/(tabs)/dictionary/definition',
      params: { query: text },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {Platform.OS === 'ios' ? (
        <View style={{ height: 50, backgroundColor: Colors.primary }} />
      ) : (
        <StatusBar style="light" backgroundColor={Colors.primary} />
      )}

      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#ffffff' },
            header: () => (
              <View style={styles.headerContainer}>
                {/* Back Button */}
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons
                    name="arrow-back"
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

                {/* Title or Search Bar */}
                <View style={styles.titleContainer}>
                  {isSearching ? (
                    <TextInput
                      ref={inputRef}
                      style={styles.searchInput}
                      placeholder="Search words..."
                      value={query}
                      onChangeText={handleQueryChange}
                    />
                  ) : (
                    <Text style={styles.headerTitle}>Definition</Text>
                  )}
                </View>

                {/* Search Icon */}
                <TouchableOpacity onPress={handleSearchToggle}>
                  <Ionicons
                    name={isSearching ? 'close' : 'search'}
                    size={24}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
      </Stack>
    </View>
  );
};

export default _layout;

const styles = StyleSheet.create({
  headerContainer: {
    top: Platform.OS === 'ios' ? 0 : 40,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.primary,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    color: Colors.primary,
  },
});
