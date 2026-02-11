import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import Ripple from 'react-native-material-ripple';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import { Button } from '../buttons';

interface MapWithMarkerProps {
  mapRef?: React.RefObject<MapView>;
  position: Region | any;
  setPosition: (location: Region) => void;
  dragable?: boolean;
  loading?: boolean;
  onUpdate: () => void;
  getCurrentLocation: () => void;
  navigation: any;
}

const MapWithMarker: React.FC<MapWithMarkerProps> = ({
  mapRef,
  position,
  setPosition,
  dragable = true,
  loading,
  onUpdate,
  getCurrentLocation,
  navigation,
}) => {
  const { top } = useSafeAreaInsets();
  const onPlaceSelected = (data: any, details: any) => {
    const { lat, lng } = details?.geometry?.location;

    const newPosition = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setPosition(newPosition);

    if (mapRef && mapRef.current) {
      mapRef.current.animateToRegion(newPosition, 1000);
    }
  };

  const onMarkerDragEnd = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newPosition = {
      ...position,
      latitude,
      longitude,
    };
    setPosition(newPosition);
    if (mapRef?.current) {
      mapRef.current.animateToRegion(newPosition, 500);
    }
  };

  return (
    <View style={Styles.container}>
      <View style={[Styles.headerWrapper, { paddingTop: top + 10 }]}>
        <Ripple onPress={() => navigation?.goBack()}>
          <AntDesign
            name={'arrowleft'}
            color={Colors.color1}
            size={wp(6)}
            style={{ top: 7 }}
          />
        </Ripple>
        <GooglePlacesAutocomplete
          fetchDetails={true}
          placeholder="Search"
          onPress={onPlaceSelected}
          enablePoweredByContainer={false}
          query={{
            key: 'AIzaSyAuJHAOwye_HX_Zvpn_cR7CE1PdNl401tY',
            language: 'en',
          }}
          styles={{
            textInputContainer: Styles.textInputContainer,
            textInput: Styles.textInput,
            description: { color: Colors.color1 },
          }}
        />
      </View>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={Styles.map}
        initialRegion={position}
        showsUserLocation={dragable}
        showsMyLocationButton={false}
        followsUserLocation={dragable}
        showsCompass={dragable}
        scrollEnabled={dragable}
        zoomEnabled={dragable}
        pitchEnabled={dragable}
        rotateEnabled={dragable}
      >
        <Marker
          title="You are here"
          coordinate={position}
          draggable={dragable}
          onDragEnd={onMarkerDragEnd}
        />
      </MapView>
      <Ripple style={Styles.gpsIcon} onPress={getCurrentLocation}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          color={Colors.color22}
          size={24}
        />
      </Ripple>
      <View style={Styles.footerWrapper}>
        <Button
          text={LanguageKeys.update}
          onPress={onUpdate}
          loading={loading}
        />
      </View>
    </View>
  );
};

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
  },
  headerWrapper: {
    flexDirection: 'row',
    width: '95%',
    gap: 5,
    position: 'absolute',
    left: wp(2.5),
    zIndex: 9,
  },
  textInputContainer: {
    overflow: 'hidden',
  },
  textInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    height: '105%',
  },
  footerWrapper: {
    width: '95%',
    position: 'absolute',
    bottom: 20,
    left: wp(2.5),
  },
  gpsIcon: {
    backgroundColor: Colors.color2,
    zIndex: 9,
    position: 'absolute',
    bottom: 100,
    right: 20,
    padding: 8,
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MapWithMarker;
