const Reducer = (state: any, action: any) => {
    switch(action.type) {
        case 'UPDATE_DIRECTION':
            return {
                ...state,
                direction: action.payload.direction,
                language: action.payload.language
            }
        case 'UPDATE_CURRENT_USER':
            return {
                ...state,
                currentUser: action.payload.currentUser,
            }
        case 'UPDATE_CONVERSATIONS':
            return {
                ...state,
                conversations: action.payload.conversations,
            }
        case 'CONVERSATION_LOADING':
            return {
                ...state,
                coversationLoading: action.payload.coversationLoading,
            }
        case 'OPENED_CONVERSATION_ID':
            return {
                ...state,
                openedConversationId: action.payload.openedConversationId,
            }
        case 'UPDATE_CUSTOM_MODAL':
            return {
                ...state,
                customModal: action.payload.customModal
            }
        default:
            return state
    }
}

export default Reducer