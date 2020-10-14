model = {
    name: 'Car Simulation',
    agents: {
        world: {
            behaviour: open('world.js'),
            visual: {
                shape: 'circle',
                width: 10,
                height: 10,
                fill: {
                    color: 'green',
                    opacity: 0.0
                }
            }
        },
        car: {
            behaviour: open('car.js'),
            visual: {
                shape: 'circle',
                width: 4,
                height: 4,
                fill: {
                    color: 'red',
                    opacity: 0.0
                }
            },
            type: 'physical',
        },
        house: {
            behaviour: open('house.js'),
            visual: {
                shape: 'rect',
                width: 4,
                height: 4,
                fill: {
                    color: 'blue',
                    opacity: 0.0
                }
            },
            type: 'physical',
        },
        person: {
            behaviour: open('person.js'),
            visual: {
                shape: 'circle',
                width: 3,
                height: 3,
                fill: {
                    color: 'green',
                    opacity: 0.5
                }
            }
        }
    },
    resources: {},

    nodes: {
        world: function (x, y) {
            return {
                id: 'world',
                x: x, // patch position
                y: y,
                visual: {
                    shape: 'icon',
                    icon: 'world',
                    label: {
                        text: 'World',
                        fontSize: 14
                    },
                    width: 20,
                    height: 20,
                    fill: {
                        color: 'black',
                        opacity: 0.5
                    }
                }
            }
        },
        car: function (x, y, id) {
            return {
                id: id,
                x: x, // patch position
                y: y,
                visual: {
                    shape: 'rect',
                    width: 10,
                    height: 10,
                    line: {
                        width: 0,
                    },
                    fill: {
                        color: 'yellow',
                        opacity: 0.5
                    }
                },
                ports: {
                    wlan: {
                        type: 'multicast',
                        status: function (nodes) {
                            // Filter out nodes, e.g., beacons only?
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 40,
                            height: 40,
                            line: {
                                color: 'red',
                                opacity: 0.5
                            }
                        }
                    }
                }
            }
        },
        house: function (x, y, id) {
            return {
                id: id,
                x: x, // patch position
                y: y,
                visual: {
                    shape: 'rect',
                    width: 20,
                    height: 20,
                    line: {
                        width: 0,
                    },
                    fill: {
                        color: 'blue',
                        opacity: 0.5
                    }
                },
                ports: {
                    wlan: {
                        type: 'multicast',
                        status: function (nodes) {
                            // Filter out nodes, e.g., beacons only?
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 50,
                            height: 50,
                            line: {
                                color: 'blue',
                                opacity: 0.5
                            }
                        }
                    }
                }
            }
        }
    },

    parameter: {
        phy: true
        // Fake answers on survey dialogs
    },

    world: {
        init: {
            agents: {
                world: function (nodeId) {
                    if (nodeId == 'world')
                        return {level: 3, args: {verbose: 1}};
                }
            }
        },
        // special nodes
        map: function () {
            return [
                model.nodes.world(55, 25),  // graphical position
            ]
        },
        // resources
        patchgrid: {
            rows: 50,
            cols: 50,
            width: 5, // geometrical width and height of patch in pixels
            height: 5,
            floating: true,  // physical agents are tuples <logical node, behavioural agent>
        }
    }
}
