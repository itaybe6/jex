// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, TextInput, SafeAreaView, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseApi';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PanGestureHandler, PinchGestureHandler, GestureHandlerRootView, GestureEvent, PanGestureHandlerEventPayload, PinchGestureHandlerEventPayload, RotationGestureHandler, Gesture, GestureDetector, TapGestureHandler, State } from 'react-native-gesture-handler';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { RotationGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { PanGestureHandlerGestureEvent, PinchGestureHandlerGestureEvent, RotationGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

type ProductImage = { id: string; image_url: string };

type Product = { id: string; price?: number; category?: string; product_images?: ProductImage[] };

// --- 1. Types for story elements ---
type StoryElement = {
    id: string;
    type: 'text' | 'product';
    text?: string;
    color?: string;
    fontSize?: number;
    x: number;
    y: number;
    scale: number;
    rotation?: number; // in radians
    // For product details
    productDetails?: { price?: number; category?: string };
};

// --- DraggableScalableText component ---
type DraggableScalableTextProps = {
    element: StoryElement;
    selected: boolean;
    text: string;
    color: string;
    fontSize?: number;
    onSelect: () => void;
    onEdit: () => void;
    onUpdate: (el: StoryElement) => void;
    onDelete: () => void;
    updateText: (id: string, text: string) => void;
    finishEditing: (id: string) => void;
};

const DraggableScalableText: React.FC<DraggableScalableTextProps> = ({ element, selected, text, color, fontSize, onSelect, onEdit, onUpdate, onDelete }) => {
    // הגנות על ערכים לא תקינים:
    const safeNumber = (val, fallback) => (typeof val === 'number' && !isNaN(val) ? val : fallback);
    // useSharedValue מאותחל פעם אחת בלבד לכל אלמנט
    const translateX = React.useRef(useSharedValue(safeNumber(element.x, 0))).current;
    const translateY = React.useRef(useSharedValue(safeNumber(element.y, 0))).current;
    const scale = React.useRef(useSharedValue(safeNumber(element.scale, 1))).current;
    const rotation = React.useRef(useSharedValue(safeNumber(element.rotation, 0))).current;

    // Gesture refs (משודרג ל-React.createRef)
    const panRef = React.useRef(React.createRef());
    const pinchRef = React.useRef(React.createRef());
    const rotationRef = React.useRef(React.createRef());

    // Pan gesture
    const panHandler = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            try {
                translateX.value = ctx.startX + event.translationX;
                translateY.value = ctx.startY + event.translationY;
            } catch (e) { console.error('panHandler error', e); }
        },
        onEnd: () => {
            try {
                if (typeof onUpdate === 'function') {
                    onUpdate({
                        ...element,
                        x: safeNumber(translateX.value, 0),
                        y: safeNumber(translateY.value, 0),
                        scale: safeNumber(scale.value, 1),
                        rotation: safeNumber(rotation.value, 0),
                    });
                }
            } catch (e) { console.error('panHandler onEnd error', e); }
        },
    });

    // Pinch gesture
    const pinchHandler = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startScale = scale.value;
        },
        onActive: (event, ctx) => {
            try {
                scale.value = ctx.startScale * event.scale;
            } catch (e) { console.error('pinchHandler error', e); }
        },
        onEnd: () => {
            try {
                if (typeof onUpdate === 'function') {
                    onUpdate({
                        ...element,
                        x: safeNumber(translateX.value, 0),
                        y: safeNumber(translateY.value, 0),
                        scale: safeNumber(scale.value, 1),
                        rotation: safeNumber(rotation.value, 0),
                    });
                }
            } catch (e) { console.error('pinchHandler onEnd error', e); }
        },
    });

    // Rotation gesture
    const rotationHandler = useAnimatedGestureHandler({
        onStart: (_, ctx) => {
            ctx.startRotation = rotation.value;
        },
        onActive: (event, ctx) => {
            try {
                rotation.value = ctx.startRotation + event.rotation;
                console.log('rotationHandler.onActive', { id: element.id, rotation: rotation.value, event });
            } catch (e) { console.error('rotationHandler error', e); }
        },
        onEnd: () => {
            try {
                console.log('rotationHandler.onEnd', { id: element.id, rotation: rotation.value });
                if (typeof onUpdate === 'function') {
                    onUpdate({
                        ...element,
                        x: safeNumber(translateX.value, 0),
                        y: safeNumber(translateY.value, 0),
                        scale: safeNumber(scale.value, 1),
                        rotation: safeNumber(rotation.value, 0),
                    });
                }
            } catch (e) { console.error('rotationHandler onEnd error', e); }
        },
    });

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        zIndex: selected ? 20 : 10,
        left: translateX.value,
        top: translateY.value,
        transform: [
            { scale: scale.value },
            { rotateZ: `${rotation.value}rad` },
        ],
    }));

    // Add double tap handler
    const doubleTapRef = React.useRef();

    return (
        <RotationGestureHandler
            ref={rotationRef.current}
            simultaneousHandlers={[pinchRef.current, panRef.current]}
            onGestureEvent={rotationHandler}
        >
            <Animated.View style={{ flex: 1 }}>
                <PinchGestureHandler
                    ref={pinchRef.current}
                    simultaneousHandlers={[rotationRef.current, panRef.current]}
                    onGestureEvent={pinchHandler}
                >
                    <Animated.View style={{ flex: 1 }}>
                        <PanGestureHandler
                            ref={panRef.current}
                            simultaneousHandlers={[rotationRef.current, pinchRef.current]}
                            onGestureEvent={panHandler}
                        >
                            <Animated.View style={animatedStyle}>
                                <TapGestureHandler
                                    numberOfTaps={1}
                                    onActivated={onEdit}
                                >
                                    <Animated.View style={{ zIndex: 100 }}>
                                        <Text style={{
                                            color: color,
                                            fontSize: fontSize,
                                            fontWeight: 'bold',
                                            textShadowColor: 'rgba(0,0,0,0.7)',
                                            textShadowOffset: { width: 0, height: 2 },
                                            textShadowRadius: 4,
                                            textAlign: 'center',
                                        }}>
                                            {text}
                                        </Text>
                                        {selected && (
                                            <TouchableOpacity
                                                onPress={onDelete}
                                                style={{ position: 'absolute', top: -18, right: -18, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 2 }}
                                            >
                                                <MaterialIcons name="delete" size={20} color="#FF7675" />
                                            </TouchableOpacity>
                                        )}
                                    </Animated.View>
                                </TapGestureHandler>
                            </Animated.View>
                        </PanGestureHandler>
                    </Animated.View>
                </PinchGestureHandler>
            </Animated.View>
        </RotationGestureHandler>
    );
};

