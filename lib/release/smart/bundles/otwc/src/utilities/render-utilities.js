import { LitElement, html, nothing } from 'lit';
import { unsafeSVG as o } from '../../node_modules/lit-html/directives/unsafe-svg.js';

// The functions in this module are mainly intended to support
// the rendering. So most of them will only work correctly in
// the render() function.
// ATTENTION: The application must ensure that the global
//            'window.otIconsRepository' is filled.

// well-known bundle names
const ICON_BUNDLE_HEADER = 'header';
const ICON_BUNDLE_ACTION = 'action';

const OTC_ICON_BUNDLE_WC_ACTION = 'otc-action';
const OTC_ICON_BUNDLE_WC_ACTION_SMALL = 'otc-action_small';
const OTC_ICON_BUNDLE_WC_ACTION_16 = 'otc-action_16';
const OTC_ICON_BUNDLE_WC_HEADER = 'otc-header';
const OTC_ICON_BUNDLE_WC_UTILITY = 'otc-utility';
const OTC_ICON_BUNDLE_WC_ILLUSTRATIONS = 'otc-illustrations';

// eslint-disable-next-line max-len
const animatedMoreSVG = '<svg role="presentation" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" xml:space="preserve">'
                               + '<style type="text/css">'
                               + '@keyframes bounce_loading{0%{r:4px;fill: var(--jatx-three-dots-color-100, #2e3d98)}'
                               + '100%{r:1.2px;fill: var(--jatx-three-dots-color-0, #2e3d98);}} '
                               + '.dots--animated_more{animation:bounce_loading 2s infinite;fill-opacity: 0.94} '
                               + '.dot1--animated_more{animation-delay:1.07s;} '
                               + '.dot2--animated_more{animation-delay:1.33s;} '
                               + '.dot3--animated_more{animation-delay:1.6s;}'
                               + '</style>'
                               + '<circle class="dots--animated_more dot1--animated_more" cx="8" cy="16" r="1.2"/>'
                               + '<circle class="dots--animated_more dot2--animated_more" cx="16" cy="16" r="1.2"/>'
                               + '<circle class="dots--animated_more dot3--animated_more" cx="24" cy="16" r="1.2"/>'
                               + '</svg>';

// The icon name must be prefixed with a bundle name. Example: action:action_add32
function _getIconObject(msgPrefix, iconKey) {
  if (window.otIconsRepository === undefined) {
    throw new Error(`${msgPrefix} No window.otIconsRepository is defined. Did you forget to include an icon bundle?`);
  }

  if (iconKey.endsWith('.svg')) {
    // eslint-disable-next-line no-console
    console.warn(`${msgPrefix} Specified icon (${iconKey}) must not have the .svg extension.`);
  }

  let [iconBundleName, iconName] = [];
  const parts = iconKey.split(':');
  if (parts.length > 1) {
    [iconBundleName, iconName] = parts;
  } else if (parts.length === 1) {
    // eslint-disable-next-line no-console
    console.warn(`${msgPrefix} Specified icon key (${iconKey}) must be prefixed with icon bundle name followed by a colon.`);
    return undefined;
  }

  const iconBundle = window.otIconsRepository[iconBundleName];
  if (iconBundle === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`${msgPrefix} Specified iconBundle (${iconBundleName}) not found in iconsRepository!`);
    return undefined;
  }
  const iconObject = iconBundle[iconName];
  if (iconObject === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`${msgPrefix} Specified icon (${iconName}) not found in icon bundle ${iconBundleName} of the iconsRepository.`);
    return undefined;
  }
  if (iconObject.svg === undefined) {
    return '';
  }
  return iconObject;
}

function getSvgPlaceholder() {
  // return minimal content
  return html``;
}

// check if the role value is valid and return '' if not one of the valid ones
function getValidRole(roleValue) {
  switch (roleValue) {
    case 'none':
    case 'img':
    case 'presentation':
      return roleValue;
    default:
      return '';
  }
}

