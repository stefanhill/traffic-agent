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
        network_explorer: {
            behaviour: open('network_explorer.js'),
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
        /*person: {
            behaviour: open('person.js'),
            visual: {
                shape: 'circle',
                width: 2,
                height: 2,
                fill: {
                    color: 'blue',
                    opacity: 0.0
                }
            },
            type: 'physical'
        },*/
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
        navigation: {
            behaviour: open('navigation.js'),
            visual: {
                shape: 'circle',
                width: 4,
                height: 4,
                fill: {
                    color: 'red',
                    opacity: 0.0
                }
            }
        },
        i_explorer: {
            behaviour: open('i_explorer.js'),
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
                    phy: {
                        type: 'physical',
                        ip: '*',
                        to: 'localhost:10002',
                        proto: 'http'

                    }
                }
            }
        },
        /*person: function (x, y, id) {
            return {
                id: id,
                x: x,
                y: y,
                visual: {
                    shape: 'rect',
                    width: 3,
                    height: 3,
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
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 20,
                            height: 20,
                            line: {
                                color: 'blue',
                                opacity: 0.5
                            }
                        }
                    }
                }
            }
        },*/
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
                /*ports: {
                    wlan: {
                        type: 'multicast',
                        status: function (nodes) {
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 40,
                            height: 40,
                            line: {
                                color: 'grey',
                                opacity: 0.5
                            }
                        }
                    }
                }*/
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
                            width: 60,
                            height: 60,
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
                ports: {
                    wlan: {
                        type: 'multicast',
                        status: function (nodes) {
                            return nodes;
                        },
                        visual: {
                            shape: 'circle',
                            width: 40,
                            height: 40,
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
                /*
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
                                color: 'green',
                                opacity: 0.5
                            }
                        }
                    }
                }*/
            }
        },
    },

    parameter: {
        simulationSpeed: 10,
        numCars: 20,
        busRoutes: [{
            name: 'A',
            stations: ['station-1', 'station-2', 'station-3', 'station-4']
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
                model.parameter.log.push('test');
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
                model.parameter.grid['x'] = [5, 18, 30];
                //model.parameter.grid['x'] = [5, 22, 32, 46];
                model.parameter.grid['y'] = [5, 16, 25];
                //model.parameter.grid['y'] = [3, 14, 25, 42];

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
                        let itype = 'normal';
                        if (Math.random() < 0) {
                            itype = 'circuit';
                        }
                        r.push(model.resources.intersection('intersection-' + c.toString() + '-' + itype, x - 1, y - 1, 3, 3));
                        c++;
                    }
                }
            }
            return r;
        },
        patchgrid: {
            rows: 35,
            cols: 35,
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

        // int -> DIR
        getRandomNextIntersectionFromIntersectionID: function (sid) {
            const nds = model.api.getDestinationsFromIntersectionID(sid);
            return nds[Math.floor(Math.random() * nds.length)].direction;
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
                        direction: model.api.getRelDir(fromDir, 'forward')
                    });
                    break;
                case model.api.getRelDir(fromDir, 'right'):
                    r.push({
                        x: model.api.getRelVector(fromDir, m, [1, 1])[0],
                        y: model.api.getRelVector(fromDir, m, [1, 1])[1],
                        direction: model.api.getRelDir(fromDir, 'right')
                    });
                    break;
                case model.api.getRelDir(fromDir, 'back'):
                    switch (intersection.intersectionType) {
                        case 'normal':
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
                    }
                    break;
                case model.api.getRelDir(fromDir, 'left'):
                    switch (intersection.intersectionType) {
                        case 'normal':
                            r.push({
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
                            break;
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
                                direction: model.api.getRelDir(fromDir, 'left')
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