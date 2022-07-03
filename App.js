import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, RefreshControl, BackHandler, ScrollView, SafeAreaView, StatusBar, Dimensions } from 'react-native';
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
    android: {
      sound: true,
      priority: 'max',
    }
  });
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [page, setPage] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();  
  const domain = 'https://intra21.emp.id/';
  const idUser = `
  document.getElementById('expotoken').value = '${expoPushToken}';
  document.querySelector('.dt-button').style.display = 'none';
  window.ReactNativeWebView.postMessage(Math.max(document.body.offsetHeight, document.body.scrollHeight));
  `;
  const [baseUrl] = useState(domain);
  
  const WebViewPage = ({navigation}) => {
    const WEBVIEW_REF = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const [currentUrl, setCurrentUrl] = useState(domain);
    
    const backAction = () => {
      // console.log(canGoBack)
      if(canGoBack){
        WEBVIEW_REF.current.goBack();
      }else{
        navigation.navigate('webview');        
      }
      return true;
    };

    useEffect(() => {
    
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));  

        BackHandler.addEventListener('hardwareBackPress', backAction);
              // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          setNotification(notification);
          const onInteraction = notification.request.content.data.event;
            setCurrentUrl(onInteraction);
        });

        // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
          // console.log(response);
          const onInteraction = response.notification.request.content.data.event;
          setCurrentUrl(onInteraction);
          // console.log(onInteraction+'response')
        });
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction);
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
    },[canGoBack]);

    //create function reload webview, scroll bottom
    const [refreshing, setRefreshing] = React.useState(false);
    const onRefresh = React.useCallback(() => {
      setRefreshing(true);
      WEBVIEW_REF.current.reload();
      setRefreshing(false);
    }, [refreshing]);
    const [webViewHeight, setWebViewHeight] = React.useState(null);
  
    const onMessage = (event) => {
      setWebViewHeight(Number(event.nativeEvent.data));
    }

    return (
        // <ScrollView contentContainerStyle={{ flexGrow: 1, height: webViewHeight }}
        // refreshControl={
        //   <RefreshControl
        //     refreshing={refreshing}
        //     onRefresh={onRefresh}
        //   />
        // }>
     <WebView
          // javaScriptEnabledAndroid={true}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          style={styles.webViewStyle}
          javaScriptCanOpenWindowsAutomatically={true}
          source={{ uri: `${currentUrl}`, "Accept-Language": navigator.language,
          "User-Agent": Platform.OS, }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={onMessage}
          injectedJavaScript={idUser}
          allowsBackForwardNavigationGestures={true}
          requestDisallowInterceptTouchEvent={true}
          downloadingMessage={'Downloading...'}
          ref={WEBVIEW_REF}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
            setCurrentUrl(navState.url);
          }}
      />
      // </ScrollView>
    );
  };
  //create stack navigator
  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="webview" component={WebViewPage} options={{ headerShown : false}}/>
      </Stack.Navigator>
    </NavigationContainer>
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
    position: 'relative',
    marginTop: 40,
  },
  activityIndicatorStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  ScrollStyle: {
    backgroundColor : 'white'
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
      sound: 'default',
    });
  }
  // console.log(token)
  return token;
}