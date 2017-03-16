---
title: 用Canvas写的一个小动画
category: 
    - share
layout: post
---

今日无大事，用canvas做了个动画，回顾一下以前的技能。

Demo地址: [http://davidaq.com/static/2017-03-16-canvas-animation](http://davidaq.com/static/2017-03-16-canvas-animation)

全部代码：
```
<!DOCTYPE html>
<html>
  <head>
    <title>Artificial Animation</title>
    <style>
      html, body { height: 100%; padding: 0; margin: 0; }
    </style>
  </head>
  <body>
    <canvas style="width: 100%; height: 100%" id="animation_canvas"></canvas>
    <script type="text/javascript">
      window.artificialAnimation = (function () {
        /**
         * Called before the first frame renders
         * Setup initial states
         */
        function createRenderContext(canvasElement) {
          var renderContext = {
            canvas: canvasElement,
            drawContext: canvasElement.getContext('2d'),
            bgDots: [],
            triangleLine: [],
            triangleLineWave: 0,
          };
          for (var i = 0; i < 35; i++) {
            renderContext.bgDots.push({
              y: Math.random() * 0.5,
              x: Math.random(),
              speed: Math.random() * 0.0001 + 0.0001,
              size: Math.random(),
            });
          }
          for (var i = 0; i <= 17; i++) {
            var x = i / 17;
            renderContext.triangleLine.push({
              x: x,
              y: 0.52,
              dots: [],
              rotate: x * 2 * Math.PI,
              size: 0.02,
            });
          }
          return renderContext;
        }

        /**
         * Called before each frame is actually rendered
         * Update states according to elapsed time
         */
        function updateStates(renderContext, timeSinceLastFrame) {
          renderContext.bgDots.forEach(function (dot) {
            dot.y -= timeSinceLastFrame * dot.speed;
            dot.x += (dot.x - 0.5) * dot.speed * 10;
            if (dot.y < 0.1) {
              dot.y = 0.5;
              dot.x = Math.random();
              dot.speed = Math.random() * 0.0001 + 0.0001;
              dot.size = Math.random();
            }
          });
          var prevTriangle;
          renderContext.triangleLineWave += 0.003;
          if (renderContext.triangleLineWave > 4) {
            renderContext.triangleLineWave = 0;
          }
          var triangleLineWave = Math.abs(renderContext.triangleLineWave - 2) - 0.5;
          renderContext.triangleLine.forEach(function (triangle) {
            triangle.rotate += 0.05;
            // Math.random() * 0.05 + 0.01;
            // if (prevTriangle) {
            //   if (triangle.rotate - prevTriangle.rotate > 0.03) {
            //     triangle.rotate = prevTriangle.rotate + 0.03;
            //   }
            // }
            prevTriangle = triangle;
            var triangeSize = triangle.size / (Math.abs(triangleLineWave - triangle.x) + 0.3);
            triangle.extSize = triangeSize;
            triangle.dots[0] = {
              x: 0,
              y: Math.cos(triangle.rotate) * triangeSize,
              z: -Math.sin(triangle.rotate) * triangeSize,
            };
            triangle.dots[1] = {
              x: 0,
              y: Math.cos(triangle.rotate + Math.PI * 2 / 3) * triangeSize,
              z: -Math.sin(triangle.rotate + Math.PI * 2 / 3) * triangeSize,
            };
            triangle.dots[2] = {
              x: 0,
              y: Math.cos(triangle.rotate + Math.PI * 4 / 3) * triangeSize,
              z: -Math.sin(triangle.rotate + Math.PI * 4 / 3) * triangeSize,
            };
            triangle.dots.forEach(function (dot) {
              dot.zoom = 1 - dot.z;
              dot.x = (dot.x + triangle.x - 0.5) * dot.zoom + 0.5;
              dot.y = (dot.y + triangle.y - 0.5) * dot.zoom + 0.5;
            });
          });
        }

        /**
         * Called when a frame should be drawn visually
         * Draw the scene state using canvas api
         */
        function drawFrame(renderContext, width, height) {
          var ctx = renderContext.drawContext;
          function X(v) {
            return v * width;
          }
          function Y(v) {
            return v * width + (height - width) / 2;
          }
          ctx.fillStyle = '#080518';
          ctx.fillRect(0, 0, width, height);
          renderContext.bgDots.forEach(function (dot) {
            var alpha = (dot.y - 0.3) / 0.3;
            var radgrad = ctx.createRadialGradient(X(dot.x), Y(dot.y), 0, X(dot.x), Y(dot.y), X(0.01));
            radgrad.addColorStop(0, 'rgba(80, 80, 250, ' + alpha * 2 + ')');
            radgrad.addColorStop(0.3 * dot.size + 0.1, 'rgba(80, 80, 250, ' + alpha * 0.2 + ')');
            radgrad.addColorStop(0.6, 'rgba(80, 80, 250, ' + alpha * 0.1 + ')');
            radgrad.addColorStop(1, 'rgba(80, 80, 250, 0)');
            ctx.fillStyle = radgrad;
            ctx.beginPath();
            ctx.arc(X(dot.x), Y(dot.y), X(0.01), 0, 2 * Math.PI);
            ctx.fill();
          });
          var prevTriangle;
          renderContext.triangleLine.forEach(function (triangle) {
            triangle.dots.forEach(function (dot, i) {
              var alpha = Math.pow(triangle.extSize / 0.1, 3);
              if (alpha > 0.1) {
                var radgrad = ctx.createRadialGradient(X(dot.x), Y(dot.y), 0, X(dot.x), Y(dot.y), X(0.005 * dot.zoom));
                radgrad.addColorStop(0, 'rgba(180, 180, 255, ' + alpha + ')');
                radgrad.addColorStop(0.7, 'rgba(180, 180, 255, ' + alpha * 0.7 + ')');
                radgrad.addColorStop(1, 'rgba(120, 120, 250, 0)');
                ctx.fillStyle = radgrad;
                ctx.beginPath();
                ctx.arc(X(dot.x), Y(dot.y), X(0.01), 0, 2 * Math.PI);
                ctx.fill();
              }

              var nextDot = triangle.dots[(i + 1) % 3];
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#55F';
              ctx.strokeStyle = 'rgba(180, 180, 255, ' + Math.pow(triangle.extSize / 0.1, 3) + ')';
              ctx.beginPath();
              ctx.moveTo(X(dot.x), Y(dot.y));
              ctx.lineTo(X(nextDot.x), Y(nextDot.y));
              ctx.stroke();
              if (prevTriangle) {
                // ctx.shadowBlur = 10;
                // ctx.shadowColor = '#55F';
                // ctx.strokeStyle = '#99F';
                ctx.strokeStyle = 'rgba(180, 180, 255, ' + Math.pow(triangle.extSize / 0.02, 2) + ')';
                var nextDot = prevTriangle.dots[i];
                ctx.beginPath();
                ctx.moveTo(X(dot.x), Y(dot.y));
                ctx.lineTo(X(nextDot.x), Y(nextDot.y));
                ctx.stroke();
              }
            });
            prevTriangle = triangle;
          });
        }

        /**
         * Entry function starting the animation by passing in a canvas DOM element
         */
        function beginAnimation(canvasElement) {
          var nextFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function(cb) {
            setTimeout(cb, 30);
          };
          var width = 0;
          var height = 0;
          var renderContext = createRenderContext(canvasElement);
          var prevTime = Date.now();
          function requestRender() {
            if (!canvasElement.parentElement) {
              return;
            }
            var rc = canvasElement.getBoundingClientRect();
            if (rc.width != width || rc.height != height) {
              width = canvasElement.width = rc.width;
              height = canvasElement.height = rc.height;
            }
            drawFrame(renderContext, width, height);
            nextFrame(function() {
              var nowTime = Date.now();
              var timeSinceLastFrame = nowTime - prevTime;
              prevTime = nowTime;
              updateStates(renderContext, timeSinceLastFrame);
              requestRender();
            });
          }
          requestRender();
        }

        return beginAnimation;
      })();
      window.artificialAnimation(document.getElementById('animation_canvas'));
    </script>
  </body>
</html>
```
