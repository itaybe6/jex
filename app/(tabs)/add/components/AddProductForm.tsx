import React, { useState } from 'react';
import { ScrollView, View, Alert, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ProductTypeSelect from './fields/ProductTypeSelect';
import BrandSelect from './fields/BrandSelect';
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
import GemFields from './fields/GemFields';
import RoughDiamondFields from './fields/RoughDiamondFields';

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

  const handleSubmitWithValidation = async () => {
    try {
      await handleSubmit();
    } catch (error) {
      console.error('Error submitting product:', error);
      Alert.alert(
        'Error',
        'Failed to submit the product. Please check all required fields and try again.',
        [{ text: 'OK' }]
      );
    }
  };

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
        {errors.category && (
          <Text style={styles.errorText}>Please select a product category</Text>
        )}
        <PriceInput
          value={formData.price}
          onChange={value => handleChange('price', value)}
          error={errors.price}
        />
        {errors.price && (
          <Text style={styles.errorText}>Please enter a valid price</Text>
        )}
        <DescriptionInput
          value={formData.description}
          onChange={value => handleChange('description', value)}
          error={errors.description}
        />
        {errors.description && (
          <Text style={styles.errorText}>Please enter a description</Text>
        )}
        {formData.category === 'Rough Diamond' ? (
          <RoughDiamondFields
            weight={dynamicFields.weight || ''}
            clarity={dynamicFields.clarity || ''}
            color={dynamicFields.color || ''}
            onWeightChange={(value: string) => handleDynamicChange('weight', value)}
            onClarityChange={(value: string) => handleDynamicChange('clarity', value)}
            onColorChange={(value: string) => handleDynamicChange('color', value)}
            errors={dynamicErrors}
          />
        ) : formData.category === 'Watches' ? (
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
          <GemFields
            type={dynamicFields.type || ''}
            origin={dynamicFields.origin || ''}
            certification={dynamicFields.certification || ''}
            weight={dynamicFields.weight || ''}
            shape={dynamicFields.shape || ''}
            clarity={dynamicFields.clarity || ''}
            transparency={!!dynamicFields.transparency}
            hasCertification={!!dynamicFields.hasCertification}
            dimensions={dynamicFields.dimensions || ''}
            onTypeChange={value => handleDynamicChange('type', value)}
            onOriginChange={value => handleDynamicChange('origin', value)}
            onCertificationChange={value => handleDynamicChange('certification', value)}
            onWeightChange={value => handleDynamicChange('weight', value)}
            onShapeChange={value => handleDynamicChange('shape', value)}
            onClarityChange={value => handleDynamicChange('clarity', value)}
            onTransparencyChange={value => handleDynamicChange('transparency', value.toString())}
            onHasCertificationChange={value => handleDynamicChange('hasCertification', value.toString())}
            onDimensionsChange={value => handleDynamicChange('dimensions', value)}
            errors={dynamicErrors}
          />
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
            images={images.map(image => ({ uri: image.uri }))}
            onRemove={removeImage}
          />
        )}

        <SubmitButton
          onPress={handleSubmitWithValidation}
          loading={loading}
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
    marginTop: 4,
    marginBottom: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddProductForm; 