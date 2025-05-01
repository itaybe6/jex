import React, { useState } from 'react';
import { ScrollView, View, Alert, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProductTypeSelect from './fields/ProductTypeSelect';
import BrandSelect from './fields/BrandSelect';
import ModelSelect from './fields/ModelSelect';
import PriceInput from './fields/PriceInput';
import DescriptionInput from './fields/DescriptionInput';
import MaterialSection from './fields/MaterialSection';
import GoldOptions from './fields/GoldOptions';
import WeightInput from './fields/WeightInput';
import DiamondCheckbox from './fields/DiamondCheckbox';
import DiamondFields from './fields/DiamondFields';
import WatchFields from './fields/WatchFields';
import SubmitButton from './fields/SubmitButton';
import useProductForm from '../hooks/useProductForm';
import { Select } from '@/components/Select';
import ImagePreview from './ImagePreview';
import SideStonesFields from './fields/SideStonesFields';

const AddProductForm = () => {
  const {
    formData,
    dynamicFields,
    errors,
    dynamicErrors,
    hasDiamond,
    hasSideStones,
    loading,
    handleChange,
    handleDynamicChange,
    handleDiamondToggle,
    handleSideStonesToggle,
    handleImageChange,
    handleSubmit,
    productTypeOptions,
    brandOptions,
    modelOptions,
    showBrandModal,
    setShowBrandModal,
    showModelModal,
    setShowModelModal,
    showCategoryModal,
    setShowCategoryModal,
    showDynamicModals,
    setShowDynamicModals,
    resetForm,
    images,
    removeImage
  } = useProductForm();

  const isJewelryProduct = ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Special pieces'].includes(formData.category);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <View style={{ padding: 20 }}>
        <ProductTypeSelect
          value={formData.category}
          onSelect={value => handleChange('category', value)}
          error={errors.category}
          options={productTypeOptions}
          showModal={showCategoryModal}
          setShowModal={setShowCategoryModal}
        />
        <PriceInput
          value={formData.price}
          onChange={value => handleChange('price', value)}
          error={errors.price}
        />
        <DescriptionInput
          value={formData.description}
          onChange={value => handleChange('description', value)}
          error={errors.description}
        />
        {formData.category === 'Watches' ? (
          <WatchFields
            brand={dynamicFields.brand}
            model={dynamicFields.model}
            diameter={dynamicFields.diameter}
            onBrandSelect={value => handleDynamicChange('brand', value)}
            onModelSelect={value => handleDynamicChange('model', value)}
            onDiameterChange={value => handleDynamicChange('diameter', value)}
            brandOptions={brandOptions}
            modelOptions={modelOptions}
            showBrandModal={showBrandModal}
            setShowBrandModal={setShowBrandModal}
            showModelModal={showModelModal}
            setShowModelModal={setShowModelModal}
            errors={dynamicErrors}
          />
        ) : formData.category === 'Gems' ? (
          <>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>Gem Type</Text>
            <Select
              data={[
                'Alexandrite', 'Amber', 'Amethyst', 'Ametrine', 'Aquamarine', 'Citrine', 'Diamond', 'Fancy Color Diamond', 'Emerald', 'Garnet', 'Iolite', 'Jade', 'Kunzite', 'Lapis Lazuli', 'Moonstone', 'Morganite', 'Opal', 'Pearl', 'Peridot', 'Rose Quartz', 'Ruby', 'Sapphire', 'Spinel', 'Sunstone', 'Tanzanite', 'Topaz', 'Tourmaline', 'Turquoise', 'Zircon'
              ]}
              value={dynamicFields.type || ''}
              onSelect={value => handleDynamicChange('type', value)}
              placeholder="Select Gem Type"
            />
            {dynamicErrors.type && <Text style={{ color: 'red', marginBottom: 8 }}>Required</Text>}
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8, marginTop: 16 }}>Origin</Text>
            <Select
              data={['Certificated', 'None Certificated', 'Natural', 'Lab Grown', 'Treated']}
              value={dynamicFields.origin || ''}
              onSelect={value => handleDynamicChange('origin', value)}
              placeholder="Select Origin"
            />
            {dynamicErrors.origin && <Text style={{ color: 'red', marginBottom: 8 }}>Required</Text>}
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8, marginTop: 16 }}>Certification</Text>
            <TextInput
              style={{ backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 }}
              value={dynamicFields.certification || ''}
              onChangeText={text => handleDynamicChange('certification', text)}
              placeholder="Enter certification"
              placeholderTextColor="#888"
            />
            {dynamicErrors.certification && <Text style={{ color: 'red', marginBottom: 8 }}>Required</Text>}
          </>
        ) : (
          <>
            <BrandSelect
              value={formData.title}
              onSelect={value => handleChange('title', value)}
              error={errors.title}
              options={brandOptions}
              showModal={showBrandModal}
              setShowModal={setShowBrandModal}
            />
            <MaterialSection
              value={dynamicFields.material}
              onSelect={value => handleDynamicChange('material', value)}
              error={dynamicErrors.material}
              showModal={!!showDynamicModals.material}
              setShowModal={value => setShowDynamicModals((prev) => ({ ...prev, material: value }))}
            />
            {dynamicFields.material === 'Gold' && (
              <GoldOptions
                karat={dynamicFields.goldKarat}
                color={dynamicFields.goldColor}
                onKaratSelect={value => handleDynamicChange('goldKarat', value)}
                onColorSelect={value => handleDynamicChange('goldColor', value)}
                karatError={dynamicErrors.goldKarat}
                colorError={dynamicErrors.goldColor}
                showKaratModal={!!showDynamicModals.goldKarat}
                setShowKaratModal={value => setShowDynamicModals((prev) => ({ ...prev, goldKarat: value }))}
                showColorModal={!!showDynamicModals.goldColor}
                setShowColorModal={value => setShowDynamicModals((prev) => ({ ...prev, goldColor: value }))}
              />
            )}
            <WeightInput
              value={dynamicFields.weight}
              onChange={value => handleDynamicChange('weight', value)}
              error={dynamicErrors.weight}
            />
            <DiamondCheckbox
              value={hasDiamond}
              onToggle={handleDiamondToggle}
            />
            {hasDiamond && (
              <DiamondFields
                fields={dynamicFields}
                errors={dynamicErrors}
                onChange={handleDynamicChange}
                showModals={showDynamicModals}
                setShowModals={setShowDynamicModals}
              />
            )}
            {isJewelryProduct && (
              <SideStonesFields
                hasSideStones={hasSideStones}
                onToggle={handleSideStonesToggle}
                fields={dynamicFields}
                errors={dynamicErrors}
                onChange={handleDynamicChange}
                showModals={showDynamicModals}
                setShowModals={setShowDynamicModals}
              />
            )}
          </>
        )}
        <TouchableOpacity 
          style={[
            styles.imageButton,
            errors.images && styles.errorButton
          ]} 
          onPress={handleImageChange}
        >
          <Text style={{ color: errors.images ? '#ff4444' : '#000' }}>
            Add Images (up to 5)
          </Text>
        </TouchableOpacity>
        {errors.images && (
          <Text style={styles.errorText}>Please add at least one image</Text>
        )}

        {images.length > 0 && (
          <ImagePreview 
            images={images} 
            onRemove={removeImage} 
          />
        )}

        <SubmitButton
          loading={loading}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  imageButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  errorButton: {
    backgroundColor: '#ffeeee',
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
});

export default AddProductForm; 