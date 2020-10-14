model = {
    name: 'test',
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
        simple: {
            behaviour: open('simple.js'),
            visual: {
                shape: 'circle',
                width: 10,
                height: 10
            },
            type: 'physical'
        }
    },
    parameter: {
        parameter1: 10
    },
    patches: {
        nodefault: {
            parameters: {},
            visual: {
                shape: 'rect',
                line: {
                    width: 0,
                    color: '#bbb'
                },
                fill: {
                    color: 'white',
                    opacity: 0.0
                }
            }
        }
    },
    nodes: {
        world: function (x, y) {
            var phy = {
                type: 'physical',
                ip: '*',
                to: model.parameter.ip + ':' + model.parameter.ipport,
                proto: model.parameter.proto
            };
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
                },
                ports: {
                    phy: phy
                }
            }
        }
    },
    world: {
        init: {
            agents: {
                world: function(nodeId) {
                    if (nodeId=='world')
                        return {level:3,args:{verbose:1}};
                }
            }
        },
        patchgrid: {
            rows: 10,
            columns: 10,
            width: 100,
            height: 100,
            visual: {
                shape: 'rect',
                width: 8,
                height: 8,
                line: {
                    width: 1,
                    color: 'red'
                }
            },
            floating: true
        }
    }
};
