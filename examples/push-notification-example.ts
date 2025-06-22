import { supabase } from '@/lib/supabase';

/**
 * Example: Creating a notification that will automatically trigger a push notification
 */

// Example 1: Deal Offer Notification
export async function createDealOfferNotification(
  buyerId: string,
  sellerId: string,
  productId: string,
  productTitle: string,
  productImageUrl: string
) {
  try {
    // Get seller profile for notification data
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', sellerId)
      .single();

    // Create notification for buyer
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: buyerId,
        type: 'transaction_offer',
        product_id: productId,
        data: {
          message: `${sellerProfile?.full_name || 'A seller'} has made you a deal offer`,
          seller_id: sellerId,
          seller_name: sellerProfile?.full_name || 'Unknown Seller',
          seller_avatar_url: sellerProfile?.avatar_url,
          product_title: productTitle,
          product_image_url: productImageUrl,
          transaction_id: 'generated-transaction-id', // You'll need to create this
        },
        read: false,
        is_action_done: false,
      });

    if (error) {
      console.error('Error creating deal offer notification:', error);
      throw error;
    }

    console.log('Deal offer notification created successfully');
    return data;
  } catch (error) {
    console.error('Failed to create deal offer notification:', error);
    throw error;
  }
}

// Example 2: Hold Request Notification
export async function createHoldRequestNotification(
  sellerId: string,
  buyerId: string,
  productId: string,
  productTitle: string,
  productImageUrl: string,
  holdRequestId: string,
  hours: number
) {
  try {
    // Get buyer profile for notification data
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', buyerId)
      .single();

    // Create notification for seller
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        type: 'hold_request',
        product_id: productId,
        data: {
          message: `Request Hold ${hours} Hours`,
          buyer_id: buyerId,
          buyer_name: buyerProfile?.full_name || 'Unknown Buyer',
          buyer_avatar_url: buyerProfile?.avatar_url,
          product_title: productTitle,
          product_image_url: productImageUrl,
          hold_request_id: holdRequestId,
          hours: hours,
        },
        read: false,
        is_action_done: false,
      });

    if (error) {
      console.error('Error creating hold request notification:', error);
      throw error;
    }

    console.log('Hold request notification created successfully');
    return data;
  } catch (error) {
    console.error('Failed to create hold request notification:', error);
    throw error;
  }
}

// Example 3: Deal Completed Notification
export async function createDealCompletedNotification(
  sellerId: string,
  buyerId: string,
  productId: string,
  productTitle: string,
  productImageUrl: string,
  transactionId: string
) {
  try {
    // Get buyer profile for notification data
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', buyerId)
      .single();

    // Create notification for seller
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        type: 'deal_completed',
        product_id: productId,
        data: {
          message: `The deal for "${productTitle}" has been completed successfully`,
          buyer_id: buyerId,
          buyer_name: buyerProfile?.full_name || 'Unknown Buyer',
          buyer_avatar_url: buyerProfile?.avatar_url,
          product_title: productTitle,
          product_image_url: productImageUrl,
          transaction_id: transactionId,
        },
        read: false,
        is_action_done: false,
      });

    if (error) {
      console.error('Error creating deal completed notification:', error);
      throw error;
    }

    console.log('Deal completed notification created successfully');
    return data;
  } catch (error) {
    console.error('Failed to create deal completed notification:', error);
    throw error;
  }
}

// Example 4: Hold Request Approved Notification
export async function createHoldApprovedNotification(
  buyerId: string,
  sellerId: string,
  productId: string,
  productTitle: string,
  productImageUrl: string,
  endTime: string
) {
  try {
    // Get seller profile for notification data
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', sellerId)
      .single();

    // Create notification for buyer
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: buyerId,
        type: 'hold_request_approved',
        product_id: productId,
        data: {
          message: `Your hold request for "${productTitle}" was approved`,
          seller_id: sellerId,
          seller_name: sellerProfile?.full_name || 'Unknown Seller',
          seller_avatar_url: sellerProfile?.avatar_url,
          product_title: productTitle,
          product_image_url: productImageUrl,
          end_time: endTime,
        },
        read: false,
        is_action_done: false,
      });

    if (error) {
      console.error('Error creating hold approved notification:', error);
      throw error;
    }

    console.log('Hold approved notification created successfully');
    return data;
  } catch (error) {
    console.error('Failed to create hold approved notification:', error);
    throw error;
  }
}

// Example 5: Batch Notifications (for multiple users)
export async function createBatchNotifications(
  userIds: string[],
  type: string,
  message: string,
  additionalData: Record<string, any> = {}
) {
  try {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type,
      data: {
        message,
        ...additionalData,
      },
      read: false,
      is_action_done: false,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('Error creating batch notifications:', error);
      throw error;
    }

    console.log(`Created ${notifications.length} notifications successfully`);
    return data;
  } catch (error) {
    console.error('Failed to create batch notifications:', error);
    throw error;
  }
}

// Example 6: Test Notification (for debugging)
export async function createTestNotification(userId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'test_notification',
        data: {
          message: 'This is a test push notification',
          timestamp: new Date().toISOString(),
        },
        read: false,
        is_action_done: false,
      });

    if (error) {
      console.error('Error creating test notification:', error);
      throw error;
    }

    console.log('Test notification created successfully');
    return data;
  } catch (error) {
    console.error('Failed to create test notification:', error);
    throw error;
  }
}

// Usage examples:
/*
// Create a deal offer notification
await createDealOfferNotification(
  'buyer-user-id',
  'seller-user-id',
  'product-uuid',
  'Diamond Ring',
  'https://example.com/ring.jpg'
);

// Create a hold request notification
await createHoldRequestNotification(
  'seller-user-id',
  'buyer-user-id',
  'product-uuid',
  'Gold Necklace',
  'https://example.com/necklace.jpg',
  'hold-request-uuid',
  24
);

// Create a test notification
await createTestNotification('user-uuid');
*/ 