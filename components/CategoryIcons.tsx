import React from 'react';
import { Image } from 'react-native';
import BraceletIcon from '@/assets/images/bracelet.png';
import RingIcon from '@/assets/images/ring.png';
import DiamondIcon from '@/assets/images/diamond.png';
import JewelryIcon from '@/assets/images/jewelry.png';
import NecklaceIcon from '@/assets/images/necklace-02.png';
import CrownIcon from '@/assets/images/crown.png';
import ShoppingCartIcon from '@/assets/images/shopping-cart.png';
import GemIcon from '@/assets/images/gem.png';
import WatchIcon from '@/assets/images/watch (1).png';

export const CATEGORY_ICONS: Record<string, (props?: { size?: number, color?: string }) => React.ReactElement> = {
  'Rings': ({ size = 40 } = {}) => <Image source={RingIcon} style={{ width: size, height: size, resizeMode: 'contain' }} />,
  'Necklaces': ({ size = 40, color } = {}) => <Image source={NecklaceIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
  'Earrings': ({ size = 40, color } = {}) => <Image source={JewelryIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
  'Bracelets': ({ size = 40, color } = {}) => <Image source={BraceletIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
  'Special Pieces': ({ size = 40, color } = {}) => <Image source={CrownIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
  'Loose Diamonds': ({ size = 40, color } = {}) => <Image source={DiamondIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
  'Rough Diamonds': ({ size = 40, color } = {}) => <Image source={ShoppingCartIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
  'Gems': ({ size = 40, color } = {}) => <Image source={GemIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
  'Watches': ({ size = 40, color } = {}) => <Image source={WatchIcon} style={{ width: size, height: size, resizeMode: 'contain', tintColor: color }} />,
}; 