// Place image data (can be data_uri or url) as href value within the wrapper icon,
// which is a svg with an embedded image and a clipping circle applied. That makes the
// image appear is a circle.
function _getSVGWrappedWithImage(image, options = {}) {
  if (image) {
    const role = `role="${getValidRole(options.role)}"`;
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 42 42" class="ot-svg ot-svg--header" ${role}>`
                + '<defs><clipPath id="clipCircle"><circle cx="21" cy="21" r="21" fill="#FFFFFF" />'
                + '</clipPath></defs>'
                + `<image x="0" y="0" width="42" height="42" clip-path="url(#clipCircle)" href="${image}" />`
                + '<circle class="ot-top-state" fill="none" stroke="none" cx="21" cy="21" r="20.0" />'
                + '<circle class="ot-focus" fill="none" stroke="none" cx="21" cy="21" r="20.5" /></svg>';
    return html`${o(svgText)}`;
  }
  return html``;
}

function getJatoSVGFromSmartIconRepository(iconKey) {
  const msgPrefix = 'render-utilities: getJatoSVGFromSmartIconRepository:';
  if (!iconKey) {
    return '';
  }
  const iconObj = _getIconObject(msgPrefix, iconKey);
  if (!iconObj || !iconObj.svg) {
    return '';
  }
  return iconObj.svg;
}

// @deprecated: use getSVGForIconWithOptions instead
function getSVGForIcon(iconKey, image, initials, title, options = {}) {
  const msgPrefix = 'render-utilities: getSVGForIcon:';

  if (image) {
    return _getSVGWrappedWithImage(image, options);
  }

  if (initials) {
    return html``; // was moved to otc-avatar
  }

  if (!iconKey) {
    return getSvgPlaceholder();
  }

  const iconObj = _getIconObject(msgPrefix, iconKey);
  if (iconObj === undefined) {
    return getSvgPlaceholder();
  }
  if (!iconObj.svg) {
    // eslint-disable-next-line no-console
    console.warn(`${msgPrefix} Specified icon (${iconKey}) does not have a 'svg' property, which should contain the svg text!`);
    return getSvgPlaceholder();
  }

  // Add the specified title.
  if (title || options.role) {
    const parser = new DOMParser();
    const svg = parser.parseFromString(iconObj.svg, 'image/svg+xml');
    const role = getValidRole(options.role);
    if (role) {
      svg.documentElement.setAttribute('role', role);
    }
    if (title) {
      svg.documentElement.setAttribute('aria-labelledby', `${title}_id`);
      svg.documentElement.insertAdjacentHTML('afterbegin', `<title id='${title}_id'>${title}</title>`);
    }
    return html`${o(svg.documentElement.outerHTML)}`;
  }

  return html`${o(iconObj.svg)}`;
}

function getSVGForIconWithOptions(attributes, options) {
  return getSVGForIcon(attributes.iconKey, attributes.image, attributes.initials, attributes.title, options);
}

function shouldRenderIcon(component) {
  if (!(component instanceof LitElement)) {
    throw new Error('component must be an instance of a class inheriting from LitElement');
  }
  return !!(component.icon?.length || component.image?.length || component.initials?.length);
}

