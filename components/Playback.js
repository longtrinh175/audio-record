import React, { Component } from 'react'
import { View, Text, Slider, TouchableHighlight } from 'react-native'
import * as Icon from '@expo/vector-icons'

const Playback = ({ data }) => {
    const { slider, isPlaying ,timeStamps, buttons } = data
    const { playPauseButton, stopButton } = buttons
    return (
        <View>
            <View style={{alignItems: 'center'}}>
                <Text>playback</Text>
            </View>
            <View>
                <Slider 
                    value={slider.value}
                    onValueChange={slider.onValueChange}
                    onSlidingComplete={slider.onSlidingComplete}
                    disabled={slider.disabled}
                />
                <View style={{alignItems: 'center'}}>
                    <Text>
                        {timeStamps}
                    </Text>
                </View>
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{width: 30, height: 30}}/>
                <TouchableHighlight
                    onPress={playPauseButton.onPress}
                    disabled={playPauseButton.disabled}
                >
                    <View>
                        {!isPlaying
                            ? <Icon.FontAwesome name='play' size={30} color='black' />
                            : <Icon.FontAwesome name='pause' size={30} color='black' />
                        }
                    </View>
                </TouchableHighlight>
                <TouchableHighlight
                    onPress={stopButton.onPress}
                    disabled={stopButton.disabled}
                >
                    <View>
                        <Icon.FontAwesome name='stop' size={30} color='black'/>
                    </View>
                </TouchableHighlight>
            </View>
        </View>
    )
}

export default Playback