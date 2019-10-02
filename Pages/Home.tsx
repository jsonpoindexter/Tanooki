import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Accelerometer, ThreeAxisMeasurement } from 'expo-sensors'
import { Subscription } from 'react-native/Libraries/EventEmitter/NativeEventEmitter'
import { Audio } from 'expo-av'
import { PlaybackStatus } from 'expo-av/build/AV'

export const Home = () => {
  const [delta, setDelta] = useState(0.0)
  const [play, setPlay] = useState(true)
  let currentAccel = 0
  let lastAccel = 0
  let tempDelta = 0
  let previousDirection: string | null
  const maxDelta = 1
  const accelInterval = 100
  const jump = require('../assets/sounds/tanukijump.wav')
  const yaheee = require('../assets/sounds/yaheee.wav')

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
      // console.log(max)

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
    const _onPlaybackStatusUpdate = (playbackStatus: PlaybackStatus) => {
      setPlay(playbackStatus.isPlaying)
    }
    accelStatus().then(async (accelState: boolean) => {
      const soundObject = new Audio.Sound()
      soundObject.setOnPlaybackStatusUpdate(_onPlaybackStatusUpdate)

      if (accelState) {
        Accelerometer.setUpdateInterval(accelInterval)

        subscription = Accelerometer.addListener(async (data: ThreeAxisMeasurement) => {
          const shakeData = detectShake(data)
          if (shakeData) {
            const direction = shakeData
            try {
              const changedDirection = !(
                ((previousDirection === 'x' || previousDirection === 'z') &&
                  (direction === 'x' || direction === 'z')) ||
                (previousDirection === 'y' && direction === 'y')
              )

              console.log(previousDirection, ' : ', direction, ' : ', changedDirection)
              if (direction === 'x' || direction === 'z') {
                if (changedDirection) {
                  await soundObject.unloadAsync()
                  await soundObject.loadAsync(jump)
                }
                await soundObject.setPositionAsync(0)
                await soundObject.playAsync()
              } else {
                if (changedDirection) {
                  await soundObject.unloadAsync()
                  await soundObject.loadAsync(yaheee)
                }
                if (!(await soundObject.getStatusAsync()).isPlaying) {
                  await soundObject.setPositionAsync(0)
                  await soundObject.playAsync()
                }
              }
            } catch (error) {
              console.log(error)
            }
            previousDirection = direction
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
