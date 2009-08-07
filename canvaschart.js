/*
 * CanvasChart
 *
 * Copyright (c) 2009 Harry Marr
 *
 * Released under the MIT license
 */

LineChart = function(canvas, options) {
    this.canvas = canvas;
    this.interpolation = options.interpolation || 'linear';
    this.background = options.background || '#fff';
    this.lineColor = options.lineColor || '#000';
    this.lineWidth = options.lineWidth || 2;
    this.pointColor = options.pointColor || '#000';
    this.pointRadius = options.pointRadius === undefined ? 3 :
                       options.pointRadius;
    this.pointStrokeWidth = options.pointStrokeWidth === undefined ? 2 :
                            options.pointStrokeWidth;
    this.pointFill = options.pointFill || null;
    this.data = new Array;
    this.animationFrameInterval = 20;
};

LineChart.prototype = {
    // Performs cubic interpolation between y1 and y2, mu is how far 
    // between y1 and y2 we are.
    cubicInterp: function(y0, y1, y2, y3, mu) {
        var mu2 = mu * mu;
        var a0 = y3 - y2 - y0 + y1;
        var a1 = y0 - y1 - a0;
        var a2 = y2 - y0;
        var a3 = y1;
        return (a0 * mu * mu2 + a1 * mu2 + a2 * mu + a3);
    },

    // Redraws the chart to the canvas
    draw: function() {
        var width = this.canvas.width;
        var height = this.canvas.height;
        var data = this.data;
        var numPoints = data.length;
        // Calculate the number of pixels between points
        var step = width / (data.length - 1);
        var ctx = this.canvas.getContext('2d');

        // Set up the canvas
        ctx.save();
        var background = this.background;
        // If background is of form '<color1>:<color2>', then the two colors
        // are used as the start and end points of a vertical linear gradient
        var sep = background.indexOf(':');
        if (sep != -1) {
            backgroundColors = background.split(':');
            background = ctx.createLinearGradient(0, 0, 0, height);
            background.addColorStop(0, backgroundColors[0]);
            background.addColorStop(1, backgroundColors[1]);
        }
        ctx.fillStyle = background;
        ctx.clearRect(0, 0, width, height);
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = this.lineColor;
        ctx.lineWidth = this.lineWidth;
        if (this.interpolation == 'cubic') {
            // Draw cubic line
            ctx.beginPath();
            for (var x = 0; x < width; x++) {
                var i = Math.floor(x / step);
                // Distance between the current point and the next point
                var mu = (x - (i * step)) / step;
                var y0 = data[Math.abs(i - 1) % data.length];
                var y1 = data[i];
                var y2 = data[(i + 1) % data.length];
                var y3 = data[(i + 2) % data.length];
                var y = this.cubicInterp(y0, y1, y2, y3, mu);
                ctx.lineTo(x, height - (height * y));
            }
            ctx.stroke();
        } else {
            var x = 0;
            ctx.beginPath();
            ctx.moveTo(x, height - (height * data[0]));
            for (var i = 0; i < numPoints; i++) {
                ctx.lineTo(x, height - (height * data[i]));
                x += step;
            }
            ctx.stroke();
        }
        ctx.restore();

        // Draw points
        ctx.save();
        ctx.strokeStyle = this.pointColor;
        ctx.lineWidth = this.pointStrokeWidth;
        if (this.pointFill) {
            ctx.fillStyle = this.pointFill;
        }
        var x = 0;
        for (var i = 0; i < numPoints; i++) {
            ctx.beginPath();
            var y = height - (height * data[i]);
            ctx.arc(x, y, this.pointRadius, 0, Math.PI * 2, true);
            if (this.pointFill) {
                ctx.fill();
            }
            if (this.pointStrokeWidth > 0) {
                ctx.stroke();
            }
            x += step;
        }
        ctx.restore();
    },

    // Updates the data the graph uses, optionally, an animation may be
    // specified. tweenFunc may be linear, quadratic, or cubic (defaults to 
    // linear). If an animation is used, the new data must have the same 
    // number of values as the current data.
    setData: function(data, animationTime, tweenFunc) {
        if (animationTime) {
            this._morphAnimateTo(data, animationTime, tweenFunc);
        } else {
            this.data = data;
            this.draw();
        }
    },

    // Internal method used to kick off the data animation
    _morphAnimateTo: function(newData, time, tweenFunc) {
        this.animation = {
            startData: this.data,
            endData: newData,
            time: time,
            numFrames: Math.floor(time / this.animationFrameInterval),
            tweenFunc: tweenFunc || 'cubic',
            frame: 0,
        };
        var _self = this;
        this.animation.intervalId = setInterval(function() {
            _self._morphAnimationStep();
        }, this.animationFrameInterval);
    },

    // Internal method called at an interval to update an animation
    _morphAnimationStep: function() {
        var newData = new Array;
        var animation = this.animation;
        var startData = animation.startData;
        var endData = animation.endData;
        var progress = animation.frame / animation.numFrames;
        var tweenFunc = animation.tweenFunc;
        for (var i = 0; i < startData.length; i++) {
            var diff = endData[i] - startData[i];
            if (tweenFunc == 'quadratic') {
                newData[i] = -diff * progress * (progress - 2) + startData[i];
            } else if (tweenFunc == 'cubic') {
                newData[i] = (diff * (Math.pow(progress - 1, 3) + 1) + 
                              startData[i]);
            } else {
                newData[i] = startData[i] + diff * progress;
            }
        }
        this.data = newData;
        this.draw();
        this.animation.frame++;
        if (this.animation.frame >= animation.numFrames) {
            clearInterval(animation.intervalId);
        }
    },
};
