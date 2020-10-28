/**
 * Created by VicSolWang.
 * Date: 2020-07-17 0:42
 * Email: vic.sol.wang@gmail.com
 */

const fs = require('fs-extra');
const test = require('ava');
const MouseDrawingManager = require('./dist/index.js');

const pathExists = (path) => fs.pathExistsSync(path);

const isFunction = (func) => typeof func === 'function';

test.serial('Execute build command to validate the result is correct.', (t) => {
	t.true(pathExists('src'));
	t.true(pathExists('src/index.js'));
	t.true(pathExists('src/style.css'));
	t.true(pathExists('test/dist'));
	t.true(pathExists('test/dist/index.js'));
	t.true(pathExists('test/dist/style.css'));
});

test.serial('Execute the content of the output file is correct.', (t) => {
	const funcPrototype = MouseDrawingManager.prototype;
	t.is(funcPrototype._className, 'DrawingManager');
	t.true(isFunction(funcPrototype._initialize));
});
