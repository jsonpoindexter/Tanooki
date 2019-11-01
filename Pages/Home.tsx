import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Accelerometer, ThreeAxisMeasurement } from 'expo-sensors'
import { Subscription } from 'react-native/Libraries/EventEmitter/NativeEventEmitter'
import { Audio } from 'expo-av'
import { PlaybackStatus } from 'expo-av/build/AV'

export const Home = () => {
  const [delta, setDelta] = useState(0.0)
  const [play, setPlay] = useState(true)
  let accelReadings: ThreeAxisMeasurement[] = new Array(3)
  let currentAccel = 0
  let lastAccel = 0
  let tempDelta = 0
  let previousDirection: string | null
  const maxDelta = 1
  const accelInterval = 16
  let timeout: boolean = false // dont evaluate accel data during timeout
  const shake = require('../assets/sounds/tanuki-jump.wav')
  const jump = [
    require('../assets/sounds/yaheee.wav'),
    require('../assets/sounds/weeee.wav'),
    require('../assets/sounds/wohoo.wav'),
    require('../assets/sounds/tanooki.wav'),
    require('../assets/sounds/yeehoo.wav'),
  ]

  // _onPlaybackStatusUpdate = playbackStatus => {
  //   if (!playbackStatus.isLoaded) {
  //     // Update your UI for the unloaded state
  //     if (playbackStatus.error) {
  //       console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
  //       // Send Expo team the error on Slack or the forums so we can help you debug!
  //     }
  //   } else {
  //     // Update your UI for the loaded state
  //
  //     if (playbackStatus.isPlaying) {
  //       // Update your UI for the playing state
  //     } else {
  //       // Update your UI for the paused state
  //     }
  //
  //     if (playbackStatus.isBuffering) {
  //       // Update your UI for the buffering state
  //     }
  //
  //     if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
  //       // The player has just finished playing and will stop. Maybe you want to play something else?
  //     }
  //   }
  // }

  useEffect(() => {
    let subscription: Subscription | null = null
    const accelStatus = async () => {
      try {
        return await Accelerometer.isAvailableAsync()
      } catch (_) {}
    }
    const detectShake = (data: ThreeAxisMeasurement): string | undefined => {
      data.y -= 1
      const x = data.x
      const y = data.y
      const z = data.z
      // console.log(data)
      const max = Math.max(
        ...Object.values(data).map(foo => {
          return Math.abs(foo)
        }),
      )

      lastAccel = currentAccel
      currentAccel = Math.sqrt(x * x + y * y + z * z)
      tempDelta = tempDelta + (currentAccel - lastAccel)
      setDelta(Math.round(tempDelta))
      if (Math.round(tempDelta) > maxDelta) {
        for (let [key, value] of Object.entries(data)) {
          if (value === max) return key
        }
      }
    }
    accelStatus().then(async (accelState: boolean) => {
      // Audio.setAudioModeAsync({
      //   allowsRecordingIOS: false,
      //   interruptionModeIOS: 1,
      //   playsInSilentModeIOS: false,
      //   staysActiveInBackground: true,
      //   interruptionModeAndroid: 1,
      //   shouldDuckAndroid: false,
      //   playThroughEarpieceAndroid: false,
      // })
      const soundObject = new Audio.Sound()

      if (accelState) {
        Accelerometer.setUpdateInterval(accelInterval)

        subscription = Accelerometer.addListener(async (data: ThreeAxisMeasurement) => {
          if (timeout) return
          const shakeData = detectShake(data)
          if (shakeData) {
            console.log(`shakeData: ${ shakeData}`)
            timeout = true
            const direction = shakeData
            const changedDirection = !(
              ((previousDirection === 'x' || previousDirection === 'z') &&
                (direction === 'x' || direction === 'z')) ||
              (previousDirection === 'y' && direction === 'y')
            )
            try {
              if (direction === 'x' || direction === 'z') {
                let status = await soundObject.getStatusAsync()
                if (changedDirection && status.isPlaying === false) {
                  // let status = await soundObject.unloadAsync()
                  // if (!status.isLoaded) {
                    await soundObject.loadAsync(shake)
                  // }
                }
               // status = await soundObject.getStatusAsync()
                // if (status.isLoaded) {
                  await soundObject.setPositionAsync(0)
                  await soundObject.playAsync()
                // }
              } else {
                let status = await soundObject.getStatusAsync()
                // console.log(status)
                if (status.isPlaying === false) {
                  status = await soundObject.unloadAsync()
                  if (!status.isLoaded)
                    status = await soundObject.loadAsync(
                      jump[Math.floor(Math.random() * jump.length)],
                    )
                  if (status.isLoaded) await soundObject.playAsync()
                }
              }
            } catch (error) {
              // console.log(previousDirection, ' >> ', direction, ' : ', changedDirection)
              console.log(error)
            }
            previousDirection = direction
            setInterval(() => {
              timeout = false
            }, 1000)
          }
        })
      }
    })
    return () => {
      Accelerometer.removeSubscription(subscription)
    }
  }, [])

  return (
    <View>
      <Text style={style.container}> delta: {delta}</Text>
    </View>
  )
}
const style = StyleSheet.create({
  container: {
    fontSize: 18,
  },
})
