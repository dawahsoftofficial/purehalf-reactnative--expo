import { routeNotification } from './routeNotification';

describe('routeNotification', () => {
  it('opens approved private photos on the member requests tab', async () => {
    const navigation = { navigate: jest.fn() };

    await routeNotification(navigation, 'photo_request_approved', {
      data: { id: 42 },
    });

    expect(navigation.navigate).toHaveBeenCalledWith('PrivatePhotoRequest', {
      initialTab: 'yourRequests',
    });
  });

  it('keeps incoming photo requests on the default request tab', async () => {
    const navigation = { navigate: jest.fn() };

    await routeNotification(navigation, 'photo_access_request');

    expect(navigation.navigate).toHaveBeenCalledWith('PrivatePhotoRequest');
  });
});
