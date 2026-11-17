# Configuration

## Application Header Smart Control​

<p>Marionette view that provides application header, a common horizontal element which is placed at the top of a page. It includes page action controls like user profile, search field, favourites etc.​</p>

**Module: smart/controls/app.header/app.header.view**

### Example for using SmartControls Application Header view
```js
define(['smart/controls/app.header/app.header.view'], function (AppHeaderView) {
  'use strict';

  var AppHeaderView = AppHeaderView.extend({
    constructor: function AppHeaderView(options) {
      AppHeaderView.prototype.constructor.call(this, options);
    },

    ...
    ...
    ...
      
  return ApplicationHeaderView;

});
```

### Config parameter to be sent by the leading application
```js
csui.require.config({
  config: {
    "smart/controls/app.header/app.header.controls": {
      extensions: {
        smart: [
          "smart/controls/app.header/app.header.controls/smart.temp.app.header.controls",
        ],
      },
    },
  },
});
```


### Example ways to enable the views of application header controls
#### For logo view
```js
define([], function () {
  return [
    {
      id: "smart/controls/app.header/test/smart.test.app.header.controls/logo/smart.test.logo.view",
      type: "logo",
    },
  ]
});
```
#### For search box view
```js
define([], function () {
  return [
    {
      id: "smart/controls/app.header/test/smart.test.app.header.controls/search.box/smart.test.search.box.view",
      sequence: 200,
      type: "search",
    },
  ];
});
```
#### For user profile view
```js
define([], function () {
  return [
    {
      id: "smart/controls/app.header/test/smart.test.app.header.controls/user.profile/smart.test.user.profile.view",
      sequence: 9999,
      type: "menu",
    },
  ];
});
```

#### User needs to give aside (boolean) option for rendering a user defined dropdown for an application header item view
```js
define([], function () {
  return [
    {
      id: "smart/controls/app.header/test/smart.test.app.header.controls/favorites/smart.test.favorites.view",
      sequence: 300,
      type: "default",
      aside: true
    },
  ];
});
```

## Options

<ul>
  <li><b>logo - `required` (String)</b> Application logo to be used in the header.</li>
  <li><b>primaryText - `...` (String)</b> Primary text to show the brand name.</li>
  <li><b>secondaryText - `...` (String)</b> Subtitle to be used beside primary text.</li>
  <li><b>versionText - `...` (String)</b> Text to show the version of the application.</li>
  <li><b>icon - `required` (String)</b> Action icon to be shown in the header for non-JATO theme. This should provide along with otcData.</li>
  <li><b>jatoIcon - `required` (String)</b> JATO Action icon to be shown in the header for JATO theme.  This should provide along with otcData.</li>
  <li><b>transparent - `required` (Boolean)</b> Default true. When this option is set to true, background of the application header will be transparent.</li>
</ul>

## Public Methods

<ul>
    <li><b>function():</b> Returns....</li>
</ul>

## Events

<ul>
    <li>On clicking any header item/user profile menu item, <b>an event will be triggered and the respective action/view will be executed</b></li>
</ul>