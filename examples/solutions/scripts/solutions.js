(function ($) {
    $.fn.cube = function(solution, solutionStep) {
        var container;
        $(this).each(function (i, el) {
            if($(el).data('cube')) {
                container = el;
                return false;
            }
        });
        if(container && $(container).data('cube')) return $(container).data('cube');
        else container = $(this).eq(0);

        function translateTwist(twist) {
            var map = {
                a: 'L',
                c: 'R',
                g: 'U',
                h: 'D',
                i: 'F',
                j: 'B'
            };
            return (twist.command.toLowerCase() in map ? map[twist.command.toLowerCase()] : twist.command.toUpperCase()) +
                (twist.degrees == 180 ? '2' : '') +
                (twist.vector < 0 ? "'" : '');
        }

        function translateSolution(solution, depth) {
            if (depth === undefined) depth = 0;
            var elements = solution.slice(0);
            var i, j, element, cw, degrees, lookAhead, twists;
            var map = {
                l: 'A',
                r: 'C',
                u: 'G',
                d: 'H',
                f: 'I',
                b: 'J'
            };
            if (typeof elements === 'object') {
                for (i = 0; i < elements.length; ++i) {
                    if (typeof elements[i] === 'object') {
                        element = elements.splice(i, 1);
                        for (j = 0; j < element.length; ++j) {
                            elements.splice(i, 0, element[j]);
                        }
                        --i;
                        continue;
                    } else if (elements[i].match(/[()]/)) {
                        elements[i] = elements[i].replace(/[()]/g, '');
                    }
                    elements[i] = translateSolution(elements[i], depth + 1);
                }
                return elements;
            } else if (typeof elements === 'string') {
                twists = [];
                elements = elements.replace(/[^()BDEFLMRSUXYZ2'’]/gi, '');
                if (elements.match(/\([^)]+\(/) || elements.match(/^[^(]+\)/) || elements.match(/\([^)]+$/)) {
                    elements = elements.replace(/[()]/g, '');
                } else if (elements.match(/^\([^()]+\)$/)) {
                    elements = elements.replace(/^\(([^()]+)\)$/, '$1');
                } else if (elements.match(/[()]/)) {
                    elements = elements.match(/\([^()]+\)|[^()]+/g);
                    return translateSolution(elements, depth);
                }
                for (i = 0; i < elements.length; ++i) {
                    element = elements[i];
                    cw = 1;
                    degrees = 90;
                    if (i + 1 < elements.length) {
                        lookAhead = elements[i + 1];
                        if (lookAhead.match(/[2'’]/)) {
                            if (lookAhead == '2') {
                                degrees = 180;
                                elements = elements.splice(i + 1, 1);
                                if (i + 1 < elements.length) {
                                    lookAhead =  elements[i + 1];
                                }
                            }
                            if (lookAhead.match(/['’]/)) {
                                cw = 0;
                                elements = elements.splice(i + 1, 1);
                            }
                        }
                    };
                    if (element.toLowerCase() === element) {
                        element = map[element];
                    }
                    twists.push(new ERNO.Twist(cw ? element.toUpperCase() : element.toLowerCase(), degrees));
                }
                return depth ? twists : [twists];
            }
        }

        function sideIsSticker(slice, row, col, side) {
            if (!side && !slice) return true;
            if (side == 1 && !row) return true;
            if (side == 2 && col == 2) return true;
            if (side == 3 && row == 2) return true;
            if (side == 4 && !col) return true;
            if (side == 5 && slice == 2) return true;
            else return false;
        }

        function sideVisibleInSolutionStep(slice, row, col, side, solutionStep) {
            switch (solutionStep) {
                case 'Cross':
                case 'White Cross':
                case 'F2L':
                case undefined:
                    return true;
                case 'OLL':
                case 'Yellow Cross':
                    if (row || side == 1) return true;
                    else return false;
                case 'Yellow Edges':
                    if (row || side == 1 || col == 1 || slice == 1) return true;
                    else return false;
            }
        }

        function cubeletVisibleInSolutionStep(slice, row, col, solutionStep) {
            switch (solutionStep) {
                case 'Cross':
                case 'White Cross':
                    if ((row && (slice == 1 || col == 1)) || (slice == 1 && col == 1)) return true;
                    else return false;
                case 'F2L':
                    if (row ||  (slice == 1 && col == 1)) return true;
                    else return false;
                case 'OLL':
                case undefined:
                    return true;
                case 'Yellow Cross':
                case 'Yellow Edges':
                    if (row ||  slice == 1 || col == 1) return true;
                    else return false;
            }
        }

        function generateCubeletColorMap(solutionStep) {
            var colors = [ERNO.BLUE, ERNO.YELLOW, ERNO.RED, ERNO.WHITE, ERNO.ORANGE, ERNO.GREEN];

            var cubelets = [];
            for (var slice = 0; slice < 3; ++slice) {
                for (var row = 0; row < 3; ++row) {
                    for (var col = 0; col < 3; ++col) {
                        var cubelet = [];
                        for (var side = 0; side < 6; ++side) {
                            if (sideIsSticker(slice, row, col, side)) {
                                if (cubeletVisibleInSolutionStep(slice, row, col, solutionStep)) {
                                    if (sideVisibleInSolutionStep(slice, row, col, side, solutionStep)) {
                                        cubelet.push(colors[side]);
                                    } else {
                                        cubelet.push(ERNO.GRAY);
                                    }
                                } else {
                                    cubelet.push(ERNO.GRAY);
                                }
                            } else cubelet.push(ERNO.COLORLESS);
                        }
                        cubelets.push(cubelet);
                    }
                }
            }
            return cubelets;
        }

        function setProblem(cube, callback, options) {
            var settings = $.extend({
                step: undefined
            }, options);

            var solution = $(cube.domElement).data('solution');
            if (settings.step !== undefined) {
                solution = solution.slice(0, settings.step);
            }

            var twistDuration = cube.twistDuration;
            cube.twistDuration = 0;
            cube.resume();

            var tq = new ERNO.Queue( ERNO.Twist.validate );
            tq.add(solution);

            var moves = tq.future.length;
            var completed = 0;

            cube.addEventListener('onTwistComplete', function count() {
                ++completed;
                if (completed >= moves)
                {
                    cube.pause();
                    cube.twistDuration = twistDuration;
                    if (callback) callback();
                    cube.removeEventListener('onTwistComplete', count)
                }
            });

            while (tq.future.length) tq.do();
            while (tq.history.length) {
                cube.immediateTwist(tq.undo().getInverse());
            }
        }

        function rotate(cube, callback) {
            var twistDuration = cube.twistDuration;
            cube.twistDuration = 0;
            cube.resume();

            var tq = new ERNO.Queue( ERNO.Twist.validate );
            tq.add('Y');

            cube.addEventListener('onTwistComplete', function count() {
                cube.pause();
                cube.twistDuration = twistDuration;
                if (callback) callback();
                cube.removeEventListener('onTwistComplete', count)
            });

            cube.immediateTwist(tq.do());
            if (!$(cube.domElement).data('rotated')) $(cube.domElement).data('rotated', new ERNO.Queue( ERNO.Twist.validate ));
            $(cube.domElement).data('rotated').add(tq.undo().getInverse());
            if($(cube.domElement).data('rotated').future.length == 4) $(cube.domElement).data('rotated').empty();
        }

        function unrotate(cube, callback) {
            var twistDuration = cube.twistDuration;
            cube.twistDuration = 0;
            cube.resume();

            var tq = $(cube.domElement).data('rotated');

            var moves = tq.future.length;
            var completed = 0;

            cube.addEventListener('onTwistComplete', function count() {
                ++completed;
                if (completed >= moves) {
                    cube.pause();
                    cube.twistDuration = twistDuration;
                    if (callback) callback();
                    cube.removeEventListener('onTwistComplete', count)
                }
            });

            while (tq.future.length) {
                cube.immediateTwist(tq.do());
            }
        }

        function solve(cube, callback, options) {
            var settings = $.extend({
                step: undefined,
                twistDuration: undefined
            }, options);

            var solution = $(cube.domElement).data('solution');
            var step = 0;
            if (settings.step !== undefined) {
                solution = [solution[settings.step]];
                step = settings.step;
            }

            if (settings.twistDuration !== undefined) {
                var twistDuration = cube.twistDuration;
                cube.twistDuration = settings.twistDuration;
            }
            cube.resume();

            var tq = new ERNO.Queue(ERNO.Twist.validate);
            tq.add(solution);

            var moves = tq.future.length;
            var completed = 0;

            cube.addEventListener('onTwistComplete', function count() {
                ++completed;
                var i = 0, j, k;
                if (completed >= moves) {
                    $('#modal .solution').find('span').removeClass('active');
                    cube.pause();
                    if (settings.twistDuration !== undefined) {
                        cube.twistDuration = twistDuration;
                    }
                    if (callback) callback();
                    cube.removeEventListener('onTwistComplete', count)
                } else {
                    twists:
                        for (j = 0; j < solution.length; ++j) {
                            for (k = 0; k < solution[j].length; ++k) {
                                if (i == completed) {
                                    $('#modal .solution').find('span').removeClass('active');
                                    $('#modal .solution').find('.step').eq(step + j).addClass('active').find('.twist').eq(k).addClass('active');
                                    break twists;
                                }
                                ++i;
                            }
                        }
                }
            });

            $('#modal .solution').find('.step').eq(step).addClass('active').find('.twist').eq(0).addClass('active');
            cube.twist(solution);
        }

        function clickedReset(callback) {
            if (!$(document).data('twisting')) {
                var cube = $('#modal').data('cube');
                if ($(cube.domElement).data('solved') || $(cube.domElement).data('step')) {
                    $(cube.domElement).hide();
                    $(document).data('twisting', true);
                    setProblem(cube, function () {
                        $(document).data('twisting', false);
                        $(cube.domElement).show();
                        if (callback && $.isFunction(callback)) callback();
                    }, $(cube.domElement).data('step') ? {step: $(cube.domElement).data('step')} : undefined);
                    $(cube.domElement).data('solved', false);
                    $(cube.domElement).data('step', 0);
                    $('#modal-reset').prop('disabled', true);
                    $('#modal-play').prop('disabled', false);
                    $('#modal-step').prop('disabled', false);
                    $('#modal-rotate').prop('disabled', false);
                } else if (callback && $.isFunction(callback)) callback();
            }
        }

        function clickedPlay() {
            if (!$(document).data('twisting')) {
                var cube = $('#modal').data('cube');
                if (!$(cube.domElement).data('solved') && !$(cube.domElement).data('step')) {
                    $(document).data('twisting', true);
                    solve(cube, function () {
                        $(document).data('twisting', false);
                    });
                    $(cube.domElement).data('solved', true);
                    $('#modal-reset').prop('disabled', false);
                    $('#modal-play').prop('disabled', true);
                    $('#modal-step').prop('disabled', true);
                    $('#modal-rotate').prop('disabled', true);
                }
            }
        }

        function clickedStep() {
            if (!$(document).data('twisting')) {
                var cube = $('#modal').data('cube');
                var solution = $(cube.domElement).data('solution');
                if (!$(cube.domElement).data('solved')) {
                    if (!$(cube.domElement).data('step')) $(cube.domElement).data('step', 0);
                    if ($(cube.domElement).data('step') < solution.length) {
                        $(document).data('twisting', true);
                        solve(cube, function () {
                            $(document).data('twisting', false);
                        }, {
                            step: $(cube.domElement).data('step')
                        });
                        $(cube.domElement).data('step', $(cube.domElement).data('step') + 1);
                        $('#modal-reset').prop('disabled', false);
                        $('#modal-play').prop('disabled', true);
                        if ($(cube.domElement).data('step') >= solution.length) {
                            $('#modal-step').prop('disabled', true);
                        }
                        $('#modal-rotate').prop('disabled', true);
                    }
                }
            }
        }

        function clickedRotate() {
            if (!$(document).data('twisting')) {
                var cube = $('#modal').data('cube');
                if (!$(cube.domElement).data('solved') && !$(cube.domElement).data('step')) {
                    $(cube.domElement).hide();
                    $(document).data('twisting', true);
                    solve(cube, function () {
                        rotate(cube, function () {
                            setProblem(cube, function() {
                                $(document).data('twisting', false);
                                $(cube.domElement).show();
                            });
                        });
                    }, {
                        twistDuration: 0
                    });
                }
            }
        }

        function clickedUnrotate(callback) {
            if (!$(document).data('twisting')) {
                var cube = $('#modal').data('cube');
                clickedReset(function() {
                    var tq = $(cube.domElement).data('rotated');
                    if (tq && tq.future.length) {
                        $(document).data('twisting', true);
                        solve(cube, function () {
                            unrotate(cube, function () {
                                setProblem(cube, function () {
                                    $(document).data('twisting', false);
                                    if (callback) callback();
                                });
                            });
                        }, {
                            twistDuration: 0
                        });
                    } else if (callback) callback();
                });
            }
        }

        function modalShow(e) {
            var cube = $('#modal').data('cube');
            var solution = $(cube.domElement).data('solution');
            $(cube.domElement).hide();
            $(cube.domElement).appendTo('#modal .container');
            displaySolution(solution);
            if (solution.length == 1) $('#modal-step').hide();
            else $('#modal-step').show();
        }

        function modalHide(e) {
            if (!$(document).data('twisting')) {
                var cube = $('#modal').data('cube');
                $(cube.domElement).hide();
                $(cube.domElement).appendTo($(cube.domElement).data('container'));
                clickedUnrotate(function() {
                    $('#modal .solution').empty();
                });
            } else {
                e.preventDefault();
            }
        }

        function modalShownHidden(e) {
            var cube = $('#modal').data('cube');
            $(cube.domElement).show();
        }

        function displaySolution(solution) {
            var step, text, j;
            for (var i = 0; i < solution.length; ++i) {
                if (i) {
                    text = document.createTextNode(' ');
                    $('#modal .solution').append(text);
                }
                step = $('<span />').addClass('step').addClass('step-' + (i + 1)).appendTo('#modal .solution');
                if (solution.length > 1 && solution[i].length > 1) {
                    text = document.createTextNode('(');
                    $(step).append(text);
                }
                for (j = 0; j < solution[i].length; ++j) {
                    if (j) {
                        text = document.createTextNode(' ');
                        $(step).append(text);
                    }
                    $('<span />').addClass('twist').addClass('twist-' + (j + 1)).text(translateTwist(solution[i][j])).appendTo(step);
                }
                if (solution.length > 1 && solution[i].length > 1) {
                    text = document.createTextNode(')');
                    $(step).append(text);
                }
            }
        }

        var cube = new ERNO.Cube({
            twistDuration: 750,
            cubeletColorMap: generateCubeletColorMap(solutionStep),
            mouseControlsEnabled: false,
            keyboardControlsEnabled: false,
            paused: true
        });
        cube.camera.position.z = (cube.size * Math.sqrt(3) / 2) / (Math.sin( cube.camera.fov * (Math.PI/180) / 2 ));

        if (!$(document).data('cubes')) $(document).data('cubes', 1);
        else $(document).data('cubes', $(document).data('cubes') + 1);
        $(cube.domElement).addClass('cube-' + $(document).data('cubes'));

        $(cube.domElement).data('container', this);
        $(container).data('cube', cube);
        $(cube.domElement).data('cube', cube);

        if (solution) {
            $(cube.domElement).click(function() {
                $('#modal-reset').on('click', clickedReset);
                $('#modal-play').on('click', clickedPlay);
                $('#modal-step').on('click', clickedStep);
                $('#modal-rotate').on('click', clickedRotate);
                $('#modal').on('show.bs.modal', modalShow);
                $('#modal').on('shown.bs.modal', modalShownHidden);
                $('#modal').on('hide.bs.modal', modalHide);
                $('#modal').on('hidden.bs.modal', modalShownHidden);
                $('#modal').on('hidden.bs.modal', function(e) {
                    $('#modal-reset').off('click');
                    $('#modal-play').off('click');
                    $('#modal-step').off('click');
                    $('#modal-rotate').off('click');
                    $('#modal').off('show.bs.modal');
                    $('#modal').off('shown.bs.modal');
                    $('#modal').off('hide.bs.modal');
                    $('#modal').off('hidden.bs.modal');

                    $('#modal').removeData('cube');
                });

                $('#modal').data('cube', cube);
                $('#modal').modal();
            });

            solution = translateSolution(solution);
            $(cube.domElement).data('solution', solution);

            $(document).data('twisting', true);
            setProblem(cube, function () {
                $(document).data('twisting', false);
                $(container).append(cube.domElement);
            });
        } else {
            $(container).append(cube.domElement);
        }

        return cube;
    }
}(jQuery));

$(document).ready(function() {
    $('.container-1').cube("(F’ U’ F) (U F’ U’ F)", 'F2L');
    $('.container-2').cube("(R U’ R’ U’ R U R’) (U’ R U2 R’)", 'F2L');
});
