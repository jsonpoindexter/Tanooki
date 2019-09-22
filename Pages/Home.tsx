import React, { useState, useEffect } from 'react'
import {StyleSheet, Text, View} from 'react-native'
import { Accelerometer, ThreeAxisMeasurement } from 'expo-sensors'
import { Subscription } from 'react-native/Libraries/EventEmitter/NativeEventEmitter'

export const Home = () => {
  const [delta, setDelta] = useState(0.0)
  let currentAccel = 0
  let lastAccel = 0
  let tempDelta = 0

  useEffect(() => {
    let subscription: Subscription | null = null
    const accelStatus = async () => {
      try {
        return await Accelerometer.isAvailableAsync()
      } catch (_) {}
    }

    const detectShake = (data: ThreeAxisMeasurement) => {
      const x = data.x
      const y = data.y
      const z = data.z
      lastAccel = currentAccel
      currentAccel = Math.sqrt(x*x + y*y + z*z)
      tempDelta = tempDelta * 0.9 + (currentAccel - lastAccel)
      setDelta( Math.round(tempDelta)) // perform low-cut filter
    }
    accelStatus().then((accelState: boolean) => {
      if (accelState) {
        Accelerometer.setUpdateInterval(16)
        subscription = Accelerometer.addListener((data: ThreeAxisMeasurement) => {
          detectShake(data)
        })
      }
    })
    return () => {
      Accelerometer.removeSubscription(subscription)
    }
  }, [])

  return (
    <View style={ delta > 3 ? style.red : null}>
      <Text> delta: {delta} </Text>
    </View>
  )
}
const style = StyleSheet.create({
  red: {
    backgroundColor: 'red',
  },
})

