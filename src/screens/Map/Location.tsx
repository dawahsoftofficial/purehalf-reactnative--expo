import Geolocation from '@react-native-community/geolocation';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Linking, Platform } from 'react-native';
import type MapView from 'react-native-maps';

import MapWithMarker from '../../components/MapWithMarker';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';

const { height, width } = Dimensions.get('window');

const LATITUDE_DELTA = 0.28;

const Location = (props: any) => {
  const mapRef = useRef<MapView>(null);
  const { setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [position, setPosition] = useState({
    latitude: 24.7945629,
    longitude: 67.0149955,
    latitudeDelta: 0.28,
    longitudeDelta: LATITUDE_DELTA * (width / height),
  });

  useEffect(() => {
    if (currentUser?.latitude && currentUser?.longitude) {
      setPosition({
        latitude: currentUser?.latitude,
        longitude: currentUser?.longitude,
        latitudeDelta: 0.28,
        longitudeDelta: LATITUDE_DELTA * (width / height),
      });
    }
  }, []);

  const getCountryAndCity = async (lat: number, long: number) => {
    try {
      const res = await ApiServices.getLocationByLatLong(lat, long);
      if (res?.error_message) {
        flashErrorMessage(res.error_message);
        throw new Error(res.error_message);
      }
      if (res?.results && res.results.length > 0) {
        const addressComponents = res.results[0].address_components;
        let country;
        let city;

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
      } else {
        return { country: null, city: null };
      }
    } catch (err) {
      console.error('Failed to fetch location data:', err);
      throw err;
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position: any) => {
        const currentLongitude: number = +JSON.stringify(
          position.coords.longitude
        );
        const currentLatitude: number = +JSON.stringify(
          position.coords.latitude
        );
        const newPosition = {
          latitude: currentLatitude,
          longitude: currentLongitude,
          latitudeDelta: 0.28,
          longitudeDelta: LATITUDE_DELTA * (width / height),
        };
        console.log({ newPosition });
        setPosition(newPosition);
        if (mapRef && mapRef?.current) {
          mapRef.current.animateToRegion(newPosition, 1000);
        }
      },
      (error: any) => {
        console.log({ error });
        // Open native location settings when GPS icon is clicked and permission not granted
        if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
        } else {
          Linking.openSettings();
        }
        flashErrorMessage('Please enable location from settings');
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 1000,
      }
    );
  };

  const onUpdate = async () => {
    setLoading(true);
    const data = await getCountryAndCity(
      position?.latitude,
      position?.longitude
    );
    ApiServices.updateUserInfo({
      latitude: position?.latitude,
      longitude: position?.longitude,
      country: data?.country,
      city: data?.city,
    })
      .then(async (res) => {
        currentUser.detail = res;
        currentUser.latitude = position?.latitude;
        currentUser.longitude = position?.longitude;
        await setData(storageKeys.USER, currentUser);
        updateCurrentUser(currentUser);
        flashSuccessMessage('Location Updated');
        setLoading(false);
        props?.navigation?.goBack();
      })
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <MapWithMarker
      mapRef={mapRef as React.RefObject<MapView>}
      position={position}
      setPosition={setPosition}
      loading={loading}
      onUpdate={onUpdate}
      getCurrentLocation={getCurrentLocation}
      navigation={props?.navigation}
    />
  );
};
export default Location;
