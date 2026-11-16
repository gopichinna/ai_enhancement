/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
var name = "@smartui/ot-web-components";
var description = "Smart View Base Controls Web Components Library";
var version = "24.4.4";
var homepage = "https://gitlab.otxlab.net/smartui/ot-web-components#opentext-web-components";
var repository = "https://gitlab.otxlab.net/smartui/ot-web-components.git";
var bugs = "https://gitlab.otxlab.net/smartui/ot-web-components/-/issues";
var engines = {
	node: ">=16"
};
var files = [
	"dist",
	"CHANGELOG.md"
];
var sideEffects = [
	"dist/all.js"
];
var main = "dist/all.js";
var module = "dist/src/index.js";
var exports = {
	".": {
		require: "./dist/all.js",
		"import": "./dist/all.js"
	},
	"./fonts.css": {
		require: "./dist/fonts.css",
		"import": "./dist/fonts.css"
	},
	"./elements": {
		"import": "./dist/src/index.js"
	},
	"./manifest": {
		require: "./dist/custom-elements.json",
		"import": "./dist/custom-elements.json"
	}
};
var customElements = "dist/custom-elements.json";
var scripts = {
	preprepare: "npm run prepare:deps && husky && npm run install:storybook && npm run install:e2e && npm run install:vis",
	"install:storybook": "node scripts/if-var --cwd=storybook !CI npm ci",
	"install:e2e": "node scripts/if-var --cwd=cypress !CI npm ci",
	"install:vis": "node scripts/if-var --cwd=screenshots !CI npm ci",
	"prepare:deps": "npm run copy:fonts && npm run bundle:icons",
	"copy:fonts": "mkdir-j -p dist && cp-j src/styles/fonts.css dist && cp-j -r src/styles/fonts dist",
	"bundle:icons": "npm run bundle:header-icons && npm run bundle:action-icons && npm run bundle:action_small-icons && npm run bundle:title-icons && npm run bundle:utility24-icons && npm run bundle:mime-icons && npm run bundle:action_16-icons && npm run bundle:illustrations-icons  && npm run bundle:utility12-icons && npm run bundle:otc-action-icons && npm run bundle:otc-action_small-icons && npm run bundle:otc-action_16-icons && npm run bundle:otc-header-icons && npm run bundle:otc-utility-icons && npm run bundle:otc-illustrations-icons",
	"bundle:header-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/header/*.svg\" -b header -c header -d dist",
	"bundle:action-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/action/*.svg\" -b action -c action -d dist",
	"bundle:action_small-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/action_small/*.svg\" -b action_small -c action_small -d dist",
	"bundle:action_16-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/action_16/*.svg\" -b action_16 -c action_16 -d dist",
	"bundle:title-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/title/*.svg\" -b title -c title -d dist",
	"bundle:utility24-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/utility/*24.svg\" -b utility24 -c utility -d dist",
	"bundle:mime-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/mime/*32.svg\" -b mime -c mime -d dist",
	"bundle:illustrations-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/illustrations/*220.svg\" -b illustrations -c illustrations -d dist",
	"bundle:utility12-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/utility/*12.svg\" -b utility12 -c utility -d dist",
	"bundle:otc-action-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_add32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_caret_up32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_caret_down32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_edit32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_confirm32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_cancel32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_caret_right32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_caret_left32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_date32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_search32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_close_min32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_animated_more32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_more32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_reveal_header32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_form_apply32.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action/action_form_cancel32.svg\" -b otc-action -c action -d lib/otc-icons",
	"bundle:otc-action_small-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/action_small/action_small_add14.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action_small/action_small_delete14.svg\" -b otc-action_small -c action -d lib/otc-icons",
	"bundle:otc-action_16-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/action_16/action_caret_right16.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action_16/action_caret_left16.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/action_16/action_caret_down16.svg\" -b otc-action_16 -c action_16 -d lib/otc-icons",
	"bundle:otc-header-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/header/header_more42.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/header/header_search42.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/header/header_user42.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/header/header_hamburger42.svg\" -b otc-header -c header -d lib/otc-icons",
	"bundle:otc-utility-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/utility/utility_search12.svg\" -s \"node_modules/@opentext/ot-icons/dist/icons/utility/utility_checkmark16.svg\" -b otc-utility -c utility -d lib/otc-icons",
	"bundle:otc-illustrations-icons": "svgbundler -s \"node_modules/@opentext/ot-icons/dist/icons/illustrations/ill_server_error220.svg\" -b otc-illustrations -c illustrations -d lib/otc-icons",
	"build:all": "npm run build:dist && npm run build:storybook",
	"build:dist": "npm run build && npm run build:manifest && npm run build:vscode-intellisense",
	"build:storybook": "cd storybook && npm run build",
	build: "rollup -c --environment NODE_ENV:production",
	"build:manifest": "cem analyze",
	"build:vscode-intellisense": "wca analyze \"src/components/**/otc!(*.test).js\" --outFile dist/html-custom-data.json --format vscode",
	"build:dev": "rollup -c",
	serve: "http-server -a localhost -gbs -c-5",
	watch: "rollup -cw",
	start: "rollup -cw --environment ROLLUP_SERVE:true",
	storybook: "node storybook/scripts/start-storybook -p 8080",
	lint: "eslint --cache --ext .js src",
	"lint:fix": "npm run lint -- --fix",
	prettify: "prettier --check \"**/*.{json, html, css, scss, md, mdx}\"",
	"prettify:fix": "prettier --write \"**/*.{json, html, css, scss, md, mdx}\"",
	test: "npm run build:all && npm run test:unit && npm run test:e2e && npm run test:a11y && npm run test:visualCypress && npm run test:vis",
	"test:unit": "web-test-runner",
	"test:unit:all": "web-test-runner --playwright --browsers chromium firefox webkit",
	"test:unit:one": "web-test-runner --playwright --browsers",
	"open:unit": "web-test-runner --manual",
	"test:dev": "npm run build:dev && web-test-runner",
	"test:watch": "npm run build:dev && web-test-runner --watch",
	"test:coverage": "web-test-runner --coverage",
	"test:e2e": "cd cypress && npm run test:e2e",
	"open:e2e": "npm run build:dev && cd cypress && npm run open:e2e",
	"test:a11y": "cd cypress && npm run test:a11y",
	"open:a11y": "npm run build:dev && cd cypress && npm run open:a11y",
	"test:visualCypress": "cd cypress && npm run test:visualCypress",
	"open:visualCypress": "npm run build:dev && cd cypress && npm run open:visualCypress",
	"update:visualCypress": "cd cypress && npm run update:visualCypress",
	"test:vis": "npm run capture:vis && npm run compare:vis",
	"test:vis:docker": "docker run --rm -it --entrypoint bash -v $(PWD):/app -w /app artifactory.otxlab.net/smartui-docker/otwc-test:23.1.1 -c \"npm run test:vis\"",
	"open:vis": "cd screenshots && npm run open:vis",
	"capture:vis": "cd screenshots && npm run capture:vis",
	"compare:vis": "cd screenshots && npm run compare:vis",
	"update:vis": "cd screenshots && npm run update:vis"
};
var dependencies = {
	"intl-datetimeformat-options": "^1.0.1",
	lit: "^3.1.2",
	luxon: "^3.4.4"
};
var devDependencies = {
	"@custom-elements-manifest/analyzer": "^0.9.4",
	"@open-wc/eslint-config": "^12.0.3",
	"@open-wc/testing": "^4.0.0",
	"@opentext/ot-icons": "^4.6.0",
	"@playwright/browser-chromium": "^1.42.1",
	"@playwright/browser-firefox": "^1.42.1",
	"@playwright/browser-webkit": "^1.42.1",
	"@playwright/test": "^1.42.1",
	"@rollup/plugin-commonjs": "^25.0.7",
	"@rollup/plugin-json": "^6.1.0",
	"@rollup/plugin-node-resolve": "^15.2.3",
	"@smartui/git-hooks": "^4.0.0",
	"@smartui/ot-icons-bundler": "^1.0.11",
	"@unixcompat/cp.js": "^3.0.0",
	"@unixcompat/mkdir.js": "^2.0.0",
	"@web/test-runner": "^0.18.1",
	"@web/test-runner-playwright": "^0.11.0",
	"cross-env": "^7.0.3",
	eslint: "^8.57.0",
	"eslint-plugin-cypress": "^2.15.1",
	"eslint-plugin-lit": "^1.11.0",
	"eslint-plugin-storybook": "^0.8.0",
	"eslint-plugin-wc": "^2.0.4",
	"http-server": "^14.1.1",
	husky: "^9.0.11",
	"lint-staged": "^15.2.2",
	prettier: "^3.2.5",
	rollup: "^3.29.4",
	"rollup-copy-transform-css": "^1.2.5",
	"rollup-plugin-copy": "^3.5.0",
	"rollup-plugin-esbuild-minify": "^1.1.1",
	"rollup-plugin-html-literals": "^1.1.8",
	"rollup-plugin-livereload": "^2.0.5",
	"rollup-plugin-scss-lit": "^1.1.6",
	"rollup-plugin-serve": "2.0.0-beta.0",
	"rollup-plugin-sourcemaps": "^0.6.3",
	"rollup-sourcemap-path-transform": "^1.0.4",
	"web-component-analyzer": "2.0.0",
	"web-optional-dots-reporter": "^1.1.0"
};
var overrides = {
	"rollup-plugin-sourcemaps": {
		"@rollup/pluginutils": "^5"
	},
	"web-optional-dots-reporter@^1.1.0": {
		"@web/test-runner": "^0.18.0"
	},
	"rollup-plugin-scss-lit@^1.1.6": {
		lit: "^3"
	}
};
var keywords = [
	"web-components",
	"custom-elements",
	"smartui",
	"ui"
];
var packageInfo = {
	name: name,
	description: description,
	version: version,
	homepage: homepage,
	repository: repository,
	bugs: bugs,
	engines: engines,
	files: files,
	sideEffects: sideEffects,
	main: main,
	module: module,
	exports: exports,
	customElements: customElements,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	overrides: overrides,
	"lint-staged": {
	"src/**/*.js": [
		"eslint --cache"
	],
	"*.{json,html,css,scss,md,mdx}": [
		"prettier --write"
	]
},
	keywords: keywords
};

export { bugs, customElements, packageInfo as default, dependencies, description, devDependencies, engines, exports, files, homepage, keywords, main, module, name, overrides, repository, scripts, sideEffects, version };
//# sourceMappingURL=package.json.js.map
