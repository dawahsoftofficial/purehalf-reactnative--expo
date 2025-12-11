import React, { useEffect } from 'react'
import { ApiServices, StorageManager, useGlobalContext } from '../services'
import { View } from 'react-native'

const CheckMembershipStatus = () => {
    const { currentUser, updateCurrentUser } = useGlobalContext()
    const { setData, storageKeys } = StorageManager

    const checkMembershipStatus = () => {
        ApiServices.getMembershipStatus().then(async (res: any) => {
            if(res || currentUser.membership_status) {
                currentUser.membership_expiry = res?.membership_expiry || currentUser.membership_expiry
                currentUser.membership_status = 1
            }
            else {
                currentUser.membership_expiry = null
                currentUser.membership_status = 0
            }
            updateCurrentUser(currentUser)
            await setData(storageKeys.USER, currentUser)
        })
    }
    useEffect(() => {
        checkMembershipStatus()
    }, [])

    return (
        <View />
    )
}

export default CheckMembershipStatus