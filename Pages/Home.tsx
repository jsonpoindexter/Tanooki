import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import {Accelerometer } from "expo-sensors";
import { Subscription } from 'react-native/Libraries/EventEmitter/NativeEventEmitter'

export const Home = () => {
    const [ currentAccelData, setAccelData ] = useState(null);

    useEffect(() => {
        let subscription: Subscription | null = null;
        const accelStatus = async() => {
            try {
                return await Accelerometer.isAvailableAsync();
            } catch(_) {}
        };
        accelStatus().then((acceleState: boolean) => {
            if(acceleState) {
                Accelerometer.setUpdateInterval(16);
                subscription = Accelerometer.addListener((data) => {
                    setAccelData(data);
                })
            }
        });
        return () => {
            Accelerometer.removeSubscription(subscription)
        }
    }, []);

        return(
            <Text>Status: { JSON.stringify(currentAccelData) }</Text>
        )
}
