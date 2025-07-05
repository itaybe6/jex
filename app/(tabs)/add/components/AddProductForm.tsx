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
import LooseDiamondFields from './fields/LooseDiamondFields';

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
      
      let errorMessage = 'שגיאה בשליחת המוצר. אנא בדוק שכל השדות הנדרשים מלאים ונסה שוב.';
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = 'בעיית חיבור לאינטרנט. אנא בדוק את החיבור ונסה שוב.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'אין הרשאה לבצע פעולה זו. אנא בדוק את ההרשאות.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'בעיה באחסון התמונות. אנא נסה שוב.';
        }
      }
      
      Alert.alert(
        'שגיאה',
        errorMessage,
        [{ text: 'אישור' }]
      );
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F5F8FC' }}>
      <View style={{ padding: 20, backgroundColor: '#fff', borderRadius: 18, shadowColor: '#0E2657', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, margin: 16 }}>
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
        {formData.category === 'Loose Diamond' ? (
          <LooseDiamondFields
            weight={dynamicFields.weight || ''}
            clarity={dynamicFields.clarity || ''}
            color={dynamicFields.color || ''}
            shape={dynamicFields.shape || ''}
            cut={dynamicFields.cut || ''}
            certificate={dynamicFields.certificate || ''}
            fluorescence={dynamicFields.fluorescence || ''}
            polish={dynamicFields.polish || ''}
            symmetry={dynamicFields.symmetry || ''}
            originType={dynamicFields.originType || ''}
            onWeightChange={value => handleDynamicChange('weight', value)}
            onClarityChange={value => handleDynamicChange('clarity', value)}
            onColorChange={value => handleDynamicChange('color', value)}
            onShapeChange={value => handleDynamicChange('shape', value)}
            onCutChange={value => handleDynamicChange('cut', value)}
            onCertificateChange={value => handleDynamicChange('certificate', value)}
            onFluorescenceChange={value => handleDynamicChange('fluorescence', value)}
            onPolishChange={value => handleDynamicChange('polish', value)}
            onSymmetryChange={value => handleDynamicChange('symmetry', value)}
            onOriginTypeChange={value => handleDynamicChange('originType', value)}
            errors={dynamicErrors}
          />
        ) : formData.category === 'Rough Diamond' ? (
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
    backgroundColor: '#E3EAF3',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
    fontFamily: 'Montserrat-Regular',
  },
  errorButton: {
    backgroundColor: '#fff0f0',
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    fontFamily: 'Montserrat-Regular',
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
    backgroundColor: '#FF3B30',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
});

export default AddProductForm; 