# מדריך דיבוג לבעיות העלאת תמונות

## בעיות נפוצות והפתרונות

### 1. האפליקציה קורסת בעת העלאת תמונה במכשיר אמיתי

#### סיבות אפשריות:
- חסרות הרשאות למצלמה/גלריה
- בעיות בקונפיגורציה של ImagePicker
- שגיאות לא מטופלות בקוד

#### פתרונות:
1. **בדיקת הרשאות**: וודא שההרשאות מוגדרות נכון ב-`app.json`
2. **בנייה מחדש**: בצע `npx expo prebuild --clean` ואז `npx expo run:android` או `npx expo run:ios`
3. **בדיקת לוגים**: השתמש בכלי הדיבוג המוצעים למטה

### 2. איך לבדוק שגיאות במכשיר אמיתי

#### עבור Android:
```bash
# התחבר למכשיר
adb devices

# צפה בלוגים בזמן אמת
adb logcat | grep -E "(ReactNative|Expo|ImagePicker|FATAL|ERROR)"

# או צפה בלוגים של האפליקציה הספציפית
adb logcat | grep "com.anonymous.jexmobilenew"
```

#### עבור iOS:
```bash
# השתמש ב-Xcode Console
# או השתמש ב-Console.app במחשב
# חפש אחר שם האפליקציה שלך
```

#### עבור Expo Development Build:
```bash
# הפעל עם דיבוג מופעל
npx expo start --dev-client

# או השתמש ב-Expo Dev Tools בדפדפן
# http://localhost:8081
```

### 3. בדיקת הרשאות

#### Android:
1. לך להגדרות > אפליקציות > JEX Mobile > הרשאות
2. וודא שהרשאות המצלמה והאחסון מאושרות

#### iOS:
1. לך להגדרות > פרטיות ואבטחה > מצלמה
2. לך להגדרות > פרטיות ואבטחה > תמונות
3. וודא שהאפליקציה מאושרת

### 4. בדיקת קונפיגורציה

וודא שקובץ `app.json` כולל:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "נדרש אישור גישה לגלריה כדי להעלות תמונות",
          "cameraPermission": "נדרש אישור גישה למצלמה כדי לצלם תמונות"
        }
      ]
    ]
  }
}
```

### 5. טיפים נוספים

1. **בדוק גרסת Expo SDK**: וודא שאתה משתמש בגרסה תואמת
2. **נקה cache**: `npx expo start --clear`
3. **בדוק חיבור לאינטרנט**: וודא שהמכשיר מחובר לאינטרנט
4. **בדוק מקום אחסון**: וודא שיש מספיק מקום במכשיר

### 6. קודי שגיאה נפוצים

- `E_PERMISSION_DENIED`: בעיית הרשאות
- `E_NO_CAMERA_ROLL`: אין גישה לגלריה
- `E_NO_CAMERA`: אין גישה למצלמה
- `E_IMAGE_PICKER_CANCELLED`: המשתמש ביטל את הבחירה

### 7. בדיקת ביצועים

```bash
# בדוק זיכרון וזמן תגובה
adb shell dumpsys meminfo com.anonymous.jexmobilenew

# בדוק שימוש ב-CPU
adb shell top | grep jexmobilenew
```

## אם הבעיה נמשכת

1. בדוק את הלוגים המלאים
2. נסה על מכשיר אחר
3. בדוק אם הבעיה קיימת גם ב-Expo Go
4. צור issue ב-GitHub עם פרטי השגיאה המלאים 