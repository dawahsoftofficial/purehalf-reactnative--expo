import React, { createContext, useContext, useReducer } from 'react'
import Reducer from './Reducer'

const AppContext: any = createContext('');

let initialState = {
    direction: 'ltr',
    language: 'en',
    currentUser: null,
    conversations: [],
    coversationLoading: true,
    openedConversationId: null,
    customModal: {
        visible: false,
        data: null
    }
}

const AppProvider = ({ children }: any) => {
    const [state, dispatch]: any = useReducer(Reducer, initialState)

    const updateCustomModal = (visible: any, data: any) => {
        return dispatch({
            type: 'UPDATE_CUSTOM_MODAL',
            payload: {
                customModal: {
                    visible: visible,
                    data: data
                }
            }
        })
    }


    const updateConversationLoading = (coversationLoading: any) => {
        return dispatch({
            type: 'CONVERSATION_LOADING',
            payload: {
                coversationLoading: coversationLoading,
            }
        })
    }

    const updateOpenedConversationId = (openedConversationId: any) => {
        return dispatch({
            type: 'OPENED_CONVERSATION_ID',
            payload: {
                openedConversationId: openedConversationId,
            }
        })
    }

    const updateDirection = (direction: any, language: any) => {
        return dispatch({
            type: 'UPDATE_DIRECTION',
            payload: {
                direction: direction,
                language: language
            }
        })
    }

    const updateCurrentUser = async (currentUser: any) => {
        return dispatch({
            type: 'UPDATE_CURRENT_USER',
            payload: {
                currentUser: currentUser
            }
        })
    }

    const updateConversations = async (conversations: any) => {
        return dispatch({
            type: 'UPDATE_CONVERSATIONS',
            payload: {
                conversations: conversations
            }
        })
    }

    return <AppContext.Provider value={{
        ...state, updateDirection,
        updateCurrentUser, updateConversations, updateConversationLoading,
        updateOpenedConversationId, updateCustomModal
    }}>
        {children}
    </AppContext.Provider>
}

const useGlobalContext = (): any => {
    return useContext(AppContext)
}

const setGlobalState = (newState: any) => {
    initialState = { ...initialState, ...newState };
};


export { AppProvider, useGlobalContext, AppContext, setGlobalState }