import Geolocation from '@react-native-community/geolocation';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  PermissionsAndroid,
  StyleSheet,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Button, Container, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';

const Location: React.FC = (props: any) => {
  const { setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<boolean>(false);
  const [isReported, setIsReported] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  const onTagLineSubmit = ({
    lat,
    long,
    country,
    city,
  }: {
    lat: number;
    long: number;
    country?: string;
    city?: string;
  }) => {
    ApiServices.updateUserInfo({
      latitude: lat,
      longitude: long,
      country,
      city,
    })
      .then(async (res) => {
        const updatedUser = {
          ...currentUser,
          detail: res,
          latitude: lat,
          longitude: long,
        };
        await setData(storageKeys.USER, updatedUser);
        updateCurrentUser(updatedUser);
        if (
          !updatedUser?.first_name ||
          !updatedUser?.last_name ||
          !updatedUser?.gender ||
          !updatedUser?.date_of_birth
        ) {
          props?.navigation.reset({
            index: 0,
            routes: [{ name: 'UserInput' }],
          });
        } else {
          props?.navigation.reset({
            index: 0,
            routes: [{ name: 'BottomTab' }],
          });
        }
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const getCountryAndCity = (lat: number, long: number) => {
    ApiServices.getLocationByLatLong(lat, long)
      .then(async (res: any) => {
        if (res?.error_message) {
          setLoading(false);
          flashErrorMessage(res?.error_message);
        }
        if (res?.results && res?.results.length > 0) {
          // Extract country and city information from the first result
          const addressComponents = res?.results[0].address_components;
          let country, city;

          // Loop through address components to find country and city
          for (const component of addressComponents) {
            if (component.types.includes('country')) {
              country = component.long_name;
            } else if (component.types.includes('locality')) {
              city = component.long_name;
            }

            // Break the loop if both country and city are found
            if (country && city) {
              break;
            }
          }
          onTagLineSubmit({ lat, long, country, city });
        }
        // onTagLineSubmit({ lat: 24.9064253, long: 67.0345873 })
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const getOneTimeLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      (position: any) => {
        const currentLongitude: number = +JSON.stringify(
          position.coords.longitude
        );
        const currentLatitude: number = +JSON.stringify(
          position.coords.latitude
        );
        getCountryAndCity(currentLatitude, currentLongitude);
      },
      (error: any) => {
        flashErrorMessage('Please enable location from settings');
        setLoading(false);
        setFailed(true);
        Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 1000,
      }
    );
  };

  const requestLocationPermission = async () => {
    if (isIOS) {
      getOneTimeLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getOneTimeLocation();
        } else {
          flashErrorMessage('Allow Permission to access your location');
          setFailed(true);
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => {
      requestLocationPermission();
    }, 0);
    setTimeout(() => {
      setReport(true);
    }, 20000);
  }, []);

  const onEnablePress = () => {
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
  };

  const onReport = () => {
    ApiServices.storeQuery({ type: 3 })
      .then((res) => {
        if (!res?.data?.error) {
          flashSuccessMessage('Reported successfully');
          setIsReported(true);
        }
      })
      .catch((err) => {});
  };

  return (
    <Container style={Styles.container}>
      <View>
        <View>
          <Image
            source={Images.logoColoured}
            resizeMode="contain"
            style={Styles.logo}
          />
        </View>
        <View style={Styles.textContainer}>
          <Text style={Styles.mainText}>{LanguageKeys.meetPartner}</Text>
          <Text style={Styles.subText}>{LanguageKeys.enableLocationDes}</Text>
        </View>
        {failed && (
          <Ripple onPress={requestLocationPermission}>
            <Text style={Styles.locationText}>{LanguageKeys.tryAgain}</Text>
          </Ripple>
        )}
        <Button
          buttonStyle={Styles.locationBtn}
          text={loading ? LanguageKeys.processing : LanguageKeys.enableLocation}
          onPress={loading ? () => {} : onEnablePress}
          // loading={failed ? false : loading}
          loading={loading}
        />
      </View>
      {report && (
        <Ripple onPress={isReported ? () => {} : onReport}>
          <Text
            style={[
              Styles.reportText,
              { color: isReported ? Colors.randomRGBA70 : Colors.color44 },
            ]}
          >
            {LanguageKeys.report}
          </Text>
        </Ripple>
      )}
    </Container>
  );
};

export default Location;

const Styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    marginTop: hp(15),
    width: '100%',
    height: hp(25),
  },
  textContainer: {
    width: wp(80),
    marginTop: hp(2),
  },
  mainText: {
    fontSize: Typography.medium,
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
  },
  subText: {
    fontSize: Typography.small1,
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color4,
  },
  locationBtn: {
    marginTop: hp(3),
  },
  locationText: {
    marginTop: hp(5),
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.color4,
    alignSelf: 'center',
    textDecorationLine: 'underline',
  },
  reportText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    alignSelf: 'center',
    marginBottom: hp(3),
    textDecorationLine: 'underline',
  },
});
