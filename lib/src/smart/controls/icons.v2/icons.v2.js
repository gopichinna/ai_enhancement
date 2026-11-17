/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/handlebars", "nuc/utils/log", "smart/controls/icons.v2/impl/core.smart.icons.v2", "csui-ext!smart/controls/icons.v2/icons.v2", "css!smart/controls/icons.v2/impl/icons.v2" ], function(module, _, Handlebars, log, CoreSmartIcons, otherIcons) {
  var initialIcons = {
    missingIcon: '<svg class="csui-icon-v2 csui-icon-v2__icon_missing" version="1.1"' + ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' + ' x="0px" y="0px"\tviewBox="0 0 12 12"' + ' xml:space="preserve"><path fill="#DF3B14"' + ' d="M6,12c-3.3083,0-6-2.6917-6-6s2.6917-6,6-6s6,2.6917,6,6S9.3083,12,6,12z' + " M6,0.9231" + " C3.2006,0.9231,0.9231,3.2006,0.9231,6c0,2.799,2.2775,5.0769,5.0769,5.0769c2.799," + '0,5.0769-2.2779,5.0769-5.0769\tC11.0769,3.2006,8.799,0.9231,6,0.9231z"/>' + '<path fill="#DF3B14"' + ' d="M3.8284,9.0947c-0.2362,0-0.4724-0.0901-0.6526-0.2704c-0.3606-0.3606-0.3606-0.9447,' + "0-1.3053 l4.3431-4.3436c0.3606-0.3606,0.9447-0.3606,1.3053,0s0.3606,0.9447,0," + '1.3053L4.4811,8.8242 C4.3008,9.0045,4.0646,9.0947,3.8284,9.0947z"/>' + "</svg>"
  };
  function IconRegistry() {
    this._icons = {};
    this._colorThemesMap = {};
    var colorThemes = [ "tree", "outline light", "outline dark", "ot navy", "ot indigo", "ot plum", "ot teal", "ot light blue", "ot steal", "ot cloud" ];
    var colorThemesMap = this._colorThemesMap;
    _.each(colorThemes, function(colorThemeName) {
      var cssClassName = colorThemeName.replace(/ /g, "-").replace(/\+/g, "").toLowerCase();
      colorThemesMap[colorThemeName] = cssClassName;
    });
  }
  _.extend(IconRegistry.prototype, {
    _isPlainObject: function(o) {
      return _.isObject(o) && o.constructor === Object;
    },
    getIconByName: function(iconName) {
      var icon = this._icons[iconName];
      if (icon) {
        return icon;
      } else {
        log.warn("Don't have icon with name " + iconName) && console.log(log.last);
        return this._icons["missingIcon"];
      }
    },
    getSmartIconNameByV2IconName: function(v2IconName) {
      function getFullSmartIconKey() {
        return `action:${smartIconKey}`;
      }
      const svgString = this._icons[v2IconName];
      if (!svgString) {
        return undefined;
      }
      if (!window.otIconsRepository) {
        window.otIconsRepository = {};
      }
      if (!window.otIconsRepository.action) {
        window.otIconsRepository.action = {};
      }
      const smartIconKey = `v2_${v2IconName}`;
      if (window.otIconsRepository.action[smartIconKey]) {
        return getFullSmartIconKey();
      }
      const startOfSvg = svgString.substring(0, 4);
      if (startOfSvg.toLowerCase() !== "<svg") {
        return undefined;
      }
      const frag = document.createRange().createContextualFragment(`${svgString}`);
      const svg = frag.querySelector("svg");
      if (!svg) {
        return undefined;
      }
      const isIconV2Svg = svg.classList.contains("csui-icon-v2");
      if (!isIconV2Svg) {
        return undefined;
      }
      svg.removeAttribute("class");
      svg.classList.add("ot-svg");
      svg.classList.add("ot-svg--action");
      const stateCircleEl = svg.querySelector(".csui-icon-v2-state");
      if (!stateCircleEl) {
        return undefined;
      }
      stateCircleEl.classList.remove("csui-icon-v2-state");
      stateCircleEl.classList.add("ot-state");
      const focusCircleEl = svg.querySelector(".csui-icon-v2-focus");
      if (!focusCircleEl) {
        return undefined;
      }
      focusCircleEl.classList.remove("csui-icon-v2-focus");
      focusCircleEl.classList.add("ot-focus");
      const metaphor0El = svg.querySelector(".csui-icon-v2-metaphor0");
      if (!metaphor0El) {
        return undefined;
      }
      metaphor0El.classList.remove("csui-icon-v2-metaphor0");
      metaphor0El.classList.add("ot-metaphor");
      const metaphor1El = svg.querySelector(".csui-icon-v2-metaphor1");
      if (metaphor1El) {
        metaphor0El.classList.remove("csui-icon-v2-metaphor1");
        metaphor0El.classList.add("ot-metaphor");
      }
      const metaphor2El = svg.querySelector(".csui-icon-v2-metaphor2");
      if (metaphor2El) {
        metaphor0El.classList.remove("csui-icon-v2-metaphor2");
        metaphor0El.classList.add("ot-metaphor");
      }
      const smartIconSvg = frag.childNodes[0].outerHTML;
      window.otIconsRepository.action[smartIconKey] = {
        svg: smartIconSvg,
        category: "action"
      };
      return getFullSmartIconKey();
    },
    getClassForSize: function(iconOptions) {
      switch (iconOptions.size) {
       case "xlarge":
        return "csui-icon-v2-size-xlarge";

       case "large":
        return "csui-icon-v2-size-large";

       case "normal":
        return "csui-icon-v2-size-normal";

       case "small":
        return "csui-icon-v2-size-small";

       case "xsmall":
        return "csui-icon-v2-size-xsmall";

       case "contain":
        return "csui-icon-v2-size-contain";

       default:
        return "csui-icon-v2-size-normal";
      }
    },
    getIconByNameWithOptions: function(iconOptions) {
      var self = this;
      var icon;
      var additionalClasses = "";
      if (iconOptions && this._isPlainObject(iconOptions)) {
        if (iconOptions.iconName) {
          icon = this.getIconByName(iconOptions.iconName);
        } else {
          throw new Error("Missing iconName in {{{icon-v2 }}} handlebars tag");
        }
        if (iconOptions.theme) {
          additionalClasses += " csui-icon-v2-theme-" + iconOptions.theme;
        }
        if (iconOptions.allStateByElement) {
          iconOptions.hoverStateByElement = true;
          iconOptions.activeStateByElement = true;
          iconOptions.focusStateByElement = true;
          iconOptions.disabledStateByElement = true;
        }
        if (iconOptions.hoverStateByElement) {
          additionalClasses += " csui-icon-v2-with-hover-by-el";
        }
        if (iconOptions.activeStateByElement) {
          additionalClasses += " csui-icon-v2-with-active-by-el";
        }
        if (iconOptions.focusStateByElement) {
          additionalClasses += " csui-icon-v2-with-focus-by-el";
        }
        if (iconOptions.disabledStateByElement) {
          additionalClasses += " csui-icon-v2-with-disabled-by-el";
        }
        if (iconOptions.states) {
          additionalClasses += " csui-icon-v2-with-states";
        }
        if (iconOptions.handleRTL) {
          additionalClasses += " smart-handle-rtl";
        }
        if (iconOptions.on) {
          additionalClasses += " csui-icon-v2-on";
        }
        if (iconOptions.grayscale) {
          if (!iconOptions.filter) {
            additionalClasses += " csui-icon-v2-grayscale";
            log.info("Usage of 'grayscale' is deprecated in icons-v2. Use filter='grayscale'" + " instead.") && console.log(log.last);
          } else {
            log.warn("Can't use deprecated option 'grayscale' together with 'filter'. 'grayscale'" + "will be ignored.") && console.log(log.last);
          }
        }
        if (iconOptions.filter && !iconOptions.theme && !iconOptions.states && !iconOptions.on) {
          switch (iconOptions.filter) {
           case "grayscale":
            additionalClasses += " csui-icon-v2-filter_grayscale";
            break;

           default:
            log.warn("Specified 'filter' attribute value is not supported in icons-v2. Ignoring" + " it.") && console.log(log.last);
          }
        }
        var iconOptionColorTheme = iconOptions["colorTheme"];
        if (iconOptionColorTheme) {
          if (iconOptions.theme || iconOptions.states || iconOptions.on) {
            log.debug("Specified colorTheme '" + iconOptionColorTheme + "' is ignored, because at least on of the following attributes is set:" + " 'theme', 'states', 'on'") && console.log(log.last);
          } else {
            var cssClassForColorTheme = self._colorThemesMap[iconOptionColorTheme.toLowerCase()];
            if (cssClassForColorTheme) {
              additionalClasses += " csui-icon-v2-colortheme--" + cssClassForColorTheme;
            } else {
              log.warn("Specified 'colorTheme " + iconOptionColorTheme + " is not supported in icons-v2. Ignoring it.") && console.log(log.last);
            }
          }
        }
        if (iconOptions.size) {
          additionalClasses += " " + this.getClassForSize(iconOptions);
        } else {
          additionalClasses += " csui-icon-v2-size-normal";
        }
        if (additionalClasses) {
          icon = icon.replace('class="csui-icon-v2 ', 'class="csui-icon-v2' + additionalClasses + " ");
        }
      }
      icon = icon.replace("<svg", '<svg role="presentation"');
      return icon;
    },
    registerIcons: function(icons) {
      if (!this._isPlainObject(icons)) {
        throw new Error("registerIcons must have plain object as parameter");
      }
      var iconNames = _.keys(icons);
      for (var i = 0; i < iconNames.length; i++) {
        var iconName = iconNames[i];
        if (this._icons[iconName]) {
          throw new Error("duplicate icon name tried to register: " + iconName);
        }
        this._icons[iconName] = icons[iconName];
      }
    }
  });
  var iconRegistry = new IconRegistry();
  iconRegistry.registerIcons(initialIcons);
  var registerArrayIcons = function(arrayIcons) {
    for (var i = 0; i < arrayIcons.length; i++) {
      var iconsMap = arrayIcons[i];
      iconRegistry.registerIcons(iconsMap);
    }
  };
  if (otherIcons) {
    if (_.isArray(otherIcons)) {
      registerArrayIcons(otherIcons);
    } else {
      iconRegistry.registerIcons(otherIcons);
    }
  }
  registerArrayIcons(CoreSmartIcons);
  Handlebars.registerHelper("icon-v2", function(options) {
    var iconOptions = options.hash;
    var icon = iconRegistry.getIconByNameWithOptions(iconOptions);
    return icon;
  });
  return iconRegistry;
});