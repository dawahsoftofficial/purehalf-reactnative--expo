import { PermissionsAndroid } from 'react-native';
const requestNotificationPermission = async () => {
    return new Promise(async (resolve, reject) => {
        const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if(!granted) {
            try {
                const status = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                );
                if(status === PermissionsAndroid.RESULTS.GRANTED) {
                    resolve('granted')
                } else {
                    reject('denied')
                }
            } catch(error) {
                reject('')
                console.error('Error requesting notification permission:', error);
            }
        }
        else {
            resolve('granted')
        }
    })
};

export default requestNotificationPermission

