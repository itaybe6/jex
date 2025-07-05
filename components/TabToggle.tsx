import React from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { View as MotiView } from 'moti';

export type TabKey = string;

interface TabToggleProps {
  tabs: { key: TabKey; label: string }[];
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function TabToggle({ tabs, activeTab, onTabChange }: TabToggleProps) {
  const [tabLayouts, setTabLayouts] = React.useState<{ [k: string]: { x: number; width: number } }>({});

  const handleLayout = (key: TabKey) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts((prev) => ({ ...prev, [key]: { x, width } }));
  };

  const highlightX = tabLayouts[activeTab]?.x ?? 0;
  const highlightW = tabLayouts[activeTab]?.width ?? 0;

  // Debug: show highlight position and width
  // console.log('TabToggle highlight:', highlightX, highlightW);

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrapper}>
        {tabLayouts[activeTab] && (
          <MotiView
            animate={{
              left: highlightX,
              width: highlightW,
              opacity: 1,
            }}
            transition={{ type: 'spring', damping: 18, stiffness: 180 }}
            style={styles.highlight}
          />
        )}
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            onLayout={handleLayout(tab.key)}
            style={[styles.tabButton]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#E3EAF3',
    borderRadius: 100,
    padding: 4,
    position: 'relative',
    minWidth: 220,
  },
  highlight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 100,
    backgroundColor: '#0E2657',
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabText: {
    color: '#0E2657',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    fontWeight: '500',
    zIndex: 2,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
}); 