const CreateDealStoryScreen = () => {
    const { productId } = useLocalSearchParams();
    const { user, accessToken } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [images, setImages] = useState<ProductImage[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [editingText, setEditingText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [textColor, setTextColor] = useState('#FFFFFF');

    // Image gesture state
    const imageScale = useSharedValue(1);
    const imageTranslateX = useSharedValue(0);
    const imageTranslateY = useSharedValue(0);

    // Text gesture state
    const textScale = useSharedValue(1);
    const textTranslateX = useSharedValue(0);
    const textTranslateY = useSharedValue(0);

    // --- 2. State for story elements ---
    const [storyElements, setStoryElements] = useState<StoryElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [addingTextAt, setAddingTextAt] = useState<{ x: number, y: number } | null>(null);
    const [activeTextElement, setActiveTextElement] = useState(null); // { x, y, text, color }
    const [editingElementId, setEditingElementId] = useState<string | null>(null); // NEW: for editing existing text

    // Track previewX/previewY for absolute positioning
    const [previewX, setPreviewX] = useState(0);
    const [previewY, setPreviewY] = useState(0);

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [showImagePicker, setShowImagePicker] = useState(false);

    useEffect(() => {
        if (!productId) return;
        setLoading(true);
        fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=*,product_images(id,image_url)`, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                setProduct(data[0]);
                setImages(data[0]?.product_images || []);
            })
            .catch(() => setImages([]))
            .finally(() => setLoading(false));
    }, [productId]);

    useEffect(() => {
        if (images.length > 1 && selectedImageIndex === null) {
            setShowImagePicker(true);
        }
    }, [images, selectedImageIndex]);

    // Image gestures
    const imagePanHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.x = imageTranslateX.value;
            ctx.y = imageTranslateY.value;
        },
        onActive: (event, ctx: any) => {
            imageTranslateX.value = ctx.x + event.translationX;
            imageTranslateY.value = ctx.y + event.translationY;
        },
    });
    const imagePinchHandler = useAnimatedGestureHandler({
        onActive: (event: any) => {
            imageScale.value = event.scale;
        },
        onEnd: () => {
            imageScale.value = withSpring(Math.max(1, imageScale.value), { damping: 10 });
        },
    });
    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: imageTranslateX.value },
            { translateY: imageTranslateY.value },
            { scale: imageScale.value },
        ],
    }));

    // On image tap, show centered TextInput
    const handleCanvasPress = () => {
        if (editingElementId || isEditing) return;
        setEditingText('');
        setTextColor('#FFFFFF');
        setIsEditing(true);
    };

    const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now();

    // When editing is done, add to storyElements at center/upper third
    const handleFinishTextInput = () => {
        if (editingText.trim()) {
            setStoryElements((prev) => [
                ...prev,
                {
                    id: generateId(),
                    type: 'text',
                    text: editingText,
                    color: textColor,
                    fontSize: 28,
                    x: width * 0.5,
                    y: height * 0.3,
                    scale: 1,
                    rotation: 0,
                },
            ]);
        }
        setEditingText('');
        setIsEditing(false);
    };

    // NEW: Finish editing existing element
    const handleFinishEditElement = () => {
        if (editingElementId) {
            setStoryElements((prev) => prev.map(e => e.id === editingElementId ? { ...e, text: editingText, color: textColor } : e));
        }
        setEditingText('');
        setEditingElementId(null);
    };

    // Update text for editing element
    const updateText = (id, text) => {
        setStoryElements((prev) => prev.map(e => e.id === id ? { ...e, text } : e));
    };

    // --- 5. Add product details block ---
    const handleAddProductDetails = () => {
        if (!product) return;
        setStoryElements((prev) => [
            ...prev,
            {
                id: generateId(),
                type: 'product',
                text: `₪${product.price}  |  ${product.category}`,
                color: '#fff',
                fontSize: 24,
                x: 40,
                y: 40,
                scale: 1,
                productDetails: { price: product.price, category: product.category },
            },
        ]);
    };

    const handleConfirm = async () => {
        if (!user || !product || !images[selectedIdx]) return;
        setUploading(true);
        try {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const body = {
                user_id: user.id,
                product_id: product.id,
                product_type: product.category?.toLowerCase().replace(/\s/g, ''),
                story_data: JSON.stringify(storyElements),
                image_url: images[selectedIdx].image_url,
                created_at: new Date().toISOString(),
                expires_at: expiresAt,
            };
            const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_of_the_day`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed to upload deal');
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                router.push('/');
            }, 1200);
        } catch (e) {
            Alert.alert('Error', 'Failed to upload deal');
        } finally {
            setUploading(false);
        }
    };

    // 1. פונקציה startEditElement
    const startEditElement = (el) => {
        setTimeout(() => {
            setEditingText(el.text || '');
            setTextColor(el.color || '#FFFFFF');
            setEditingElementId(el.id);
            setIsEditing(false);
        }, 0);
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#0E2657" /></View>;
    }
    if (!product) {
        return <View style={styles.centered}><Text>Product not found</Text></View>;
    }
    if (success) {
        return <View style={styles.centered}><Text style={{ color: '#0E2657', fontSize: 20 }}>Deal uploaded successfully!</Text></View>;
    }

    if (showImagePicker) {
        return (
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 20, marginBottom: 16 }}>Choose an image</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {images.map((img, idx) => (
                        <TouchableOpacity key={img.id} onPress={() => { setSelectedImageIndex(idx); setShowImagePicker(false); }}>
                            <Image source={{ uri: img.image_url }} style={{ width: 90, height: 90, margin: 8, borderRadius: 10, borderWidth: selectedImageIndex === idx ? 3 : 0, borderColor: '#6C5CE7' }} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    const imageToShow = images[selectedImageIndex ?? 0]?.image_url;

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                {/* סרגל עליון */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: 56, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 100 }}>
                    <TouchableOpacity onPress={() => setShowConfirmModal(true)}>
                        <Ionicons name="checkmark" size={32} color="#fff" />
                    </TouchableOpacity>
                </View>
                {/* תמונה בגודל מלא */}
                <Pressable
                    style={{ flex: 1, width: '100%', height: '100%' }}
                    onPress={handleCanvasPress}
                >
                    <PinchGestureHandler onGestureEvent={imagePinchHandler}>
                        <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
                            <PanGestureHandler onGestureEvent={imagePanHandler}>
                                <Animated.Image source={{ uri: imageToShow }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            </PanGestureHandler>
                        </Animated.View>
                    </PinchGestureHandler>
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.gradientOverlay} />
                    {storyElements.map((el) => {
                        const isEditing = el.id === editingElementId;
                        return (
                            <DraggableScalableText
                                key={el.id}
                                element={el}
                                selected={selectedElementId === el.id}
                                text={isEditing ? editingText : el.text}
                                color={isEditing ? textColor : el.color}
                                fontSize={el.fontSize}
                                onSelect={() => setSelectedElementId(el.id)}
                                onEdit={() => startEditElement(el)}
                                onUpdate={(updated: StoryElement) => {
                                    if (
                                        typeof updated.x !== 'number' || isNaN(updated.x) ||
                                        typeof updated.y !== 'number' || isNaN(updated.y) ||
                                        typeof updated.scale !== 'number' || isNaN(updated.scale) ||
                                        typeof updated.rotation !== 'number' || isNaN(updated.rotation)
                                    ) {
                                        console.error('Invalid update values', updated);
                                        return;
                                    }
                                    setStoryElements((prev) => prev.map(e => {
                                        if (e.id !== el.id) return e;
                                        if (
                                            e.x === updated.x &&
                                            e.y === updated.y &&
                                            e.scale === updated.scale &&
                                            e.rotation === updated.rotation
                                        ) {
                                            return e;
                                        }
                                        return updated;
                                    }));
                                }}
                                onDelete={() => setStoryElements((prev) => prev.filter(e => e.id !== el.id))}
                                updateText={updateText}
                                finishEditing={handleFinishEditElement}
                            />
                        );
                    })}
                    {editingElementId ? (
                        <>
                            <View style={{
                                position: 'absolute',
                                top: 100,
                                left: 0,
                                right: 0,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                zIndex: 999,
                            }}>
                                {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF'].map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setTextColor(color)}
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: color,
                                            marginHorizontal: 6,
                                            borderWidth: textColor === color ? 2 : 0,
                                            borderColor: '#666',
                                        }}
                                    />
                                ))}
                            </View>
                            <TextInput
                                value={editingText}
                                onChangeText={setEditingText}
                                autoFocus
                                style={{
                                    position: 'absolute',
                                    top: '40%',
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center',
                                    fontSize: 28,
                                    color: textColor,
                                    backgroundColor: 'transparent',
                                    borderBottomWidth: 1,
                                    borderColor: '#0E2657',
                                    minWidth: 80,
                                    zIndex: 99,
                                }}
                                onSubmitEditing={handleFinishEditElement}
                                onBlur={handleFinishEditElement}
                                placeholder="Edit text..."
                                placeholderTextColor="#aaa"
                                returnKeyType="done"
                            />
                        </>
                    ) : isEditing ? (
                        <>
                            <View style={{
                                position: 'absolute',
                                top: 100,
                                left: 0,
                                right: 0,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                zIndex: 999,
                            }}>
                                {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF'].map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setTextColor(color)}
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: color,
                                            marginHorizontal: 6,
                                            borderWidth: textColor === color ? 2 : 0,
                                            borderColor: '#666',
                                        }}
                                    />
                                ))}
                            </View>
                            <TextInput
                                value={editingText}
                                onChangeText={setEditingText}
                                autoFocus
                                style={{
                                    position: 'absolute',
                                    top: '40%',
                                    left: 0,
                                    right: 0,
                                    textAlign: 'center',
                                    fontSize: 28,
                                    color: textColor,
                                    backgroundColor: 'transparent',
                                    borderBottomWidth: 1,
                                    borderColor: '#0E2657',
                                    minWidth: 80,
                                    zIndex: 99,
                                }}
                                onSubmitEditing={handleFinishTextInput}
                                onBlur={handleFinishTextInput}
                                placeholder="Type here..."
                                placeholderTextColor="#aaa"
                                returnKeyType="done"
                            />
                        </>
                    ) : null}
                </Pressable>
                {/* מודאל אישור */}
                <Modal
                    visible={showConfirmModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowConfirmModal(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, width: 320, alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, color: '#0E2657', fontWeight: 'bold', marginBottom: 18, textAlign: 'center' }}>
                                האם להעלות את הסטורי?
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#6C5CE7', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', marginHorizontal: 8 }}
                                    onPress={async () => {
                                        setShowConfirmModal(false);
                                        await handleConfirm();
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>אישור</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#eee', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center', marginHorizontal: 8 }}
                                    onPress={() => setShowConfirmModal(false)}
                                >
                                    <Text style={{ color: '#0E2657', fontWeight: 'bold', fontSize: 16 }}>ביטול</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 18,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 20,
        color: '#0E2657',
        fontWeight: 'bold',
    },
    imageArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    carouselRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    carouselImg: {
        width: 60,
        height: 60,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'transparent',
        marginHorizontal: 2,
    },
    selectedImg: {
        borderColor: '#6C5CE7',
    },
    storyPreviewWrapper: {
        width: width * 0.85,
        height: height * 0.55,
        borderRadius: 18,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#eee',
        marginBottom: 18,
    },
    storyPreviewImg: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: height * 0.18,
    },
    draggableTextWrapper: {
        position: 'absolute',
        left: width * 0.1,
        top: height * 0.15,
        zIndex: 10,
    },
    overlayContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 24,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    price: {
        fontSize: 22,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        marginBottom: 8,
    },
    storyMessage: {
        color: '#fff',
        fontSize: 28,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        fontWeight: 'bold',
        paddingHorizontal: 8,
    },
    storyMessageInput: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 8,
        width: '90%',
        alignSelf: 'center',
        marginBottom: 8,
    },
    confirmButton: {
        backgroundColor: '#6C5CE7',
        borderRadius: 10,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        margin: 24,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CreateDealStoryScreen; 