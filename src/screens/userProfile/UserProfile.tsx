import React from 'react'
import { Profile } from '../profile'

const UserProfile = (props: any) => {
    const userData = props?.route?.params?.userData

    return (
        <Profile
            fromUserProfile={true}
            userData={userData}
            navigation={props.navigation}
        />
    )
}

export default UserProfile