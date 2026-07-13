import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

import Reducer from './Reducer';

const AppContext: any = createContext('');

let initialState = {
  direction: 'ltr',
  language: 'en',
  currentUser: null,
  openedConversationId: null,
  customModal: {
    visible: false,
    data: null,
  },
};

const AppProvider = ({ children }: any) => {
  const [state, dispatch]: any = useReducer(Reducer, initialState);
  const updateCustomModal = useCallback((visible: any, data: any) => {
    dispatch({
      type: 'UPDATE_CUSTOM_MODAL',
      payload: {
        customModal: {
          visible: visible,
          data: data,
        },
      },
    });
  }, []);

  const updateOpenedConversationId = useCallback(
    (openedConversationId: any) => {
      dispatch({
        type: 'OPENED_CONVERSATION_ID',
        payload: {
          openedConversationId: openedConversationId,
        },
      });
    },
    []
  );

  const updateDirection = useCallback((direction: any, language: any) => {
    dispatch({
      type: 'UPDATE_DIRECTION',
      payload: {
        direction: direction,
        language: language,
      },
    });
  }, []);

  const updateCurrentUser = useCallback(async (currentUser: any) => {
    dispatch({
      type: 'UPDATE_CURRENT_USER',
      payload: {
        currentUser: currentUser,
      },
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      updateDirection,
      updateCurrentUser,
      updateOpenedConversationId,
      updateCustomModal,
    }),
    [
      state,
      updateDirection,
      updateCurrentUser,
      updateOpenedConversationId,
      updateCustomModal,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

const useGlobalContext = (): any => {
  return useContext(AppContext);
};

const setGlobalState = (newState: any) => {
  initialState = { ...initialState, ...newState };
};

export { AppContext, AppProvider, setGlobalState, useGlobalContext };
