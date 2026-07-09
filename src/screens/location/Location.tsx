import Geolocation from '@react-native-community/geolocation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  type AppStateStatus,
  Linking,
  PermissionsAndroid,
  StyleSheet,
  View,
} from 'react-native';

import { Colors } from '@/res';

import { Button, Container } from '../../components';
import { hp, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';
import LocationHeader from './components/location-header';
import ReportLink from './components/report-link';
import TryAgainLink from './components/try-again-link';

type GeolocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
  };
};

type GeolocationError = {
  code: number;
  message: string;
};

type AddressComponent = {
  types: string[];
  long_name: string;
};

type GeocodingResponse = {
  error_message?: string;
  results?: Array<{
    address_components: AddressComponent[];
  }>;
};

type User = {
  first_name?: string;
  last_name?: string;
  gender?: string;
  date_of_birth?: string;
  latitude?: number;
  longitude?: number;
  detail?: unknown;
  [key: string]: unknown;
};

type LocationProps = {
  navigation: {
    reset: (config: { index: number; routes: Array<{ name: string }> }) => void;
  };
};

function Location({ navigation }: LocationProps) {
  const { setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<boolean>(false);
  const [isReported, setIsReported] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);
  // Guards against overlapping location requests (each has a 30s timeout).
  // Without it, repeatedly returning to the foreground would stack requests.
  const isFetchingRef = useRef<boolean>(false);

  const navigateToNextScreen = useCallback(
    (user: User) => {
      const hasBasicInfo =
        user?.first_name &&
        user?.last_name &&
        user?.gender &&
        user?.date_of_birth;

      navigation.reset({
        index: 0,
        routes: [{ name: hasBasicInfo ? 'BottomTab' : 'UserInput' }],
      });
    },
    [navigation]
  );

  const onTagLineSubmit = useCallback(
    ({
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
          const updatedUser: User = {
            ...(currentUser as User),
            detail: res,
            latitude: lat,
            longitude: long,
          };
          await setData(storageKeys.USER, updatedUser);
          updateCurrentUser(updatedUser);
          navigateToNextScreen(updatedUser);
        })
        .catch(() => {
          setLoading(false);
        });
    },
    [
      currentUser,
      setData,
      storageKeys.USER,
      updateCurrentUser,
      navigateToNextScreen,
    ]
  );

  const extractLocationInfo = useCallback(
    (addressComponents: AddressComponent[]) => {
      let country: string | undefined;
      let city: string | undefined;

      for (const component of addressComponents) {
        if (component.types.includes('country')) {
          country = component.long_name;
        } else if (component.types.includes('locality')) {
          city = component.long_name;
        }

        if (country && city) {
          break;
        }
      }

      return { country, city };
    },
    []
  );

  const getCountryAndCity = useCallback(
    (lat: number, long: number) => {
      ApiServices.getLocationByLatLong(lat, long)
        .then((res: unknown) => {
          const response = res as GeocodingResponse;
          if (response?.error_message) {
            setLoading(false);
            flashErrorMessage(response.error_message);
            return;
          }
          if (response?.results && response.results.length > 0) {
            const addressComponents = response.results[0].address_components;
            const { country, city } = extractLocationInfo(addressComponents);
            onTagLineSubmit({ lat, long, country, city });
          }
        })
        .catch(() => {
          setLoading(false);
        });
    },
    [extractLocationInfo, onTagLineSubmit]
  );

  const getOneTimeLocation = useCallback(
    ({ silent = false }: { silent?: boolean } = {}) => {
      // Don't stack automatic retries on top of an in-flight request.
      if (silent && isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;
      setLoading(true);
      Geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          isFetchingRef.current = false;
          const currentLatitude = position.coords.latitude;
          const currentLongitude = position.coords.longitude;
          getCountryAndCity(currentLatitude, currentLongitude);
        },
        (error: GeolocationError) => {
          isFetchingRef.current = false;
          console.error('Geolocation error:', error);
          setLoading(false);
          setFailed(true);
          // Only surface a flash for explicit user attempts. Automatic retries
          // triggered by returning to the foreground stay silent, otherwise the
          // same "enable location" message loops every time the user comes back
          // from the settings screen while the GPS has no fix yet (a transient
          // timeout is misreported as location being off).
          if (!silent) {
            flashErrorMessage('Please enable location from settings');
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 1000,
        }
      );
    },
    [getCountryAndCity]
  );

  const requestLocationPermission = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (isIOS) {
        getOneTimeLocation({ silent });
        return;
      }

      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getOneTimeLocation({ silent });
        } else {
          setFailed(true);
          if (!silent) {
            flashErrorMessage('Allow Permission to access your location');
          }
        }
      } catch (error) {
        console.error('Permission request error:', error);
        setFailed(true);
      }
    },
    [getOneTimeLocation]
  );

  useEffect(() => {
    const permissionTimer = setTimeout(() => {
      requestLocationPermission();
    }, 0);

    const reportTimer = setTimeout(() => {
      setReport(true);
    }, 20000);

    return () => {
      clearTimeout(permissionTimer);
      clearTimeout(reportTimer);
    };
  }, [requestLocationPermission]);

  // When user returns from Settings (e.g. after enabling location on iOS), retry
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active' && failed) {
          // Silent: auto-retry to proceed if the user just enabled location,
          // without re-flashing an error on every return to the foreground.
          requestLocationPermission({ silent: true });
        }
      }
    );
    return () => subscription.remove();
  }, [failed, requestLocationPermission]);

  const onEnablePress = useCallback(() => {
    if (isIOS) {
      Linking.openSettings();
    } else {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
    }
  }, []);

  const onReport = useCallback(() => {
    ApiServices.storeQuery({ type: 3 })
      .then((res: unknown) => {
        const response = res as { data?: { error?: boolean } };
        if (!response?.data?.error) {
          flashSuccessMessage('Reported successfully');
          setIsReported(true);
        }
      })
      .catch((error) => {
        console.error('Error reporting issue:', error);
      });
  }, []);

  const buttonText = useMemo(
    () => (loading ? LanguageKeys.processing : LanguageKeys.enableLocation),
    [loading]
  );

  return (
    <Container style={Styles.container}>
      <LocationHeader />
      <View style={Styles.buttonContainer}>
        {failed && (
          <TryAgainLink
            onPress={
              isIOS
                ? () => Linking.openSettings()
                : () => requestLocationPermission()
            }
          />
        )}
        <Button
          buttonStyle={Styles.locationBtn}
          text={buttonText}
          onPress={loading ? () => {} : onEnablePress}
          loading={loading}
        />
        {report && <ReportLink isReported={isReported} onPress={onReport} />}
      </View>
    </Container>
  );
}

export default Location;

const Styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: Colors.color2,
  },
  locationBtn: {
    marginTop: hp(3),
  },
  buttonContainer: {
    bottom: 0,
    zIndex: 1,
    width: '100%',
    position: 'absolute',
    paddingBottom: hp(1.5),
    paddingHorizontal: wp(4),
  },
});
