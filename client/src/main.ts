import Phaser from 'phaser'

import Preloader from './scenes/Preloader'
import LobbyGame from './scenes/LobbyGame'
import Battle
	from './scenes/Battle'
const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 400,
	height: 300,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
			debug: true
		}
	},
	scene: [Preloader, LobbyGame, Battle],
	scale: {
		zoom: 2,
	}
}

export default new Phaser.Game(config)
