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

export const CATEGORY_ICONS: Record<string, () => React.ReactElement> = {
  'Rings': () => <Image source={RingIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Necklaces': () => <Image source={NecklaceIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Earrings': () => <Image source={JewelryIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Bracelets': () => <Image source={BraceletIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Special Pieces': () => <Image source={CrownIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Loose Diamonds': () => <Image source={DiamondIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Rough Diamonds': () => <Image source={ShoppingCartIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Gems': () => <Image source={GemIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
  'Watches': () => <Image source={WatchIcon} style={{ width: 40, height: 40, resizeMode: 'contain' }} />,
}; 