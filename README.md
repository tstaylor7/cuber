Cuber
==============================================================================

Cuber is a Rubik's cube simulator written in javascript with a little bit of three.js thrown in for good measure. It uses CSS 3D transforms and has a programmatic API, and has different rendering outputs.


### Getting started

Download the [minified file](/build/cuber.min.js), the [css](/build/cube.css) and include it in your project.

```html
<script  charset="utf-8" src="js/cuber.min.js"></script>
<link rel="stylesheet" type="text/css" href="styles/cube.css">
```

Create a new Cube, attach it to your DOM and you're good to go.

```javascript
var cube = new ERNO.Cube();
document.body.appendChild( cube.domElement );
```


### Commands

Cuber is interactive, but you can also twist slices programmatically. We use a variation of the [Singmaster notation](http://en.wikipedia.org/wiki/Rubik's_Cube#Move_notation) which uses a single character and it's case to denote a move. For example `cube.twist( 'U' )` rotates the Upper face clockwise. You can also chain multiple moves into a sequence such as `cube.twist( 'UDLF' )`.

You can also use `cube.undo()` and `cube.redo()` to step through the move history. `cube.shuffle( 5 )` shuffles the cube 5 times. 



Examples
------------------------------------------------------------------------------

__From the desktop__  
Take a look at the [basic example](/index.html). This demonstrates many of the api settings.