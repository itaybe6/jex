# Push Notifications Setup Guide

## Overview
This guide explains how to set up push notifications for the JEX mobile app using Supabase Edge Functions and Expo Push Notifications.

## Architecture
1. **Client Side**: Expo app requests push notification permissions and gets a token
2. **Token Storage**: Token is saved to `profiles.push_token` in Supabase
3. **Database Trigger**: When a new notification is inserted, a trigger calls the Edge Function
4. **Edge Function**: Sends push notification via Expo Push API
5. **User Receives**: Push notification on their device

## Important Note: iOS Development
If you see the error `"אין מחרוזת זכות ״aps-environment״ תקינה עבור היישום"`, this is **normal in development**. The code has been updated to handle this gracefully:

- **Development**: The error is expected and handled properly
- **Production**: Requires Push Notification Certificate from Apple Developer Console
- **Android**: Works in development without additional setup

See `IOS_PUSH_SETUP.md` for detailed iOS setup instructions.

## Setup Steps

### 1. Deploy the Edge Function

First, install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

Login to Supabase:
```bash
supabase login
```

Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy the Edge Function:
```bash
supabase functions deploy send-push-notification
```

### 2. Update Database Trigger

Update the migration file `supabase/migrations/20250101000000_create_notification_trigger.sql` with your actual project reference:

```sql
-- Replace 'your-project-ref' with your actual Supabase project reference
url := 'https://YOUR_ACTUAL_PROJECT_REF.supabase.co/functions/v1/send-push-notification',
```

Run the migration:
```bash
supabase db push
```

### 3. Configure Environment Variables

Set the following environment variables in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to Settings > API
3. Copy your project URL and anon key
4. Go to Settings > Edge Functions
5. Add these environment variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### 4. Test the Setup

#### Development Testing

1. **Test Token Registration**: 
   - Open the app and check the console for push notification logs
   - On iOS: You may see "iOS Push Notification Certificate not configured" - this is normal
   - On Android: Should work normally
   - Verify the token is saved in the `profiles` table

2. **Test Push Notification**:
   - Insert a test notification directly in the database:
   ```sql
   INSERT INTO notifications (user_id, type, data, read, is_action_done)
   VALUES (
     'your-user-id',
     'test_notification',
     '{"message": "Test push notification"}',
     false,
     false
   );
   ```

3. **Check Edge Function Logs**:
   ```bash
   supabase functions logs send-push-notification
   ```

#### Production Testing

For production testing, you'll need to:
1. Configure Push Notification Certificate in Apple Developer Console
2. Build the app with EAS: `eas build --platform ios`
3. Install on a physical device

## Code Structure

### Edge Function (`supabase/functions/send-push-notification/index.ts`)
- Listens for INSERT events on notifications table
- Fetches user's push token from profiles table
- Sends push notification via Expo Push API
- Handles different notification types with appropriate titles

### Client Service (`lib/pushNotificationService.ts`)
- Manages push notification permissions
- Registers for push notifications with fallback handling
- Saves token to server
- Sets up notification handlers
- Handles iOS development errors gracefully

### Database Trigger (`supabase/migrations/20250101000000_create_notification_trigger.sql`)
- Automatically calls Edge Function when notification is inserted
- Uses Supabase's HTTP extension

## Notification Types

The system supports these notification types with custom titles:

- `transaction_offer` → "New Deal Offer"
- `deal_completed` → "Deal Completed"
- `deal_rejected` → "Deal Rejected"
- `hold_request` → "Hold Request"
- `hold_request_approved` → "Hold Request Approved"
- `hold_request_rejected` → "Hold Request Rejected"
- `waiting_seller_approval` → "Waiting for Approval"

## Troubleshooting

### Common Issues

1. **iOS "aps-environment" error**: 
   - **Development**: This is normal and expected
   - **Production**: Configure Push Notification Certificate in Apple Developer Console
   - See `IOS_PUSH_SETUP.md` for detailed instructions

2. **Token not saved**: 
   - Check network requests and server logs
   - Verify Supabase environment variables are set

3. **Push notification not received**: 
   - Verify token is valid
   - Check Edge Function logs
   - Ensure app has notification permissions
   - For iOS: Use physical device for testing

4. **Edge Function not triggered**: 
   - Verify trigger is created in database
   - Check function URL in trigger
   - Ensure HTTP extension is enabled

### Debug Commands

```bash
# Check Edge Function status
supabase functions list

# View function logs
supabase functions logs send-push-notification --follow

# Test function locally
supabase functions serve send-push-notification --env-file .env.local
```

## Development vs Production

### Development
- iOS: May show certificate errors (normal)
- Android: Works normally
- Testing: Use Android device/emulator or Expo Go
- Token: Still saved to server for production use

### Production
- iOS: Requires Push Notification Certificate
- Android: Works normally
- Testing: Use physical devices
- Build: Use EAS Build for proper certificates

## Security Considerations

1. **Service Role Key**: Only used in Edge Function, never exposed to client
2. **Token Validation**: Edge Function validates user permissions
3. **Rate Limiting**: Consider implementing rate limiting for push notifications
4. **Token Rotation**: Implement token refresh mechanism for security

## Performance Optimization

1. **Batch Notifications**: For multiple notifications, consider batching
2. **Token Cleanup**: Remove invalid tokens from database
3. **Caching**: Cache user profiles to reduce database calls
4. **Error Handling**: Implement retry logic for failed notifications

## Monitoring

Monitor the following metrics:
- Push notification delivery rate
- Edge Function execution time
- Error rates in function logs
- Token validity rates

## Example Usage

```typescript
// Creating a notification (this will automatically trigger push notification)
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: 'user-uuid',
    type: 'transaction_offer',
    data: {
      message: 'You have a new deal offer!',
      product_title: 'Diamond Ring',
      product_image_url: 'https://example.com/image.jpg'
    },
    read: false,
    is_action_done: false
  });
```

The push notification will be sent automatically when this insert completes.

## Quick Start

For a quick setup guide, see `QUICK_START.md`.

For iOS-specific setup, see `IOS_PUSH_SETUP.md`. 