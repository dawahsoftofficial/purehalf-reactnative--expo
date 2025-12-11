import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button } from '../buttons';
import { wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import { isIOS } from '../../services';

interface MapWithMarkerProps {
  mapRef?: React.RefObject<MapView>;
  position: Region | any;
  setPosition: (location: Region) => void;
  dragable?: boolean;
  loading?: boolean;
  onUpdate: () => void;
  getCurrentLocation: () => void;
  navigation: any
}

const MapWithMarker: React.FC<MapWithMarkerProps> = ({ mapRef, position, setPosition, dragable = true, loading, onUpdate, getCurrentLocation, navigation }) => {
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

  return (
    <View style={Styles.container}>
      <View style={Styles.headerWrapper}>
        <Ripple
          onPress={() => navigation?.goBack()}
        >
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
            key: 'AIzaSyAyqvD_HZo402WmbfQ3AbvM60jYljrGbu8',
            language: 'en',
          }}
          styles={{
            textInputContainer: Styles.textInputContainer,
            textInput: Styles.textInput,
            description: { color: Colors.color1 }
          }}
        />
      </View>
      <MapView
        ref={mapRef}
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
        onRegionChangeComplete={(location: Region) => dragable && setPosition(location)}
      >
        <Marker title="You are here" coordinate={position} />
      </MapView>
      <Ripple style={Styles.gpsIcon} onPress={getCurrentLocation}>
        <MaterialCommunityIcons name="crosshairs-gps" color={Colors.color22} size={24} />
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
  },
  headerWrapper: {
    flexDirection: 'row',
    width: "95%",
    gap: 5,
    position: 'absolute',
    top: isIOS ? 70 : 20,
    left: wp(2.5),
    zIndex: 9
  },
  textInputContainer: {
    overflow: 'hidden'
  },
  textInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    height: "105%"
  },
  footerWrapper: {
    width: "95%",
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
  }
});

export default MapWithMarker;
