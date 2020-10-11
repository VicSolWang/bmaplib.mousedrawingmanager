/**
 * Created by VicSolWang.
 * Date: 2020-10-09 17:24
 * Email: vic.sol.wang@gmail.com
 */

/**
 * 方法名称：isPolygon
 * 功能描述：判断是否是多边形
 * 判断依据：多边形的每条线段最多和两条线段相交
 * 参数描述：
 * pointsList：多边形各个点的顺序数组
 * 返回值：
 * true：是多边形
 * false：不是多边形
 */
const isPolygon = function (pointsList) {
	const len = pointsList.length;
	let _isPolygon = true;
	let otherLineList = [];
	let currentLine = null;
	let item = null;
	let overlapLineCount = 0;
	let nextItem = null;
	if (len < 3) {
		return false;
	}
	for (let i = 0; i < len; i += 1) {
		item = pointsList[i];
		if (i === len - 1) {
			const [firstItem] = pointsList;
			nextItem = firstItem;
		} else {
			nextItem = pointsList[i + 1];
		}
		currentLine = {
			S: {
				x: item.lng,
				y: item.lat,
			},
			E: {
				x: nextItem.lng,
				y: nextItem.lat,
			},
		};
		otherLineList = getPolygonLine(pointsList, currentLine);
		overlapLineCount = getOverlapCount(currentLine, otherLineList);
		if (overlapLineCount.length > 2) {
			_isPolygon = false;
			break;
		}
	}
	return _isPolygon;
};

/**
 * 方法名称：getPolygonLine
 * 功能描述：获取多边形除指定线段的其他线段
 * 参数描述：
 * pointsList：多边形各个点的顺序数组
 * exceptLine：指定排除的线段
 * 返回值：多边形线段数组
 */
var getPolygonLine = function (pointsList, exceptLine) {
	const len = pointsList.length;
	let line = null;
	let item = null;
	const lineList = [];
	let nextItem = null;
	for (let i = 0; i < len; i += 1) {
		item = pointsList[i];
		if (i === len - 1) {
			const [firstItem] = pointsList;
			nextItem = firstItem;
		} else {
			nextItem = pointsList[i + 1];
		}
		if (
			parseFloat(item.lng) === parseFloat(exceptLine.S.x)
			&& parseFloat(item.lat) === parseFloat(exceptLine.S.y)
		) {
			continue;
		}
		line = {
			S: {
				x: item.lng,
				y: item.lat,
			},
			E: {
				x: nextItem.lng,
				y: nextItem.lat,
			},
		};
		lineList.push(line);
	}
	return lineList;
};

/**
 * 方法名称：getOverlapCount
 * 功能描述：获取指定线段与线段数组里面相交的线段（不包括斜率一致的）
 * 参数描述：
 * line：指定线段
 * lineList：线段数组
 * 返回值：返回相交的线段
 */
var getOverlapCount = function (line, lineList) {
	const len = lineList.length;
	let item = null;
	const overlapLine = [];
	for (let i = 0; i < len; i += 1) {
		item = lineList[i];
		if (isOverlapping(line, item) && isEqualK(line, item) === false) {
			overlapLine.push(item);
		}
	}
	return overlapLine;
};

/**
 * 方法名称：isEqualK
 * 功能描述：判断斜率是否一致
 * 参数描述：
 * lineA：线段A
 * lineB：线段B
 * 返回值：
 * true：一致
 * false：不一致
 */
var isEqualK = function (lineA, lineB) {
	const lineAK = getLineK(lineA.S.x, lineA.S.y, lineA.E.x, lineA.E.y);
	const lineBK = getLineK(lineB.S.x, lineB.S.y, lineB.E.x, lineB.E.y);
	const sub = lineAK - lineBK;
	return lineAK === lineBK || (sub < 2e-10 && sub > -2e-10); // 相等则直接返回true，不等先判断是否接近0
};

/**
 * 方法名称：isOverlapping
 * 功能描述：判断两个线段是否相交
 * 参数描述：
 * lineA：线段A
 * lineB：线段B
 * 返回值：
 * true：交叉
 * false：不交叉
 * 判断依据：1：判断两条线段的端点是否存在在彼此之上的情况，2：判断两个线段的两个端点是否都在彼此的两边
 */
