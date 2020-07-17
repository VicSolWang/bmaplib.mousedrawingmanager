/**
 * Created by VicSolWang.
 * Date: 2020-07-17 0:42
 * Email: vic.sol.wang@gmail.com
 */

const fs = require('fs-extra');
const shell = require('shelljs');
const test = require('ava');

test.serial(
	'Execute build command to validate the result is correct.',
	async (t) => {
		await shell.exec('npm run build');
		t.true(fs.pathExistsSync('dist'));
		t.true(fs.pathExistsSync('dist/index.js'));
		t.true(fs.pathExistsSync('dist/style.css'));
	},
);
