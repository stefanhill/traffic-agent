DIR = {
    NORTH: 'DIR.NORTH',
    EAST: 'DIR.EAST',
    SOUTH: 'DIR.SOUTH',
    WEST: 'DIR.WEST'
};

model = {
    name: 'Transport Management',
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
        network_mapper: {
            behaviour: open('network_mapper.js'),
            visual: {
                shape: 'rect',
                width: 3,
                height: 3,
                fill: {
                    color: '#444',
                    opacity: 0.0
                },
                line: {
                    color: 'orange',
                    width: 1
                }
            }
        },
        remote_control: {
            behaviour: open('remote_control.js'),
            visual: {
                shape: 'rect',
                width: 5,
                height: 5,
                fill: {
                    color: '#444',
                    opacity: 0.0
                },
                line: {
                    color: 'red',
                    width: 1
                }
            }
        },
        reservation_agent: {
            behaviour: open('reservation_agent.js'),
            visual: {
                shape: 'rect',
                width: 3,
                height: 3,
                fill: {
                    color: 'red',
                },
                line: {
                    color: 'orange',
                    width: 1
                }
            }
        },
        evaluation_agent: {
            behaviour: open('evaluation_agent.js'),
            visual: {
                shape: 'rect',
                width: 3,
                height: 3,
                fill: {
                    color: '#444',
                    opacity: 0.0
                },
                line: {
                    color: 'green',
                    width: 1
                }
            }
        },
        agent_control: {
            behaviour: open('agent_control.js'),
            visual: {
                shape: 'circle',
                width: 7,
                height: 7,
                fill: {
                    color: '#444',
                    opacity: 0.0
                },
                line: {
                    color: 'pink',
                    width: 1
                }
            }
        },
        negotiation_agent: {
            behaviour: open('negotiation_agent.js'),
            visual: {
                shape: 'rect',
                width: 3,
                height: 3,
                fill: {
                    color: '#444',
                    opacity: 0.0
                },
                line: {
                    color: 'lime',
                    width: 1
                }
            }
        },
        kp_agent: {
            behaviour: open('kp_agent.js'),
            visual: {
                shape: 'rect',
                width: 3,
                height: 3,
                fill: {
                    color: '#444',
                    opacity: 0.0
                },
                line: {
                    color: 'orange',
                    width: 1
                }
            }
        },
        vehicle: {
            behaviour: open('vehicle.js'),
            visual: {
                shape: 'circle',
                width: 4,
                height: 4,
                fill: {
                    color: 'grey',
                    opacity: 0.0
                }
            },
            type: 'physical'
        },
        intersection_management: {
            behaviour: open('intersection_management.js'),
            visual: {
                shape: 'circle',
                width: 5,
                height: 5,
                fill: {
                    color: 'white',
                }
            },
            type: 'physical'
        },
        flow: {
            behaviour: open('flow.js'),
            visual: {
                shape: 'circle',
                width: 5,
                height: 5,
                fill: {
                    color: 'white',
                },
                line: {
                    width: 0
                }
            },
            type: 'physical'
        },
        station: {
            behaviour: open('station.js'),
            visual: {
                shape: 'circle',
                width: 6,
                height: 6,
                line: {
                    width: 0
                },
                fill: {
                    color: 'orange',
                    opacity: 0.0
                }
            },
            type: 'physical',
        }

    },

    resources: {
        street: function (id, x, y, w, h) {
            return {
                id: id,
                class: 'street',
                visual: {
                    shape: 'rect',
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    line: {
                        color: '#FFF',
                        width: 1
                    },
                    fill: {
                        color: '#888',
                        opacity: 0.4,
                    }
                }
            };
        },
        intersection: function (id, x, y, w, h) {
            return {
                id: id,
                class: 'intersection',
                visual: {
                    shape: 'rect',
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    line: {
                        color: '#FFF',
                        width: 0,
                    },
                    fill: {
                        color: '#888',
                        opacity: 0.4,
                    }
                }
            };
        }
    },

    nodes: {
        world: function (x, y) {
            return {
                id: 'world',
                x: x,
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
                    wlan: {
                        type: 'multicast',
                        status: function (nodes) {
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 2000,
                            height: 2000,
                            line: {
                                color: '#BBB',
                                opacity: 0.1,
                                width: 1
                            }
                        }
                    },
                    phy: {
                        type: 'physical',
                        ip: '*',
                        to: 'localhost:10001',
                        proto: 'http'
                    }
                }
            }
        },
        vehicle: function (x, y, id) {
            return {
                id: id,
                x: x,
                y: y,
                visual: {
                    shape: 'rect',
                    width: 10,
                    height: 10,
                    line: {
                        width: 0,
                    },
                    fill: {
                        color: 'grey',
                        opacity: 0.5
                    }
                },
                ports: {
                    wlan: {
                        type: 'multicast',
                        status: function (nodes) {
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 60,
                            height: 60,
                            line: {
                                color: '#BBB',
                                opacity: 0.2,
                                width: 1
                            }
                        }
                    }
                }
            }
        },
        intersection_management: function (x, y, id) {
            return {
                id: id,
                x: x,
                y: y,
                visual: {
                    shape: 'rect',
                    width: 10,
                    height: 10,
                    line: {
                        width: 0,
                    },
                    fill: {
                        color: '#888',
                        opacity: 0.5
                    }
                },
                ports: {
                    wlan: {
                        type: 'multicast',
                        status: function (nodes) {
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 130,
                            height: 130,
                            line: {
                                color: '#BBB',
                                opacity: 0.1,
                                width: 1
                            }
                        }
                    }
                }
            }
        },
        flow: function (x, y, id) {
            return {
                id: id,
                x: x,
                y: y,
                visual: {
                    shape: 'rect',
                    width: 10,
                    height: 10,
                    fill: {
                        color: '#BBB'
                    },
                    line: {
                        width: 0
                    }
                },
            }
        },
        station: function (x, y, id) {
            return {
                id: id,
                x: x,
                y: y,
                visual: {
                    shape: 'rect',
                    width: 10,
                    height: 10,
                    line: {
                        width: 0,
                    },
                    fill: {
                        color: 'purple',
                        opacity: 0.0
                    }
                },
            }
        },
    },

    parameter: {
        simulationSpeed: 10,
        mode: 'sector', //{reservation/kp/normal/circuit/sector}
        const: {
            world: {},
            num: {
                cars: 75,
                buses: 0
            },
            stations: {
                distance: 4,
                granularity: 0.2
            },
            enable: {
                sourcesAndSinks: true,
                parking: true,
                buses: true,
                network: true
            }
        },
        sources: [{
            x: 10,
            y: 10,
            weight: 100
        }],
        intersections: [],
        graph: [],
        grid: [],
        stations: [],
        log: []
    },

    world: {
        init: {
            agents: {
                world: function (nodeId) {
                    if (nodeId === 'world')
                        return {level: 3, args: {verbose: 1}};
                }
            }
        },
        // special nodes
        map: function () {
            return [
                model.nodes.world(model.world.patchgrid.rows + 10, 5),  // graphical position
            ]
        },
        // [type, {param}] -> [Resources]
        resources: function (resources) {
            let r = [];

            if (resources.length > 0) {
                model.parameter.log.push('ok');
                for (let resource in resources) {
                    let res = resources[resource];
                    switch (res.type) {
                        case 'street':
                            r.push(model.resources.street(res.param.id, res.param.x, res.param.y, res.param.w, res.param.h));
                            break;
                        case 'intersection':
                            r.push(model.resources.intersection(res.param.id, res.param.x, res.param.y, res.param.w, res.param.h));
                            break;
                    }
                }
            } else {
                //model.parameter.grid['x'] = [5, 18, 30];
                model.parameter.grid['x'] = [5, 22, 32, 46];
                //model.parameter.grid['y'] = [5, 16, 25];
                model.parameter.grid['y'] = [3, 14, 25, 42];

                let c = 0;
                for (let i in model.parameter.grid.x) {
                    for (let j in model.parameter.grid.y) {
                        let x = model.parameter.grid.x[i],
                            y = model.parameter.grid.y[j];
                        if (i > 0) {
                            if (Math.random() > 0) {
                                let w1 = x - model.parameter.grid.x[i - 1] - 3,
                                    h1 = 1,
                                    id11 = 'street-' + c.toString() + '-west',
                                    id12 = 'street-' + c.toString() + '-east';
                                r.push(model.resources.street(id11, x - w1 - 1, y - 1, w1, h1));
                                r.push(model.resources.street(id12, x - w1 - 1, y + 1, w1, h1));
                                model.parameter.graph.push({
                                    from: c,
                                    to: c - model.parameter.grid.y.length,
                                    distance: w1 + 3
                                });
                                model.parameter.graph.push({
                                    from: c - model.parameter.grid.y.length,
                                    to: c,
                                    distance: w1 + 3
                                });
                            }
                        }
                        if (j > 0) {
                            if (Math.random() > 0) {
                                let w2 = 1,
                                    h2 = y - model.parameter.grid.y[j - 1] - 3,
                                    id21 = 'street-' + c.toString() + '-south',
                                    id22 = 'street-' + c.toString() + '-north';
                                r.push(model.resources.street(id21, x - 1, y - h2 - 1, w2, h2));
                                r.push(model.resources.street(id22, x + 1, y - h2 - 1, w2, h2));
                                model.parameter.graph.push({
                                    from: c,
                                    to: c - 1,
                                    distance: h2 + 3
                                });
                                model.parameter.graph.push({
                                    from: c - 1,
                                    to: c,
                                    distance: h2 + 3
                                });
                            }
                        }
                        model.parameter.intersections.push({id: c, x: x, y: y});
                        r.push(model.resources.intersection('intersection-' + c.toString(), x - 1, y - 1, 3, 3));
                        c++;
                    }
                }
            }
            return r;
        },
        patchgrid: {
            rows: 50,
            cols: 50,
            width: 10,
            height: 10,
            floating: true
        }
    },

    api: {
        // {north|east|south|west} -> DIR
        getDirectionFromString: function (dir) {
            const dirs = [DIR.NORTH, DIR.EAST, DIR.SOUTH, DIR.WEST],
                dirStrings = ['north', 'east', 'south', 'west'];
            return dirs[dirStrings.indexOf(dir)];
        },

        // DIR -> [int, int] -> [int, int] -> [int, int]
        getRelVector: function (dir, m, v) {
            const alpha = [DIR.NORTH, DIR.EAST, DIR.SOUTH, DIR.WEST].indexOf(dir) * Math.PI / 2,
                rM = [[Math.cos(alpha), -1 * Math.sin(alpha)], [Math.sin(alpha), Math.cos(alpha)]];
            let vR = [rM[0][0] * v[0] + rM[0][1] * v[1], rM[1][0] * v[0] + rM[1][1] * v[1]];
            return [Math.round(vR[0] + m[0]), Math.round(vR[1] + m[1])];
        },

        // DIR -> {forward|right|back|left} -> DIR
        getRelDir: function (dir, relDir) {
            const dirs = [DIR.NORTH, DIR.EAST, DIR.SOUTH, DIR.WEST],
                relDirs = ['forward', 'right', 'back', 'left'];
            return dirs[(dirs.indexOf(dir) + relDirs.indexOf(relDir)) % 4];
        },

        // [int, int] -> [int, int] -> DIR
        getRelDirPGrid: function (p1, p2) {
            if (p1[0] - p2[0] > 0) {
                return DIR.WEST;
            }
            else if (p1[0] - p2[0] < 0) {
                return DIR.EAST;
            }
            else {
                if (p1[1] - p2[1] > 0) {
                    return DIR.NORTH;
                }
                else {
                    return DIR.SOUTH;
                }
            }
        },

        // int -> DIR
        getRandomNextIntersectionFromIntersectionID: function (sid, rdir = -1) {
            let i = model.parameter.intersections[sid],
                ndsW = [],
                nds = model.api.getDestinationsFromIntersectionID(sid).filter(function (elem) {
                    return elem.direction !== rdir;
                }).map(function (elem) {
                    let w = 1,
                        v = model.api.getRelVector(elem.direction, [i.x, i.y], [0, -3]);
                    i.sources.forEach(function (e) {
                        w = w * e.weight / model.api.getDistance(v, [e.x, e.y]);
                    });
                    return {
                        key: elem.direction,
                        value: w
                    }
                });
            return model.api.getRandomWeightedKey(nds);
        },

        // [DIR, DIR] -> [DIR, DIR] -> bool
        checkCrossRequest: function (a, b) {
            if (a[0] === b[0]) {
                return true;
            } else {
                switch (a[1]) {
                    case a[0]:
                        switch (b[0]) {
                            case model.api.getRelDir(a[0], 'back'):
                                return b[1] !== model.api.getRelDir(a[0], 'right');
                            case model.api.getRelDir(a[0], 'right'):
                                return b[1] === model.api.getRelDir(a[0], 'back');
                            default:
                                return false;
                        }
                    case model.api.getRelDir(a[0], 'left'):
                        switch (b[0]) {
                            case model.api.getRelDir(a[0], 'right'):
                                return b[1] === model.api.getRelDir(a[0], 'back');
                            case model.api.getRelDir(a[0], 'left'):
                                return b[1] === model.api.getRelDir(a[0], 'forward');
                            default:
                                return false;
                        }
                    case model.api.getRelDir(a[0], 'right'):
                        switch (b[0]) {
                            case model.api.getRelDir(a[0], 'back'):
                                return b[1] !== model.api.getRelDir(a[0], 'right');
                            case model.api.getRelDir(a[0], 'right'):
                                return b[1] !== model.api.getRelDir(a[0], 'right');
                            default:
                                return true;
                        }
                    case model.api.getRelDir(a[0], 'back'):
                        switch (b[0]) {
                            case model.api.getRelDir(a[0], 'back'):
                                return b[1] === model.api.getRelDir(a[0], 'left');
                            case model.api.getRelDir(a[0], 'left'):
                                return b[1] !== model.api.getRelDir(a[0], 'back');
                            default:
                                return false;
                        }
                    default:
                        return false;
                }
            }
        },

        // [{key: string/int, value: int}] -> string/int
        getRandomWeightedKey: function (arr) {
            let sum = arr.map(obj => obj.value).reduce((a, b) => a + b),
                r = Math.random(),
                c = 0;
            for (let e in arr) {
                let elem = arr[e];
                c += elem.value / sum;
                if (c > r) {
                    return elem.key;
                }
            }
            return arr[0].key;
        },

        // [int, int] -> [int, int] -> int
        getDistance: function (a, b) {
            return Math.sqrt(Math.pow(Math.abs(a[0] - b[0]), 2) + Math.pow(Math.abs(a[1] - b[1]), 2));
        },

        // DIR -> DIR -> Patch -> [{x: int, y: int, direction: DIR}]
        getIntersectionPath: function (fromDir, toDir, intersection) {
            const m = [intersection.x, intersection.y];
            let r = [];
            switch (toDir) {
                case model.api.getRelDir(fromDir, 'forward'):
                    r.push({
                        x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                        y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                        direction: model.api.getRelDir(fromDir, 'forward'),
                        sector: true
                    });
                    r.push({
                        x: model.api.getRelVector(fromDir, m, [1, 0])[0],
                        y: model.api.getRelVector(fromDir, m, [1, 0])[1],
                        direction: model.api.getRelDir(fromDir, 'forward')
                    });
                    r.push({
                        x: model.api.getRelVector(fromDir, m, [1, -1])[0],
                        y: model.api.getRelVector(fromDir, m, [1, -1])[1],
                        direction: model.api.getRelDir(fromDir, 'forward'),
                        sector: true
                    });
                    break;
                case model.api.getRelDir(fromDir, 'right'):
                    r.push({
                        x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                        y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                        direction: model.api.getRelDir(fromDir, 'right'),
                        sector: true
                    });
                    break;
                case model.api.getRelDir(fromDir, 'back'):
                    switch (intersection.intersectionType) {
                        case 'circuit':
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'forward')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 0])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 0])[1],
                                direction: model.api.getRelDir(fromDir, 'forward')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [0, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [0, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [-1, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [-1, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'back')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [-1, 0])[0],
                                y: model.api.getRelVector(fromDir, m, [-1, 0])[1],
                                direction: model.api.getRelDir(fromDir, 'back')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [-1, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [-1, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'back')
                            });
                            break;
                        default:
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'left')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [0, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [0, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'left')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [-1, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [-1, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'back')
                            });
                            break;
                    }
                    break;
                case model.api.getRelDir(fromDir, 'left'):
                    switch (intersection.intersectionType) {
                        case 'circuit':
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'forward'),
                                sector: true
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 0])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 0])[1],
                                direction: model.api.getRelDir(fromDir, 'forward')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left'),
                                sector: true
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [0, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [0, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [-1, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [-1, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left'),
                                sector: true
                            });
                            break;
                        default:
                            /*r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'forward')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [0, 0])[0],
                                y: model.api.getRelVector(fromDir, m, [0, 0])[1],
                                direction: model.api.getRelDir(fromDir, 'forward')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [-1, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [-1, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left')
                            });
                            break;*/
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                                direction: model.api.getRelDir(fromDir, 'forward'),
                                sector: true
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, 0])[0],
                                y: model.api.getRelVector(fromDir, m, [1, 0])[1],
                                direction: model.api.getRelDir(fromDir, 'forward')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [1, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [1, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left'),
                                sector: true
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [0, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [0, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left')
                            });
                            r.push({
                                x: model.api.getRelVector(fromDir, m, [-1, -1])[0],
                                y: model.api.getRelVector(fromDir, m, [-1, -1])[1],
                                direction: model.api.getRelDir(fromDir, 'left'),
                                sector: true
                            });
                            break;
                    }
                    break;
            }
            return r;
        },

        // int -> int -> [[int], [int]]
        bellmanFord: function (from, to) {
            let distance = [],
                prev = [];
            for (let n in model.parameter.intersections) {
                let node = model.parameter.intersections[n];
                distance[node.id] = Infinity;
                prev[node.id] = undefined;
            }
            distance[from] = 0;
            for (let i = 0; i < model.parameter.intersections.length - 1; i++) {
                for (let e in model.parameter.graph) {
                    let edge = model.parameter.graph[e];
                    if (distance[edge.from] + edge.distance < distance[edge.to]) {
                        distance[edge.to] = distance[edge.from] + edge.distance;
                        prev[edge.to] = edge.from;
                    }
                }
            }
            return {distances: distance, prevs: prev};
        },

        // int -> {id: int, direction: DIR}
        getDestinationsFromIntersectionID: function (intersection) {
            let r = [],
                p = model.parameter;
            for (let i in p.graph) {
                let g = p.graph[i];
                if (g.from.toString() === intersection.toString()) {
                    let dir = null;
                    if (p.intersections[g.from].x === p.intersections[g.to].x) {
                        if (p.intersections[g.from].y > p.intersections[g.to].y) {
                            dir = DIR.NORTH;
                        } else {
                            dir = DIR.SOUTH;
                        }
                    } else if (p.intersections[g.from].y === p.intersections[g.to].y) {
                        if (p.intersections[g.from].x > p.intersections[g.to].x) {
                            dir = DIR.WEST;
                        } else {
                            dir = DIR.EAST;
                        }
                    }
                    r.push({id: g.to, direction: dir});
                }
            }
            return r;
        }
    },

};