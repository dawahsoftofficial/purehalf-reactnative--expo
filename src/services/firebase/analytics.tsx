import analytics from '@react-native-firebase/analytics'


const addAnaylatics = async (title: string, obj: any) => {
    console.log('analytic msg-->', 'Click on ' + title)
    await analytics()
        .logEvent(title.replace('-', ''), obj)
        .then(() => {
            console.log('analytics added')
        })
}

export { addAnaylatics }
