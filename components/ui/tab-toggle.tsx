import React from 'react';
import { motion } from 'framer-motion';

interface TabToggleProps {
  activeTab: 'forYou' | 'requests';
  onTabChange: (tab: 'forYou' | 'requests') => void;
}

const tabs = [
  { key: 'forYou', label: 'For You' },
  { key: 'requests', label: 'Requests' },
] as const;

export const TabToggle: React.FC<TabToggleProps> = ({ activeTab, onTabChange }) => {
  return (
    <div style={{ position: 'relative', display: 'flex', background: '#E3EAF3', borderRadius: 100, padding: 4, width: 240, margin: '0 auto' }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            background: 'none',
            color: activeTab === tab.key ? '#fff' : '#0E2657',
            fontWeight: activeTab === tab.key ? 700 : 500,
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 16,
            borderRadius: 100,
            position: 'relative',
            zIndex: 2,
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          {tab.label}
        </button>
      ))}
      {/* highlight bar */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'absolute',
          top: 4,
          left: activeTab === 'forYou' ? 4 : 'calc(50% + 4px)',
          width: 'calc(50% - 8px)',
          height: 'calc(100% - 8px)',
          borderRadius: 100,
          background: '#0E2657',
          zIndex: 1,
        }}
      />
    </div>
  );
};

export default TabToggle; 