function getClassesForIcon(component) {
  const msgPrefix = 'render-utilities: getClassesForIcon:';

  const classes = {
    'ot--is-header-item': component.headerItem,
    'ot-icon--is-disabled': component.disabled,
    'ot-icon--is-toggled': component.toggled || component.active,
    'ot-icon--is-menu-open': component.menuOpen,
    'ot-icon--is-emphasis': component.emphasis,
    'ot-icon--is-mirrored-if-rtl': component.mirrorIconIfRtl,
  };

  if (shouldRenderIcon(component)) {
    let category;
    if (!component.icon && (component.image || component.initials)) {
      category = 'header';
    } else {
      const iconObj = _getIconObject(msgPrefix, component.icon);
      if (iconObj === undefined) {
        return classes;
      }
      category = iconObj.category;
    }

    classes['ot-icon'] = true;
    let canBeStyleable = false;

    // use icon category to calculate type of icon and needed css classes
    switch (category) {
      case 'action':
        classes['ot-icon--is-action-icon'] = true;
        canBeStyleable = !!component.icon;
        break;
      case 'action_small':
        classes['ot-icon--is-action-small-icon'] = true;
        canBeStyleable = !!component.icon;
        break;
      case 'action_16':
        classes['ot-icon--is-action_16-icon'] = true;
        canBeStyleable = !!component.icon;
        break;
      case 'header':
        canBeStyleable = true; // header icon is styleable - independent of icon

        if (component.image) {
          classes['ot-icon--is-header-icon-user'] = true;
        } else {
          classes['ot-icon--is-header-icon'] = true;
        }
        break;
      case 'tree':
        classes['ot-icon--is-tree-control-icon'] = true;
        break;
      case 'status':
        classes['ot-icon--is-status-icon'] = true;
        break;
      case 'mime':
        classes['ot-icon--is-mime-type-icon'] = true;
        break;
      case 'landing-page-tile':
        classes['ot-icon--is-landing-page-tile'] = true;
        break;
      case 'tile-header':
        classes['ot-icon--is-tile-header-icon'] = true;
        break;
      case 'illustrations':
        classes['ot-icon--is-illustrations-icon'] = true;
        break;
      default:
        classes['ot-icon--is-unspecific-icon'] = true;
    }

    classes['ot-icon--is-styleable-icon'] = !component.disableEffects && canBeStyleable;

    if (component.iconAppearance) {
      classes[`ot-icon--appearance-${component.iconAppearance}`] = true;
    }
  }
  return classes;
}

// encodes UTF8 string
function b64Encode(str) {
  return btoa(encodeURIComponent(str));
}

// decodes UTF8 string
function b64Decode(str) {
  return decodeURIComponent(atob(str));
}

function getActionSmallButton(label, ariaLabel, iconName, callback, CSSClass = '', tabIndex = null) {
  return html`<button class="${CSSClass} ot-btn ot-icon ot-icon--is-action-small-icon ot-icon--is-styleable-icon" aria-label="${ariaLabel}" title="${label}" @click="${callback}" tabindex="${tabIndex !== null ? tabIndex : nothing}">${getSVGForIconWithOptions(
    { iconKey: `${OTC_ICON_BUNDLE_WC_ACTION_SMALL}:${iconName}` },
    { role: 'presentation' },
  )}</button>`;
}

function getActionSmallAddButton(label, ariaLabel, callback, CSSClass = '', tabIndex = null) {
  return getActionSmallButton(label, ariaLabel, 'action_small_add14', callback, `${CSSClass} ot-icon--appearance-blue`, tabIndex);
}

function getActionSmallDeleteButton(label, ariaLabel, callback, CSSClass = '', tabIndex = null) {
  return getActionSmallButton(label, ariaLabel, 'action_small_delete14', callback, `${CSSClass} ot-icon--appearance-red`, tabIndex);
}

export { ICON_BUNDLE_ACTION, ICON_BUNDLE_HEADER, OTC_ICON_BUNDLE_WC_ACTION, OTC_ICON_BUNDLE_WC_ACTION_16, OTC_ICON_BUNDLE_WC_ACTION_SMALL, OTC_ICON_BUNDLE_WC_HEADER, OTC_ICON_BUNDLE_WC_ILLUSTRATIONS, OTC_ICON_BUNDLE_WC_UTILITY, animatedMoreSVG, b64Decode, b64Encode, getActionSmallAddButton, getActionSmallDeleteButton, getClassesForIcon, getJatoSVGFromSmartIconRepository, getSVGForIcon, getSVGForIconWithOptions, getSvgPlaceholder, shouldRenderIcon };
//# sourceMappingURL=render-utilities.js.map
