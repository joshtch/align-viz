var numNodes = Math.floor(5 * Math.log(dimension));
var nodeRadius = scale(0.009);
var svg = d3.select("body")
	.append("svg")
		.attr("width", dimension)
		.attr("height", dimension);

svg.append("rect")
		.attr("id", "background")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", scale(1))
		.attr("height", scale(1))
		.attr("fill", "none")
		.attr("stroke", "black")
		.attr("stroke-width", "1px");

svg.append("rect")
		.attr("x", scale(0.00, nodeRadius * 2))
		.attr("y", scale(0.50) - nodeRadius * 3)
		.attr("width", dimension - nodeRadius * 4)
		.attr("height", nodeRadius * 6)
		.attr("fill", "white")
		.attr("stroke", "none")
		.attr("stroke-width", "1px")
		.attr("rx", nodeRadius * 3)
		.attr("ry", nodeRadius * 3);

var nodes = [];
initializeNodes(nodes);

svg.append("g")
		.attr("class", "node")
	.selectAll("circle")
		.data(nodes)
	.enter()
	.append("circle")
		.attr("r", nodeRadius);

var aligning = false;

var simulation = d3.forceSimulation(nodes)
		.velocityDecay(0)
		.alphaDecay(0.05)
		.force("collide", d3.forceCollide().radius(nodeRadius).strength(1).iterations(1))
		.force("bound", forceBoundaryBox)
		.force("disperse", disperse())
		.on("tick", ticked)
		.on("end", ended);

function ended() {
	if (!aligning) {
		startAlign.apply(this);
	} else {
		startDisperse.apply(this);
	}
	aligning = !aligning;
	this.alpha(1)
		.restart();
}

function startAlign() {
	var target, alphaTransitionPoint;
	this.alphaDecay(0.02)
		.force("align", forceAlign(scale(0.015)))
		.force("disperse", nullforce)
		.force("rectangle",
			function(alpha) {
				target = alphaTargetVal(this);
				alphaTransitionPercentage = (1 - target) / 3;
				fadeToBlack(alpha, alphaTransitionPercentage);
			});
}

function alphaTargetVal(sim) {
	return ((typeof sim.alphaTarget === 'undefined') ? 0 : sim.alphaTarget());
}

function fadeToBlack(alpha, transitionPoint) {
	if (alpha <= transitionPoint) {
		newColor = (Math.floor(0x99 * (1 - (transitionPoint - alpha) / transitionPoint))).toString(16);
		parseInt(newColor,16) < 16
			? newColor = "0" + newColor
			: newColor;
		newColor = "#" + newColor + newColor + newColor;
		svg.select("rect#background").attr("fill", newColor);
	} else {
		svg.select("rect#background").attr("fill", "white");
	}
}

function startDisperse() {
	this.alphaDecay(0.05)
		.force("disperse", disperse(scale(0.02)))
		.force("align", nullforce)
		.force("rectangle", nullforce);
	svg.select("rect#background").attr("fill", "none");
}

function forceAlign(strength) {
	return function (_) {
		var i, n = nodes.length, node, x_destination, x_difference, y_difference;
		for (i = 0; i < n; i++) {
			node = nodes[i];
			destination = { x : scale(node.index / (nodes.length - 1), nodeRadius*5),
				y : scale(0.50)  };

			x_difference = destination.x - node.x;
			node.vx = x_difference / dimension * Math.floor(Math.log(dimension)) * strength;

			y_difference = destination.y - node.y;
			node.vy = y_difference / dimension * Math.floor(Math.log(dimension)) * strength;
		}
	};
}

function disperse() {
	var v, i, node, n = nodes.length;
	var strength = scale(0.02);
	for (i = 0; i < n; i++) {
		node = nodes[i];
		v = randDirection();
		node.vx = v.x * strength;
		node.vy = v.y * strength;
	}
}

function forceBoundaryBox(alpha) {
	var i, n = nodes.length, node, flip_vx, flip_vy;
	for (i = 0; i < n; i++) {
		node = nodes[i];
		flip_vx = (node.x <= nodeRadius && node.vx < 0)
			|| (node.x >= dimension - nodeRadius && node.vx > 0)
		if (flip_vx) {
			node.vx = -1 * node.vx;
		}

		flip_vy = (node.y <= nodeRadius && node.vy < 0)
			|| (node.y >= dimension - nodeRadius && node.vy > 0)
		if (flip_vy) {
			node.vy = -1 * node.vy;
		}
	}
}
function scale(n, margin) {
	if (typeof margin === "undefined") margin = 0;
	return n * (dimension - 2 * margin) + margin;
}

function randDirection() {
	var directionInRadians = 2 * Math.PI * Math.random();
	var speed = 1/(Math.random()+0.6);
	var x_coord = speed * Math.cos(directionInRadians);
	var y_coord = speed * Math.sin(directionInRadians);
	return {  x: x_coord, y: y_coord };
}

function initializeNodes(nodes) {
	for (var i = 0; numNodes > i; i++) {
		var d = randDirection();
		nodes.push({ index : i,
			x     : scale(Math.random(), nodeRadius),
			y     : scale(Math.random(), nodeRadius) });
	}
}

function ticked() {
	svg.selectAll("circle")
		.attr("cx", function(d) { return d.x })
		.attr("cy", function(d) { return d.y });
}

function nullforce() {};


