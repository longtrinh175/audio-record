import React from 'react'
import { View, Text, TouchableHighlight, Slider } from 'react-native'
import * as Icon from '@expo/vector-icons'

const Volume = ({ data }) => {
    const { slider, mutedButton } = data
    return (
        <View>
            <View style={{alignItems: 'center'}}>
                <Text>Volume</Text>
            </View>           
            <View>
                <View style={{alignItems: 'flex-start'}}>
                    <TouchableHighlight
                        onPress={mutedButton.onPress}
                        disabled={mutedButton.disabled}
                    >
                        <View>
                            {mutedButton.isMuted
                                ? <Icon.Octicons name='mute' size={20} color='black'/>
                                : <Icon.Octicons name='unmute' size={20} color='black'/>
                            }
                        </View>
                    </TouchableHighlight>
                </View>
                <Slider 
                    value={1}
                    onValueChange={slider.onValueChange}
                    disabled={slider.disabled}
                />
            </View>
        </View>
    )
}

export default Volume