---
title: 用Canvas写的一个小动画
category: 
    - share
layout: post
---

今日无大事，用canvas做了个动画，回顾一下以前的技能。

<div style="width: 100%; height: 0; padding-bottom: 35%; position: relative">
  <iframe style="position: absolute; top:0; left: 0; width: 100%; height: 100%" src="http://davidaq.com/static/2017-03-16-canvas-animation" frameborder="0"></iframe>
</div>

全部代码：

```
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Animation: Spiral Triangle</title>
    <style>
      html, body { height: 100%; padding: 0; margin: 0; background: #080518; overflow: hidden; }
      canvas { width: 100%; height: 100%; }
      @media (min-width: 600px) {
        canvas { width: 50%; height: 50%; position: absolute; top: 25%; left: 25%; }
      }
    </style>
  </head>
  <body>
    <canvas id="animation_canvas"></canvas>
    <script type="text/javascript">
      window.artificialAnimation = (function () {
        "use strict";
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
            triangleLineRotate: 0,
          };
          for (var i = 0; i < 15; i++) {
            renderContext.bgDots.push({
              y: Math.random() * 0.5,
              x: Math.random(),
              speed: Math.random() * 0.0001 + 0.0001,
              size: Math.random(),
            });
          }
          var triangleCount = 15;
          for (var i = 0; i <= triangleCount; i++) {
            var x = i / triangleCount * 1.08 - 0.04;
            renderContext.triangleLine.push({
              x: x,
              y: 0.5,
              dots: [{}, {}, {}],
              rotate: x * 2 * Math.PI,
              size: 0.06,
            });
          }
          return renderContext;
        }

        /**
         * Called before each frame is actually rendered
         * Update states according to elapsed time
         */
        function updateStates(renderContext, timeSinceLastFrame) {
          var dots = renderContext.bgDots;
          for (var i = dots.length - 1; i >= 0; i--) {
            var dot = dots[i];
            dot.y -= timeSinceLastFrame * dot.speed;
            dot.x += (dot.x - 0.5) * dot.speed * 30;
            if (dot.y < 0.1 || dot.x < -0.01 || dot.x > 1.01 || (dot.y < 0.4 && dot.alpha < 0.1)) {
              dot.y = 0.5;
              dot.x = Math.random();
              dot.speed = Math.random() * 0.0001 + 0.0001;
              dot.size = Math.random();
            }
            dot.alpha = dot.y < 0.4 ? (dot.y - 0.3) / 0.1 : (0.5 - dot.y) / 0.1;
          };
          var prevTriangle;
          renderContext.triangleLineWave += 0.0003 * timeSinceLastFrame;
          if (renderContext.triangleLineWave > 2) {
            renderContext.triangleLineWave = 0;
          }
          var triangleLineWave = (Math.abs(renderContext.triangleLineWave - 2) - 0.75) * 2;
          renderContext.triangleLineRotate += 0.002 * timeSinceLastFrame;
          if (renderContext.triangleLineRotate > 2 * Math.PI) {
            renderContext.triangleLineRotate -= 2 * Math.PI;
          }
          var triangleLine = renderContext.triangleLine;
          var triangleRotate = renderContext.triangleLineRotate;
          var rotateStep = 4 / triangleLine.length;
          for (var j = triangleLine.length - 1; j >= 0; j--) {
            var triangle = triangleLine[j];
            triangle.rotate = triangleRotate;
            prevTriangle = triangle;
            var triangeSize = triangle.size * Math.pow(Math.max(0.5, 1.1 * (1 - Math.abs(triangleLineWave - triangle.x) * 0.5)), 2);
            triangleRotate += rotateStep;
            triangle.extSize = triangeSize;
            for (var i = 0; i < 3; i++) {
              var dot = triangle.dots[i];
              var rotate = triangle.rotate + Math.PI * i * 2 / 3;
              dot.y = Math.cos(rotate) * triangeSize;
              dot.z = -Math.sin(rotate) * triangeSize;
              dot.zoom = 1 - dot.z;
              dot.x = (triangle.x - 0.5) * dot.zoom + 0.5;
              dot.y = (dot.y + triangle.y - 0.5) * dot.zoom + 0.5;
            }
          };
        }

        /**
         * Called when a frame should be drawn visually
         * Draw the scene state using canvas api
         */
        function drawFrame(renderContext, width, height) {
          ctxWidth = width;
          ctxHeightDelta = (height - width) / 2;

          var ctx = renderContext.drawContext;
          ctx.fillStyle = '#080518';
          ctx.fillRect(0, 0, width, height);
          var dots = renderContext.bgDots;
          for (var i = dots.length - 1; i >= 0; i--) {
            var dot = dots[i];
            var alpha = dot.alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#55F';
            ctx.fillStyle = 'rgba(120, 120, 200, ' + alpha + ')';
            ctx.beginPath();
            ctx.arc(X(dot.x), Y(dot.y), X(0.005 * dot.size + 0.005), 0, 2 * Math.PI);
            ctx.fill();
          }
          var prevTriangle;
          var triangleLine = renderContext.triangleLine;
          for (var j = triangleLine.length - 1; j >= 0; j--) {
            var triangle = triangleLine[j];
            for (var i = 0; i < 3; i++) {
              var dot = triangle.dots[i];
              var nextDot = triangle.dots[(i + 1) % 3];
              var alpha = Math.pow(triangle.extSize / 0.09, 3);
              if (alpha > 0.01) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#55F';
                ctx.fillStyle = 'rgba(180, 180, 255, ' + alpha + ')';
                ctx.beginPath();
                ctx.arc(X(dot.x), Y(dot.y), X(0.004), 0, 2 * Math.PI);
                ctx.fill();
              }

              alpha *= (dot.z + nextDot.z + 0.12) / 2 / 0.12 * 0.9 + 0.1;
              if (alpha > 0.01) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#55F';
                ctx.strokeStyle = 'rgba(180, 180, 255, ' + alpha + ')';
                ctx.beginPath();
                ctx.moveTo(X(dot.x), Y(dot.y));
                ctx.lineTo(X(nextDot.x), Y(nextDot.y));
                ctx.stroke();
              }
              if (prevTriangle) {
                var nextDot = prevTriangle.dots[i];
                alpha = Math.pow(triangle.extSize / 0.03, 2);
                alpha *= (dot.z + nextDot.z + 0.12) / 2 / 0.12 * 0.9 + 0.1;
                ctx.strokeStyle = 'rgba(180, 180, 255, ' + alpha + ')';
                ctx.beginPath();
                ctx.moveTo(X(dot.x), Y(dot.y));
                ctx.lineTo(X(nextDot.x), Y(nextDot.y));
                ctx.stroke();
              }
            }
            prevTriangle = triangle;
          }
        }
        var ctxWidth, ctxHeightDelta;

        function X(v) {
          return v * ctxWidth;
        }

        function Y(v) {
          return v * ctxWidth + ctxHeightDelta;
        }

        /**
         * Entry function starting the animation by passing in a canvas DOM element
         */
        function beginAnimation(canvasElement) {
          var nextFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function(cb) {
            setTimeout(cb, 30);
          };
          var renderContext = createRenderContext(canvasElement);
          var prevTime = Date.now();
          var fnum = 0xffffff;
          var width, height;
          function requestRender() {
            if (!canvasElement.parentElement) {
              return;
            }
            var nowTime = Date.now();
            var timeSinceLastFrame = nowTime - prevTime;
            prevTime = nowTime;
            updateStates(renderContext, timeSinceLastFrame);
            if (++fnum > 20) {
              fnum = 0;
              var rc = canvasElement.getBoundingClientRect();
              if (rc.width != width || rc.height != height) {
                width = canvasElement.width = rc.width;
                height = canvasElement.height = rc.height;
              }
            }
            drawFrame(renderContext, width, height);
            nextFrame(requestRender);
          }
          nextFrame(requestRender);
        }

        return beginAnimation;
      })();
      window.artificialAnimation(document.getElementById('animation_canvas'));
    </script>
  </body>
</html>
```
