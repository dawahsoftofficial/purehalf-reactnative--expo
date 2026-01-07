import {
  appleAuth,
  type AppleRequestResponseFullName,
} from '@invertase/react-native-apple-authentication';
import { getApp } from '@react-native-firebase/app';
import {
  AppleAuthProvider,
  getAuth,
  signInWithCredential,
} from '@react-native-firebase/auth';
import axios from 'axios';
import Purchases from 'react-native-purchases';

import { LanguageKeys } from '../../languages';
import { isIOS } from '../CommonServices';
import { Firebase } from '../firebase';
import { flashErrorMessage, flashSuccessMessage } from '../FlashMessages';
import { StorageManager } from '../storageManager';
import BaseUrl from './BaseUrl';
import EndPoints from './EndPoints';
import { Api } from './Middleware';
import type {
  CurrentUserDetail,
  GetCurrentUserDetailResponse,
} from './types/user-types';

const { storageKeys, setData, getData } = StorageManager;

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);

class GApiServices {
  /**
   * Gets a valid FCM token from storage, or fetches a fresh one if the stored token is a placeholder
   * @returns Promise<string> - A valid FCM token or placeholder 'FcmToken' for iOS emulator
   */
  private async getValidFcmToken(): Promise<string> {
    try {
      const storedToken = (await getData(storageKeys.FCM_TOKEN)) as
        | string
        | null
        | undefined;

      // If stored token is valid and not a placeholder, use it
      if (storedToken && storedToken !== 'FcmToken' && storedToken.length > 0) {
        return storedToken;
      }

      // If stored token is the placeholder 'FcmToken' or empty, try to get a fresh token
      try {
        const freshToken = (await Firebase.getFcmToken()) as
          | string
          | null
          | undefined;
        if (freshToken && freshToken !== 'FcmToken' && freshToken.length > 0) {
          // Save the fresh token for future use
          await setData(storageKeys.FCM_TOKEN, freshToken);
          return freshToken;
        }
      } catch (error) {
        // Silently handle error - permissions might not be granted yet
        // This is expected behavior and not a critical error
        console.log(
          '[getValidFcmToken] Could not fetch fresh FCM token (permissions may not be granted):',
          error instanceof Error ? error.message : String(error)
        );
      }

      // Return stored token if exists, otherwise return placeholder
      return storedToken || 'FcmToken';
    } catch (error) {
      console.error(
        '[getValidFcmToken] Error retrieving FCM token from storage:',
        error
      );
      // Try to get a fresh token as fallback
      try {
        const freshToken = (await Firebase.getFcmToken()) as
          | string
          | null
          | undefined;
        if (freshToken && freshToken.length > 0) {
          return freshToken;
        }
      } catch (fallbackError) {
        // Silently handle fallback error
        console.log(
          '[getValidFcmToken] Could not fetch fresh FCM token in fallback:',
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError)
        );
      }
      return 'FcmToken';
    }
  }
  socialAuthenticate = (provider: string) => {
    return new Promise(async (resolve, reject) => {
      console.log(
        '[socialAuthenticate] Starting social authentication with provider:',
        provider
      );
      Firebase.googleSignIn()
        .then(async (googleRes: any) => {
          // Handle response structure - could be direct or wrapped in data
          const idToken = googleRes?.data?.idToken || googleRes?.idToken;
          const userData = googleRes?.data?.user || googleRes?.user;
          const email = userData?.email;
          const givenName = userData?.givenName;
          const familyName = userData?.familyName;

          console.log('[socialAuthenticate] Google sign-in successful:', {
            hasIdToken: !!idToken,
            hasUser: !!userData,
            userEmail: email,
            userId: userData?.id,
            responseStructure: {
              hasData: !!googleRes?.data,
              hasDirectIdToken: !!googleRes?.idToken,
              hasDirectUser: !!googleRes?.user,
            },
          });
          const fcmToken = await this.getValidFcmToken();
          console.log('[socialAuthenticate] FCM token retrieved:', {
            hasToken: !!fcmToken,
            isPlaceholder: fcmToken === 'FcmToken',
          });
          const requestPayload = {
            token: idToken,
            email: email,
            provider,
            fcm_token: fcmToken,
            device_type: !isIOS ? 0 : 1,
          };
          console.log('[socialAuthenticate] Calling API with payload:', {
            hasToken: !!requestPayload.token,
            email: requestPayload.email,
            provider: requestPayload.provider,
            hasFcmToken: !!requestPayload.fcm_token,
            deviceType: requestPayload.device_type,
          });
          Api.post(EndPoints.socialAuthenticate, requestPayload)
            .then(async (apiRes: any) => {
              console.log('[socialAuthenticate] API call successful:', {
                hasData: !!apiRes?.data,
                hasResults: !!apiRes?.data?.results,
                hasBearerToken: !!apiRes?.data?.bearer_token,
              });
              const apiResult = apiRes?.data?.results;

              const firstName = apiResult?.first_name || givenName || '';
              const lastName = apiResult?.last_name || familyName || '';

              apiResult.first_name = firstName;
              apiResult.last_name = lastName;

              console.log(
                '[socialAuthenticate] Saving user data to storage...'
              );
              await setData(storageKeys.USER, apiResult);
              await setData(storageKeys.USER_TOKEN, apiRes?.data?.bearer_token);
              await Firebase.handleIsLoggedIn(true);

              if (apiResult?.banned_at && apiResult?.banned_at?.length !== 0) {
                console.log('[socialAuthenticate] User is banned');
                flashErrorMessage(
                  'You are banned and not allowed to login anymore.'
                );
                const banError = new Error('User is banned');
                reject(banError);
              } else {
                const res = {
                  user: apiResult,
                };
                console.log(
                  '[socialAuthenticate] Authentication completed successfully:',
                  {
                    userId: apiResult?.id,
                    userEmail: apiResult?.email,
                  }
                );
                resolve(res);
              }
            })
            .catch((error: any) => {
              const errorData = error?.response?.data || error;
              console.error(
                '[socialAuthenticate] API error while authenticating User with google:',
                {
                  message: error?.message || errorData?.message,
                  errorData: errorData,
                  responseData: error?.response?.data,
                  responseStatus: error?.response?.status,
                  statusCode: error?.response?.status || errorData?.code,
                  errorCode: error?.code || errorData?.code,
                  results: errorData?.results,
                  resultsArray: Array.isArray(errorData?.results)
                    ? errorData.results.map((r: any, i: number) => ({
                        index: i,
                        ...r,
                      }))
                    : errorData?.results,
                  fullError: JSON.stringify(error, null, 2),
                }
              );
              const errorMessage =
                errorData?.message ||
                errorData?.results?.[0]?.message ||
                error?.message ||
                'Authentication failed';
              flashErrorMessage(errorMessage);
              reject(error);
            });
        })
        .catch((error: any) => {
          console.error('[socialAuthenticate] Error in Google sign-in:', {
            error,
            message: error?.message,
            code: error?.code,
          });
          reject(error);
        });
    });
  };
  socialAppleAuthenticate = (provider: string) => {
    return new Promise(async (resolve, reject) => {
      console.log(
        '[socialAppleAuthenticate] Starting Apple authentication with provider:',
        provider
      );
      let appleFullName: AppleRequestResponseFullName | null = null;
      try {
        // Check if Apple Sign In is supported on this device
        const isSupported = appleAuth.isSupported;
        console.log(
          '[socialAppleAuthenticate] Apple Sign In supported:',
          isSupported
        );
        if (!isSupported) {
          const error = new Error(
            'Apple Sign In is not supported on this device. Please use iOS 13+ or try another login method.'
          );
          error.name = 'AppleSignInNotSupported';
          flashErrorMessage(
            'Apple Sign In is not available on this device. Please use another login method.'
          );
          reject(error);
          return;
        }

        console.log(
          '[socialAppleAuthenticate] Performing Apple authentication request...'
        );
        const appleAuthRequestResponse = await appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
          // See: https://github.com/invertase/react-native-apple-authentication#faqs
          requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
        });
        console.log(
          '[socialAppleAuthenticate] Apple auth request successful:',
          {
            hasIdentityToken: !!appleAuthRequestResponse?.identityToken,
            hasNonce: !!appleAuthRequestResponse?.nonce,
            hasFullName: !!appleAuthRequestResponse?.fullName,
            hasEmail: !!appleAuthRequestResponse?.email,
          }
        );

        const { identityToken, nonce, fullName } = appleAuthRequestResponse;
        appleFullName = fullName;
        console.log(
          '[socialAppleAuthenticate] Creating Firebase credential...'
        );
        const appleCredential = AppleAuthProvider.credential(
          identityToken,
          nonce
        );
        console.log(
          '[socialAppleAuthenticate] Signing in with Firebase credential...'
        );

        signInWithCredential(auth, appleCredential)
          .then(async (res: any) => {
            console.log(
              '[socialAppleAuthenticate] Firebase sign-in successful:',
              {
                hasUser: !!res?.user,
                userEmail: res?.user?.email,
                userId: res?.user?.uid,
              }
            );
            const fcmToken = await this.getValidFcmToken();
            console.log('[socialAppleAuthenticate] FCM token retrieved:', {
              hasToken: !!fcmToken,
              isPlaceholder: fcmToken === 'FcmToken',
            });

            const requestPayload = {
              token: identityToken,
              email: res?.user?.email,
              provider,
              fcm_token: fcmToken,
              device_type: !isIOS ? 0 : 1,
            };

            console.log('[socialAppleAuthenticate] Calling API with payload:', {
              hasToken: !!requestPayload.token,
              email: requestPayload.email,
              provider: requestPayload.provider,
              hasFcmToken: !!requestPayload.fcm_token,
              deviceType: requestPayload.device_type,
            });

            Api.post(EndPoints.socialAuthenticate, requestPayload)
              .then(async (apiRes: any) => {
                console.log('[socialAppleAuthenticate] API call successful:', {
                  hasData: !!apiRes?.data,
                  hasResults: !!apiRes?.data?.results,
                  hasBearerToken: !!apiRes?.data?.bearer_token,
                });
                const apiResult = apiRes?.data?.results;
                let firstName = '';
                let lastName = '';

                if (appleFullName) {
                  const { givenName, familyName } = appleFullName;
                  firstName = givenName || '';
                  lastName = familyName || '';
                  console.log(
                    '[socialAppleAuthenticate] Extracted name from Apple:',
                    {
                      firstName,
                      lastName,
                    }
                  );
                }

                apiResult.first_name = apiResult?.first_name || firstName;
                apiResult.last_name = apiResult?.last_name || lastName;

                console.log(
                  '[socialAppleAuthenticate] Saving user data to storage...'
                );
                await setData(storageKeys.USER, apiResult);
                await setData(
                  storageKeys.USER_TOKEN,
                  apiRes?.data?.bearer_token
                );
                await Firebase.handleIsLoggedIn(true);

                if (
                  apiResult?.banned_at &&
                  apiResult?.banned_at?.length !== 0
                ) {
                  console.log('[socialAppleAuthenticate] User is banned');
                  flashErrorMessage(
                    'You are banned and not allowed to login anymore.'
                  );
                  const banError = new Error('User is banned');
                  reject(banError);
                } else {
                  const res = {
                    user: apiResult,
                  };
                  console.log(
                    '[socialAppleAuthenticate] Authentication completed successfully:',
                    {
                      userId: apiResult?.id,
                      userEmail: apiResult?.email,
                    }
                  );
                  resolve(res);
                }
              })
              .catch((error: any) => {
                const errorData = error?.response?.data || error;
                console.error(
                  '[socialAppleAuthenticate] API error while authenticating User with Apple:',
                  {
                    message: error?.message || errorData?.message,
                    errorData: errorData,
                    responseData: error?.response?.data,
                    responseStatus: error?.response?.status,
                    statusCode: error?.response?.status || errorData?.code,
                    errorCode: error?.code || errorData?.code,
                    results: errorData?.results,
                    resultsArray: Array.isArray(errorData?.results)
                      ? errorData.results.map((r: any, i: number) => ({
                          index: i,
                          ...r,
                        }))
                      : errorData?.results,
                    fullError: JSON.stringify(error, null, 2),
                  }
                );
                const errorMessage =
                  errorData?.message ||
                  errorData?.results?.[0]?.message ||
                  error?.message ||
                  'Authentication failed';
                flashErrorMessage(errorMessage);
                reject(error);
              });
          })
          .catch((error: any) => {
            console.error(
              '[socialAppleAuthenticate] Error in Firebase sign-in with credential:',
              {
                error,
                message: error?.message,
                code: error?.code,
              }
            );
            reject(error);
          });
      } catch (error: any) {
        const errorCode = error?.code;
        const errorMessage = error?.message;
        const errorDomain = error?.domain;

        console.error(
          '[socialAppleAuthenticate] Error in Apple authentication request:',
          {
            error,
            message: errorMessage,
            code: errorCode,
            domain: errorDomain,
            userInfo: error?.userInfo,
          }
        );

        // Handle specific Apple authentication error codes
        // Error code 1001 = ASAuthorizationErrorCanceled (user canceled)
        // Error code 1000 = ASAuthorizationErrorUnknown (unknown error - could be configuration issue)
        // Error code 1002 = ASAuthorizationErrorInvalidResponse
        // Error code 1003 = ASAuthorizationErrorNotHandled
        // Error code 1004 = ASAuthorizationErrorFailed
        if (errorCode === '1001' || errorCode === 1001) {
          console.log(
            '[socialAppleAuthenticate] User canceled Apple authentication'
          );
          // Don't show error message if user canceled
          const cancelError = new Error('User canceled Apple sign in');
          cancelError.name = 'AppleSignInCanceled';
          reject(cancelError);
        } else if (errorCode === '1000' || errorCode === 1000) {
          // Error 1000 is ASAuthorizationErrorUnknown - could be:
          // - Configuration issue (missing Sign in with Apple capability)
          // - Device not signed in to iCloud
          // - Bundle identifier mismatch
          // - Missing configuration in Apple Developer Portal
          console.error(
            '[socialAppleAuthenticate] Apple authentication error 1000 (Unknown) - Possible causes:',
            {
              possibleCauses: [
                'Missing Sign in with Apple capability in Xcode',
                'Device not signed in to iCloud',
                'Bundle identifier mismatch',
                'Missing configuration in Apple Developer Portal',
                'iOS version or device compatibility issue',
              ],
              errorDetails: {
                domain: errorDomain,
                userInfo: error?.userInfo,
              },
            }
          );
          const configError = new Error(
            'Apple Sign In configuration error. Please check your device settings or contact support.'
          );
          configError.name = 'AppleSignInConfigurationError';
          flashErrorMessage(
            'Apple Sign In is not properly configured. Please use another login method or contact support.'
          );
          reject(configError);
        } else {
          // Other errors - show user-friendly message
          console.error(
            '[socialAppleAuthenticate] Apple authentication error:',
            errorCode,
            errorMessage
          );
          const authError = new Error(
            errorMessage || 'Apple authentication failed. Please try again.'
          );
          authError.name = 'AppleSignInError';
          flashErrorMessage(
            'Apple sign in failed. Please try again or use another method.'
          );
          reject(authError);
        }
      }
    });
  };

  loginUser = async (phoneNumber: any, onLogin: any) => {
    return new Promise(async (resolve, reject) => {
      const fcmToken = await this.getValidFcmToken();
      Api.post(EndPoints.authenticate, {
        phone_number: phoneNumber,
        fcm_token: fcmToken,
        device_type: !isIOS ? 0 : 1,
      })
        .then(async (apiRes: any) => {
          const apiResult = apiRes?.data?.results;
          await setData(storageKeys.USER, apiResult);
          await setData(storageKeys.USER_TOKEN, apiRes?.data?.bearer_token);
          if (apiResult?.banned_at && apiResult?.banned_at?.length !== 0) {
            flashErrorMessage(
              'You are banned and not allowed to login anymore.'
            );
            reject('');
          } else {
            onLogin(apiRes?.data);
          }
        })
        .catch((error) => {
          reject('');
          console.log(
            'error while authenticating User =>',
            error?.response?.data
          );
        });
    });
  };

  authenticateUser = (phoneNumber: any, onLogin: any, fromOtp: boolean) => {
    return new Promise(async (resolve, reject) => {
      // const fcmToken = await getData(storageKeys.FCM_TOKEN)
      if (fromOtp) {
        this.loginUser(phoneNumber, onLogin);
      } else {
        Firebase.sendVerificationCode(phoneNumber)
          .then(async (verificationRes) => {
            const res: any = {
              verificationRes: verificationRes,
            };
            const verificationId = await getData(
              storageKeys.FIREBASE_VERIFICATION_ID
            );
            await setData(
              storageKeys.FIREBASE_VERIFICATION_ID,
              res?.verificationRes?.['_verificationId']
            );

            if (verificationId === res?.verificationRes?.['_verificationId']) {
              this.loginUser(phoneNumber, onLogin);
            } else {
              resolve(res);
            }
          })
          .catch((error) => {
            console.log(
              'error while authentication User on firebase with phone number =>',
              error
            );
            reject('');
          });
      }
    });
  };

  updateUserInfo = (params: any) => {
    return new Promise(async (resolve, reject) => {
      Api.post(EndPoints.updateInfo, params)
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          const errorMessage = error?.response?.data?.results;
          if (errorMessage && errorMessage?.length !== 0) {
            flashErrorMessage(errorMessage[0]);
          } else {
            flashErrorMessage();
          }
          reject('');
          console.log('error while updating auth info =>', error);
        });
    });
  };

  getAppSettings = () => {
    return new Promise((resolve, reject) => {
      Api.get(EndPoints.getAppSettings)
        .then((data: any) => {
          const response = {
            message: data?.data?.message || '',
            error: data?.data?.error || false,
            code: data?.data?.code || 200,
            results: data?.data?.results || [],
          };
          resolve(response);
        })
        .catch((error) => {
          console.log('error while getting Button Status =>', error);
          reject('');
        });
    });
  };

  getLanguages = () => {
    return new Promise((resolve, reject) => {
      Api.get(EndPoints.getLanguageList)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          console.log('error while getting languages =>', error);
          reject('');
        });
    });
  };

  getNationality = () => {
    return new Promise((resolve, reject) => {
      Api.get(EndPoints.getNationalityList)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          console.log('error while getting nationality list =>', error);
          reject('');
        });
    });
  };

  getUsers = (
    params: { page: number; type: number | string } = { page: 1, type: -1 }
  ) => {
    return new Promise((resolve, reject) => {
      const { page, type } = params;

      Api.get(`${EndPoints.getUsers}?page=${page}&type=${type}`)
        .then((data) => {
          if (Array.isArray(data?.data?.results)) {
            resolve(data?.data?.results);
          } else {
            resolve([data?.data?.results]);
          }
        })
        .catch((error) => {
          console.log('error while getting users =>', error?.response?.data);
          reject('');
        });
    });
  };

  getAttribute = () => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.getAttribute}`)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          console.log('error while getting attributes =>', error);
          reject('');
        });
    });
  };

  updateDetails = (params: any) => {
    return new Promise((resolve, reject) => {
      params.in_app_notifications = 1;
      Api.post(EndPoints.updateDetails, params)
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage(error?.response?.data?.message);
          reject('');
          console.log('error while updateDetails =>', error);
        });
    });
  };

  getUserDetail = (id: any) => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.getUserDetail}/${id}/detail`)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          console.log(
            'error while getting user detail =>',
            error?.response?.data
          );
          reject('');
        });
    });
  };

  getRecommendedUser = () => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.recommendedUsers}`)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          console.log(
            'error while getting recommended users =>',
            error?.response?.data
          );
          reject('');
        });
    });
  };

  logout = () => {
    return new Promise(async (resolve, reject) => {
      // const fcmToken = await getData(storageKeys.FCM_TOKEN)
      const fcmToken = await this.getValidFcmToken();
      Api.post(EndPoints.logout, {
        fcm_token: fcmToken,
      })
        .then(() => {
          resolve('');
        })
        .catch((error) => {
          console.log('error while logging out user =>', error);
          reject('');
        });
    });
  };

  imageUpload = (file: any, key: any, youtubeURL: any) => {
    return new Promise(async (resolve, reject) => {
      const myHeaders = new Headers();
      myHeaders.append(
        'Authorization',
        `Bearer ${await StorageManager.getData(StorageManager.storageKeys.USER_TOKEN)}`
      );
      myHeaders.append('Content-Type', 'multipart/form-data');

      const formdata = new FormData();
      if (file?.uri && key) {
        formdata.append('file', {
          uri: file.uri,
          type: file?.type ? file.type : 'image/jpeg',
          name: file.name,
        });
        formdata.append('key', key);
      }

      if (youtubeURL?.length !== 0) {
        formdata.append('youtube_url', youtubeURL);
      }

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formdata,
        redirect: 'follow',
      };
      fetch(`${BaseUrl}/auth/media/upload`, requestOptions)
        .then((response) => response.text())
        .then((result) => {
          resolve(JSON.parse(result).results);
        })
        .catch((error) => {
          reject('');
          console.log('error while uploading image =>', error);
        });
    });
  };

  deleteImage = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.deleteMedia, params)
        .then(async (res) => {
          flashSuccessMessage(LanguageKeys.imageDeleted);
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log('error while deleting image =>', error);
        });
    });
  };

  moveMedia = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.moveMedia, params)
        .then(async (res) => {
          flashSuccessMessage(LanguageKeys.imageMoved);
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log('error while moving image =>', error);
        });
    });
  };

  interactionAction = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.interactionAction, params)
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log(
            'error while hiting intreaction action api =>',
            error?.response?.data
          );
        });
    });
  };

  topPicks = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.topPicks, params)
        .then(async (res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          // flashErrorMessage()
          reject('');
          console.log(
            'error while hiting topPicks api =>',
            error?.response?.data
          );
        });
    });
  };

  privatePhotoAccessRequest = (userId: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.privatePhotoAccessRequest, { action_user_id: userId })
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          reject('');
          flashErrorMessage(error?.response?.data?.message);
          console.log(
            'error while hiting private Photo Access Request api =>',
            error
          );
        });
    });
  };

  getUserStats = () => {
    return new Promise((resolve, reject) => {
      Api.get(EndPoints.counter)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          console.log('error while running counter API  =>', error);
          reject('');
        });
    });
  };

  privatePhotoAcceptRequest = (userId: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.privatePhotoAcceptRequest, { action_user_id: userId })
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log(
            'error while hiting private Photo Accept Request api =>',
            error?.response.data
          );
        });
    });
  };

  privatePhotoRejectRequest = (userId: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.privatePhotoRejectRequest, { action_user_id: userId })
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log(
            'error while hiting private Photo Reject Request api =>',
            error
          );
        });
    });
  };

  privatePhotoRemoveRequest = (userId: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.privatePhotoRemoveRequest, { action_user_id: userId })
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log(
            'error while hiting private Photo Remove Request api =>',
            error
          );
        });
    });
  };

  searchFilterApply = (params: any, page = 1) => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.searchFilterApply}?page=${page}${params}`)
        .then((data) => {
          resolve(data?.data);
        })
        .catch((error) => {
          if (error?.response?.data?.results.length !== 0) {
            flashErrorMessage(error?.response?.data?.results[0]);
          }
          console.log(
            'error while running search filter API  =>',
            error?.response?.data
          );
          reject('');
        });
    });
  };

  saveSearchFilter = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.saveSearchFilter, params)
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log(
            'error while saving search filter =>',
            error?.response?.data
          );
        });
    });
  };

  getSearchFilters = (page = 1) => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.getSearchFilter}?page=${page}`)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          console.log('error while getting filter   =>', error);
          reject('');
        });
    });
  };

  sendOTPForAccountDelete = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.deleteAccountOtp, params)
        .then(async (res) => {
          resolve(res?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log(
            'error while sending otp delete Account =>',
            error?.response?.data
          );
        });
    });
  };

  verifyOTP = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.verifyOtp, params)
        .then(async (res) => {
          resolve(res?.data);
        })
        .catch((error) => {
          flashErrorMessage(error?.response?.data?.message);
          reject('');
          console.log(
            'error while verifying otp delete Account =>',
            error?.response?.data
          );
        });
    });
  };

  deleteAccount = (purposeOfLeaving: any) => {
    return new Promise(async (resolve, reject) => {
      const config = {
        method: 'delete',
        maxBodyLength: Infinity,
        url: `${BaseUrl}${EndPoints.deleteAccount}`,
        headers: {
          Authorization: `Bearer ${await StorageManager.getData(StorageManager.storageKeys.USER_TOKEN)}`,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({
          purpose_of_leaving: purposeOfLeaving,
        }),
      };
      axios
        .request(config)
        .then(() => {
          flashSuccessMessage(LanguageKeys.accountDeleted);
          resolve('');
        })
        .catch((error) => {
          flashErrorMessage();
          reject('');
          console.log('error while deleting account =>', error);
        });
    });
  };

  getCurrentUserDetail = (): Promise<CurrentUserDetail> => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.getCurrentUserDetail}`)
        .then(async (response) => {
          const data = response.data as GetCurrentUserDetailResponse;
          if (data?.error === false && data?.results) {
            await setData(storageKeys.USER, data.results);
            resolve(data.results);
          } else {
            const errorMessage =
              data?.message || 'Failed to get current user detail';
            console.error(
              '[ApiServices.getCurrentUserDetail] API returned error:',
              errorMessage
            );
            reject(errorMessage);
          }
        })
        .catch((error) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to get current user detail';
          flashErrorMessage();
          console.error(
            '[ApiServices.getCurrentUserDetail] Error:',
            errorMessage,
            error?.response?.data
          );
          reject(errorMessage);
        });
    });
  };

  getMembershipStatus = () => {
    return new Promise((resolve, reject) => {
      Purchases.getCustomerInfo()
        .then((res: any) => {
          if (res?.activeSubscriptions?.length !== 0) {
            const data = {
              membership_status: 1,
              membership_expiry: res?.latestExpirationDate,
            };
            resolve(data);
          } else {
            resolve(null);
          }
        })
        .catch(() => {
          reject('');
        });
    });
  };

  /**
   * Collect chat credits (premium members only)
   * This endpoint is only available for premium members
   * @returns Promise resolving to user object with updated data
   */
  collectChatCredits = () => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.collectChatCredit)
        .then((response) => {
          const data = response?.data;
          if (data?.error === false && data?.results) {
            resolve(data.results);
          } else {
            const errorMessage =
              data?.message || 'Failed to collect chat credits';
            console.error(
              '[ApiServices.collectChatCredits] API returned error:',
              errorMessage
            );
            reject(errorMessage);
          }
        })
        .catch((error) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to collect chat credits';
          console.error('[ApiServices.collectChatCredits] Error:', {
            message: errorMessage,
            status: error?.response?.status,
            data: error?.response?.data,
          });
          reject(errorMessage);
        });
    });
  };

  deleteSearchFilter = (id: any) => {
    return new Promise((resolve, reject) => {
      Api.delete(`${EndPoints.searchFilter}/${id}/delete`)
        .then(() => {
          resolve('');
        })
        .catch((error) => {
          flashErrorMessage();
          console.log(
            'error while deleting search filter =>',
            error?.response?.data
          );
          reject('');
        });
    });
  };

  viewPrivateMedia = (id: any) => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.user}/${id}${EndPoints.privateMedia}`)
        .then(async (data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          flashErrorMessage();
          console.log(
            'error while getting private media  =>',
            error?.response?.data
          );
          reject('');
        });
    });
  };

  addWaliInformation = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(`${EndPoints.createGuardian}`, params)
        .then(async (data) => {
          resolve(data);
        })
        .catch((error) => {
          flashErrorMessage();
          console.log('error while adding wali  =>', error?.response?.data);
          reject('');
        });
    });
  };

  removeWali = () => {
    return new Promise((resolve, reject) => {
      Api.delete(`${EndPoints.removeGuardian}`)
        .then(async (data) => {
          resolve(data);
        })
        .catch((error) => {
          flashErrorMessage();
          console.log('error while adding wali  =>', error?.response?.data);
          reject('');
        });
    });
  };

  resendWaliVerificationCode = () => {
    return new Promise((resolve, reject) => {
      Api.get(`${EndPoints.resendOtp}`)
        .then(async (data) => {
          resolve(data);
          flashSuccessMessage(LanguageKeys.codeSentToWali);
        })
        .catch((error) => {
          flashErrorMessage();
          console.log(
            'error while resending otp to wali email  =>',
            error?.response?.data
          );
          reject('');
        });
    });
  };

  authenticateGuardian = async (params: any) => {
    try {
      const response = await Api.post(
        `${EndPoints.authenticateGuardian}`,
        params
      );
      await setData(storageKeys.USER_TOKEN, response?.data?.bearer_token);
      return response?.data?.results;
    } catch (error: any) {
      const errorDetail = error?.response?.data;
      if (errorDetail?.message) {
        flashErrorMessage(errorDetail?.message);
      } else {
        flashErrorMessage();
      }

      console.log('error while logging in guardian =>', errorDetail);
      throw error;
    }
  };

  verifyWaliCode = async (otp: any) => {
    try {
      const response = await Api.post(`${EndPoints.verifyGuardian}`, { otp });
      return response;
    } catch (error: any) {
      error = error?.response?.data;
      if (error?.code === 422) {
        flashErrorMessage(LanguageKeys.otpMismatchedError);
      } else if (error?.error) {
        flashErrorMessage(error?.message);
      } else {
        flashErrorMessage();
      }
      console.log('error while verifying wali otp =>', error);
      throw error;
    }
  };

  changeGuardianPassword = async (params: any) => {
    try {
      const response = await Api.post(
        `${EndPoints.changeGuardianPassword}`,
        params
      );
      return response;
    } catch (error: any) {
      error = error?.response?.data;
      if (error && error?.results?.length !== 0) {
        flashErrorMessage(error?.results[0]);
      } else {
        flashErrorMessage();
      }
      console.log('error while changing guardian password =>', error?.response);
      throw error;
    }
  };

  getUserDetailGuardian = async (userId: string) => {
    try {
      const response = await Api.get(
        `${EndPoints.guardianAuthUser}/${userId}/detail`
      );
      return response.data?.results;
    } catch (error: any) {
      console.log('error while getting user detail', error?.response);
      throw error;
    }
  };

  logoutGuardian = () => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.guardianLogout)
        .then(() => resolve(''))
        .catch((error: any) => {
          console.log('error while logging out guardian =>', error);
          reject('');
        });
    });
  };

  addProfilePicture = (params: any, onProgress: (progress: number) => void) => {
    return new Promise(async (resolve, reject) => {
      const { uri, name } = params;
      const formData = new FormData();

      // Determine file type from URI or default to jpeg
      let fileType = 'image/jpeg';
      if (uri) {
        const extension = uri.split('.').pop()?.toLowerCase();
        if (extension === 'png') {
          fileType = 'image/png';
        } else if (extension === 'jpg' || extension === 'jpeg') {
          fileType = 'image/jpeg';
        }
      }

      formData.append('file', {
        uri: uri,
        type: fileType,
        name: name || 'profile_picture.jpg',
      } as any);
      formData.append('key', 'primary_image');

      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.open('POST', `${BaseUrl}/auth/media/upload`);
      const userToken = await StorageManager.getData(
        StorageManager.storageKeys.USER_TOKEN
      );
      xhr.setRequestHeader('Authorization', `Bearer ${userToken}`);

      // Initialize progress
      onProgress(0);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const progressPercentage = Math.round(
            (event.loaded / event.total) * 100
          );
          const clampedProgress = Math.min(
            Math.max(progressPercentage, 0),
            100
          );
          onProgress(clampedProgress);
        } else if (event.loaded > 0) {
          // Fallback: estimate progress if total is unknown
          const estimatedProgress = Math.min(
            Math.max(Math.round((event.loaded / 1000000) * 50), 0),
            99
          );
          onProgress(estimatedProgress);
        }
      };
      xhr.onload = () => {
        // Ensure progress reaches 100% on completion
        onProgress(100);

        if (xhr.status === 200) {
          try {
            const responseData = JSON.parse(xhr.response);
            resolve(responseData);
          } catch (parseError) {
            console.error('[Upload] Error parsing response:', parseError);
            reject('');
          }
        } else {
          if (
            xhr.response &&
            xhr.response.results &&
            xhr.response.results.length !== 0
          ) {
            flashErrorMessage('File must be shorter than 2 MB');
          } else {
            flashErrorMessage();
          }
          reject('');
        }
      };
      xhr.onerror = () => {
        reject('');
      };
      xhr.send(formData);
    });
  };

  getLocationByLatLong = async (lat: number, long: number) => {
    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json?address=' +
          lat +
          ',' +
          long +
          '&key=' +
          'AIzaSyAyqvD_HZo402WmbfQ3AbvM60jYljrGbu8'
      );
      return response?.data;
    } catch (error: any) {
      console.log('error while getting user detail', error?.response);
      throw error;
    }
  };

  storeQuery = async (params: any) => {
    try {
      const response = await Api.post(EndPoints.storeQuerySupport, params);
      return response;
    } catch (error: any) {
      error = error?.response?.data;
      if (error && error?.results?.length !== 0) {
        flashErrorMessage(error?.results[0]);
      } else {
        flashErrorMessage();
      }
      console.log('error while changing guardian password =>', error?.response);
      throw error;
    }
  };

  getPaymentInfo = () => {
    return new Promise((resolve, reject) => {
      Api.get(EndPoints.paymentInfo)
        .then((data) => {
          resolve(data?.data?.results);
        })
        .catch((error) => {
          console.log('error while getting Payment Info =>', error);
          reject('');
        });
    });
  };

  snedMessageNotification = (params: any) => {
    return new Promise((resolve, reject) => {
      Api.post(EndPoints.snedMessageNotification, params)
        .then(async (res) => {
          console.log({ res });

          resolve(res?.data);
        })
        .catch((error) => {
          // flashErrorMessage()
          reject('');
          console.log(
            'error while hiting snedMessageNotification api =>',
            error,
            error?.response,
            error?.response?.data
          );
        });
    });
  };
}

const ApiServices = new GApiServices();
export default ApiServices;
