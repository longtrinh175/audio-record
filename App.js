import React from 'react';
import {
	Text,
	View,
	StyleSheet,
	Slider,
	TouchableHighlight
} from 'react-native';
import * as Expo from 'expo'
import * as Icon from '@expo/vector-icons'

const RATE_SCALE = 3.0

export default class App extends React.Component {
	constructor(props) {
		super(props)
		this.recording = null
		this.sound = null
		this.isSeeking = false
		this.shouldPlayAtEndOfSeek = false
		this.state = {
			haveRecordingPermissions: false,
			isLoading: false,
			isPlaybackAllowed: false,
			isMuted: false,
			soundPosition: null,
			soundDuration: null,
			recordingDuration: null,
			shouldPlay: false,
			isPlaying: false,
			isRecording: false,
			shouldCorrectPitch: true,
			volume: 1.0,
			rate: 1.0
		}
		this.recordingSettings = JSON.parse(JSON.stringify(Expo.Audio.RECORDING_OPTIONS_PRESET_LOW_QUALITY))
	}

	componentDidMount() {
		setTimeout(this._askForPermission, 1000)
	}

	_askForPermission = async () => {
		const response = await Expo.Permissions.askAsync(Expo.Permissions.AUDIO_RECORDING)
		this.setState(prevState => {
			return {
				haveRecordingPermissions: response.status === 'granted'
			}
		})
	}

	_updateScreenForSoundStatus = status => {
		if (status.isLoaded) {
			this.setState(prevState => {
				return {
					soundDuration: status.durationMillis,
					soundPosition: status.positionMillis,
					shouldPlay: status.shouldPlay,
					isPlaying: status.isPlaying,
					rate: status.rate,
					isMuted: status.isMuted,
					volume: status.volume,
					shouldCorrectPitch: status.shouldCorrectPitch,
					isPlaybackAllowed: true
				}
			})
		} else {
			this.setState(prevState => {
				return {
					soundDuration: null,
					soundPosition: null,
					isPlaybackAllowed: false,
				}
			})
			if (status.error) {
				console.warn(`FATAL PLAYER ERROR: ${status.error}`)
			}
		}
	}

	_updateScreenForRecordingStatus = status => {
		if (status.canRecord) {
			this.setState(prevState => {
				return {
					isRecording: status.isRecording,
					recordingDuration: status.durationMillis
				}
			})
		} else if (status.isDoneRecording) {
			this.setState(prevState => {
				return {
					isRecording: false,
					recordingDuration: status.durationMillis
				}
			})
			if (!this.state.isLoading) {
				this._stopRecordingAndEnablePlayback()
			}
		}
	}

	_stopPlaybackAndBeginRecording = async () => {
		this.setState(prevState => {
			return {
				isLoading: true
			}
		})
		if (this.sound !== null) {
			await this.sound.unloadAsync()
			this.sound.setOnPlaybackStatusUpdate(null)
			this.sound = null
		}
		await Expo.Audio.setAudioModeAsync({
			playThroughEarpieceAndroid: false,
			shouldDuckAndroid: true,
			interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
			allowsRecordingIOS: true,
			interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
			playsInSilentModeIOS: true
		})
		if (this.recording !== null) {
			this.recording.setOnRecordingStatusUpdate(null)
			this.recording = null
		}

		const recording = new Expo.Audio.Recording()
		await recording.prepareToRecordAsync(this.recordingSettings)
		recording.setOnRecordingStatusUpdate(this._updateScreenForRecordingStatus)

		this.recording = recording
		await this.recording.startAsync()
		this.setState(prevState => {
			return {
				isLoading: false
			}
		})
	}

	_stopRecordingAndEnablePlayback = async () => {
		this.setState(prevState => {
			return {
				isLoading: true
			}
		})
		try {
			await this.recording.stopAndUnloadAsync()
		} catch (error) {
			console.warn('err when stop recording and playing')
		}
		const info = await Expo.FileSystem.getInfoAsync(this.recording.getURI())
		console.log(`FILE INFO: ${JSON.stringify(info)}`)
		await Expo.Audio.setAudioModeAsync({
			allowsRecordingIOS: false,
			interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
			playsInSilentModeIOS: true,
			playsInSilentLockedModeIOS: true,
			shouldDuckAndroid: true,
			playThroughEarpieceAndroid: false,
			interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
		})
		const { sound, status } = await this.recording.createNewLoadedSoundAsync(
			{
				isLooping: true,
				isMuted: this.state.isMuted,
				volume: this.state.volume,
				rate: this.state.rate,
				shouldCorrectPitch: this.state.shouldCorrectPitch
			},
			this._updateScreenForSoundStatus
		)
		this.sound = sound
		this.setState(prevState => {
			return {
				isLoading: false
			}
		})
	}

	_onRecordPressed = () => {
		if (!this.state.isRecording) {
			this._stopPlaybackAndBeginRecording()
		} else {
			this._stopRecordingAndEnablePlayback()
		}
	}

	_onPlayPausePressed = () => {
		if (this.sound !== null) {
			if (this.state.isPlaying) {
				this.sound.pauseAsync()

			} else {
				this.sound.playAsync()
			}
		} 
	}

	_onStopPressed = () => {
		if (this.sound !== null) {
			this.sound.stopAsync()
		}
	}

	_onMutePressed = () => {
		if (this.sound !== null) {
			this.sound.setIsMutedAsync(!this.state.isMuted)
		}
	}

