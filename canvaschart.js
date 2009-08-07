LineChart = function(canvas, interpolation) {
    this.canvas = canvas;
    this.interpolation = interpolation;
    this.data = new Array;
    this.animationFrameInterval = 20;
};

LineChart.prototype = {
    /* Performs cubic interpolation between y1 and y2, mu is how far between
       y1 and y2 we are. */
    cubicInterp: function(y0, y1, y2, y3, mu) {
        var mu2 = mu * mu;
        var a0 = y3 - y2 - y0 + y1;
        var a1 = y0 - y1 - a0;
        var a2 = y2 - y0;
        var a3 = y1;
        return (a0 * mu * mu2 + a1 * mu2 + a2 * mu + a3);
    },

    draw: function() {
        var width = this.canvas.width;
        var height = this.canvas.height;
        var data = this.data;
        var numPoints = data.length;
        var step = width / (data.length - 1);
        var ctx = this.canvas.getContext('2d');

        ctx.save();
        var backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
        backgroundGradient.addColorStop(0, '#ddf0ff');
        backgroundGradient.addColorStop(1, '#AECEE7');
        ctx.fillStyle = backgroundGradient;
        ctx.clearRect(0, 0, width, height);
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        if (this.interpolation == 'cubic') {
            // Draw cubic line
            ctx.beginPath();
            for (var x = 0; x < width; x++) {
                var i = Math.floor(x / step);
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

        // Draw points
        var x = 0;
        for (var i = 0; i < numPoints; i++) {
            ctx.beginPath();
            var y = height - (height * data[i]);
            ctx.arc(x, y, 3, 0, Math.PI * 2, true);
            ctx.fill();
            x += step;
        }
    },

    setData: function(data) {
        this.data = data;
        this.draw();
    },

    animate: function(startData, endData, time) {
        this.animationStartData = startData;
        this.animationEndData = endData;
        var numFrames = Math.floor(time / this.animationFrameInterval);
        this.animationNumFrames = numFrames;
        this.animationFrame = 0;
        var _self = this;
        this.animationIntervalId = setInterval(function() {
            _self._animationStep();
        }, this.animationFrameInterval);
    },

    _animationStep: function() {
        var newData = new Array;
        for (var i = 0; i < this.animationStartData.length; i++) {
            var diff = this.animationEndData[i] - this.animationStartData[i];
            var progress = this.animationFrame / this.animationNumFrames;
            newData[i] = this.animationStartData[i] + diff * progress;
            newData[i] = (diff * (Math.pow(progress - 1, 3) + 1) + 
                          this.animationStartData[i]);
        }
        this.data = newData;
        this.draw('cubic');
        this.animationFrame++;
        if (this.animationFrame >= this.animationNumFrames) {
            clearInterval(this.animationIntervalId);
        }
    },
};
