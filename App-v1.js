import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { StyleSheet, Text, View, ActivityIndicator, ScrollView, RefreshControl, Button, Linking } from 'react-native';
import { StyleSheet, RefreshControl, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
export async function allowsNotificationsAsync() {
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}
export async function requestPermissionsAsync() {
  return await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowAnnouncements: true,
    },
  });
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [page, setPage] = useState('');
  const [baseUrl] = useState('http://984a-111-95-220-4.ngrok.io');
  const notificationListener = useRef();
  const responseListener = useRef();  
  //create back handler webview
  const WEBVIEW_REF = useRef();
  const [canGoBack, setCanGoBack] = useState(false);

  const idUser = `
      document.getElementById('expotoken').value = '${expoPushToken}';
  `;
  
  const handleBackButton = () => {
    console.log(canGoBack)
    if (this.state.canGoBack) {
      this.state.WEBVIEW_REF.goBack();
    }
    return true;
  };

  const onNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      const onInteraction = notification.request.content.data.event;
        setPage(onInteraction);
        console.log(onInteraction)
    });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      const onInteraction = response.notification.request.content.data.event;
      setPage(onInteraction);
      console.log(onInteraction+'response')
    });

    BackHandler.addEventListener("hardwareBackPress", handleBackButton);

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      BackHandler.removeEventListener("hardwareBackPress", this.handleBackButton);
    };
  }, [canGoBack]);
  //webview with on message
  return (
      <WebView
          originWhitelist={['*']}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          style={styles.webViewStyle}
          javaScriptCanOpenWindowsAutomatically={true}
          source={{ uri: `${baseUrl}/${page}`, "Accept-Language": navigator.language,
          "User-Agent": Platform.OS, }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={idUser}
          allowsBackForwardNavigationGestures={true}
          requestDisallowInterceptTouchEvent={true}       
          ref={this.WEBVIEW_REF}
          onNavigationStateChange={onNavigationStateChange}   
      />

  );

}

const styles = StyleSheet.create({
  stylBefore: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleAfter: {
    flex: 1,
  },
  webViewStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginTop: 40,
  },
  activityIndicatorStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  ScrollStyle: {
    backgroundColor : 'white',
    position: 'relative',
   }
});

// Can use this function below, OR use Expo's Push Notification Tool-> https://expo.dev/notifications
async function sendPushNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Original Title',
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return token;
}