	_onVolumeSliderValueChange = value => {
		if (this.sound !== null) {
			this.sound.setVolumeAsync(value)
		}
	}

	_trySetRate = async (rate, shouldCorrectPitch) => {
		if (this.sound !== null) {
			try {
				await this.sound.setRateAsync(rate, shouldCorrectPitch)
			} catch (error) {
				console.error('err when set rate')
			}
		}
	}

	_onRateSliderSlidingComplete = async (value) => {
		this._trySetRate(value * RATE_SCALE, this.state.shouldCorrectPitch)
	}

	_onPitchCorrectionPressed = async (value) => {
		this._trySetRate(this.state.rate, !this.state.shouldCorrectPitch)
	}

	_onSeekSliderValueChange = value => {
		if (this.sound !== null && !this.isSeeking) {
			this.isSeeking = true
			this.shouldPlayAtEndOfSeek = this.state.shouldPlay
			this.sound.pauseAsync()
		}
	}

	_onSeekSliderSlidingComplete = async (value) => {
		if (this.sound !== null) {
			this.isSeeking = false
			const seekPosition = value * this.state.soundDuration
			if (this.shouldPlayAtEndOfSeek) {
				this.sound.playFromPositionAsync(seekPosition)
			} else {
				this.sound.setPositionAsync(seekPosition)
			}
		}
	}

	_getSeekSliderPosition = () => {
		if (
			this.sound !== null &&
			this.state.soundDuration !== null &&
			this.state.soundPosition !== null
		) {
			return (
				this.state.soundPosition / 
				this.state.soundDuration
			)
		}
		return 0
	}

	_getMMSSFromMillis = millis => {
		const totalSeconds = millis / 1000
		const seconds = Math.floor(totalSeconds % 60)
		const minutes = Math.floor(totalSeconds / 60)

		const padWithZero = number => {
			const string = number.toString()
			if (number < 10) {
				return '0' + string
			}
			return string
		}
		return padWithZero(minutes) + ':' + padWithZero(seconds)
	}

	_getPlaybackTimeStamps = () => {
		if (
			this.sound !== null &&
			this.state.positionMillis !== null &&
			this.state.soundDuration !== null
		) {
			return `${this._getMMSSFromMillis(this.state.soundPosition)} / ${this._getMMSSFromMillis(this.state.soundDuration)}`
		}
		return `${this._getMMSSFromMillis(0)}`
	}

	_getRecordingTimeStamps = () => {
		if (this.state.recordingDuration !== null) {
			return `${this._getMMSSFromMillis(this.state.recordingDuration)}`
		}
		return `${this._getMMSSFromMillis(0)}`
	}

	render() {
		return (
			<View style={styles.container}>
				{!this.state.haveRecordingPermissions
					? 	<View>
							<Text>You must enable audio permission in order to use this app</Text>
						</View>
					: 	<View>
							<View style={{alignItems: 'center'}}>
								<Text>Recording</Text>
							</View>
							<View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
								<TouchableHighlight
									onPress={this._onRecordPressed}
									disabled={this.state.isLoading}
								>
									<View>
										<Icon.MaterialCommunityIcons name='record'  size={30} color='black' />
									</View>
								</TouchableHighlight>
								<View>
									{this.state.isRecording && 
										<Icon.MaterialCommunityIcons name='record-rec'  size={30} color='red' />
									}
								</View>				
							</View>
							<View style={{alignItems: 'center'}}>
								<Text>
									{this._getRecordingTimeStamps()}
								</Text>
							</View>
							<View style={{alignItems: 'center'}}>
								<Text>playback</Text>
							</View>
							<View>
								<Slider 
									value={this._getSeekSliderPosition()}
									onValueChange={this._onSeekSliderValueChange}
									onSlidingComplete={this._onSeekSliderSlidingComplete}
									disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
								/>
								<View style={{alignItems: 'center'}}>
									<Text>
										{this._getPlaybackTimeStamps()}
									</Text>
								</View>
							</View>

							<View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
								<View style={{width: 30, height: 30}}/>
								<TouchableHighlight
									onPress={this._onPlayPausePressed}
									disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
								>
									<View>
										{!this.state.isPlaying
											? <Icon.FontAwesome name='play' size={30} color='black' />
											: <Icon.FontAwesome name='pause' size={30} color='black' />
										}
									</View>
								</TouchableHighlight>
								<TouchableHighlight
									onPress={this._onStopPressed}
									disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
								>
									<View>
										<Icon.FontAwesome name='stop' size={30} color='black'/>
									</View>
								</TouchableHighlight>
							</View>

							<View style={{alignItems: 'center'}}>
								<Text>Volume</Text>
							</View>
							
							<View>
								<View style={{alignItems: 'flex-start'}}>
									<TouchableHighlight
										onPress={this._onMutePressed}
										disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
									>
										<View style={{}}>
											{this.state.isMuted
												? <Icon.Octicons name='mute' size={20} color='black'/>
												: <Icon.Octicons name='unmute' size={20} color='black'/>
											}
										</View>
									</TouchableHighlight>
								</View>
								<Slider 
									value={1}
									onValueChange={this._onVolumeSliderValueChange}
									disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
								/>
				
							</View>
						</View>
				}
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1, 
		flexDirection: 'column', 
		justifyContent: 'center'
	},
})
