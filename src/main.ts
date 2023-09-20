/// <reference types="@workadventure/iframe-api-typings" />

console.log('Script started successfully');

const buttons = {
    "button1": { x: 3, y: 5, color: 'red', pressed: false },
    "button2": { x: 5, y: 5, color: 'red', pressed: false },
    "button3": { x: 17, y: 5, color: 'blue', pressed: false },
    "button4": { x: 19, y: 5, color: 'blue', pressed: false },

}

interface TileDescriptor {
    x: number;
    y: number;
    tile: number | string | null;
    layer: string;
}

// Attendons l'initialisation de l'API
WA.onInit().then(async () => {
    console.log('Scripting API ready');
    // Afin de pouvoir lire les variables des autres joueurs, nous devons activer le tracking des joueurs.
    await WA.players.configureTracking({
        players: true,
    });

    for (const [btnName, {x, y}] of Object.entries(buttons)) {
        WA.room.area.create({
            name: btnName,
            x: x * 32,
            y: y * 32,
            width: 32,
            height: 32,
        });
        WA.room.area.onEnter(btnName).subscribe(() => {
            WA.player.state.saveVariable("buttonPressed", btnName, {
                persist: false,
                public: true,
            });
            updateMap();
        });
        WA.room.area.onLeave(btnName).subscribe(() => {
            WA.player.state.saveVariable("buttonPressed", undefined, {
                persist: false,
                public: true,
            });
            updateMap();
        });
    }

    WA.players.onPlayerEnters.subscribe((player) => {
        player.state.onVariableChange('buttonPressed').subscribe(() => {
            updateMap();
        });
    });
    WA.players.onPlayerLeaves.subscribe(() => {
        updateMap();
    });

    /*WA.players.onVariableChange('buttonPressed').subscribe(({player, value}) => {
        console.log("VARIABLE CHANGED", value, player.state.buttonPressed);
        updateMap();
    });*/

    updateMap();

}).catch(e => console.error(e));

function updateMap() {
    // Reset pressed state
    for (const button of Object.values(buttons)) {
        button.pressed = false;
    }

    let nbRedPressed = 0;
    let nbBluePressed = 0;

    const players = [...WA.players.list(), WA.player];
    for (const player of players) {
        const buttonPressed = player.state.buttonPressed;
        // Workaround for Typescript type narrowing bug with "buttonPressed in buttons"
        if (typeof buttonPressed === 'string' && (buttonPressed === "button1" || buttonPressed === "button2" || buttonPressed === "button3" || buttonPressed === "button4")) {
            buttons[buttonPressed].pressed = true;
            if (buttons[buttonPressed].color === 'red') {
                nbRedPressed++;
            }
            if (buttons[buttonPressed].color === 'blue') {
                nbBluePressed++;
            }
        }
    }

    displayButtons();

    if (nbRedPressed >= 1) {
        WA.room.showLayer('doors/red_door_opened');
        WA.room.hideLayer('doors/red_door_closed');
    } else {
        WA.room.hideLayer('doors/red_door_opened');
        WA.room.showLayer('doors/red_door_closed');
    }
    if (nbBluePressed >= 1) {
        WA.room.showLayer('doors/blue_door_opened');
        WA.room.hideLayer('doors/blue_door_closed');
    } else {
        WA.room.hideLayer('doors/blue_door_opened');
        WA.room.showLayer('doors/blue_door_closed');
    }
}

function displayButtons() {
    let tiles: TileDescriptor[] = [];
    for (const {x, y, color, pressed} of Object.values(buttons)) {
        tiles.push({ x, y, tile: color + (pressed ? '_enabled' : '_disabled'), layer: 'buttons' });
    }
    WA.room.setTiles(tiles);
}

export {};
