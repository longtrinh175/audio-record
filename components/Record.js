import React from 'react'
import { View, Text, TouchableHighlight, } from 'react-native'
import * as Icon from '@expo/vector-icons'

const Record = ({ data }) => {
    const { isRecording, recordButton, timeStamps } = data
    return (
        <View>
            <View style={{alignItems: 'center'}}>
                <Text>Recording</Text>
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <TouchableHighlight
                    onPress={recordButton.onPress}
                    disabled={recordButton.disabled}
                >
                    <View>
                        <Icon.MaterialCommunityIcons name='record'  size={30} color='black' />
                    </View>
                </TouchableHighlight>
                <View>
                    {isRecording && 
                        <Icon.MaterialCommunityIcons name='record-rec'  size={30} color='red' />
                    }
                </View>				
            </View>
            <View style={{alignItems: 'center'}}>
                <Text>
                    {timeStamps}
                </Text>
            </View>
        </View>
    )
}

export default Record