var isOverlapping = function (lineA, lineB) {
	const lineAStartPointInLineB = isPointInLine(lineA.S, lineB.S, lineB.E);
	const lineAEndPointInLineB = isPointInLine(lineA.E, lineB.S, lineB.E);
	const lineBStartPointInLineA = isPointInLine(lineB.S, lineA.S, lineA.E);
	const lineBEndPointInLineA = isPointInLine(lineB.E, lineA.S, lineA.E);
	// 只要有一点在另外一条线上我们就认为相交，也就是两条直线相交
	if (
		lineAStartPointInLineB === 0
		|| lineAEndPointInLineB === 0
		|| lineBStartPointInLineA === 0
		|| lineBEndPointInLineA === 0
	) {
		return true;
	}
	// 如果上面条件不满足，点都不在对应的线段上，但是有一个点在另外一条线的延长线上，说明一定不会相交
	if (
		lineAStartPointInLineB === -2
		|| lineAEndPointInLineB === -2
		|| lineBStartPointInLineA === -2
		|| lineBEndPointInLineA === -2
	) {
		return false;
	}
	// 因为在上面是1，在下面是-1，两个相乘如果小于0则一定在两边，如果两条线段的两个端点分别在对应线段的两端，说明相交
	if (
		lineAStartPointInLineB * lineAEndPointInLineB < 1
		&& lineBStartPointInLineA * lineBEndPointInLineA < 1
	) {
		return true;
	}
	return false; // 默认不相交
};

/*
 * 方法名称：isPointInLine
 * 功能描述：判断点point是否在以linePS为起点，linePE为终点的线段上
 * 参数描述：
 * point：点
 * linePS：线段起点
 * linePE：线段终点
 * 返回值：
 * 0：在线段上
 * 1：不在线段上，而是在线段的上方
 * -1：不在线段上，而是在线段的下方
 * -2：不在线段上，而是在线段所在的直线上
 */
var isPointInLine = function (point, linePS, linePE) {
	// 设点为Q，线段为P1P2
	// (Q - P1) * (P2 - P1) = 0 保证了Q在P1P2上或P1P2的延长线上或P1P2的反向延长线上
	// 注：矢量A = (x1, y1)，矢量B = (x2, y2)，A * B = (x1 * y2) - (x2 * y1)
	// 最终矢量叉乘公式为(Q.x - P1.x) * (P2.y - P1.y) - (P2.x - P1.x) * (Q.y - P1.y)
	const crossProduct =		(point.x - linePS.x) * (linePE.y - linePS.y)
		- (linePE.x - linePS.x) * (point.y - linePS.y);
	// 实质判断是否接近0，接近0则在线上或延长线上或反向延长线上，则判断该点是否在该线段的外包矩形内
	if (crossProduct < 2e-10 && crossProduct > -2e-10) {
		if (
			point.x >= Math.min(linePS.x, linePE.x)
			&& point.x <= Math.max(linePS.x, linePE.x)
			&& point.y >= Math.min(linePS.y, linePE.y)
			&& point.y <= Math.max(linePS.y, linePE.y)
		) {
			return 0;
		}
		return -2;
	}
	// 不在线上或延长线上或反向延长线上，先计算线段斜率
	const K = getLineK(linePS.x, linePS.y, linePE.x, linePE.y);
	// 斜率为无限大，则线段垂直于x轴，则只需比较该点横坐标与线段任意端点横坐标大小
	if (K === Infinity && linePS.x === linePE.x) {
		if (point.x < linePS.x) {
			return 1;
		}
		return -1;
	}
	// 斜率不为无限大，则通过该点横坐标计算其在线段上对应纵坐标，与该点纵坐标进行大小比较
	const B = getLineB(linePS.x, linePS.y, K);
	const linePointY = K * point.x + B;
	if (linePointY > point.y) {
		return -1;
	}
	return 1;
};

/**
 * 方法名称：getLineK
 * 功能描述：获取线段的斜率
 * 参数描述：
 * x1：X坐标1
 * y1：Y坐标1
 * x2：X坐标2
 * y2：Y坐标2
 * 返回值：斜率
 */
var getLineK = function (x1, y1, x2, y2) {
	return (y1 - y2) / (x1 - x2);
};

/**
 * 方法名称：getLineB
 * 功能描述：获取线段的y轴截距
 * 参数描述：
 * x1：X坐标1
 * y1：Y坐标1
 * k：斜率
 * 返回值：线段的y轴截距
 */
var getLineB = function (x1, y1, k) {
	return y1 - k * x1;
};

export default isPolygon;
